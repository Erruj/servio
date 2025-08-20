import { NavLink, useLocation } from 'react-router-dom';
import { Mail, BarChart3, FileText, Settings, Brain, PieChart, Euro } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface SidebarProps {
  className?: string;
}

const getNavigation = (t: any) => [
  { name: t('inbox'), href: '/', icon: Mail },
  { name: t('dashboard'), href: '/dashboard', icon: PieChart },
  { name: t('statistics'), href: '/stats', icon: BarChart3 },
  { name: t('templates'), href: '/templates', icon: FileText },
  { name: t('pricing'), href: '/pricing', icon: Euro },
  { name: t('settings'), href: '/settings', icon: Settings },
];

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation();
  const { t } = useTranslation();
  const navigation = getNavigation(t);

  return (
    <div className={cn('w-64 bg-card border-r border-border flex flex-col shadow-card', className)}>
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-primary rounded-xl shadow-card">
            <Brain className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Servio</h1>
            <p className="text-sm text-muted-foreground">AI-powered support</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-6 space-y-3">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center px-4 py-4 text-sm font-medium rounded-xl transition-all duration-200 shadow-subtle hover:shadow-card',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-card'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-border">
        <div className="text-xs text-muted-foreground">
          <p>{t('version')} 2.0.1</p>
          <p className="mt-1">© 2024 Servio</p>
        </div>
      </div>
    </div>
  );
}