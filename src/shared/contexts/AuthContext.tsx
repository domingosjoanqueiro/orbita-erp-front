'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/shared/services/auth/auth.service';
import { useLoading } from './LoadingContext';
import { useToast } from './ToastContext';

export interface User {
  id: number;
  uuid: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  mustChangePassword: boolean;
  isActive: boolean;
  roles: {
    id: number;
    name: string;
    permissions: {
      id: number;
      code: string;
      name: string;
      module: string;
    }[];
  }[];
  company: {
    id: number;
    uuid: string;
    name: string;
  };
  // Preenchido quando o utilizador está associado a um professor (portal do professor)
  teacher?: {
    uuid: string;
    teacherNumber: string;
    fullName: string;
  } | null;
  // Preenchido quando o utilizador está associado a um aluno (portal do aluno)
  student?: {
    uuid: string;
    studentNumber: string;
    fullName: string;
  } | null;
}

// Página inicial de cada tipo de utilizador
export function homePathFor(user: Pick<User, 'student'> | null | undefined): string {
  return user?.student ? '/student' : '/dashboard';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string , confirmPassword: string) => Promise<void>;
  refreshUser: () => Promise<User>;
  mustChangePassword: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const COMPANY_TOKEN_KEY = 'accessTokenorbitavisionapi@2026';
