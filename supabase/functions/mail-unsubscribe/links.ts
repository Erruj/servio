export function unsubscribeTarget(header: string | null, post: string | null) {
  const links = (header || '').match(/<[^<>]+>/g) || [];
  let https: string | undefined;
  let mailto: string | undefined;
  for (const link of links) {
    try {
      const url = new URL(link.slice(1,-1));
      if(url.protocol==='https:' && !url.username && !url.password && !https) https=url.href;
      if(url.protocol==='mailto:' && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(decodeURIComponent(url.pathname)) && !mailto) mailto=url.href;
    } catch { /* ignore invalid headers */ }
  }
  return {https,mailto,oneClick:!!https && /^\s*List-Unsubscribe\s*=\s*One-Click\s*$/i.test(post || '')};
}
export function publicAddress(address:string):boolean {
  if(address.includes(':')) return false; // IPv6 and IPv4-mapped literals are deliberately not accepted.
  const parts=address.split('.').map(Number);
  if(parts.length!==4 || parts.some(n=>!Number.isInteger(n)||n<0||n>255)) return false;
  const [a,b]=parts;
  return !(a===0||a===10||a===127||a>=224||a===169&&b===254||a===172&&b>=16&&b<=31||a===192&&(b===168||b===0||b===2)||a===100&&b>=64&&b<=127||a===198&&(b===18||b===19||b===51)||a===203&&b===0);
}