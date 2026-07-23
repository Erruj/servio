// Email text utilities: strip HTML/CSS, decode entities, fix common UTF-8 mojibake.

const ENTITY_MAP: Record<string, string> = {
  nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
  copy: '©', reg: '®', trade: '™', hellip: '…', mdash: '—', ndash: '–',
  lsquo: '\u2018', rsquo: '\u2019', ldquo: '\u201C', rdquo: '\u201D', euro: '€', pound: '£',
};

function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => {
      try { return String.fromCodePoint(parseInt(h, 16)); } catch { return ''; }
    })
    .replace(/&#(\d+);/g, (_, d) => {
      try { return String.fromCodePoint(parseInt(d, 10)); } catch { return ''; }
    })
    .replace(/&([a-zA-Z]+);/g, (m, name) => ENTITY_MAP[name.toLowerCase()] ?? '');
}

// Fix common mojibake from latin1/windows-1252 misinterpreted as UTF-8
export function fixEncoding(text: string): string {
  if (!text) return '';
  return text
    .replace(/Ã©/g, 'é').replace(/Ã¨/g, 'è').replace(/Ã«/g, 'ë').replace(/Ãª/g, 'ê')
    .replace(/Ã¯/g, 'ï').replace(/Ã®/g, 'î').replace(/Ã¶/g, 'ö').replace(/Ã´/g, 'ô')
    .replace(/Ã¼/g, 'ü').replace(/Ã»/g, 'û').replace(/Ã¤/g, 'ä').replace(/Ã¢/g, 'â')
    .replace(/Ã§/g, 'ç').replace(/Ã±/g, 'ñ').replace(/Ã³/g, 'ó').replace(/Ã /g, 'à')
    .replace(/Ã¡/g, 'á').replace(/Ãº/g, 'ú').replace(/Ã­/g, 'í').replace(/Ã¥/g, 'å')
    .replace(/Ã˜/g, 'Ø').replace(/Ã†/g, 'Æ').replace(/Ã‰/g, 'É').replace(/Ã„/g, 'Ä')
    .replace(/Ã–/g, 'Ö').replace(/Ãœ/g, 'Ü').replace(/Ã‡/g, 'Ç')
    .replace(/â‚¬/g, '€').replace(/Â£/g, '£').replace(/Â©/g, '©').replace(/Â®/g, '®')
    .replace(/â€™/g, '\u2019').replace(/â€˜/g, '\u2018').replace(/â€œ/g, '\u201C').replace(/â€/g, '\u201D')
    .replace(/â€"/g, '–').replace(/â€"/g, '—').replace(/â€¦/g, '…')
    .replace(/Â\s/g, ' ').replace(/Â(?=[^\w])/g, '');
}

/**
 * Aggressively strip an HTML / CSS / MIME-leaking string into clean readable text.
 * Removes style/script blocks, @-rules, CSS selectors+declarations that leaked
 * into the body, HTML tags, entities, MIME headers, and zero-width chars.
 */
