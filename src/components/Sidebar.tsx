import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Mail, BarChart3, FileText, Settings, Brain, PieChart, Wallet, Receipt, Upload, FileBox, Users, Lock, Shield, ClipboardList, Clock, UserCircle, Star, GripVertical, RotateCcw } from 'lucide-react';
import servioLogo from '@/assets/servio-icon.png';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { UsageBadge } from '@/components/UsageBadge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { usePersonalization } from '@/hooks/usePersonalization';
import { Button } from '@/components/ui/button';
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist';

interface SidebarProps {
  className?: string;
}

const getNavigation = (t: any) => [
  { id: 'inbox', name: t('inbox'), href: '/app', icon: Mail, feature: null },
  { id: 'dashboard', name: t('dashboard'), href: '/dashboard', icon: PieChart, feature: null },
  { id: 'statistics', name: t('statistics'), href: '/stats', icon: BarChart3, feature: 'advanced_stats' },
  { id: 'templates', name: t('templates'), href: '/templates', icon: FileText, feature: null },
  { id: 'settings', name: t('settings'), href: '/settings', icon: Settings, feature: null },
];

const getAdministrationNavigation = (t: any) => [
  { id: 'admin-overview', name: t('financialOverview'), href: '/administration/overview', icon: Wallet, feature: 'administration' },
  { id: 'admin-ai', name: t('aiAssistant'), href: '/administration/ai-assistant', icon: Brain, feature: 'ai_assistant' },
  { id: 'admin-invoices', name: t('invoices'), href: '/administration/invoices', icon: Receipt, feature: 'administration' },
  { id: 'admin-quotes', name: t('quotes'), href: '/administration/quotes', icon: ClipboardList, feature: 'administration' },
  { id: 'admin-receipts', name: t('receipts'), href: '/administration/receipts', icon: Upload, feature: 'administration' },
  { id: 'admin-customers', name: t('customers'), href: '/administration/customers', icon: UserCircle, feature: 'administration' },
  { id: 'admin-time', name: t('timeTracking'), href: '/administration/time-tracking', icon: Clock, feature: 'administration' },
  { id: 'admin-docs', name: t('documents'), href: '/administration/documents', icon: FileBox, feature: 'documents' },
  { id: 'admin-exports', name: t('exports'), href: '/administration/exports', icon: Upload, feature: 'exports' },
  { id: 'admin-audit', name: t('auditLog'), href: '/administration/audit-log', icon: Shield, feature: null },
];

interface NavItemProps {
  item: { id?: string; name: string; href: string; icon: any; feature: string | null };
  isActive: boolean;
  isLocked: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  requiredLabel?: string;
  showFavControls?: boolean;
}

