'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Shield, CheckCircle, XCircle, AlertCircle, KeyRound, Moon, Sun } from 'lucide-react';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Button } from '@/shared/components/ui/Button/Button';
import { Input } from '@/shared/components/ui/Input/Input';
import { useToast } from '@/shared/contexts/ToastContext';
import styles from './page.module.css';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string()
    .min(8, 'A senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'A senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'A senha deve conter pelo menos um número')
    .regex(/[^A-Za-z0-9]/, 'A senha deve conter pelo menos um caractere especial'),
  confirmPassword: z.string().min(1, 'Confirme sua nova senha'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, changePassword, logout, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showSuccess } = useToast();
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPassword = watch('newPassword');

  useEffect(() => {
    if (!newPassword) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    if (newPassword.length >= 8) strength += 1;
    if (/[A-Z]/.test(newPassword)) strength += 1;
    if (/[a-z]/.test(newPassword)) strength += 1;
    if (/[0-9]/.test(newPassword)) strength += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) strength += 1;
    
    setPasswordStrength(strength);
  }, [newPassword]);

  // Se não estiver autenticado, redirecionar
  useEffect(() => {
    if (!user && !isLoading) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const getStrengthInfo = () => {
    const strengths = [
      { label: 'Muito fraca', color: '#EF4444', width: '20%' },
      { label: 'Fraca', color: '#F59E0B', width: '40%' },
      { label: 'Média', color: '#F59E0B', width: '60%' },
      { label: 'Forte', color: '#10B981', width: '80%' },
      { label: 'Muito forte', color: '#10B981', width: '100%' },
    ];
    return strengths[passwordStrength - 1] || strengths[0];
  };

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await changePassword(data.currentPassword, data.newPassword, data.confirmPassword);

      console.log("a respostsa")
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erro ao alterar senha. Tente novamente.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.iconWrapper}>
              <Shield size={32} className={styles.shieldIcon} />
            </div>
            <h1 className={styles.title}>Carregando...</h1>
          </div>
        </div>
      </div>
    );
  }

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
          <div className={styles.iconWrapper}>
            <Shield size={32} className={styles.shieldIcon} />
          </div>
          <h1 className={styles.title}>Alteração de Senha</h1>
          <p className={styles.subtitle}>
            Por segurança, você precisa alterar sua senha antes de continuar
          </p>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.firstName} {user?.lastName}</span>
            <span className={styles.userEmail}>{user?.email}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
          <div className={styles.formGroup}>
            <label htmlFor="currentPassword" className={styles.label}>
              Senha atual
            </label>
            <div className={styles.passwordWrapper}>
              <Input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                placeholder="Digite sua senha atual"
                leftIcon={<KeyRound size={16} />}
                {...register('currentPassword')}
                error={errors.currentPassword}
                fullWidth
              />
              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="newPassword" className={styles.label}>
              Nova senha
            </label>
            <div className={styles.passwordWrapper}>
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Digite sua nova senha"
                leftIcon={<Shield size={16} />}
                {...register('newPassword')}
                error={errors.newPassword}
                fullWidth
              />
              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {newPassword && (
              <div className={styles.strengthContainer}>
                <div className={styles.strengthBar}>
                  <div 
                    className={styles.strengthFill}
                    style={{
                      width: getStrengthInfo().width,
                      backgroundColor: getStrengthInfo().color,
                    }}
                  />
                </div>
                <div className={styles.strengthLabel}>
                  <span style={{ color: getStrengthInfo().color }}>
                    {getStrengthInfo().label}
                  </span>
                </div>
              </div>
            )}

            <div className={styles.requirements}>
              <p className={styles.requirementsTitle}>Requisitos da senha:</p>
              <ul className={styles.requirementsList}>
                <li className={newPassword.length >= 8 ? styles.requirementMet : ''}>
                  {newPassword.length >= 8 ? <CheckCircle size={14} /> : <XCircle size={14} />}
                  Mínimo 8 caracteres
                </li>
                <li className={/[A-Z]/.test(newPassword) ? styles.requirementMet : ''}>
                  {/[A-Z]/.test(newPassword) ? <CheckCircle size={14} /> : <XCircle size={14} />}
                  Uma letra maiúscula
                </li>
                <li className={/[a-z]/.test(newPassword) ? styles.requirementMet : ''}>
                  {/[a-z]/.test(newPassword) ? <CheckCircle size={14} /> : <XCircle size={14} />}
                  Uma letra minúscula
                </li>
                <li className={/[0-9]/.test(newPassword) ? styles.requirementMet : ''}>
                  {/[0-9]/.test(newPassword) ? <CheckCircle size={14} /> : <XCircle size={14} />}
                  Um número
                </li>
                <li className={/[^A-Za-z0-9]/.test(newPassword) ? styles.requirementMet : ''}>
                  {/[^A-Za-z0-9]/.test(newPassword) ? <CheckCircle size={14} /> : <XCircle size={14} />}
                  Um caractere especial
                </li>
              </ul>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>
              Confirmar nova senha
            </label>
            <div className={styles.passwordWrapper}>
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirme sua nova senha"
                leftIcon={<CheckCircle size={16} />}
                {...register('confirmPassword')}
                error={errors.confirmPassword}
                fullWidth
              />
              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className={styles.errorMessage} role="alert">
              <AlertCircle size={16} className={styles.errorIcon} />
              <span>{error}</span>
            </div>
          )}

          <div className={styles.actions}>
            <Button
              type="button"
              variant="secondary"
              onClick={logout}
              className={styles.logoutButton}
            >
              Sair
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              icon={<KeyRound size={18} />}
              iconPosition="right"
              className={styles.submitButton}
            >
              Alterar Senha
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}