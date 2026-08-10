'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/shared/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermissions = [],
  requiredRoles = [],
}) => {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

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
        height: '100vh' 
      }}>
        Carregando...
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Verificar permissões
  if (requiredPermissions.length > 0) {
    const userPermissions = user?.role?.permissions || [];
    const hasAllPermissions = requiredPermissions.every(permission =>
      userPermissions.some(p => p.name === permission)
    );

    if (!hasAllPermissions) {
      return (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <h2>Sem permissão</h2>
          <p>Você não tem permissão para acessar esta página</p>
        </div>
      );
    }
  }

  // Verificar roles
  if (requiredRoles.length > 0) {
    const userRole = user?.role?.name;
    const hasRequiredRole = requiredRoles.includes(userRole || '');

    if (!hasRequiredRole) {
      return (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <h2>Acesso negado</h2>
          <p>Você não tem permissão para acessar esta página</p>
        </div>
      );
    }
  }

  return <>{children}</>;
};