function NavItem({ item, isActive, isLocked, isFavorite, onToggleFavorite, requiredLabel, showFavControls }: NavItemProps) {
  const content = (
    <NavLink
      to={item.href}
      className={cn(
        'group flex items-center h-10 px-3 text-[13px] font-medium rounded-lg transition-all duration-150 ease-out',
        isActive
          ? 'bg-primary text-primary-foreground shadow-subtle'
          : isLocked
            ? 'text-muted-foreground/50 cursor-default'
            : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
      )}
    >
      <item.icon className="mr-3 h-[18px] w-[18px] flex-shrink-0" />
      <span className="flex-1 truncate">{item.name}</span>
      {isLocked && <Lock className="h-3.5 w-3.5 ml-2 text-muted-foreground/50" />}
      {showFavControls && !isLocked && onToggleFavorite && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(); }}
          className={cn(
            'ml-1 opacity-0 group-hover:opacity-100 transition-opacity',
            isFavorite && 'opacity-100'
          )}
        >
          <Star className={cn('h-3.5 w-3.5', isFavorite ? 'fill-primary text-primary' : 'text-muted-foreground')} />
        </button>
      )}
    </NavLink>
  );

  if (isLocked) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">{requiredLabel}</TooltipContent>
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
  const { settings: personalization, updateSettings } = usePersonalization();
  const [showFavControls, setShowFavControls] = useState(false);

  const navigation = getNavigation(t);
  const adminNavigation = getAdministrationNavigation(t);

  const favorites = personalization.sidebarFavorites || [];

  const toggleFavorite = (id: string) => {
    const newFavs = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
    updateSettings({ sidebarFavorites: newFavs });
  };

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

  // Build ordered main nav
  const orderedMainNav = personalization.sidebarOrder
    ? personalization.sidebarOrder.map(id => navigation.find(n => n.id === id)).filter(Boolean) as typeof navigation
    : navigation;
  // Add any items not in the order
  const remainingMain = navigation.filter(n => !orderedMainNav.some(o => o.id === n.id));
  const finalMainNav = [...orderedMainNav, ...remainingMain];

  // Favorites section - items from any section that are favorited
  const allItems = [...navigation, ...adminNavigation];
  const favoriteItems = favorites.map(id => allItems.find(i => i.id === id)).filter(Boolean) as typeof allItems;

  return (
    <div className={cn('hidden md:flex w-64 bg-card border-r border-border flex-col shadow-card sticky top-0 h-screen overflow-hidden', className)}>
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <img src={servioLogo} alt="Servio logo" className="w-10 h-10" width={40} height={40} />
          <div>
            <h1 className="text-xl font-bold text-foreground">Servio</h1>
            <p className="text-sm text-muted-foreground">AI-powered support</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Favorites */}
        {favoriteItems.length > 0 && (
          <div className="space-y-1">
            <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Star className="h-3 w-3 fill-primary text-primary" /> {t('favorites')}
            </h3>
            {favoriteItems.map((item) => (
              <NavItem
                key={`fav-${item.id}`}
                item={item}
                isActive={location.pathname === item.href}
                isLocked={isFeatureLocked(item.feature)}
                requiredLabel={item.feature ? requiredTierLabel(item.feature) : undefined}
              />
            ))}
          </div>
        )}

        {/* Main Navigation */}
        <div className="space-y-1">
          {finalMainNav.filter(item => {
            if (item.href === '/app' && !permissions.canAccessInbox) return false;
            if (item.href === '/stats' && !permissions.canAccessStatistics) return false;
            if (item.href === '/templates' && !permissions.canAccessTemplates) return false;
            if (item.href === '/settings' && !permissions.canAccessSettings) return false;
            return true;
          }).map((item) => (
            <NavItem
              key={item.id}
              item={item}
              isActive={location.pathname === item.href}
              isLocked={isFeatureLocked(item.feature)}
              isFavorite={favorites.includes(item.id)}
              onToggleFavorite={() => toggleFavorite(item.id)}
              requiredLabel={item.feature ? requiredTierLabel(item.feature) : undefined}
              showFavControls={showFavControls}
            />
          ))}
        </div>

        {/* Administration Section */}
        {permissions.canAccessAdministration && (
          <div className="space-y-1">
            <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('administration')}
            </h3>
            {adminNavigation.filter(item => {
              if (item.href === '/administration/ai-assistant' && !permissions.canUseAI) return false;
              if (item.href === '/administration/exports' && !permissions.canExportData) return false;
              return true;
            }).map((item) => (
              <NavItem
                key={item.id}
                item={item}
                isActive={location.pathname === item.href}
                isLocked={isFeatureLocked(item.feature)}
                isFavorite={favorites.includes(item.id)}
                onToggleFavorite={() => toggleFavorite(item.id)}
                requiredLabel={item.feature ? requiredTierLabel(item.feature) : undefined}
                showFavControls={showFavControls}
              />
            ))}
          </div>
        )}

        {/* Team Management */}
        {permissions.canManageTeam && (
          <div className="space-y-1 mt-2">
            <NavItem
              item={{ id: 'team', name: t('teamManagement'), href: '/team', icon: Users, feature: 'team_management' }}
              isActive={location.pathname === '/team'}
              isLocked={isFeatureLocked('team_management')}
              requiredLabel={requiredTierLabel('team_management')}
            />
          </div>
        )}

        {/* Sidebar customize toggle */}
        <div className="pt-2 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs text-muted-foreground"
            onClick={() => setShowFavControls(!showFavControls)}
          >
            <Star className="h-3.5 w-3.5 mr-2" />
            {showFavControls ? t('doneCustomizing') : t('manageFavorites')}
          </Button>
          {showFavControls && favorites.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs text-muted-foreground"
              onClick={() => updateSettings({ sidebarFavorites: [] })}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-2" />
              {t('resetFavorites')}
            </Button>
          )}
        </div>
      </nav>

      <OnboardingChecklist />
      <UsageBadge />

      {/* Footer - sticky bottom */}
      <div className="flex-shrink-0 p-4 border-t border-border bg-card">
        <div className="text-xs text-muted-foreground">
          <p>{t('version')} 1.0.0 · © {new Date().getFullYear()} Servio</p>
        </div>
      </div>
    </div>
  );
}
