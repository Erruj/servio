import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Password Decryption ─────────────────────────────────────────────────

async function deriveKey(): Promise<CryptoKey> {
  const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const keyMaterial = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: new TextEncoder().encode("servio-imap-v1"), iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
}

async function decryptPassword(encryptedB64: string): Promise<string> {
  const key = await deriveKey();
  const data = Uint8Array.from(atob(encryptedB64), (c) => c.charCodeAt(0));
  const iv = data.slice(0, 12);
  const ciphertext = data.slice(12);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return new TextDecoder().decode(decrypted);
}

// ─── Google Token Refresh ────────────────────────────────────────────────

async function refreshGoogleToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
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

// ─── Gmail Raw Email Builder ─────────────────────────────────────────────

interface Attachment {
  filename: string;
  mimeType: string;
  content: string; // base64
}

function buildRawEmail(to: string, cc: string, subject: string, body: string, fromEmail: string, attachments?: Attachment[]): string {
  const boundary = "boundary_" + Date.now() + "_" + Math.random().toString(36).slice(2);
  const encodedSubject = `=?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const encodedBody = btoa(unescape(encodeURIComponent(body)));

  if (!attachments || attachments.length === 0) {
    return [
      `From: ${fromEmail}`,
      `To: ${to}`,
      ...(cc ? [`Cc: ${cc}`] : []),
      `Subject: ${encodedSubject}`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
      "",
      encodedBody,
    ].join("\r\n");
  }

  const lines = [
    `From: ${fromEmail}`,
    `To: ${to}`,
    ...(cc ? [`Cc: ${cc}`] : []),
    `Subject: ${encodedSubject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    encodedBody,
  ];

  for (const att of attachments) {
    lines.push(
      `--${boundary}`,
      `Content-Type: ${att.mimeType}; name="${att.filename}"`,
      `Content-Disposition: attachment; filename="${att.filename}"`,
      "Content-Transfer-Encoding: base64",
      "",
      att.content
    );
  }
  lines.push(`--${boundary}--`);
  return lines.join("\r\n");
}

