'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Layers, Hash, FileText, X, CheckCircle } from 'lucide-react';
import { Input } from '@/shared/components/ui/Input/Input';
import { Textarea } from '@/shared/components/ui/Textarea/Textarea';
import { Button } from '@/shared/components/ui/Button/Button';
import { useToast } from '@/shared/contexts/ToastContext';
import { useLoading } from '@/shared/contexts/LoadingContext';
import { schoolLevelService } from '../services/school-level.service';
import type { SchoolLevel } from '../types/school-level.types';
import styles from './SchoolLevelForm.module.css';

interface SchoolLevelFormProps {
  level?: SchoolLevel | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const createSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100, 'Nome deve ter no máximo 100 caracteres'),
  code: z.string().min(2, 'Código deve ter no mínimo 2 caracteres').max(20, 'Código deve ter no máximo 20 caracteres'),
  description: z.string().max(255, 'Descrição deve ter no máximo 255 caracteres').optional(),
});

const updateSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100, 'Nome deve ter no máximo 100 caracteres').optional(),
  code: z.string().min(2, 'Código deve ter no mínimo 2 caracteres').max(20, 'Código deve ter no máximo 20 caracteres').optional(),
  description: z.string().max(255, 'Descrição deve ter no máximo 255 caracteres').optional(),
});

type CreateFormData = z.infer<typeof createSchema>;
type UpdateFormData = z.infer<typeof updateSchema>;

export const SchoolLevelForm: React.FC<SchoolLevelFormProps> = ({
  level,
  onSuccess,
  onCancel,
}) => {
  const isEditing = !!level;
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { showSuccess, showError } = useToast();
  const { startLoading, stopLoading } = useLoading();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateFormData | UpdateFormData>({
    resolver: zodResolver(isEditing ? updateSchema : createSchema),
    defaultValues: isEditing && level ? {
      name: level.name || '',
      code: level.code || '',
      description: level.description || '',
    } : {
      name: '',
      code: '',
      description: '',
    },
  });

  const onSubmit = async (data: CreateFormData | UpdateFormData) => {
    try {
      setIsSubmitting(true);
      startLoading();

      const payload: any = {
        name: data.name,
        code: data.code,
        description: data.description,
      };

      let response;
      if (isEditing && level) {
        response = await schoolLevelService.update(level.uuid, payload);
        showSuccess('Nível atualizado', `${response.name} foi atualizado com sucesso`);
      } else {
        response = await schoolLevelService.create(payload);
        showSuccess('Nível criado', `${response.name} foi criado com sucesso`);
      }

      onSuccess();
    } catch (error: any) {
      console.error('Erro ao salvar nível:', error);
      let errorMessage = 'Erro ao salvar nível. Tente novamente.';
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>
          <Layers size={16} />
          Informações do Nível de Ensino
        </h4>
        <div className={styles.fields}>
          <div className={styles.field}>
            <Input
              label="Nome"
              placeholder="Ex: Ensino Primário"
              leftIcon={<Layers size={16} />}
              {...register('name')}
              error={errors.name?.message}
              fullWidth
            />
          </div>
          <div className={styles.field}>
            <Input
              label="Código"
              placeholder="Ex: PRIMARY"
              leftIcon={<Hash size={16} />}
              {...register('code')}
              error={errors.code?.message}
              fullWidth
            />
          </div>
          <div className={styles.field}>
            <Textarea
              label="Descrição"
              placeholder="Descreva o nível de ensino"
              {...register('description')}
              error={errors.description?.message}
              fullWidth
              rows={3}
            />
          </div>
        </div>
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
          icon={<CheckCircle size={18} />}
        >
          {isEditing ? 'Atualizar' : 'Criar'} Nível
        </Button>
      </div>
    </form>
  );
};