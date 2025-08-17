import { NavLink, useLocation } from 'react-router-dom';
import { Mail, BarChart3, FileText, Settings, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  className?: string;
}

const navigation = [
  { name: 'Inbox', href: '/', icon: Mail },
  { name: 'Statistieken', href: '/stats', icon: BarChart3 },
  { name: 'Templates', href: '/templates', icon: FileText },
  { name: 'Instellingen', href: '/settings', icon: Settings },
];

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation();

  return (
    <div className={cn('w-64 bg-card border-r border-border flex flex-col', className)}>
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary rounded-lg">
            <Brain className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Smart Support</h1>
            <p className="text-sm text-muted-foreground">AI-powered desk</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
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
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground">
          <p>Versie 1.0</p>
          <p className="mt-1">© 2024 Smart Support Desk</p>
        </div>
      </div>
    </div>
  );
}