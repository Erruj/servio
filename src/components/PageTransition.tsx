import { useEffect, useState, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Wraps page content with a smooth fade + slight slide transition
 * triggered on route changes. Pure CSS, no external deps.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [displayKey, setDisplayKey] = useState(location.pathname);
  const [stage, setStage] = useState<'in' | 'out'>('in');

  useEffect(() => {
    if (location.pathname === displayKey) return;
    setStage('out');
    const t = window.setTimeout(() => {
      setDisplayKey(location.pathname);
      setStage('in');
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }, 200);
    return () => window.clearTimeout(t);
  }, [location.pathname, displayKey]);

  return (
    <div
      key={displayKey}
      style={{
        opacity: stage === 'in' ? 1 : 0,
        transform: stage === 'in' ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 320ms cubic-bezier(0.4, 0, 0.2, 1), transform 320ms cubic-bezier(0.4, 0, 0.2, 1)',
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
}