function toGmailRaw(rawMessage: string): string {
  return btoa(rawMessage).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// ─── SMTP Send ───────────────────────────────────────────────────────────

async function sendViaSMTP(
  smtpHost: string,
  smtpPort: number,
  email: string,
  password: string,
  to: string,
  cc: string,
  rawMessage: string
) {
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

  const expect = async (code: string, errorMsg: string) => {
    const resp = await read();
    if (!resp.startsWith(code)) throw new Error(`${errorMsg}: ${resp.trim()}`);
    return resp;
  };

  try {
    await expect("220", "SMTP server niet bereikbaar");

    await conn.write(enc.encode("EHLO servio.co\r\n"));
    await read(); // EHLO response

    if (smtpPort === 587) {
      await conn.write(enc.encode("STARTTLS\r\n"));
      await expect("220", "STARTTLS mislukt");
      conn = await Deno.startTls(conn as Deno.TcpConn, { hostname: smtpHost });
      await conn.write(enc.encode("EHLO servio.co\r\n"));
      await read();
    }

    // AUTH LOGIN
    await conn.write(enc.encode("AUTH LOGIN\r\n"));
    await expect("334", "AUTH LOGIN niet ondersteund");
    await conn.write(enc.encode(btoa(email) + "\r\n"));
    await expect("334", "Gebruikersnaam afgewezen");
    await conn.write(enc.encode(btoa(password) + "\r\n"));
    await expect("235", "Authenticatie mislukt");

    // MAIL FROM
    await conn.write(enc.encode(`MAIL FROM:<${email}>\r\n`));
    await expect("250", "MAIL FROM afgewezen");

    // RCPT TO — always extract the pure email address (no display name)
    const extractEmail = (address: string): string => {
      // Match anything inside angle brackets first: "Name" <email@x.com>
      const angleMatch = address.match(/<([^>]+)>/);
      if (angleMatch) return angleMatch[1].trim();
      // Otherwise look for the first token that looks like an email
      const emailMatch = address.match(/[^\s<>"'(),;:]+@[^\s<>"'(),;:]+/);
      if (emailMatch) return emailMatch[0].trim();
      return address.trim();
    };

    const recipients = [to, ...(cc ? cc.split(",") : [])]
      .map((r) => extractEmail(r))
      .filter(Boolean);
    for (const rcptEmail of recipients) {
      await conn.write(enc.encode(`RCPT TO:<${rcptEmail}>\r\n`));
      await expect("250", `RCPT TO afgewezen voor ${rcptEmail}`);
    }

    // DATA
    await conn.write(enc.encode("DATA\r\n"));
    await expect("354", "DATA commando afgewezen");

    // Send message (escape dots at start of line)
    const escapedMessage = rawMessage.replace(/\r\n\./g, "\r\n..");
    await conn.write(enc.encode(escapedMessage + "\r\n.\r\n"));
    await expect("250", "E-mail verzenden mislukt");

    // QUIT
    await conn.write(enc.encode("QUIT\r\n"));
  } finally {
    try { conn.close(); } catch { /* ignore */ }
  }
}

// ─── Main Handler ────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { to, cc, subject, body, replyToEmailId, attachments, connection_id } = await req.json();
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    // Find active connection (optionally by ID)
    let connQuery = supabase
      .from("email_connections")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (connection_id) {
      connQuery = connQuery.eq("id", connection_id);
    }

    const { data: connection, error: connError } = await connQuery
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (connError || !connection) {
      return new Response(
        JSON.stringify({ error: "Geen actieve mailbox gevonden. Koppel eerst je mailbox." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawMessage = buildRawEmail(to, cc || "", subject, body, connection.email_address, attachments);

    if (connection.provider === "gmail") {
      // ─── Gmail API Send ──────────────────────────────────────────
      let accessToken = connection.access_token;
      const tokenExpiry = new Date(connection.token_expires_at);
      if (tokenExpiry < new Date(Date.now() + 5 * 60 * 1000)) {
        const newTokens = await refreshGoogleToken(connection.refresh_token);
        if (!newTokens) {
          return new Response(
            JSON.stringify({ error: "Token verlopen. Koppel je Gmail opnieuw." }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        accessToken = newTokens.access_token;
        await supabase
          .from("email_connections")
          .update({
            access_token: accessToken,
            token_expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
          })
          .eq("id", connection.id);
      }

      const gmailBody: any = { raw: toGmailRaw(rawMessage) };

      if (replyToEmailId) {
        const { data: originalEmail } = await supabase
          .from("emails")
          .select("thread_id")
          .eq("id", replyToEmailId)
          .eq("user_id", user.id)
          .single();
        if (originalEmail?.thread_id) gmailBody.threadId = originalEmail.thread_id;
      }

      const gmailResponse = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(gmailBody),
      });

      if (!gmailResponse.ok) {
        const errorText = await gmailResponse.text();
        console.error("Gmail send error:", errorText);
        throw new Error("E-mail verzenden mislukt via Gmail.");
      }

      const result = await gmailResponse.json();
      return new Response(
        JSON.stringify({ success: true, messageId: result.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (connection.provider === "imap") {
      // ─── SMTP Send ───────────────────────────────────────────────
      if (!connection.encrypted_password || !connection.smtp_host) {
        throw new Error("SMTP configuratie onvolledig. Koppel je mailbox opnieuw.");
      }

      const password = await decryptPassword(connection.encrypted_password);

      console.log(`[send-email] Sending via SMTP ${connection.smtp_host}:${connection.smtp_port} from ${connection.email_address}`);

      await sendViaSMTP(
        connection.smtp_host,
        connection.smtp_port || 587,
        connection.email_address,
        password,
        to,
        cc || "",
        rawMessage
      );

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      throw new Error(`Provider ${connection.provider} ondersteunt geen e-mail verzenden.`);
    }
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
