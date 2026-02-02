import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    // Get the frontend URL for redirects
    const frontendUrl = Deno.env.get("FRONTEND_URL") || "https://servio.lovable.app";

    if (error) {
      console.error("OAuth error:", error);
      return Response.redirect(`${frontendUrl}/mailbox-setup?error=${encodeURIComponent(error)}`);
    }

    if (!code || !state) {
      return Response.redirect(`${frontendUrl}/mailbox-setup?error=missing_params`);
    }

    // Decode state to get user_id
    let userId: string;
    try {
      const stateData = JSON.parse(atob(state));
      userId = stateData.user_id;
    } catch {
      return Response.redirect(`${frontendUrl}/mailbox-setup?error=invalid_state`);
    }

    const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
    const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      throw new Error("Google OAuth credentials not configured");
    }

    const redirectUri = `${SUPABASE_URL}/functions/v1/gmail-callback`;

    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange failed:", errorText);
      return Response.redirect(`${frontendUrl}/mailbox-setup?error=token_exchange_failed`);
    }

    const tokens = await tokenResponse.json();

    // Get user email from Google
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }
    );

    if (!userInfoResponse.ok) {
      return Response.redirect(`${frontendUrl}/mailbox-setup?error=failed_to_get_user_info`);
    }

    const userInfo = await userInfoResponse.json();
    const emailAddress = userInfo.email;

    // Calculate token expiration
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Store connection in database using service role
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Upsert the connection (update if exists, insert if not)
    const { error: dbError } = await supabase
      .from("email_connections")
      .upsert(
        {
          user_id: userId,
          provider: "gmail",
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

    // Redirect back to the app with success
    return Response.redirect(`${frontendUrl}/app?connected=gmail`);
  } catch (error) {
    console.error("Gmail callback error:", error);
    const frontendUrl = Deno.env.get("FRONTEND_URL") || "https://servio.lovable.app";
    return Response.redirect(`${frontendUrl}/mailbox-setup?error=unknown_error`);
  }
});
