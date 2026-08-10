'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, LogIn, AlertCircle, Moon, Sun, User, Lock } from 'lucide-react';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Button } from '@/shared/components/ui/Button/Button';
import { Input } from '@/shared/components/ui/Input/Input';
import { env } from '@/shared/config/env';
import styles from './page.module.css';

const loginSchema = z.object({
  identifier: z.string().min(3, 'Identificador deve ter no mínimo 3 caracteres'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, isLoading, user, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log('🔍 LoginPage - Estado:', { user, isAuthenticated, isLoading });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  // Auto-focus no primeiro campo
  useEffect(() => {
    const identifierInput = document.getElementById('identifier');
    if (identifierInput) {
      identifierInput.focus();
    }
  }, []);

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      console.log('📤 Tentando login com:', data.identifier);
      await login(data.identifier, data.password);
      console.log('✅ Login bem-sucedido!');
    } catch (err: any) {
      console.error('❌ Erro no login capturado:', err);
      const message = err.response?.data?.message || err.message || 'Credenciais inválidas. Tente novamente.';
      setError(message);
    }
  };

  return (
    <div className={styles.container}>
      <button
        onClick={toggleTheme}
        className={styles.themeToggle}
        aria-label={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
      >
        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
      </button>

      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>O</div>
            <span className={styles.logoText}>{env.app.name}</span>
          </div>
          <h1 className={styles.title}>Bem-vindo de volta</h1>
          <p className={styles.subtitle}>
            Entre com suas credenciais para acessar o sistema
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
          <div className={styles.formGroup}>
            <label htmlFor="identifier" className={styles.label}>
              Usuário / Email
            </label>
            <Input
              id="identifier"
              type="text"
              placeholder="Digite seu usuário, email ou número mecanográfico"
              autoComplete="username"
              leftIcon={<User size={16} />}
              {...register('identifier')}
              error={errors.identifier}
              fullWidth
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              Senha
            </label>
            <div className={styles.passwordWrapper}>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Digite sua senha"
                autoComplete="current-password"
                leftIcon={<Lock size={16} />}
                {...register('password')}
                error={errors.password}
                fullWidth
              />
              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className={styles.errorMessage} role="alert">
              <AlertCircle size={16} className={styles.errorIcon} />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            fullWidth
            isLoading={isLoading || isSubmitting}
            icon={<LogIn size={18} />}
            className={styles.submitButton}
          >
            Entrar
          </Button>
        </form>

        <div className={styles.footer}>
          <p className={styles.footerText}>
            Sistema corporativo © 2024 {env.app.name}
          </p>
          <p className={styles.footerVersion}>
            v{env.app.version} - {env.app.env}
          </p>
        </div>
      </div>
    </div>
  );
}