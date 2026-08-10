'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, LogIn, AlertCircle, Moon, Sun, User, Lock, Crown } from 'lucide-react';
import { usePlatformAuth } from '@/shared/contexts/PlatformAuthContext';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Button } from '@/shared/components/ui/Button/Button';
import { Input } from '@/shared/components/ui/Input/Input';
import { env } from '@/shared/config/env';
import styles from './page.module.css';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function PlatformLoginPage() {
  const { login, isLoading } = usePlatformAuth();
  const { theme, toggleTheme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    const emailInput = document.getElementById('email');
    if (emailInput) {
      emailInput.focus();
    }
  }, []);

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      await login(data.email, data.password);
    } catch (err: any) {
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
            <div className={styles.logoIcon}>
              <Crown size={24} />
            </div>
            <div>
              <span className={styles.logoText}>Orbita</span>
              <span className={styles.logoHighlight}>Platform</span>
            </div>
          </div>
          <h1 className={styles.title}>Acesso à Plataforma</h1>
          <p className={styles.subtitle}>
            Entre com suas credenciais de administrador
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="admin@orbita.com"
              autoComplete="email"
              leftIcon={<User size={16} />}
              {...register('email')}
              error={errors.email}
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
            Entrar na Plataforma
          </Button>
        </form>

        <div className={styles.footer}>
          <p className={styles.footerText}>
            Sistema de Administração da Plataforma
          </p>
          <p className={styles.footerVersion}>
            v{env.app.version} • {env.app.env}
          </p>
        </div>
      </div>
    </div>
  );
}