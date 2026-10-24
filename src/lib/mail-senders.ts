export function senderAddress(value: string): string | null {
  const address = (value.match(/<([^<>]+)>/)?.[1] || value).trim().toLowerCase();
  return address.length <= 320 && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(address) ? address : null;
}

export function legacyBlockedSenders(raw: string | null): string[] {
  try {
    const values: unknown = JSON.parse(raw || '[]');
    return Array.isArray(values) ? [...new Set(values.filter((v): v is string => typeof v === 'string').map(senderAddress).filter((v): v is string => !!v))] : [];
  } catch { return []; }
}

export function unsubscribeLinks(header?: string | null): { https?: string; mailto?: string } {
  const result: { https?: string; mailto?: string } = {};
  for (const match of (header || '').matchAll(/<([^<>]+)>/g)) {
    try {
      const url = new URL(match[1]);
      if (url.protocol === 'https:' && !url.username && !url.password && !result.https) result.https = url.href;
      if (url.protocol === 'mailto:' && senderAddress(decodeURIComponent(url.pathname)) && !result.mailto) result.mailto = url.href;
    } catch { /* Ignore malformed sender-provided links. */ }
  }
  return result;
}