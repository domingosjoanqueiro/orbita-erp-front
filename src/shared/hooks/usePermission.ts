'use client';

import { useAuth } from '@/shared/contexts/AuthContext';

export function usePermission() {
  const { user } = useAuth();

  const hasPermission = (permissionName: string): boolean => {
    if (!user) return false;

    // O usuário pode ter múltiplas roles, cada uma com suas permissões
    const userPermissions = user.roles?.flatMap(role => role.permissions || []) || [];
    return userPermissions.some(p => p.name === permissionName || p.code === permissionName);
  };

  const hasAnyPermission = (permissionNames: string[]): boolean => {
    return permissionNames.some(name => hasPermission(name));
  };

  const hasAllPermissions = (permissionNames: string[]): boolean => {
    return permissionNames.every(name => hasPermission(name));
  };

  const hasRole = (roleName: string): boolean => {
    if (!user) return false;
    return user.roles?.some(role => role.name === roleName) || false;
  };

  const hasAnyRole = (roleNames: string[]): boolean => {
    return roleNames.some(name => hasRole(name));
  };

  const hasAllRoles = (roleNames: string[]): boolean => {
    return roleNames.every(name => hasRole(name));
  };

  // Verificar se o usuário tem uma role específica e permissão
  const hasRoleAndPermission = (roleName: string, permissionName: string): boolean => {
    return hasRole(roleName) && hasPermission(permissionName);
  };

  // Obter todas as permissões do usuário
  const getAllPermissions = (): string[] => {
    if (!user) return [];
    return user.roles?.flatMap(role => role.permissions?.map(p => p.name || p.code) || []) || [];
  };

  // Verificar se o usuário é Super Admin
  const isSuperAdmin = (): boolean => {
    return hasRole('SUPER_ADMIN');
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    hasRoleAndPermission,
    getAllPermissions,
    isSuperAdmin,
  };
}