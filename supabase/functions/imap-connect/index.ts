import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function deriveKey(): Promise<CryptoKey> {
  const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const keyMaterial = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: new TextEncoder().encode("servio-imap-v1"), iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptPassword(password: string): Promise<string> {
  const key = await deriveKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(password));
  const combined = new Uint8Array(12 + new Uint8Array(encrypted).length);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), 12);
  return btoa(String.fromCharCode(...combined));
}

async function testImap(host: string, port: number, email: string, password: string, useSsl: boolean) {
  const conn = (useSsl || port === 993)
    ? await Deno.connectTls({ hostname: host, port })
    : await Deno.connect({ hostname: host, port });

  const enc = new TextEncoder();
  const dec = new TextDecoder();
  let buf = "";

  const readLine = async (): Promise<string> => {
    while (true) {
      const idx = buf.indexOf("\r\n");
      if (idx >= 0) {
        const line = buf.substring(0, idx);
        buf = buf.substring(idx + 2);
        return line;
      }
      const chunk = new Uint8Array(4096);
      const n = await conn.read(chunk);
      if (n === null) throw new Error("Verbinding verbroken");
      buf += dec.decode(chunk.subarray(0, n));
    }
  };

  const readTag = async (tag: string) => {
    while (true) {
      const line = await readLine();
      if (line.startsWith(`${tag} OK`)) return;
      if (line.startsWith(`${tag} NO`) || line.startsWith(`${tag} BAD`)) {
        throw new Error(`IMAP authenticatie mislukt: ${line.substring(tag.length + 1)}`);
      }
    }
  };

  try {
    const greeting = await readLine();
    if (!greeting.includes("OK")) throw new Error("IMAP server niet bereikbaar");

    const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    await conn.write(enc.encode(`A1 LOGIN "${esc(email)}" "${esc(password)}"\r\n`));
    await readTag("A1");
    await conn.write(enc.encode("A2 LOGOUT\r\n"));
  } finally {
    try { conn.close(); } catch { /* ignore */ }
  }
}

async function testSmtp(host: string, port: number, email: string, password: string) {
  let conn: Deno.Conn = port === 465
    ? await Deno.connectTls({ hostname: host, port })
    : await Deno.connect({ hostname: host, port });

  const enc = new TextEncoder();
  const dec = new TextDecoder();

  const read = async (): Promise<string> => {
    let response = "";
    while (true) {
      const chunk = new Uint8Array(4096);
      const n = await conn.read(chunk);
      if (n === null) throw new Error("SMTP verbinding verbroken");
      response += dec.decode(chunk.subarray(0, n));
      if (/^\d{3} /m.test(response) || /^\d{3}\r?\n/m.test(response)) return response;
    }
  };

  try {
    const greeting = await read();
    if (!greeting.startsWith("220")) throw new Error("SMTP server niet bereikbaar");

    await conn.write(enc.encode("EHLO servio.co\r\n"));
    await read();

    if (port === 587) {
      await conn.write(enc.encode("STARTTLS\r\n"));
      const tlsResp = await read();
      if (!tlsResp.startsWith("220")) throw new Error("STARTTLS mislukt");
      conn = await Deno.startTls(conn as Deno.TcpConn, { hostname: host });
      await conn.write(enc.encode("EHLO servio.co\r\n"));
      await read();
    }

    await conn.write(enc.encode("AUTH LOGIN\r\n"));
    let resp = await read();
    if (!resp.startsWith("334")) throw new Error("AUTH LOGIN niet ondersteund");

    await conn.write(enc.encode(btoa(email) + "\r\n"));
    resp = await read();
    if (!resp.startsWith("334")) throw new Error("Gebruikersnaam afgewezen");

    await conn.write(enc.encode(btoa(password) + "\r\n"));
    resp = await read();
    if (!resp.startsWith("235")) throw new Error("Authenticatie mislukt. Controleer je wachtwoord.");

    await conn.write(enc.encode("QUIT\r\n"));
  } finally {
    try { conn.close(); } catch { /* ignore */ }
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { action, email, password, imap_host, imap_port = 993, smtp_host, smtp_port = 587, use_ssl = true } = body;

    if (!email || !password || !imap_host || !smtp_host) {
      throw new Error("Alle velden zijn verplicht");
    }

    // Validate input lengths
    if (email.length > 255 || imap_host.length > 255 || smtp_host.length > 255) {
      throw new Error("Veld te lang");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Niet ingelogd");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) throw new Error("Niet ingelogd");

    console.log(`[imap-connect] Testing IMAP ${imap_host}:${imap_port} for ${email}`);
    await testImap(imap_host, imap_port, email, password, use_ssl);

    console.log(`[imap-connect] Testing SMTP ${smtp_host}:${smtp_port} for ${email}`);
    await testSmtp(smtp_host, smtp_port, email, password);

    if (action === "test") {
      return new Response(
        JSON.stringify({ success: true, message: "Verbinding succesvol" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save connection
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const encryptedPw = await encryptPassword(password);

    const { error: insertError } = await admin.from("email_connections").insert({
      user_id: user.id,
      provider: "imap",
      email_address: email,
      imap_host,
      imap_port,
      smtp_host,
      smtp_port,
      use_ssl,
      encrypted_password: encryptedPw,
      is_active: true,
    });

    if (insertError) throw new Error(`Opslaan mislukt: ${insertError.message}`);

    console.log(`[imap-connect] Connection saved for ${email}`);
    return new Response(
      JSON.stringify({ success: true, message: "E-mail succesvol gekoppeld" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[imap-connect] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Er is een fout opgetreden" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
