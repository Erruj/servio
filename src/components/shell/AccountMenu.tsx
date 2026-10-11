import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import { ChevronsUpDown, CreditCard, Globe, LogOut, Moon, Sun, User } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { APP_LANGUAGES, changeAppLanguage } from '@/components/LanguageSelector';
import { cn } from '@/lib/utils';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
  DropdownMenuRadioGroup, DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';

export function AccountMenu({ collapsed = false }: { collapsed?: boolean }) {
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [name, setName] = useState('');

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle()
      .then(({ data }) => setName(data?.full_name || user.email || ''));
  }, [user]);

  const initials = (name || user?.email || '?').trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  const isDark = resolvedTheme === 'dark';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex w-full items-center gap-3 rounded-xl p-2 min-h-11 text-left transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            collapsed && 'justify-center',
          )}
          aria-label={t('ui.accountMenu', { defaultValue: 'Accountmenu' })}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[13px] font-semibold text-primary">
            {initials}
          </span>
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-foreground">{name}</span>
                <span className="block truncate text-[13px] text-muted-foreground">{user?.email}</span>
              </span>
              <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-60 rounded-xl">
        <DropdownMenuLabel className="truncate font-normal text-muted-foreground">{user?.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/profile')}><User className="mr-2 h-4 w-4" />{t('ui.profile')}</DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/settings#subscription')}><CreditCard className="mr-2 h-4 w-4" />{t('ui.subscription', { defaultValue: 'Abonnement' })}</DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger><Globe className="mr-2 h-4 w-4" />{t('ui.language', { defaultValue: 'Taal' })}</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={i18n.language?.slice(0, 2)} onValueChange={(code) => changeAppLanguage(i18n, code)}>
              {APP_LANGUAGES.map((l) => (
                <DropdownMenuRadioItem key={l.code} value={l.code}>{l.name}</DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem onClick={() => setTheme(isDark ? 'light' : 'dark')}>
          {isDark ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
          {isDark ? t('ui.lightMode', { defaultValue: 'Licht thema' }) : t('ui.darkMode', { defaultValue: 'Donker thema' })}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={async () => { await signOut(); navigate('/login'); }}>
          <LogOut className="mr-2 h-4 w-4" />{t('logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
