// Daily cron: send a Trustpilot review request to users 14+ days after
// their first successful Stripe payment. Idempotent via user_settings.review_requested_at.
// Auth: requires CRON_SECRET in Authorization header.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET")!;
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const TRUSTPILOT_REVIEW_URL =
  Deno.env.get("TRUSTPILOT_REVIEW_URL") ||
  "https://www.trustpilot.com/evaluate/getservio.co";

const DAYS_BEFORE_REQUEST = 14;

// ─── Password decryption (mirrors send-email) ──────────────────────────
async function deriveKey(): Promise<CryptoKey> {
  const secret = SERVICE_ROLE_KEY;
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode("servio-imap-v1"),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
}

async function decryptPassword(encryptedB64: string): Promise<string> {
  const key = await deriveKey();
  const data = Uint8Array.from(atob(encryptedB64), (c) => c.charCodeAt(0));
  const iv = data.slice(0, 12);
  const ciphertext = data.slice(12);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext,
  );
  return new TextDecoder().decode(decrypted);
}

async function refreshGoogleToken(
  refreshToken: string,
): Promise<{ access_token: string; expires_in: number } | null> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
      client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
      grant_type: "refresh_token",
    }),
  });
  if (!response.ok) return null;
  return response.json();
}

function buildRawEmail(
  to: string,
  subject: string,
  body: string,
  fromEmail: string,
): string {
  const encodedSubject = `=?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const encodedBody = btoa(unescape(encodeURIComponent(body)));
  return [
    `From: ${fromEmail}`,
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    encodedBody,
  ].join("\r\n");
}

function toGmailRaw(rawMessage: string): string {
  return btoa(rawMessage)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function sendViaGmail(connection: any, supabase: any, raw: string) {
  let accessToken = connection.access_token;
  const expiry = new Date(connection.token_expires_at);
  if (expiry < new Date(Date.now() + 5 * 60 * 1000)) {
    const newTokens = await refreshGoogleToken(connection.refresh_token);
    if (!newTokens) throw new Error("Gmail token refresh mislukt");
    accessToken = newTokens.access_token;
    await supabase
      .from("email_connections")
      .update({
        access_token: accessToken,
        token_expires_at: new Date(
          Date.now() + newTokens.expires_in * 1000,
        ).toISOString(),
      })
      .eq("id", connection.id);
  }
  const res = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: toGmailRaw(raw) }),
    },
  );
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Gmail send fout: ${t}`);
  }
}

async function sendViaSMTP(connection: any, to: string, raw: string) {
  const password = await decryptPassword(connection.encrypted_password);
  const smtpHost = connection.smtp_host;
  const smtpPort = connection.smtp_port || 587;
  const email = connection.email_address;

  let conn: Deno.Conn = smtpPort === 465
    ? await Deno.connectTls({ hostname: smtpHost, port: smtpPort })
    : await Deno.connect({ hostname: smtpHost, port: smtpPort });

  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const read = async (): Promise<string> => {
    let response = "";
    while (true) {
      const chunk = new Uint8Array(8192);
      const n = await conn.read(chunk);
      if (n === null) throw new Error("SMTP verbinding verbroken");
      response += dec.decode(chunk.subarray(0, n));
      if (/^\d{3} /m.test(response) || /^\d{3}\r?\n/m.test(response)) return response;
    }
  };
  const expect = async (code: string, msg: string) => {
    const r = await read();
    if (!r.startsWith(code)) throw new Error(`${msg}: ${r.trim()}`);
  };
  try {
    await expect("220", "SMTP niet bereikbaar");
    await conn.write(enc.encode("EHLO servio.co\r\n"));
    await read();
    if (smtpPort === 587) {
      await conn.write(enc.encode("STARTTLS\r\n"));
      await expect("220", "STARTTLS mislukt");
      conn = await Deno.startTls(conn as Deno.TcpConn, { hostname: smtpHost });
      await conn.write(enc.encode("EHLO servio.co\r\n"));
      await read();
    }
    await conn.write(enc.encode("AUTH LOGIN\r\n"));
    await expect("334", "AUTH LOGIN niet ondersteund");
    await conn.write(enc.encode(btoa(email) + "\r\n"));
    await expect("334", "Gebruikersnaam afgewezen");
    await conn.write(enc.encode(btoa(password) + "\r\n"));
    await expect("235", "Auth mislukt");
    await conn.write(enc.encode(`MAIL FROM:<${email}>\r\n`));
    await expect("250", "MAIL FROM afgewezen");
    await conn.write(enc.encode(`RCPT TO:<${to}>\r\n`));
    await expect("250", "RCPT TO afgewezen");
    await conn.write(enc.encode("DATA\r\n"));
    await expect("354", "DATA afgewezen");
    const escaped = raw.replace(/\r\n\./g, "\r\n..");
    await conn.write(enc.encode(escaped + "\r\n.\r\n"));
    await expect("250", "Verzenden mislukt");
    await conn.write(enc.encode("QUIT\r\n"));
  } finally {
    try { conn.close(); } catch { /* ignore */ }
  }
}

