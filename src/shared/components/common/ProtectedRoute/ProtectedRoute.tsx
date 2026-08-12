'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/shared/contexts/AuthContext';
import { usePermission } from '@/shared/hooks/usePermission';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  fallback,
}) => {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { hasAllPermissions, hasAnyRole, hasRole } = usePermission();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div>Carregando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Verificar permissões - usando o hook usePermission
  if (requiredPermissions.length > 0) {
    const hasAccess = hasAllPermissions(requiredPermissions);
    if (!hasAccess) {
      if (fallback) {
        return <>{fallback}</>;
      }
      return (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 600 }}>
            Sem permissão
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Você não tem permissão para acessar esta página
          </p>
        </div>
      );
    }
  }

  // Verificar roles - usando o hook usePermission
  if (requiredRoles.length > 0) {
    const hasAccess = hasAnyRole(requiredRoles);
    if (!hasAccess) {
      if (fallback) {
        return <>{fallback}</>;
      }
      return (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 600 }}>
            Acesso negado
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Você não tem permissão para acessar esta página
          </p>
        </div>
      );
    }
  }

  return <>{children}</>;
};