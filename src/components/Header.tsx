import { Button } from '@/components/ui/button';
import { Sparkles, LogOut, User as UserIcon } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
  user?: User | null;
  onLogout?: () => void;
}

export function Header({ user, onLogout }: HeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="bg-card border-b border-border shadow-subtle">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center space-x-3">
          <div className="p-1.5 md:p-2 bg-primary/20 rounded-xl">
            <Sparkles className="h-6 w-6 md:h-8 md:w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-primary">Servio</h1>
            <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">
              {t('tagline')}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 md:space-x-3">
          <ThemeToggle />
          <LanguageSelector />
          
          {user && (
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-foreground truncate max-w-[150px]">
                  {user.user_metadata?.full_name || user.email}
                </p>
                <p className="text-xs text-muted-foreground truncate max-w-[150px]">{user.email}</p>
              </div>
              <Button variant="outline" size="sm" onClick={onLogout}>
                <LogOut className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">{t('logout')}</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}