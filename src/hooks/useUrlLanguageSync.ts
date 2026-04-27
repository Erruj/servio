import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * Synchroniseert i18n taal met de huidige URL prefix:
 *  - /en of /en/* → 'en'
 *  - alles anders (marketing) → 'nl' (alleen wanneer een marketing-pad)
 *  - app routes (/app, /dashboard, etc.) wijzigen de taal NIET op basis van URL
 */
const MARKETING_PATHS = ['/', '/features', '/pricing', '/about', '/blog', '/contact', '/privacy', '/terms', '/cookies'];

function isMarketingPath(path: string): boolean {
  if (path.startsWith('/en')) return true;
  return MARKETING_PATHS.some((p) => path === p || (p !== '/' && path.startsWith(p + '/')));
}

export function useUrlLanguageSync() {
  const location = useLocation();
  const { i18n } = useTranslation();

  useEffect(() => {
    const path = location.pathname;
    if (!isMarketingPath(path)) return;

    const wantsEn = path === '/en' || path.startsWith('/en/');
    const target = wantsEn ? 'en' : 'nl';
    if (i18n.language !== target) {
      i18n.changeLanguage(target);
      try { localStorage.setItem('servio-language', target); } catch { /* noop */ }
    }
  }, [location.pathname, i18n]);
}
