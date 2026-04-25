import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';

/**
 * Compact NL/EN switcher.
 * Updates i18next language, persists to localStorage, and (for marketing pages)
 * keeps the URL in sync with the /en/ prefix convention.
 */
export function LanguageSwitcher({ variant = 'marketing' }: { variant?: 'marketing' | 'app' }) {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const current = i18n.language?.startsWith('en') ? 'en' : 'nl';

  const switchTo = (lng: 'nl' | 'en') => {
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
    <div className="inline-flex items-center rounded-lg border border-border/60 bg-background/60 p-0.5 text-xs">
      <Button
        type="button"
        variant={current === 'nl' ? 'secondary' : 'ghost'}
        size="sm"
        className="h-7 px-2.5 text-xs font-medium"
        onClick={() => switchTo('nl')}
        aria-label="Nederlands"
      >
        🇳🇱 NL
      </Button>
      <Button
        type="button"
        variant={current === 'en' ? 'secondary' : 'ghost'}
        size="sm"
        className="h-7 px-2.5 text-xs font-medium"
        onClick={() => switchTo('en')}
        aria-label="English"
      >
        🇬🇧 EN
      </Button>
    </div>
  );
}