function buildReviewEmail(name: string): { subject: string; body: string } {
  const first = (name || "").split(" ")[0] || "daar";
  const subject = "Zou je Servio een review willen geven?";
  const body =
`Hoi ${first},

Fijn dat je Servio gebruikt! Je bent nu ruim twee weken onderweg en ik ben heel benieuwd hoe het je bevalt.

Als Servio je tijd bespaart of je administratie makkelijker maakt, zou het enorm helpen als je een korte review achterlaat op Trustpilot. Andere ondernemers gebruiken die reviews om te beslissen of Servio ook iets voor hen is — en voor ons is het de belangrijkste manier om te groeien.

Laat je review achter:
${TRUSTPILOT_REVIEW_URL}

Loop je ergens tegenaan of heb je feedback? Beantwoord deze mail gewoon — dan lees ik het persoonlijk.

Dank je wel!
Team Servio`;
  return { subject, body };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // CRON auth
  const auth = req.headers.get("Authorization") || "";
  const provided = auth.replace(/^Bearer\s+/i, "");
  if (!CRON_SECRET || provided !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-08-27.basil" });

  const cutoff = new Date(Date.now() - DAYS_BEFORE_REQUEST * 24 * 60 * 60 * 1000).toISOString();

  // Candidates: paying customers, not yet emailed
  const { data: candidates, error } = await supabase
    .from("user_settings")
    .select("user_id, stripe_customer_id, subscription_status")
    .is("review_requested_at", null)
    .not("stripe_customer_id", "is", null)
    .in("subscription_status", ["active", "trialing", "past_due"])
    .limit(200);

  if (error) {
    console.error("[review] query error", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const results: any[] = [];

  for (const row of candidates ?? []) {
    try {
      // Determine first successful payment date via Stripe
      const charges = await stripe.charges.list({
        customer: row.stripe_customer_id!,
        limit: 100,
      });
      const paid = charges.data
        .filter((c) => c.paid && c.status === "succeeded")
        .sort((a, b) => a.created - b.created);
      if (paid.length === 0) {
        results.push({ user: row.user_id, skipped: "no_paid_charge" });
        continue;
      }
      const firstPaidAt = new Date(paid[0].created * 1000);
      if (firstPaidAt > new Date(cutoff)) {
        results.push({ user: row.user_id, skipped: "too_recent" });
        continue;
      }

      // Get profile email + name
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", row.user_id)
        .maybeSingle();
      if (!profile?.email) {
        results.push({ user: row.user_id, skipped: "no_email" });
        continue;
      }

      // Find their active mail connection (used as sender)
      const { data: connection } = await supabase
        .from("email_connections")
        .select("*")
        .eq("user_id", row.user_id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!connection) {
        results.push({ user: row.user_id, skipped: "no_connection" });
        continue;
      }

      const { subject, body } = buildReviewEmail(profile.full_name || "");
      const raw = buildRawEmail(profile.email, subject, body, connection.email_address);

      if (connection.provider === "gmail") {
        await sendViaGmail(connection, supabase, raw);
      } else if (connection.provider === "imap") {
        if (!connection.encrypted_password || !connection.smtp_host) {
          results.push({ user: row.user_id, skipped: "smtp_incomplete" });
          continue;
        }
        await sendViaSMTP(connection, profile.email, raw);
      } else {
        results.push({ user: row.user_id, skipped: `provider_${connection.provider}` });
        continue;
      }

      await supabase
        .from("user_settings")
        .update({ review_requested_at: new Date().toISOString() })
        .eq("user_id", row.user_id);

      results.push({ user: row.user_id, sent: true });
    } catch (e: any) {
      console.error("[review] user error", row.user_id, e?.message);
      results.push({ user: row.user_id, error: e?.message ?? "unknown" });
    }
  }

  return new Response(
    JSON.stringify({ processed: results.length, results }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
