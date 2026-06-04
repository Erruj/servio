import { NavLink, useLocation } from 'react-router-dom';
import { Mail, PieChart, Receipt, Settings, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/AuthProvider';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

const APP_PREFIXES = ['/app', '/dashboard', '/stats', '/templates', '/settings', '/profile', '/team', '/administration', '/mailbox-setup', '/analytics'];

export function MobileBottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const { canAccessAdministration } = useFeatureAccess();

  // Only show inside the app, not on marketing/auth/legal pages
  const isAppRoute = APP_PREFIXES.some(p => location.pathname === p || location.pathname.startsWith(p + '/') || location.pathname === p);
  if (!user || !isAppRoute) return null;

  const items = [
    { href: '/app', label: 'Inbox', icon: Mail },
    { href: '/dashboard', label: 'Dashboard', icon: PieChart },
    ...(canAccessAdministration ? [
      { href: '/administration/invoices', label: 'Facturen', icon: Receipt },
      { href: '/administration/ai-assistant', label: 'AI', icon: Brain },
    ] : []),
    { href: '/settings', label: 'Instellingen', icon: Settings },
  ];

  const isActive = (href: string) =>
    location.pathname === href || location.pathname.startsWith(href + '/');

  return (
    <nav
      aria-label="Mobiele navigatie"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t border-border shadow-elevated"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex items-stretch justify-around">
        {items.map(item => (
          <li key={item.href} className="flex-1">
            <NavLink
              to={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] text-[11px] font-medium transition-colors',
                isActive(item.href)
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="truncate max-w-full px-1">{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
