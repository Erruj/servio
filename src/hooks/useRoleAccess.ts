import { useAuth } from '@/components/AuthProvider';
import { useMemo } from 'react';

export type UserRole = 'owner' | 'admin' | 'agent' | 'finance' | 'viewer';

interface RolePermissions {
  canAccessInbox: boolean;
  canAccessAdministration: boolean;
  canAccessStatistics: boolean;
  canAccessTemplates: boolean;
  canAccessSettings: boolean;
  canManageTeam: boolean;
  canManageRoles: boolean;
  canAccessAnalytics: boolean;
  canExportData: boolean;
  canUploadDocuments: boolean;
  canUseAI: boolean;
}

const rolePermissionsMap: Record<UserRole, RolePermissions> = {
  owner: {
    canAccessInbox: true,
    canAccessAdministration: true,
    canAccessStatistics: true,
    canAccessTemplates: true,
    canAccessSettings: true,
    canManageTeam: true,
    canManageRoles: true,
    canAccessAnalytics: true,
    canExportData: true,
    canUploadDocuments: true,
    canUseAI: true,
  },
  admin: {
    canAccessInbox: true,
    canAccessAdministration: true,
    canAccessStatistics: true,
    canAccessTemplates: true,
    canAccessSettings: true,
    canManageTeam: true,
    canManageRoles: false, // can't change owner role
    canAccessAnalytics: true,
    canExportData: true,
    canUploadDocuments: true,
    canUseAI: true,
  },
  agent: {
    canAccessInbox: true,
    canAccessAdministration: false,
    canAccessStatistics: false,
    canAccessTemplates: true,
    canAccessSettings: false,
    canManageTeam: false,
    canManageRoles: false,
    canAccessAnalytics: false,
    canExportData: false,
    canUploadDocuments: false,
    canUseAI: true,
  },
  finance: {
    canAccessInbox: false,
    canAccessAdministration: true,
    canAccessStatistics: true,
    canAccessTemplates: false,
    canAccessSettings: false,
    canManageTeam: false,
    canManageRoles: false,
    canAccessAnalytics: true,
    canExportData: true,
    canUploadDocuments: true,
    canUseAI: true,
  },
  viewer: {
    canAccessInbox: false,
    canAccessAdministration: false,
    canAccessStatistics: true,
    canAccessTemplates: false,
    canAccessSettings: false,
    canManageTeam: false,
    canManageRoles: false,
    canAccessAnalytics: true,
    canExportData: false,
    canUploadDocuments: false,
    canUseAI: false,
  },
};

export function useRoleAccess() {
  const { userRole } = useAuth();

  const permissions = useMemo(() => {
    if (!userRole) {
      return rolePermissionsMap.viewer;
    }
    return rolePermissionsMap[userRole as UserRole] || rolePermissionsMap.viewer;
  }, [userRole]);

  const hasRole = (role: UserRole) => userRole === role;

  const hasAnyRole = (roles: UserRole[]) => roles.includes(userRole as UserRole);

  return {
    permissions,
    hasRole,
    hasAnyRole,
    currentRole: userRole as UserRole,
  };
}
