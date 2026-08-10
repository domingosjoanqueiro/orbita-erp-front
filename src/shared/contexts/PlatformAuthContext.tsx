'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { platformAuthService } from '@/shared/services/platform/auth.service';
import { useLoading } from './LoadingContext';
import { useToast } from './ToastContext';

export interface PlatformUser {
  id: number;
  uuid: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  isRoot: boolean;
  isActive: boolean;
  isPlatformUser: boolean;
  roles?: {
    id: number;
    name: string;
    permissions?: {
      id: number;
      code: string;
      name: string;
      module: string;
    }[];
  }[];
  createdAt?: string;
  updatedAt?: string;
}

interface PlatformAuthContextType {
  user: PlatformUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isRoot: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const PlatformAuthContext = createContext<PlatformAuthContextType | undefined>(undefined);

const PLATFORM_TOKEN_KEY = 'platformAccessToken';
const PLATFORM_REFRESH_TOKEN_KEY = 'platformRefreshToken';
const PLATFORM_USER_KEY = 'platformUser';

export const PlatformAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<PlatformUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { startLoading, stopLoading } = useLoading();
  const { showSuccess, showError } = useToast();

  // Extrair dados do usuário da resposta da API
  const extractUserData = (data: any): PlatformUser => {
    const userData = data.user || data;
    
    // Construir o objeto do usuário da plataforma
    const platformUser: PlatformUser = {
      id: userData.id || 0,
      uuid: userData.uuid || '',
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      email: userData.email || '',
      username: userData.username || '',
      isRoot: userData.isRoot || false,
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      isPlatformUser: true, // Sempre true para usuários da plataforma
      createdAt: userData.createdAt || '',
      updatedAt: userData.updatedAt || '',
      // Adicionar uma role virtual para compatibilidade com a lógica do Sidebar
      roles: [
        {
          id: 1,
          name: 'SUPER_ADMIN',
          permissions: [],
        }
      ],
    };

    return platformUser;
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem(PLATFORM_TOKEN_KEY);
        if (token) {
          const userData = localStorage.getItem(PLATFORM_USER_KEY);
          if (userData) {
            try {
              const parsedUser = JSON.parse(userData);
              setUser(parsedUser);
              setIsLoading(false);
              return;
            } catch {
              localStorage.removeItem(PLATFORM_USER_KEY);
            }
          }
          await refreshUser();
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação da plataforma:', error);
        clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const clearAuthData = () => {
    localStorage.removeItem(PLATFORM_TOKEN_KEY);
    localStorage.removeItem(PLATFORM_REFRESH_TOKEN_KEY);
    localStorage.removeItem(PLATFORM_USER_KEY);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const response = await platformAuthService.me();
      const userData = extractUserData(response);
      setUser(userData);
      localStorage.setItem(PLATFORM_USER_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Erro ao buscar usuário da plataforma:', error);
      throw error;
    }
  };

  const login = async (identifier: string, password: string) => {
    try {
      startLoading();
      
      if (!identifier || !password) {
        throw new Error('Identificador e senha são obrigatórios');
      }

      const response = await platformAuthService.login({ identifier, password });
      
      const { data } = response;
      
      if (!data) {
        throw new Error('Resposta do servidor inválida');
      }

      if (!data.accessToken) {
        throw new Error('Token de acesso não encontrado na resposta');
      }

      // Salvar tokens
      localStorage.setItem(PLATFORM_TOKEN_KEY, data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem(PLATFORM_REFRESH_TOKEN_KEY, data.refreshToken);
      }
      
      // Salvar usuário
      const userData = extractUserData(data);
      if (!userData) {
        throw new Error('Dados do usuário não encontrados');
      }

      setUser(userData);
      localStorage.setItem(PLATFORM_USER_KEY, JSON.stringify(userData));

      // Salvar cookie para o middleware
      document.cookie = `${PLATFORM_TOKEN_KEY}=${data.accessToken}; path=/; max-age=3600`;

      showSuccess('Bem-vindo!', `Olá ${userData.firstName || 'Admin'}!`);

      // Redirecionar para o dashboard do Super Admin
      router.push('/super-admin');
    } catch (error: any) {
      console.error('❌ Erro no login da plataforma:', error);
      
      let errorMessage = 'Erro ao fazer login. Tente novamente.';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.errors) {
          const messages = Object.values(errorData.errors).flat();
          errorMessage = messages.join(', ');
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showError('Erro no login', errorMessage);
      throw error;
    } finally {
      stopLoading();
    }
  };

  const logout = async () => {
    try {
      startLoading();
      await platformAuthService.logout();
      showSuccess('Até logo!', 'Você saiu do sistema da plataforma');
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      clearAuthData();
      document.cookie = `${PLATFORM_TOKEN_KEY}=; path=/; max-age=0`;
      stopLoading();
      router.push('/platform-login');
    }
  };

  return (
    <PlatformAuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isRoot: user?.isRoot || false,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </PlatformAuthContext.Provider>
  );
};

export const usePlatformAuth = () => {
  const context = useContext(PlatformAuthContext);
  if (!context) {
    throw new Error('usePlatformAuth must be used within a PlatformAuthProvider');
  }
  return context;
};