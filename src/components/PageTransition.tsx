import { ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Route-change side effects only (scroll reset).
 * Intentionally does NOT fade the entire tree — that caused the whole app
 * (including sidebar/topbar) to blank out between routes. Individual pages
 * can animate their own content with `animate-page-in` if desired.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);

  return <>{children}</>;
}