const COMPANY_REFRESH_TOKEN_KEY = 'refreshTokenorbitavisionapi@2026';
const COMPANY_USER_KEY = 'userorbitavisionapi@2026';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const router = useRouter();
  const { startLoading, stopLoading } = useLoading();
  const { showSuccess, showError } = useToast();

  const extractUserData = (data: any): User => {
    const userData = data.user || data;
    return {
      id: userData.id || 0,
      uuid: userData.uuid || '',
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      email: userData.email || '',
      username: userData.username || '',
      mustChangePassword: data.mustChangePassword === 1 || data.mustChangePassword === true,
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      roles: userData.roles || [],
      company: data.company || userData.company || { id: 0, uuid: '', name: '' },
      teacher: userData.teacher ?? null,
      student: userData.student ?? null,
    };
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem(COMPANY_TOKEN_KEY);
        if (token) {
          const userData = localStorage.getItem(COMPANY_USER_KEY);
          if (userData) {
            try {
              const parsedUser = JSON.parse(userData);
              setUser(parsedUser);
              setMustChangePassword(parsedUser.mustChangePassword || false);
              setIsLoading(false);
              // Revalida em segundo plano: roles/permissões podem ter mudado
              refreshUser().catch(() => undefined);
              return;
            } catch {
              localStorage.removeItem(COMPANY_USER_KEY);
            }
          }
          await refreshUser();
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const clearAuthData = () => {
    localStorage.removeItem(COMPANY_TOKEN_KEY);
    localStorage.removeItem(COMPANY_REFRESH_TOKEN_KEY);
    localStorage.removeItem(COMPANY_USER_KEY);
    setUser(null);
    setMustChangePassword(false);
  };

  const refreshUser = async () => {
    try {
      const response = await authService.me();
      // /auth/me responde { success, message, data: { ...utilizador, roles, company } }
      const userData = extractUserData(response?.data ?? response);
      setUser(userData);
      setMustChangePassword(userData.mustChangePassword || false);
      localStorage.setItem(COMPANY_USER_KEY, JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      throw error;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    try {
      startLoading();
      await authService.changePassword({ currentPassword, newPassword, confirmPassword });

      // O token atual ainda diz "tem de alterar a senha": renova-o para a API deixar de bloquear
      const storedRefresh = localStorage.getItem(COMPANY_REFRESH_TOKEN_KEY);
      if (storedRefresh) {
        try {
          const refreshed = await authService.refreshToken(storedRefresh);
          const tokens = (refreshed as unknown as { data?: { accessToken?: string; refreshToken?: string } })?.data ?? refreshed;
          if (tokens?.accessToken) {
            localStorage.setItem(COMPANY_TOKEN_KEY, tokens.accessToken);
            document.cookie = `${COMPANY_TOKEN_KEY}=${tokens.accessToken}; path=/; max-age=3600; SameSite=Lax`;
          }
          if (tokens?.refreshToken) {
            localStorage.setItem(COMPANY_REFRESH_TOKEN_KEY, tokens.refreshToken);
            document.cookie = `${COMPANY_REFRESH_TOKEN_KEY}=${tokens.refreshToken}; path=/; max-age=604800; SameSite=Lax`;
          }
        } catch {
          // Se a renovação falhar, o próximo login resolve
        }
      }
      document.cookie = `mustChangePassword=false; path=/; max-age=3600; SameSite=Lax`;

      // Atualizar usuário
      const updatedUser = await refreshUser();
      showSuccess('Senha alterada!', 'Sua senha foi atualizada com sucesso');
      
      // Redirecionar para a página inicial (alunos: portal do aluno)
      router.push(homePathFor(updatedUser));
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      const message = error.response?.data?.message || 'Erro ao alterar senha';
      showError('Erro', message);
      throw error;
    } finally {
      stopLoading();
    }
  };

const login = async (identifier: string, password: string) => {
  try {
    console.log('🔑 Iniciando login com:', { identifier });
    startLoading();
    
    if (!identifier || !password) {
      throw new Error('Identificador e senha são obrigatórios');
    }

    console.log('📡 Chamando authService.login...');
    const response = await authService.login({ identifier, password });
    console.log('📥 Resposta do login:', response);
    
    const { data } = response;
    
    if (!data) {
      throw new Error('Resposta do servidor inválida');
    }

    if (!data.accessToken) {
      throw new Error('Token de acesso não encontrado na resposta');
    }

    console.log('💾 Salvando tokens...');
    // Salvar tokens no localStorage
    localStorage.setItem(COMPANY_TOKEN_KEY, data.accessToken);
    if (data.refreshToken) {
      localStorage.setItem(COMPANY_REFRESH_TOKEN_KEY, data.refreshToken);
    }
    
    // Salvar cookie para o middleware
    document.cookie = `${COMPANY_TOKEN_KEY}=${data.accessToken}; path=/; max-age=3600; SameSite=Lax`;
    if (data.refreshToken) {
      document.cookie = `${COMPANY_REFRESH_TOKEN_KEY}=${data.refreshToken}; path=/; max-age=604800; SameSite=Lax`;
    }
    
    // Salvar usuário
    console.log('👤 Extraindo dados do usuário...');
    const userData = extractUserData(data);
    console.log('👤 Usuário extraído:', userData);
    
    setUser(userData);
    setMustChangePassword(userData.mustChangePassword || false);
    localStorage.setItem(COMPANY_USER_KEY, JSON.stringify(userData));

    // A resposta do login não traz roles/permissões; carrega o perfil completo
    let fullUser: User = userData;
    try {
      fullUser = await refreshUser();
    } catch {
      // Mantém os dados básicos do login; as permissões serão carregadas no próximo arranque
    }

    // Salvar mustChangePassword em cookie
    document.cookie = `mustChangePassword=${userData.mustChangePassword}; path=/; max-age=3600; SameSite=Lax`;

    showSuccess('Bem-vindo!', `Olá ${userData.firstName || 'Usuário'}!`);

    // Redirecionar
    console.log('🔄 Redirecionando para:', userData.mustChangePassword ? '/change-password' : homePathFor(fullUser));
    if (userData.mustChangePassword) {
      router.push('/change-password');
    } else {
      router.push(homePathFor(fullUser));
    }
    
  } catch (error: any) {
    console.error('❌ Erro no login:', error);
    
    let errorMessage = 'Credenciais inválidas. Tente novamente.';
    
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
      await authService.logout();
      showSuccess('Até logo!', 'Você saiu do sistema');
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      clearAuthData();
      document.cookie = `${COMPANY_TOKEN_KEY}=; path=/; max-age=0`;
      document.cookie = `${COMPANY_REFRESH_TOKEN_KEY}=; path=/; max-age=0`;
      document.cookie = `mustChangePassword=; path=/; max-age=0`;
      stopLoading();
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        changePassword,
        refreshUser,
        mustChangePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};