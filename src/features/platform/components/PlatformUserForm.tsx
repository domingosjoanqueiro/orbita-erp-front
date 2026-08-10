'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Phone, Lock, Shield, X, Crown } from 'lucide-react';
import { Input } from '@/shared/components/ui/Input/Input';
import { Select } from '@/shared/components/ui/Select/Select';
import { Button } from '@/shared/components/ui/Button/Button';
import { useToast } from '@/shared/contexts/ToastContext';
import { useLoading } from '@/shared/contexts/LoadingContext';
import { platformUsersService } from '@/features/platform/services/platform-users.service';
import type { PlatformUser } from '@/features/platform/types/platform-user.types';
import styles from './PlatformUserForm.module.css';

interface PlatformUserFormProps {
  user?: PlatformUser | null;
  onSuccess: () => void;
  onCancel: () => void;
}

// Schemas separados para create e update
const createSchema = z.object({
  firstName: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  lastName: z.string().min(2, 'Sobrenome deve ter no mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  username: z.string().min(3, 'Usuário deve ter no mínimo 3 caracteres'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  phone: z.string().optional(),
  roleIds: z.array(z.string()).min(1, 'Selecione pelo menos uma role'),
});

const updateSchema = z.object({
  firstName: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').optional(),
  lastName: z.string().min(2, 'Sobrenome deve ter no mínimo 2 caracteres').optional(),
  email: z.string().email('Email inválido').optional(),
  username: z.string().min(3, 'Usuário deve ter no mínimo 3 caracteres').optional(),
  phone: z.string().optional(),
  roleIds: z.array(z.string()).min(1, 'Selecione pelo menos uma role').optional(),
});

// Tipos separados para create e update
type CreateFormData = z.infer<typeof createSchema>;
type UpdateFormData = z.infer<typeof updateSchema>;

// Mock de roles (substituir pela API real)
const roleOptions = [
  { value: '1', label: 'Super Admin' },
  { value: '2', label: 'Admin' },
  { value: '3', label: 'Gestor' },
];

export const PlatformUserForm: React.FC<PlatformUserFormProps> = ({
  user,
  onSuccess,
  onCancel,
}) => {
  const isEditing = !!user;
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { showSuccess, showError } = useToast();
  const { startLoading, stopLoading } = useLoading();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateFormData | UpdateFormData>({
    resolver: zodResolver(isEditing ? updateSchema : createSchema),
    defaultValues: isEditing && user ? {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      username: user.username || '',
      phone: user.phone || '',
      roleIds: user.roles?.map(r => String(r.id)) || [],
    } : {
      firstName: '',
      lastName: '',
      email: '',
      username: '',
      password: '',
      phone: '',
      roleIds: [],
    },
  });

  const selectedRoles = (watch('roleIds') as string[]) || [];

  const onSubmit = async (data: CreateFormData | UpdateFormData) => {
    try {
      setIsSubmitting(true);
      startLoading();

      // Preparar payload base
      const basePayload: any = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        username: data.username,
        phone: data.phone || undefined,
        roleIds: (data.roleIds || []).map(Number),
      };

      // Adicionar password apenas se for criação
      if (!isEditing && 'password' in data) {
        basePayload.password = data.password;
      }

      let response;
      if (isEditing && user) {
        response = await platformUsersService.update(user.uuid, basePayload);
        showSuccess('Usuário atualizado', `${response.firstName} ${response.lastName} foi atualizado com sucesso`);
      } else {
        response = await platformUsersService.create(basePayload);
        showSuccess('Usuário criado', `${response.firstName} ${response.lastName} foi criado com sucesso`);
      }

      onSuccess();
    } catch (error: any) {
      console.error('Erro ao salvar usuário:', error);
      let errorMessage = 'Erro ao salvar usuário. Tente novamente.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        const messages = Object.values(error.response.data.errors).flat();
        errorMessage = messages.join(', ');
      }
      showError('Erro', errorMessage);
    } finally {
      setIsSubmitting(false);
      stopLoading();
    }
  };

  const toggleRole = (roleId: string) => {
    const current = selectedRoles;
    const newSelection = current.includes(roleId)
      ? current.filter(id => id !== roleId)
      : [...current, roleId];
    setValue('roleIds', newSelection as any);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Dados Pessoais</h4>
        <div className={styles.fields}>
          <div className={styles.field}>
            <Input
              label="Nome"
              placeholder="Digite o nome"
              leftIcon={<User size={16} />}
              {...register('firstName')}
              error={errors.firstName?.message}
              fullWidth
            />
          </div>
          <div className={styles.field}>
            <Input
              label="Sobrenome"
              placeholder="Digite o sobrenome"
              leftIcon={<User size={16} />}
              {...register('lastName')}
              error={errors.lastName?.message}
              fullWidth
            />
          </div>
          <div className={styles.field}>
            <Input
              label="Email"
              type="email"
              placeholder="usuario@orbita.com"
              leftIcon={<Mail size={16} />}
              {...register('email')}
              error={errors.email?.message}
              fullWidth
            />
          </div>
          <div className={styles.field}>
            <Input
              label="Usuário"
              placeholder="Digite o nome de usuário"
              leftIcon={<User size={16} />}
              {...register('username')}
              error={errors.username?.message}
              fullWidth
            />
          </div>
          <div className={styles.field}>
            <Input
              label="Telefone"
              placeholder="(+258) 82 123 4567"
              leftIcon={<Phone size={16} />}
              {...register('phone')}
              error={errors.phone?.message}
              fullWidth
            />
          </div>
          {!isEditing && (
            <div className={styles.field}>
              <Input
                label="Senha"
                type="password"
                placeholder="Digite uma senha forte"
                leftIcon={<Lock size={16} />}
                {...register('password')}
                error={(errors as any).password?.message}
                fullWidth
              />
            </div>
          )}
        </div>
      </div>

      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>
          <Shield size={16} />
          Roles
        </h4>
        <div className={styles.rolesContainer}>
          {roleOptions.map((role) => (
            <label
              key={role.value}
              className={`${styles.roleOption} ${selectedRoles.includes(role.value) ? styles.selected : ''}`}
            >
              <input
                type="checkbox"
                checked={selectedRoles.includes(role.value)}
                onChange={() => toggleRole(role.value)}
              />
              <span>{role.label}</span>
              {role.value === '1' && <Crown size={12} className={styles.crownIcon} />}
            </label>
          ))}
        </div>
        {errors.roleIds && (
          <span className={styles.errorMessage}>{errors.roleIds.message}</span>
        )}
      </div>

      {isEditing && user?.isRoot && (
        <div className={styles.warningBox}>
          <Crown size={16} />
          <span>Este é um usuário Root. Algumas permissões não podem ser alteradas.</span>
        </div>
      )}

      <div className={styles.actions}>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          icon={<X size={18} />}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          isLoading={isSubmitting}
          icon={<User size={18} />}
        >
          {isEditing ? 'Atualizar' : 'Criar'} Usuário
        </Button>
      </div>
    </form>
  );
};