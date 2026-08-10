'use client';

import React from 'react';
import { usePermission } from '@/shared/hooks/usePermission';

interface PermissionGuardProps {
  children: React.ReactNode;
  permissions?: string[];
  permissionsMatch?: 'any' | 'all';
  roles?: string[];
  rolesMatch?: 'any' | 'all';
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permissions = [],
  permissionsMatch = 'any',
  roles = [],
  rolesMatch = 'any',
  fallback = null,
}) => {
  const { hasAnyPermission, hasAllPermissions, hasAnyRole } = usePermission();

  let hasAccess = true;

  // Verificar permissões
  if (permissions.length > 0) {
    if (permissionsMatch === 'any') {
      hasAccess = hasAnyPermission(permissions);
    } else {
      hasAccess = hasAllPermissions(permissions);
    }
  }

  // Verificar roles
  if (roles.length > 0 && hasAccess) {
    if (rolesMatch === 'any') {
      hasAccess = hasAnyRole(roles);
    } else {
      // Verificar todas as roles
      hasAccess = roles.every(role => hasAnyRole([role]));
    }
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};