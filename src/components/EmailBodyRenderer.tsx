import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Shield, ImageIcon, ChevronDown, ChevronUp, UserCheck } from 'lucide-react';
import { fixEncoding as fixEnc, stripToPlainText, splitQuotedReply } from '@/lib/emailText';
import { supabase } from '@/integrations/supabase/client';
import { useEmailImagePrefs } from '@/hooks/useEmailImagePrefs';
import { ComposeEmail } from '@/components/ComposeEmail';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { toast } from 'sonner';

interface EmailBodyRendererProps {
  bodyHtml?: string;
  bodyText?: string;
  className?: string;
  fromEmail?: string;
}

const PLACEHOLDER_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/%3E";
const EXT_IMG_RE = /<img\b([^>]*?)\bsrc\s*=\s*["'](https?:\/\/[^"']+)["']([^>]*)>/gi;
const STYLE_URL_RE = /url\(\s*(['"]?)(https?:\/\/[^'")\s]+)\1\s*\)/gi;

function decodeEntities(s: string) {
  return s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

/** Verzamelt alle externe afbeeldings-URL's (img src + inline style url()). */
function collectImageUrls(html: string): string[] {
  const urls = new Set<string>();
  const noStyleBlocks = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  for (const m of noStyleBlocks.matchAll(EXT_IMG_RE)) urls.add(decodeEntities(m[2]));
  for (const m of noStyleBlocks.matchAll(/style\s*=\s*"([^"]*)"/gi)) {
    for (const u of m[1].matchAll(STYLE_URL_RE)) urls.add(decodeEntities(u[2]));
  }
  return [...urls];
}

/** Herschrijft externe afbeeldingen: naar proxy-URL (map) of naar een lege placeholder. */
function rewriteImages(html: string, map: Record<string, string> | null): string {
  const to = (raw: string) => (map ? map[decodeEntities(raw)] : undefined);
  let out = html.replace(EXT_IMG_RE, (_m, pre, src, post) => {
    const proxied = to(src);
    return proxied
      ? `<img${pre}src="${proxied}"${post}>`
      : `<img${pre}src="${PLACEHOLDER_SVG}" data-blocked="1"${post}>`;
  });
  out = out.replace(/style\s*=\s*"([^"]*)"/gi, (_m, style: string) =>
    `style="${style.replace(STYLE_URL_RE, (_x, _q, u) => { const p = to(u); return p ? `url('${p}')` : 'none'; })}"`);
  return out;
}

function domainOf(url: string): string | null {
  try { return new URL(url).hostname.replace(/^www\./, '').toLowerCase(); } catch { return null; }
}

/** Is de zichtbare linktekst zelf een domein dat afwijkt van het echte doel? */
function looksMisleading(text: string, href: string): string | null {
  const target = domainOf(href);
  if (!target) return null;
  const m = text.trim().toLowerCase().match(/^(?:https?:\/\/)?(?:www\.)?([a-z0-9-]+(?:\.[a-z0-9-]+)+)(?:[/?#]\S*)?$/);
  if (!m) return null;
  const shown = m[1];
  const same = target === shown || target.endsWith('.' + shown) || shown.endsWith('.' + target);
  return same ? null : target;
}

/**
 * Toont e-mailinhoud veilig:
 * - HTML in een sandboxed iframe (geen scripts); links openen altijd in een nieuw tabblad
 * - externe afbeeldingen standaard geblokkeerd, op verzoek via de eigen image-proxy
 */
export function EmailBodyRenderer({ bodyHtml, bodyText, className = '', fromEmail }: EmailBodyRendererProps) {
  const { t } = useTranslation();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState(200);
  const [showOnce, setShowOnce] = useState(false);
  const [proxyMap, setProxyMap] = useState<Record<string, string> | null>(null);
  const [loadingImages, setLoadingImages] = useState(false);
  const [showQuoted, setShowQuoted] = useState(false);
  const [hoverUrl, setHoverUrl] = useState<string | null>(null);
  const [pendingLink, setPendingLink] = useState<{ url: string; domain: string } | null>(null);
  const [mailtoTo, setMailtoTo] = useState<string | null>(null);
  const prefs = useEmailImagePrefs();

  const isHtml = Boolean(bodyHtml && bodyHtml.trim().length > 0);
  const content = isHtml ? (bodyHtml || '') : (bodyText || '');
  const sender = (fromEmail || '').toLowerCase();

  useEffect(() => { setShowOnce(false); setProxyMap(null); setShowQuoted(false); }, [content]);

  const imageUrls = useMemo(() => (isHtml ? collectImageUrls(content) : []), [isHtml, content]);
  const hasExternalImages = imageUrls.length > 0;
  const wantImages = prefs.mode !== 'never' && (showOnce || prefs.mode === 'always' || (!!sender && prefs.senders.has(sender)));

  // Vraag ondertekende proxy-URL's op zodra afbeeldingen getoond mogen worden.
  useEffect(() => {
    if (!wantImages || !hasExternalImages || proxyMap) return;
    let cancelled = false;
    setLoadingImages(true);
    supabase.functions.invoke('email-image-proxy', { body: { urls: imageUrls.slice(0, 300) } })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data?.signed) { toast.error(t('emailView.imagesError')); setShowOnce(false); return; }
        setProxyMap(data.signed);
      })
      .finally(() => { if (!cancelled) setLoadingImages(false); });
    return () => { cancelled = true; };
  }, [wantImages, hasExternalImages, proxyMap, imageUrls, t]);

  const htmlHasQuoted = useMemo(() => {
    if (!isHtml) return false;
    return /class\s*=\s*["'][^"']*\bgmail_quote\b[^"']*["']|<blockquote\b|id\s*=\s*["']divRplyFwdMsg["']|type\s*=\s*["']cite["']/i.test(content);
  }, [isHtml, content]);

  const buildIframeDoc = useCallback((htmlContent: string): string => {
    const fixed = fixEnc(htmlContent)
      // Geen scripts, event-handlers of base-tags uit de mail.
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<base\b[^>]*>/gi, '');
    const processed = rewriteImages(fixed, wantImages ? proxyMap : null);
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src data: cid: https://*.supabase.co; font-src data:;">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; max-width: 100% !important; }
    html, body { overflow-x: hidden; width: 100%; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.6; color: #1a1a1a; background: transparent; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word; }
    a { color: #2563eb; word-break: break-all; cursor: pointer; }
    img { max-width: 100% !important; height: auto !important; }
    img[data-blocked="1"], img.servio-broken { display: inline-block; min-width: 24px; min-height: 18px; background: #f1f5f9; border-radius: 6px; }
    .servio-alt { display: inline-block; padding: 2px 8px; border-radius: 6px; background: #f1f5f9; color: #64748b; font-size: 12px; }
    table { max-width: 100% !important; display: block; overflow-x: auto; }
    pre, code { white-space: pre-wrap; word-wrap: break-word; }
    blockquote { border-left: 3px solid #d1d5db; padding-left: 12px; margin: 8px 0; color: #4b5563; }
    body[data-hide-quoted="1"] .gmail_quote,
    body[data-hide-quoted="1"] blockquote,
    body[data-hide-quoted="1"] [type="cite"],
    body[data-hide-quoted="1"] .servio-quoted { display: none !important; }
  </style>
</head>
<body${!showQuoted ? ' data-hide-quoted="1"' : ''}>${processed}</body>
</html>`;
  }, [wantImages, proxyMap, showQuoted]);

  const openExternal = useCallback((url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  useEffect(() => {
    if (!isHtml || !iframeRef.current) return;
    const iframe = iframeRef.current;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(buildIframeDoc(content));
    doc.close();
    const outlook=doc.getElementById('divRplyFwdMsg');
    if(outlook){let node:Element|null=outlook;while(node){node.classList.add('servio-quoted');node=node.nextElementSibling;}}

    // Alle links: nieuw tabblad, zonder opener/referrer.
    doc.querySelectorAll('a[href]').forEach((a) => {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
    });
    // Afbeeldingen die toch niet laden: nette placeholder met alt-tekst.
    doc.querySelectorAll('img').forEach((img) => {
      img.addEventListener('error', () => {
        const alt = img.getAttribute('alt');
        if (alt && alt.trim()) {
          const span = doc.createElement('span');
          span.className = 'servio-alt';
          span.textContent = alt;
          img.replaceWith(span);
        } else {
          img.style.display = 'none';
        }
      }, { once: true });
    });

    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a) return;
      e.preventDefault();
      const raw = a.getAttribute('href') || '';
      if (raw.startsWith('#')) {
        const id = decodeURIComponent(raw.slice(1));
        const el = doc.getElementById(id) || doc.getElementsByName(id)[0];
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      if (/^mailto:/i.test(raw)) {
        setMailtoTo(decodeURIComponent(raw.replace(/^mailto:/i, '').split('?')[0]));
        return;
      }
      if (!/^https?:\/\//i.test(raw)) return; // javascript:, data:, enz. nooit openen
      const misleading = looksMisleading(a.textContent || '', raw);
      if (misleading) setPendingLink({ url: raw, domain: misleading });
      else openExternal(raw);
    };
    const onOver = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      const href = a?.getAttribute('href') || '';
      setHoverUrl(a && href && !href.startsWith('#') ? href : null);
    };
    const onLeave = () => setHoverUrl(null);
    doc.addEventListener('click', onClick);
    doc.addEventListener('mouseover', onOver);
    doc.addEventListener('mouseleave', onLeave);

    const resize = () => {
      const body = doc.body;
      if (body) setIframeHeight(Math.min(Math.max(body.scrollHeight, 100) + 16, 800));
    };
    const resizeObserver = new ResizeObserver(resize);
    const timer = setTimeout(() => { if (doc.body) resizeObserver.observe(doc.body); resize(); }, 100);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      doc.removeEventListener('click', onClick);
      doc.removeEventListener('mouseover', onOver);
      doc.removeEventListener('mouseleave', onLeave);
    };
  }, [content, isHtml, buildIframeDoc, openExternal]);

  const compose = mailtoTo !== null && (
    <ComposeEmail key={mailtoTo} open onOpenChange={(o) => { if (!o) setMailtoTo(null); }} hasConnection initialTo={mailtoTo} />
  );

  if (!isHtml) {
    const looksLikeMarkup = /<\/?[a-z][^>]*>|@font-face|@media|\{[^}]*:[^}]*\}/i.test(content);
    const cleanText = looksLikeMarkup ? stripToPlainText(content) : fixEnc(content);
    const { main, quoted } = splitQuotedReply(cleanText);
    return (
      <div className={`bg-secondary/30 rounded-xl p-4 ${className}`}>
        <pre className="whitespace-pre-wrap text-foreground leading-relaxed font-sans text-sm">{main}</pre>
        {quoted && (
          <div className="mt-3">
            <Button variant="ghost" size="icon" aria-expanded={showQuoted} aria-label={t(showQuoted?'mailSearch.hideQuotes':'mailSearch.quotes')} title={t(showQuoted?'mailSearch.hideQuotes':'mailSearch.quotes')} onClick={() => setShowQuoted(v => !v)} className="h-11 w-11 text-muted-foreground hover:text-foreground">
              ⋯
            </Button>
            {showQuoted && (
              <pre className="mt-2 whitespace-pre-wrap font-sans text-xs leading-relaxed text-muted-foreground border-l-2 border-border pl-3">{quoted}</pre>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      {hasExternalImages && !wantImages && prefs.loaded && (
        <div className="flex flex-wrap items-center gap-2 bg-muted/40 rounded-lg px-3 py-2 mb-3 text-[13px]">
          <Shield className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-muted-foreground flex-1 min-w-[180px]">
            {prefs.mode === 'never' ? t('emailView.imagesNever') : t('emailView.imagesBlocked')}
          </span>
          {prefs.mode !== 'never' && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setShowOnce(true)} className="text-[13px] h-8">
                <ImageIcon className="h-3.5 w-3.5 mr-1" />{t('emailView.showImages')}
              </Button>
              {sender && (
                <Button variant="ghost" size="sm" className="text-[13px] h-8"
                  onClick={() => prefs.trustSender.mutate(sender, {
                    onSuccess: () => toast.success(t('emailView.senderTrusted', { sender })),
                    onError: (e) => toast.error((e as Error).message),
                  })}>
                  <UserCheck className="h-3.5 w-3.5 mr-1" />{t('emailView.alwaysForSender', { sender })}
                </Button>
              )}
            </>
          )}
        </div>
      )}

      <div className="relative bg-secondary/30 rounded-xl overflow-hidden p-4">
        <iframe
          ref={iframeRef}
          sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          title={t('emailView.iframeTitle')}
          className="w-full border-0"
          style={{ height: `${iframeHeight}px`, minHeight: '100px', opacity: loadingImages ? 0.85 : 1 }}
        />
        {htmlHasQuoted && (
          <div className="mt-2">
            <Button variant="ghost" size="icon" aria-expanded={showQuoted} aria-label={t(showQuoted?'mailSearch.hideQuotes':'mailSearch.quotes')} title={t(showQuoted?'mailSearch.hideQuotes':'mailSearch.quotes')} onClick={() => setShowQuoted(v => !v)} className="h-11 w-11 text-muted-foreground hover:text-foreground">
              ⋯
            </Button>
          </div>
        )}
        {hoverUrl && (
          <div className="pointer-events-none absolute bottom-1 left-1 max-w-[90%] truncate rounded-md bg-popover/95 px-2 py-1 text-[13px] text-muted-foreground shadow-sm border border-border">
            {hoverUrl}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!pendingLink}
        onOpenChange={(o) => { if (!o) setPendingLink(null); }}
        title={t('emailView.linkWarningTitle')}
        description={t('emailView.linkWarning', { domain: pendingLink?.domain ?? '' })}
        confirmLabel={t('emailView.linkContinue')}
        cancelLabel={t('emailView.cancel')}
        variant="default"
        onConfirm={() => { if (pendingLink) openExternal(pendingLink.url); setPendingLink(null); }}
      />
      {compose}
    </div>
  );
}
