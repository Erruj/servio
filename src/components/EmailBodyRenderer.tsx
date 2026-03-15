import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Shield, ImageIcon } from 'lucide-react';

interface EmailBodyRendererProps {
  bodyHtml?: string;
  bodyText?: string;
  className?: string;
}

/**
 * Renders email body content safely:
 * - HTML emails in a sandboxed iframe with external images blocked by default
 * - Plain text emails as pre-wrapped text
 * - Handles UTF-8 encoding issues
 */
export function EmailBodyRenderer({ bodyHtml, bodyText, className = '' }: EmailBodyRendererProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState(200);
  const [showExternalImages, setShowExternalImages] = useState(false);
  const [hasExternalImages, setHasExternalImages] = useState(false);

  const isHtml = Boolean(bodyHtml && bodyHtml.trim().length > 0);
  const content = isHtml ? bodyHtml! : (bodyText || '');

  // Fix common encoding issues (mojibake from latin1/windows-1252 misinterpreted as UTF-8)
  const fixEncoding = (text: string): string => {
    return text
      .replace(/Â€/g, '€')
      .replace(/Â£/g, '£')
      .replace(/Â©/g, '©')
      .replace(/Â®/g, '®')
      .replace(/Â´/g, '´')
      .replace(/Ã©/g, 'é')
      .replace(/Ã¨/g, 'è')
      .replace(/Ã«/g, 'ë')
      .replace(/Ã¯/g, 'ï')
      .replace(/Ã¶/g, 'ö')
      .replace(/Ã¼/g, 'ü')
      .replace(/Ã¤/g, 'ä')
      .replace(/Ã /g, 'à')
      .replace(/Ã¢/g, 'â')
      .replace(/Ã®/g, 'î')
      .replace(/Ã´/g, 'ô')
      .replace(/Ã»/g, 'û')
      .replace(/Ã§/g, 'ç')
      .replace(/Ã±/g, 'ñ')
      .replace(/Â\s/g, ' ')
      .replace(/Â(?=[^\w])/g, '');
  };

  // Check if HTML contains external images
  const detectExternalImages = useCallback((html: string): boolean => {
    const imgRegex = /<img[^>]+src\s*=\s*["'](https?:\/\/[^"']+)["'][^>]*>/gi;
    const bgRegex = /url\s*\(\s*["']?(https?:\/\/[^"')]+)["']?\s*\)/gi;
    return imgRegex.test(html) || bgRegex.test(html);
  }, []);

  // Block external images by replacing src with placeholder
  const blockExternalImages = useCallback((html: string): string => {
    // Block <img> tags with external URLs
    let result = html.replace(
      /<img([^>]+)src\s*=\s*["'](https?:\/\/[^"']+)["']([^>]*)>/gi,
      '<img$1src="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23999\' stroke-width=\'2\'%3E%3Crect x=\'3\' y=\'3\' width=\'18\' height=\'18\' rx=\'2\'/%3E%3Ccircle cx=\'8.5\' cy=\'8.5\' r=\'1.5\'/%3E%3Cpath d=\'m21 15-5-5L5 21\'/%3E%3C/svg%3E" data-original-src="$2"$3>'
    );
    // Block background images in style attributes
    result = result.replace(
      /url\s*\(\s*["']?(https?:\/\/[^"')]+)["']?\s*\)/gi,
      'url(about:blank)'
    );
    return result;
  }, []);

  // Build the full HTML document for the iframe
  const buildIframeDoc = useCallback((htmlContent: string): string => {
    const fixed = fixEncoding(htmlContent);
    const processed = showExternalImages ? fixed : blockExternalImages(fixed);

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; ${showExternalImages ? "img-src https: data: cid:;" : "img-src data: cid:;"} font-src data:;">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #1a1a1a;
      background: transparent;
      word-wrap: break-word;
      overflow-wrap: break-word;
      padding: 0;
    }
    a { color: #2563eb; }
    img { max-width: 100%; height: auto; }
    table { max-width: 100% !important; }
    pre, code { white-space: pre-wrap; word-wrap: break-word; }
    blockquote { border-left: 3px solid #d1d5db; padding-left: 12px; margin: 8px 0; color: #4b5563; }
  </style>
</head>
<body>${processed}</body>
</html>`;
  }, [showExternalImages, blockExternalImages]);

  // Write content to iframe and auto-resize
  useEffect(() => {
    if (!isHtml || !iframeRef.current) return;

    const iframe = iframeRef.current;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    const htmlDoc = buildIframeDoc(content);
    doc.open();
    doc.write(htmlDoc);
    doc.close();

    // Check for external images
    setHasExternalImages(detectExternalImages(content));

    // Auto-resize iframe to content height
    const resizeObserver = new ResizeObserver(() => {
      const body = doc.body;
      if (body) {
        const newHeight = Math.max(body.scrollHeight, 100);
        setIframeHeight(Math.min(newHeight + 16, 800));
      }
    });

    const checkHeight = () => {
      const body = doc.body;
      if (body) {
        resizeObserver.observe(body);
        const newHeight = Math.max(body.scrollHeight, 100);
        setIframeHeight(Math.min(newHeight + 16, 800));
      }
    };

    // Small delay to let content render
    const timer = setTimeout(checkHeight, 100);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
    };
  }, [content, isHtml, buildIframeDoc, detectExternalImages]);

  // Plain text rendering
  if (!isHtml) {
    const fixedText = fixEncoding(content);
    return (
      <div className={`bg-secondary/30 rounded-xl p-4 ${className}`}>
        <pre className="whitespace-pre-wrap text-foreground leading-relaxed font-sans text-sm">
          {fixedText}
        </pre>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* External images banner */}
      {hasExternalImages && !showExternalImages && (
        <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-lg px-3 py-2 mb-3 text-sm">
          <Shield className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-muted-foreground flex-1">
            Externe afbeeldingen zijn geblokkeerd voor je privacy.
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowExternalImages(true)}
            className="text-xs h-7"
          >
            <ImageIcon className="h-3 w-3 mr-1" />
            Toon afbeeldingen
          </Button>
        </div>
      )}

      {/* Sandboxed iframe for HTML email */}
      <div className="bg-secondary/30 rounded-xl overflow-hidden">
        <iframe
          ref={iframeRef}
          sandbox="allow-same-origin"
          title="Email inhoud"
          className="w-full border-0"
          style={{ height: `${iframeHeight}px`, minHeight: '100px' }}
        />
      </div>
    </div>
  );
}
