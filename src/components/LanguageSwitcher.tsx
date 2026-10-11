import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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

  useEffect(() => {
    document.documentElement.lang = current;
  }, [current]);

  if (variant === 'marketing') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Taal / Language"
            className="inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            <Globe className="h-4 w-4" />
            {current.toUpperCase()}
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="z-[70] min-w-[10rem]">
          {LANGS.map((l) => (
            <DropdownMenuItem key={l.code} onSelect={() => switchTo(l.code)} className="min-h-11 justify-between">
              {l.name}
              {current === l.code && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

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
