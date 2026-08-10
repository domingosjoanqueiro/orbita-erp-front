'use client';

import { useAuth } from '@/shared/contexts/AuthContext';

export function usePermission() {
  const { user } = useAuth();

  const hasPermission = (permissionName: string): boolean => {
    if (!user) return false;

    // Verificar se o usuário tem a permissão específica
    const userPermissions = user.role?.permissions || [];
    return userPermissions.some(p => p.name === permissionName);
  };

  const hasAnyPermission = (permissionNames: string[]): boolean => {
    return permissionNames.some(name => hasPermission(name));
  };

  const hasAllPermissions = (permissionNames: string[]): boolean => {
    return permissionNames.every(name => hasPermission(name));
  };

  const hasRole = (roleName: string): boolean => {
    if (!user) return false;
    return user.role?.name === roleName;
  };

  const hasAnyRole = (roleNames: string[]): boolean => {
    return roleNames.some(name => hasRole(name));
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
  };
}