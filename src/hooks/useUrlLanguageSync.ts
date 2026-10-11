import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18nInstance from '@/lib/i18n';

/**
 * Op marketingroutes bepaalt de URL de taal:
 *  - /en of /en/* → altijd Engels
 *  - routes zonder prefix → Nederlands, tenzij de bezoeker in deze sessie
 *    via de keuzelijst DE/FR/ES koos (die talen hebben geen eigen route)
 * Deze wissels worden niet opgeslagen, zodat de app-taal (profiel /
 * localStorage) de website niet overschrijft en andersom.
 * Op app-routes wordt de opgeslagen app-taal hersteld.
 */
const MARKETING_PATHS = ['/', '/features', '/pricing', '/about', '/blog', '/contact', '/privacy', '/terms', '/cookies'];
const SESSION_KEY = 'servio-marketing-language';
const NO_ROUTE_LANGS = ['de', 'fr', 'es'];

export function isMarketingPath(path: string): boolean {
  if (path === '/en' || path.startsWith('/en/')) return true;
  return MARKETING_PATHS.some((p) => path === p || (p !== '/' && path.startsWith(p + '/')));
}

let suppressPersist = false;
export const isLanguagePersistSuppressed = () => suppressPersist;

/** Taal wisselen zonder het in localStorage/profiel op te slaan. */
export function changeLanguageTransient(lng: string) {
  if ((i18nInstance.language || '').slice(0, 2) === lng) return;
  suppressPersist = true;
  Promise.resolve(i18nInstance.changeLanguage(lng)).finally(() => { suppressPersist = false; });
}

export function setMarketingLanguageChoice(lng: string) {
  try {
    if (NO_ROUTE_LANGS.includes(lng)) sessionStorage.setItem(SESSION_KEY, lng);
    else sessionStorage.removeItem(SESSION_KEY);
  } catch { /* noop */ }
}

export function marketingLanguageFor(path: string): string {
  if (path === '/en' || path.startsWith('/en/')) return 'en';
  try {
    const chosen = sessionStorage.getItem(SESSION_KEY);
    if (chosen && NO_ROUTE_LANGS.includes(chosen)) return chosen;
  } catch { /* noop */ }
  return 'nl';
}

export function useUrlLanguageSync() {
  const location = useLocation();
  const { i18n } = useTranslation();

  useEffect(() => {
    const path = location.pathname;
    if (isMarketingPath(path)) {
      changeLanguageTransient(marketingLanguageFor(path));
      return;
    }
    let saved: string | null = null;
    try { saved = localStorage.getItem('servio-language'); } catch { /* noop */ }
    if (saved) changeLanguageTransient(saved);
  }, [location.pathname, i18n]);
}
