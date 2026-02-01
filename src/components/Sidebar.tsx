import { NavLink, useLocation } from 'react-router-dom';
import { Mail, BarChart3, FileText, Settings, Brain, PieChart, Euro, Wallet, Receipt, Upload, FileBox, Download, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useRoleAccess } from '@/hooks/useRoleAccess';

interface SidebarProps {
  className?: string;
}

const getNavigation = (t: any) => [
  { name: t('inbox'), href: '/app', icon: Mail },
  { name: t('dashboard'), href: '/dashboard', icon: PieChart },
  { name: t('statistics'), href: '/stats', icon: BarChart3 },
  { name: t('templates'), href: '/templates', icon: FileText },
  { name: t('settings'), href: '/settings', icon: Settings },
];

const getAdministrationNavigation = (t: any) => [
  { name: t('financialOverview'), href: '/administration/overview', icon: Wallet },
  { name: t('aiAssistant'), href: '/administration/ai-assistant', icon: Brain },
  { name: t('invoices'), href: '/administration/invoices', icon: Receipt },
  { name: t('receipts'), href: '/administration/receipts', icon: Upload },
  { name: t('documents'), href: '/administration/documents', icon: FileBox },
  { name: t('exports'), href: '/administration/exports', icon: Upload },
];

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation();
  const { t } = useTranslation();
  const { permissions } = useRoleAccess();
  const navigation = getNavigation(t);
  const adminNavigation = getAdministrationNavigation(t);

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
      <nav className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Main Navigation */}
        <div className="space-y-3">
        {navigation.filter(item => {
            // Filter based on permissions
            if (item.href === '/app' && !permissions.canAccessInbox) return false;
            if (item.href === '/stats' && !permissions.canAccessStatistics) return false;
            if (item.href === '/templates' && !permissions.canAccessTemplates) return false;
            if (item.href === '/settings' && !permissions.canAccessSettings) return false;
            return true;
          }).map((item) => {
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
        </div>

        {/* Administration Section */}
        {permissions.canAccessAdministration && (
          <div className="space-y-3">
            <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('administration')}
            </h3>
            {adminNavigation.filter(item => {
              // Filter AI assistant and exports based on permissions
              if (item.href === '/administration/ai-assistant' && !permissions.canUseAI) return false;
              if (item.href === '/administration/exports' && !permissions.canExportData) return false;
              return true;
            }).map((item) => {
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
          </div>
        )}

        {/* Team Management */}
        {permissions.canManageTeam && (
          <div className="space-y-3 mt-6">
            <NavLink
              to="/team"
              className={cn(
                'flex items-center px-4 py-4 text-sm font-medium rounded-xl transition-all duration-200 shadow-subtle hover:shadow-card',
                location.pathname === '/team'
                  ? 'bg-primary text-primary-foreground shadow-card'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              )}
            >
              <Users className="mr-3 h-5 w-5" />
              {t('teamManagement')}
            </NavLink>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-border">
        <div className="text-xs text-muted-foreground">
          <p>{t('version')} 2.0.1</p>
          <p className="mt-1">© {new Date().getFullYear()} Servio</p>
        </div>
      </div>
    </div>
  );
}