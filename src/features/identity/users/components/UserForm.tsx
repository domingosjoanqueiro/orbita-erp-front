'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Mail, Lock, Building2, Shield, X } from 'lucide-react';
import { Input } from '@/shared/components/ui/Input/Input';
import { Select } from '@/shared/components/ui/Select/Select';
import { Button } from '@/shared/components/ui/Button/Button';
import { createUserSchema, updateUserSchema } from '../validators/user.validators';
import type { User as UserType } from '../types/user.types';
import styles from './UserForm.module.css';

interface UserFormProps {
  user?: UserType | null;
  onSuccess: () => void;
  onCancel: () => void;
}

// Mock data
const roleOptions = [
  { value: '1', label: 'Administrador' },
  { value: '2', label: 'Gerente' },
  { value: '3', label: 'Usuário' },
];

const companyOptions = [
  { value: '1', label: 'Orbita Educação' },
  { value: '2', label: 'Orbita Tech' },
];

// Definir os tipos para o formulário
type CreateFormData = {
  name: string;
  email: string;
  password: string;
  roleId: string;
  companyId: string;
};

type UpdateFormData = {
  name?: string;
  email?: string;
  roleId?: string;
  isActive?: boolean;
};

type FormData = CreateFormData | UpdateFormData;

export const UserForm: React.FC<UserFormProps> = ({
  user,
  onSuccess,
  onCancel,
}) => {
  const isEditing = !!user;
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(isEditing ? updateUserSchema : createUserSchema),
    defaultValues: isEditing ? {
      name: user.name,
      email: user.email,
      roleId: user.roleId,
      isActive: user.isActive,
    } : {
      name: '',
      email: '',
      password: '',
      roleId: '',
      companyId: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      // Simular chamada API
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Dados do usuário:', data);
      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <div className={styles.fields}>
        <div className={styles.field}>
          <Input
            label="Nome completo"
            placeholder="Digite o nome do usuário"
            leftIcon={<User size={16} />}
            {...register('name')}
            error={errors.name?.message}
            fullWidth
          />
        </div>

        <div className={styles.field}>
          <Input
            label="Email"
            type="email"
            placeholder="usuario@empresa.com"
            leftIcon={<Mail size={16} />}
            {...register('email')}
            error={errors.email?.message}
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

        <div className={styles.field}>
          <Select
            label="Role"
            options={roleOptions}
            {...register('roleId')}
            error={errors.roleId?.message}
            fullWidth
          />
        </div>

        {!isEditing && (
          <div className={styles.field}>
            <Select
              label="Empresa"
              options={companyOptions}
              {...register('companyId')}
              error={(errors as any).companyId?.message}
              fullWidth
            />
          </div>
        )}
      </div>

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
          icon={isEditing ? <User size={18} /> : <User size={18} />}
        >
          {isEditing ? 'Atualizar' : 'Criar'} Usuário
        </Button>
      </div>
    </form>
  );
};