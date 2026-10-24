import {useMailNotifications} from '@/hooks/useMailNotifications';
import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { AppTopbar } from '@/components/shell/AppTopbar';
import { AppShellContext } from '@/components/shell/AppShellContext';

interface AppShellProps {
  children: ReactNode;
  /** When true, the main content area does not scroll — the page manages its own scrolling. */
  noScroll?: boolean;
}

/**
 * Eén gedeelde shell voor alle ingelogde pagina's: sidebar links, slanke bovenbalk,
 * inhoud met een korte fade (150ms, alleen opacity) bij route-wissels.
 */
export function AppShell({ children, noScroll = false }: AppShellProps) {
  const { pathname } = useLocation();
  useMailNotifications();

  return (
    <AppShellContext.Provider value={true}>
      <div className="flex h-screen bg-background">
        <Sidebar fromShell />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppTopbar />
          <main
            key={pathname}
            className={
              (noScroll
                ? 'flex min-h-0 flex-1 flex-col overflow-hidden'
                : 'min-h-0 flex-1 overflow-y-auto pb-20 md:pb-0') + ' animate-route-fade'
            }
          >
            {children}
          </main>
        </div>
      </div>
    </AppShellContext.Provider>
  );
}
