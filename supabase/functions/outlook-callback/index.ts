import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

async function hmacSign(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    const frontendUrl = Deno.env.get("FRONTEND_URL") || "https://getservio.co";

    if (error) {
      console.error("OAuth error:", error);
      return Response.redirect(`${frontendUrl}/mailbox-setup?error=${encodeURIComponent(error)}`);
    }

    if (!code || !state) {
      return Response.redirect(`${frontendUrl}/mailbox-setup?error=missing_params`);
    }

    // Verify signed state
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    let userId: string;
    try {
      const stateData = JSON.parse(atob(state));
      const { payload, sig } = stateData;
      if (!payload || !sig) {
        return Response.redirect(`${frontendUrl}/mailbox-setup?error=invalid_state`);
      }
      const expectedSig = await hmacSign(payload, SUPABASE_SERVICE_ROLE_KEY);
      if (!timingSafeEqual(sig, expectedSig)) {
        console.error("State signature mismatch");
        return Response.redirect(`${frontendUrl}/mailbox-setup?error=invalid_state`);
      }
      const parsedPayload = JSON.parse(payload);
      userId = parsedPayload.user_id;
      if (Date.now() - parsedPayload.ts > 10 * 60 * 1000) {
        return Response.redirect(`${frontendUrl}/mailbox-setup?error=state_expired`);
      }
    } catch {
      return Response.redirect(`${frontendUrl}/mailbox-setup?error=invalid_state`);
    }

    const MICROSOFT_CLIENT_ID = Deno.env.get("MICROSOFT_CLIENT_ID");
    const MICROSOFT_CLIENT_SECRET = Deno.env.get("MICROSOFT_CLIENT_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");

    if (!MICROSOFT_CLIENT_ID || !MICROSOFT_CLIENT_SECRET) {
      throw new Error("Microsoft OAuth credentials not configured");
    }

    const redirectUri = `${SUPABASE_URL}/functions/v1/outlook-callback`;

    const tokenResponse = await fetch(
      "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: MICROSOFT_CLIENT_ID,
          client_secret: MICROSOFT_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange failed:", errorText);
      return Response.redirect(`${frontendUrl}/mailbox-setup?error=token_exchange_failed`);
    }

    const tokens = await tokenResponse.json();

    const userInfoResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoResponse.ok) {
      return Response.redirect(`${frontendUrl}/mailbox-setup?error=failed_to_get_user_info`);
    }

    const userInfo = await userInfoResponse.json();
    const emailAddress = userInfo.mail || userInfo.userPrincipalName;

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY);

    const { error: dbError } = await supabase
      .from("email_connections")
      .upsert(
        {
          user_id: userId,
          provider: "outlook",
          email_address: emailAddress,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: expiresAt,
          scopes: tokens.scope?.split(" ") || [],
          is_active: true,
          sync_error: null,
        },
        {
          onConflict: "user_id,provider,email_address",
        }
      );

    if (dbError) {
      console.error("Database error:", dbError);
      return Response.redirect(`${frontendUrl}/mailbox-setup?error=database_error`);
    }

    return Response.redirect(`${frontendUrl}/app?connected=outlook`);
  } catch (error) {
    console.error("Outlook callback error:", error);
    const frontendUrl = Deno.env.get("FRONTEND_URL") || "https://getservio.co";
    return Response.redirect(`${frontendUrl}/mailbox-setup?error=unknown_error`);
  }
});
