import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Mail, PieChart, Settings, Menu, Brain, Receipt, FileBox, Users, Wallet, ClipboardList, Upload, UserCircle, Clock, Shield, BarChart3, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();
  const { permissions } = useRoleAccess();
  const { canAccessAdministration } = useFeatureAccess();

  const mainNav = [
    { name: t('inbox'), href: '/app', icon: Mail, show: permissions.canAccessInbox },
    { name: t('dashboard'), href: '/dashboard', icon: PieChart, show: true },
    { name: t('statistics'), href: '/stats', icon: BarChart3, show: permissions.canAccessStatistics },
    { name: t('templates'), href: '/templates', icon: FileText, show: permissions.canAccessTemplates },
    { name: t('settings'), href: '/settings', icon: Settings, show: permissions.canAccessSettings },
  ];

  const adminNav = [
    { name: t('financialOverview'), href: '/administration/overview', icon: Wallet },
    { name: t('aiAssistant'), href: '/administration/ai-assistant', icon: Brain },
    { name: t('invoices'), href: '/administration/invoices', icon: Receipt },
    { name: t('quotes'), href: '/administration/quotes', icon: ClipboardList },
    { name: t('receipts'), href: '/administration/receipts', icon: Upload },
    { name: t('customers'), href: '/administration/customers', icon: UserCircle },
    { name: t('timeTracking'), href: '/administration/time-tracking', icon: Clock },
    { name: t('documents'), href: '/administration/documents', icon: FileBox },
    { name: t('exports'), href: '/administration/exports', icon: Upload },
    { name: t('auditLog'), href: '/administration/audit-log', icon: Shield },
  ];

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Navigatie</SheetTitle>
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <Brain className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">Servio</span>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            {mainNav.filter(n => n.show).map(item => (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  location.pathname === item.href
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </NavLink>
            ))}

            {permissions.canAccessAdministration && canAccessAdministration && (
              <>
                <div className="pt-4 pb-2">
                  <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t('administration')}
                  </p>
                </div>
                {adminNav.map(item => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      location.pathname === item.href
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </NavLink>
                ))}
              </>
            )}

            {permissions.canManageTeam && (
              <NavLink
                to="/team"
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mt-4',
                  location.pathname === '/team'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
              >
                <Users className="h-5 w-5" />
                {t('teamManagement')}
              </NavLink>
            )}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
            <p className="text-xs text-muted-foreground">v1.0.0 · © {new Date().getFullYear()} Servio</p>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
