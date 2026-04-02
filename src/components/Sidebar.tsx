import { NavLink, useLocation } from 'react-router-dom';
import { Mail, BarChart3, FileText, Settings, Brain, PieChart, Wallet, Receipt, Upload, FileBox, Users, Lock, Shield, ClipboardList, Clock, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { UsageBadge } from '@/components/UsageBadge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarProps {
  className?: string;
}

const getNavigation = (t: any) => [
  { name: t('inbox'), href: '/app', icon: Mail, feature: null },
  { name: t('dashboard'), href: '/dashboard', icon: PieChart, feature: null },
  { name: t('statistics'), href: '/stats', icon: BarChart3, feature: 'advanced_stats' },
  { name: t('templates'), href: '/templates', icon: FileText, feature: null },
  { name: t('settings'), href: '/settings', icon: Settings, feature: null },
];

const getAdministrationNavigation = (t: any) => [
  { name: t('financialOverview'), href: '/administration/overview', icon: Wallet, feature: 'administration' },
  { name: t('aiAssistant'), href: '/administration/ai-assistant', icon: Brain, feature: 'ai_assistant' },
  { name: t('invoices'), href: '/administration/invoices', icon: Receipt, feature: 'administration' },
  { name: 'Offertes', href: '/administration/quotes', icon: ClipboardList, feature: 'administration' },
  { name: t('receipts'), href: '/administration/receipts', icon: Upload, feature: 'administration' },
  { name: 'Klanten', href: '/administration/customers', icon: UserCircle, feature: 'administration' },
  { name: 'Uren', href: '/administration/time-tracking', icon: Clock, feature: 'administration' },
  { name: t('documents'), href: '/administration/documents', icon: FileBox, feature: 'documents' },
  { name: t('exports'), href: '/administration/exports', icon: Upload, feature: 'exports' },
  { name: 'Audit Log', href: '/administration/audit-log', icon: Shield, feature: null },
];

interface NavItemProps {
  item: { name: string; href: string; icon: any; feature: string | null };
  isActive: boolean;
  isLocked: boolean;
  requiredLabel?: string;
}

function NavItem({ item, isActive, isLocked, requiredLabel }: NavItemProps) {
  const content = (
    <NavLink
      to={item.href}
      className={cn(
        'flex items-center px-4 py-4 text-sm font-medium rounded-xl transition-all duration-200 shadow-subtle hover:shadow-card',
        isActive
          ? 'bg-primary text-primary-foreground shadow-card'
          : isLocked
            ? 'text-muted-foreground/50 hover:bg-secondary/50 cursor-default'
            : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
      )}
    >
      <item.icon className="mr-3 h-5 w-5" />
      <span className="flex-1">{item.name}</span>
      {isLocked && <Lock className="h-4 w-4 ml-2 text-muted-foreground/50" />}
    </NavLink>
  );

  if (isLocked) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">
          Beschikbaar vanaf {requiredLabel}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation();
  const { t } = useTranslation();
  const { permissions } = useRoleAccess();
  const { canAccessAdministration, canAccessAIAssistant, canAccessDocuments, canAccessExports, canAccessAdvancedStats, canManageTeam, requiredTierLabel } = useFeatureAccess();
  const navigation = getNavigation(t);
  const adminNavigation = getAdministrationNavigation(t);

  const isFeatureLocked = (feature: string | null): boolean => {
    if (!feature) return false;
    switch (feature) {
      case 'administration': return !canAccessAdministration;
      case 'ai_assistant': return !canAccessAIAssistant;
      case 'documents': return !canAccessDocuments;
      case 'exports': return !canAccessExports;
      case 'advanced_stats': return !canAccessAdvancedStats;
      case 'team_management': return !canManageTeam;
      default: return false;
    }
  };

  return (
    <div className={cn('hidden md:flex w-64 bg-card border-r border-border flex-col shadow-card', className)}>
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
            if (item.href === '/app' && !permissions.canAccessInbox) return false;
            if (item.href === '/stats' && !permissions.canAccessStatistics) return false;
            if (item.href === '/templates' && !permissions.canAccessTemplates) return false;
            if (item.href === '/settings' && !permissions.canAccessSettings) return false;
            return true;
          }).map((item) => {
            const isActive = location.pathname === item.href;
            const locked = isFeatureLocked(item.feature);
            return (
              <NavItem
                key={item.name}
                item={item}
                isActive={isActive}
                isLocked={locked}
                requiredLabel={item.feature ? requiredTierLabel(item.feature) : undefined}
              />
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
              if (item.href === '/administration/ai-assistant' && !permissions.canUseAI) return false;
              if (item.href === '/administration/exports' && !permissions.canExportData) return false;
              return true;
            }).map((item) => {
              const isActive = location.pathname === item.href;
              const locked = isFeatureLocked(item.feature);
              return (
                <NavItem
                  key={item.name}
                  item={item}
                  isActive={isActive}
                  isLocked={locked}
                  requiredLabel={item.feature ? requiredTierLabel(item.feature) : undefined}
                />
              );
            })}
          </div>
        )}

        {/* Team Management */}
        {permissions.canManageTeam && (
          <div className="space-y-3 mt-6">
            <NavItem
              item={{ name: t('teamManagement'), href: '/team', icon: Users, feature: 'team_management' }}
              isActive={location.pathname === '/team'}
              isLocked={isFeatureLocked('team_management')}
              requiredLabel={requiredTierLabel('team_management')}
            />
          </div>
        )}
      </nav>

      {/* Usage tracker for Starter */}
      <UsageBadge />

      {/* Footer */}
      <div className="p-6 border-t border-border">
        <div className="text-xs text-muted-foreground">
          <p>{t('version')} 1.0.0</p>
          <p className="mt-1">© {new Date().getFullYear()} Servio</p>
        </div>
      </div>
    </div>
  );
}
