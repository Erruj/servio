// Haalt externe afbeeldingen uit e-mails op via de server (zoals Gmail),
// zodat de afzender het IP-adres van de gebruiker niet ziet en de CSP van de
// app niet ruimer hoeft. Alleen URL's met een geldige HMAC-handtekening.
//   POST { urls: string[] }  (ingelogd)  -> { signed: Record<url, proxyUrl> }
//   GET  ?url=...&sig=...                -> de afbeelding
import { createClient } from "npm:@supabase/supabase-js@2";

const MAX_BYTES = 5 * 1024 * 1024;
const TIMEOUT_MS = 8000;
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

let keyPromise: Promise<CryptoKey> | null = null;
function getKey() {
  if (!keyPromise) {
    const base = Deno.env.get("EMAIL_IMAGE_PROXY_SECRET") ||
      `email-image-proxy:${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`;
    keyPromise = crypto.subtle.importKey("raw", new TextEncoder().encode(base),
      { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
  }
  return keyPromise;
}
const b64url = (buf: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
async function sign(url: string) {
  return b64url(await crypto.subtle.sign("HMAC", await getKey(), new TextEncoder().encode(url)));
}
function fromB64url(s: string) {
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
}

function isSafeUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    const h = u.hostname.toLowerCase();
    if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal")) return false;
    if (/^(127\.|10\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h)) return false;
    if (h.startsWith("[")) return false; // geen IPv6-literals
    return true;
  } catch { return false; }
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  if (req.method === "POST") {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Je bent niet ingelogd." }, 401);
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data, error } = await supabase.auth.getUser(auth.replace("Bearer ", ""));
    if (error || !data.user) return json({ error: "Je sessie is verlopen. Log opnieuw in." }, 401);

    let urls: unknown;
    try { urls = (await req.json())?.urls; } catch { return json({ error: "Ongeldig verzoek." }, 400); }
    if (!Array.isArray(urls) || urls.length > 300 || urls.some((u) => typeof u !== "string" || u.length > 4000)) {
      return json({ error: "Ongeldige lijst met afbeeldingen (maximaal 300)." }, 400);
    }
    const base = `${Deno.env.get("SUPABASE_URL")}/functions/v1/email-image-proxy`;
    const signed: Record<string, string> = {};
    for (const u of urls as string[]) {
      if (!isSafeUrl(u)) continue;
      signed[u] = `${base}?url=${encodeURIComponent(u)}&sig=${await sign(u)}`;
    }
    return json({ signed });
  }

  if (req.method !== "GET") return json({ error: "Methode niet toegestaan." }, 405);

  const params = new URL(req.url).searchParams;
  const target = params.get("url") || "";
  const sig = params.get("sig") || "";
  let valid = false;
  try {
    valid = await crypto.subtle.verify("HMAC", await getKey(), fromB64url(sig), new TextEncoder().encode(target));
  } catch { valid = false; }
  if (!valid || !isSafeUrl(target)) return new Response("Ongeldige handtekening", { status: 403, headers: cors });

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const upstream = await fetch(target, {
      signal: ctrl.signal,
      redirect: "follow",
      credentials: "omit",
      referrerPolicy: "no-referrer",
      headers: { "User-Agent": "ServioImageProxy/1.0", Accept: "image/*" },
    });
    const type = upstream.headers.get("content-type") || "";
    if (!upstream.ok || !type.toLowerCase().startsWith("image/") || type.includes("svg")) {
      return new Response("Geen afbeelding", { status: 415, headers: cors });
    }
    const declared = Number(upstream.headers.get("content-length") || 0);
    if (declared > MAX_BYTES) return new Response("Afbeelding te groot", { status: 413, headers: cors });

    const reader = upstream.body!.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_BYTES) { reader.cancel(); return new Response("Afbeelding te groot", { status: 413, headers: cors }); }
      chunks.push(value);
    }
    const body = new Uint8Array(size);
    let off = 0;
    for (const c of chunks) { body.set(c, off); off += c.length; }
    return new Response(body, {
      headers: {
        ...cors,
        "Content-Type": type,
        "Cache-Control": "public, max-age=86400",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'",
      },
    });
  } catch {
    return new Response("Afbeelding kon niet worden opgehaald", { status: 502, headers: cors });
  } finally {
    clearTimeout(timer);
  }
});
