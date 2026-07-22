import { ReactNode } from 'react';
import { Sidebar } from '@/components/Sidebar';

interface AppShellProps {
  children: ReactNode;
  /** When true, the main content area does not scroll — the page manages its own scrolling. */
  noScroll?: boolean;
}

/**
 * Shared app shell for authenticated routes.
 * Keeps the sidebar visible across route changes so navigation never blanks out.
 */
export function AppShell({ children, noScroll = false }: AppShellProps) {
  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <main
        className={
          noScroll
            ? 'flex-1 min-w-0 flex flex-col'
            : 'flex-1 min-w-0 overflow-y-auto'
        }
      >
        {children}
      </main>
    </div>
  );
}
