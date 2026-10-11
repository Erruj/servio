import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HelpCircle, Search } from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';
import { MobileNav } from '@/components/MobileNav';
import { Button } from '@/components/ui/button';
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import { ROUTE_META } from './routeMeta';

export function AppTopbar() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const meta = ROUTE_META[pathname];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-3 backdrop-blur-md supports-[backdrop-filter]:bg-background/70 sm:px-6">
      <div className="md:hidden"><MobileNav /></div>

      <div className="min-w-0 flex-1 md:flex-none md:w-64">
        {meta?.parentKey && (
          <p className="truncate text-[13px] leading-none text-muted-foreground">{t(meta.parentKey)}</p>
        )}
        <p className="truncate text-sm font-semibold tracking-tight text-foreground">{meta ? t(meta.titleKey) : 'Servio'}</p>
      </div>

      <div className="hidden flex-1 justify-center md:flex">
        <button
          onClick={() => setOpen(true)}
          className="flex h-9 w-full max-w-md items-center gap-2 rounded-full border border-border bg-card px-4 text-[13px] text-muted-foreground shadow-input transition-colors hover:text-foreground"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">{t('ui.searchPlaceholder')}</span>
          <kbd className="rounded-md border border-border px-1.5 text-[13px]">⌘K</kbd>
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" size="icon" className="h-11 w-11 md:hidden rounded-full" onClick={() => setOpen(true)} aria-label={t('ui.searchPlaceholder')}>
          <Search className="h-4 w-4" />
        </Button>
        <NotificationBell />
        <Button variant="ghost" size="icon" className="hidden h-11 w-11 rounded-full sm:inline-flex text-muted-foreground" title="Sneltoetsen (druk op ?)" aria-label="Help">
          <HelpCircle className="h-4 w-4" />
        </Button>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={t('ui.searchPlaceholder')} />
        <CommandList>
          <CommandEmpty>{t('ui.noResults', { defaultValue: 'Geen resultaten' })}</CommandEmpty>
          <CommandGroup heading={t('ui.pages', { defaultValue: "Pagina's" })}>
            {Object.entries(ROUTE_META).map(([href, m]) => (
              <CommandItem key={href} value={`${t(m.titleKey)} ${href}`} onSelect={() => { setOpen(false); navigate(href); }}>
                {t(m.titleKey)}
                {m.parentKey && <span className="ml-2 text-muted-foreground">· {t(m.parentKey)}</span>}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </header>
  );
}
