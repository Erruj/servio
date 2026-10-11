import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';

/**
 * Compact language switcher (NL/EN/DE/FR/ES). Only EN has its own /en URLs.
 * Updates i18next language, persists to localStorage, and (for marketing pages)
 * keeps the URL in sync with the /en/ prefix convention.
 */
export function LanguageSwitcher({ variant = 'marketing' }: { variant?: 'marketing' | 'app' }) {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const LANGS = [
    { code: 'nl', label: 'NL', name: 'Nederlands' },
    { code: 'en', label: 'EN', name: 'English' },
    { code: 'de', label: 'DE', name: 'Deutsch' },
    { code: 'fr', label: 'FR', name: 'Français' },
    { code: 'es', label: 'ES', name: 'Español' },
  ] as const;
  type Lng = (typeof LANGS)[number]['code'];
  const current = ((i18n.language || 'nl').slice(0, 2) as Lng);

  const switchTo = (lng: Lng) => {
    if (lng === current) return;
    i18n.changeLanguage(lng);
    try { localStorage.setItem('servio-language', lng); } catch { /* noop */ }

    if (variant === 'marketing') {
      const path = location.pathname;
      const isMarketingPath = ['/', '/features', '/pricing', '/about', '/blog', '/contact', '/privacy', '/terms', '/cookies'].some(
        (p) => path === p || path.startsWith(p === '/' ? '/' : p + '/')
      ) || path.startsWith('/en');

      if (isMarketingPath) {
        let stripped = path.startsWith('/en/') ? path.slice(3) : path === '/en' ? '/' : path;
        if (!stripped.startsWith('/')) stripped = '/' + stripped;
        const target = lng === 'en' ? (stripped === '/' ? '/en' : '/en' + stripped) : stripped;
        navigate(target);
      }
    }
  };

  return (
    <div className="inline-flex flex-wrap items-center rounded-lg border border-border/60 bg-background/60 p-0.5 text-xs">
      {LANGS.map((l) => (
        <Button
          key={l.code}
          type="button"
          variant={current === l.code ? 'secondary' : 'ghost'}
          size="sm"
          className="h-11 min-w-11 sm:h-7 sm:min-w-0 px-2.5 text-xs font-medium"
          onClick={() => switchTo(l.code)}
          aria-label={l.name}
          aria-pressed={current === l.code}
        >
          {l.label}
        </Button>
      ))}
    </div>
  );
}
