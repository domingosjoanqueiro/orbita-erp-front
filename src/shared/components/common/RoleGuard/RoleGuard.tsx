'use client';

import React from 'react';
import { usePermission } from '@/shared/hooks/usePermission';

interface RoleGuardProps {
  children: React.ReactNode;
  roles: string[];
  match?: 'any' | 'all';
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  roles,
  match = 'any',
  fallback = null,
}) => {
  const { hasAnyRole } = usePermission();

  let hasAccess = false;

  if (match === 'any') {
    hasAccess = hasAnyRole(roles);
  } else {
    hasAccess = roles.every(role => hasAnyRole([role]));
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};