export function stripToPlainText(input: string): string {
  if (!input) return '';
  let s = input;

  // Remove HTML comments
  s = s.replace(/<!--[\s\S]*?-->/g, ' ');

  // Remove full <style>/<script>/<head> blocks (with content)
  s = s.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ');
  s = s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ');
  s = s.replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, ' ');

  // Strip remaining tags
  s = s.replace(/<\/?[a-zA-Z][^>]*>/g, ' ');

  // Decode HTML entities
  s = decodeEntities(s);

  // Remove leaked CSS: @-rules with blocks (@font-face, @media, @import, @charset, @keyframes, etc.)
  s = s.replace(/@[a-z-]+\b[^{};]*\{[\s\S]*?\}/gi, ' ');
  s = s.replace(/@[a-z-]+\b[^;]*;/gi, ' ');

  // Remove CSS rule blocks: selector { ... } — including attribute selectors like a[href^="x"]
  // Keep iterating until no more blocks (handles nested-ish content)
  for (let i = 0; i < 4; i++) {
    const before = s;
    s = s.replace(/[^{}\n;<>]{1,400}\{[^{}]*\}/g, ' ');
    if (s === before) break;
  }

  // Remove stray CSS declarations on their own line: "background-color: #F0F0F0;"
  s = s.replace(/(^|\n|\s)[a-z-]{2,40}\s*:\s*[^;\n{}]{1,200};/gi, ' ');

  // Remove any remaining brace blocks (orphan CSS that survived above)
  s = s.replace(/\{[^{}]*\}/g, ' ');

  // Remove standalone CSS selectors left behind (e.g. ".foo, #bar a:hover")
  s = s.replace(/(^|\s)[.#][a-zA-Z][\w-]*(\s*[,>+~]\s*[.#]?[a-zA-Z][\w-]*)*\s*(?=\s|$)/g, ' ');


  // Remove MIME headers that sometimes leak
  s = s.replace(/^(content-type|content-transfer-encoding|mime-version|boundary):[^\n]*$/gim, ' ');

  // Remove zero-width / BOM
  s = s.replace(/[\u200B-\u200D\uFEFF]/g, '');

  // Fix mojibake
  s = fixEncoding(s);

  // Collapse whitespace
  s = s.replace(/\s+/g, ' ').trim();

  return s;
}

/** Build a clean preview, max N chars. Always strips HTML/CSS aggressively. */
export function buildPreview(opts: { bodyText?: string | null; bodyHtml?: string | null; snippet?: string | null }, maxLen = 120): string {
  const looksLikeJunk = (s: string): boolean => {
    if (!s || s.length < 4) return true;
    if (/^[\s{}@.#:>;,*+\-_/\\()=\[\]"'`%]+$/.test(s)) return true;
    if (/\{[^}]*:[^}]*\}/.test(s)) return true;
    if (/@(font-face|media|import|charset|keyframes|supports)\b/i.test(s)) return true;
    // Mostly CSS-like tokens vs words
    const words = s.split(/\s+/).filter(w => /^[a-zA-ZÀ-ÿ]{2,}$/.test(w)).length;
    if (words < 2 && s.length > 20) return true;
    return false;
  };

  const sources = [opts.bodyText, opts.bodyHtml, opts.snippet];
  for (const src of sources) {
    if (!src) continue;
    const cleaned = stripToPlainText(src);
    if (cleaned && !looksLikeJunk(cleaned)) {
      return cleaned.length > maxLen ? cleaned.slice(0, maxLen).trimEnd() + '…' : cleaned;
    }
  }
  // Last-resort: combine + scrub residual CSS-ish tokens
  const fallback = stripToPlainText([opts.bodyText, opts.bodyHtml, opts.snippet].filter(Boolean).join(' '));
  const scrubbed = fallback
    .replace(/\{[^}]*\}/g, ' ')
    .replace(/[a-z-]{2,30}\s*:\s*[^;]{1,80};/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return scrubbed.length > maxLen ? scrubbed.slice(0, maxLen).trimEnd() + '…' : scrubbed;
}

/**
 * Split a plain-text email body into the new reply and the quoted previous message.
 * Detects common markers in Dutch/English/German/French plus classic `>` quoting
 * and Outlook-style "-----Original Message-----" separators.
 */
export function splitQuotedReply(text: string): { main: string; quoted: string | null } {
  if (!text) return { main: '', quoted: null };

  // Patterns that mark the beginning of a quoted previous email. Each is anchored
  // to line start so we don't split on the word "op" mid-sentence.
  const markers: RegExp[] = [
    // Dutch: "Op maandag 12 mei 2025 om 10:00 schreef Jan <jan@x.nl>:"
    /^[ \t>]*Op\s.{1,300}\bschreef\b[^\n]*:?\s*$/im,
    // English: "On Mon, May 12, 2025 at 10:00 AM John Doe <john@x.com> wrote:"
    /^[ \t>]*On\s.{1,300}\bwrote\b[^\n]*:?\s*$/im,
    // German: "Am 12.05.2025 um 10:00 schrieb Jan:"
    /^[ \t>]*Am\s.{1,300}\bschrieb\b[^\n]*:?\s*$/im,
    // French: "Le 12 mai 2025 à 10:00, Jean a écrit :"
    /^[ \t>]*Le\s.{1,300}\ba\s+écrit\b[^\n]*:?\s*$/im,
    // Outlook separator
    /^[ \t>]*-{2,}\s*(Original Message|Oorspronkelijk bericht|Ursprüngliche Nachricht|Message d'origine)\s*-{2,}\s*$/im,
    // Header block that starts with From:/Van:/Von:/De:
    /^[ \t>]*(From|Van|Von|De)\s*:\s.{1,200}$/im,
    // A run of at least 2 consecutive lines starting with ">"
    /(?:^|\n)(?:[ \t]*>[^\n]*\n){2,}/,
  ];

  let earliest = -1;
  for (const re of markers) {
    const m = text.match(re);
    if (m && typeof m.index === 'number') {
      if (earliest === -1 || m.index < earliest) earliest = m.index;
    }
  }

  if (earliest === -1) return { main: text, quoted: null };

  const main = text.slice(0, earliest).replace(/\s+$/, '');
  const quoted = text.slice(earliest).replace(/^\s+/, '');
  if (!main || !quoted) return { main: text, quoted: null };
  return { main, quoted };
}

