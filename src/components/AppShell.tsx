import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';

interface AppShellProps {
  children: ReactNode;
  /** When true, the main content area does not scroll — the page manages its own scrolling. */
  noScroll?: boolean;
}

/**
 * Shared app shell for authenticated routes.
 * Keeps the sidebar visible across route changes so navigation never blanks out.
 * De content krijgt een korte fade (150ms, alleen opacity) bij route-wissels,
 * zodat het niet abrupt knippert zonder de app trager te laten aanvoelen.
 */
export function AppShell({ children, noScroll = false }: AppShellProps) {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <main
        key={pathname}
        className={
          (noScroll
            ? 'flex-1 min-w-0 flex flex-col'
            : 'flex-1 min-w-0 overflow-y-auto') + ' animate-route-fade'
        }
      >
        {children}
      </main>
    </div>
  );
}
