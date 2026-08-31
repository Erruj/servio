// Gedeelde security-helpers voor edge functions.

/**
 * Vergelijkt twee strings in (nagenoeg) constante tijd, zodat een aanvaller
 * geen secret kan afleiden uit responstijden.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  // Lengteverschil mag niet leiden tot vroegtijdig stoppen: vergelijk altijd
  // over dezelfde lengte en neem het lengteverschil mee in het resultaat.
  const len = Math.max(aBytes.length, bBytes.length);
  let diff = aBytes.length ^ bBytes.length;
  for (let i = 0; i < len; i++) {
    diff |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0);
  }
  return diff === 0;
}

const SENSITIVE_PATTERNS: Array<[RegExp, string]> = [
  [/("?(access|refresh|id)_token"?\s*[:=]\s*")[^"]+/gi, '$1[REDACTED]'],
  [/(Bearer\s+)[A-Za-z0-9._\-]+/gi, '$1[REDACTED]'],
  [/("?client_secret"?\s*[:=]\s*")[^"]+/gi, '$1[REDACTED]'],
  [/("?password"?\s*[:=]\s*")[^"]+/gi, '$1[REDACTED]'],
];

/**
 * Maakt een upstream response-body veilig om te loggen: redacteert tokens en
 * geheimen en kort de body af, zodat er nooit volledige provider-payloads
 * (met mogelijke token-fragmenten) in de logs terechtkomen.
 */
export function safeLogBody(body: unknown, maxLength = 300): string {
  let text = typeof body === "string" ? body : (() => {
    try {
      return JSON.stringify(body);
    } catch {
      return String(body);
    }
  })();

  for (const [pattern, replacement] of SENSITIVE_PATTERNS) {
    text = text.replace(pattern, replacement);
  }

  return text.length > maxLength ? `${text.slice(0, maxLength)}…[truncated]` : text;
}

const ALLOWED_ORIGIN_PATTERNS: RegExp[] = [
  /^https:\/\/(www\.)?getservio\.co$/i,
  /^https:\/\/[a-z0-9-]+\.lovable\.app$/i,
  /^https:\/\/[a-z0-9-]+\.lovableproject\.com$/i,
  /^https:\/\/[a-z0-9.-]+\.lovable\.dev$/i,
  /^http:\/\/localhost(:\d+)?$/i,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/i,
];

const DEFAULT_ORIGIN = "https://getservio.co";

/**
 * CORS-headers met een allow-list in plaats van een wildcard. Alleen de eigen
 * frontend (productie, Lovable-previews en lokale dev) mag deze gevoelige
 * endpoints vanuit de browser aanroepen.
 */
export function buildCorsHeaders(req: Request, allowHeaders: string): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  const allowed = ALLOWED_ORIGIN_PATTERNS.some((p) => p.test(origin));
  return {
    "Access-Control-Allow-Origin": allowed ? origin : DEFAULT_ORIGIN,
    "Access-Control-Allow-Headers": allowHeaders,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}
