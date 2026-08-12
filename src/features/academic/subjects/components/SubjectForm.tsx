'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  BookOpen,
  Hash,
  FileText,
  X,
  CheckCircle,
  Layers,
} from 'lucide-react';
import { Input } from '@/shared/components/ui/Input/Input';
import { Textarea } from '@/shared/components/ui/Textarea/Textarea';
import { Button } from '@/shared/components/ui/Button/Button';
import { useToast } from '@/shared/contexts/ToastContext';
import { useLoading } from '@/shared/contexts/LoadingContext';
import { subjectService } from '../services/subject.service';
import type { Subject } from '../types/subject.types';
import styles from './SubjectForm.module.css';

interface SubjectFormProps {
  subject?: Subject | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const createSchema = z.object({
  code: z.string()
    .min(2, 'Código deve ter no mínimo 2 caracteres')
    .max(20, 'Código deve ter no máximo 20 caracteres')
    .regex(/^[A-Z0-9]+$/, 'Código deve conter apenas letras maiúsculas e números'),
  name: z.string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  description: z.string()
    .max(255, 'Descrição deve ter no máximo 255 caracteres')
    .optional(),
  isActive: z.boolean().default(true),
});

const updateSchema = z.object({
  code: z.string()
    .min(2, 'Código deve ter no mínimo 2 caracteres')
    .max(20, 'Código deve ter no máximo 20 caracteres')
    .regex(/^[A-Z0-9]+$/, 'Código deve conter apenas letras maiúsculas e números')
    .optional(),
  name: z.string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .optional(),
  description: z.string()
    .max(255, 'Descrição deve ter no máximo 255 caracteres')
    .optional(),
  isActive: z.boolean().optional(),
});

type CreateFormData = z.infer<typeof createSchema>;
type UpdateFormData = z.infer<typeof updateSchema>;

export const SubjectForm: React.FC<SubjectFormProps> = ({
  subject,
  onSuccess,
  onCancel,
}) => {
  const isEditing = !!subject;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showSuccess, showError } = useToast();
  const { startLoading, stopLoading } = useLoading();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CreateFormData | UpdateFormData>({
    resolver: zodResolver(isEditing ? updateSchema : createSchema),
    defaultValues: isEditing && subject ? {
      code: subject.code || '',
      name: subject.name || '',
      description: subject.description || '',
      isActive: subject.isActive ?? true,
    } : {
      code: '',
      name: '',
      description: '',
      isActive: true,
    },
  });

  const onSubmit = async (data: CreateFormData | UpdateFormData) => {
    try {
      setIsSubmitting(true);
      startLoading();

      const payload: any = {
        code: data.code,
        name: data.name,
        description: data.description || '',
        isActive: data.isActive ?? true,
      };

      let response;
      if (isEditing && subject) {
        response = await subjectService.update(subject.uuid, payload);
        showSuccess('Disciplina atualizada', `Disciplina ${response.name} foi atualizada`);
      } else {
        response = await subjectService.create(payload);
        showSuccess('Disciplina criada', `Disciplina ${response.name} foi criada`);
      }

      onSuccess();
    } catch (error: any) {
      console.error('Erro ao salvar disciplina:', error);
      let errorMessage = 'Erro ao salvar disciplina. Tente novamente.';
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

  const watchedValues = watch();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>
          <BookOpen size={16} />
          Informações da Disciplina
        </h4>

        <div className={styles.fields}>
          <div className={styles.field}>
            <Input
              label="Código"
              placeholder="Ex: MAT101, FIS201"
              leftIcon={<Hash size={16} />}
              value={watchedValues.code || ''}
              onChange={(e) => setValue('code', e.target.value)}
              error={errors.code?.message}
              fullWidth
              helpText="Use apenas letras maiúsculas e números"
            />
          </div>

          <div className={styles.field}>
            <Input
              label="Nome"
              placeholder="Ex: Matemática, Física, Português"
              leftIcon={<BookOpen size={16} />}
              value={watchedValues.name || ''}
              onChange={(e) => setValue('name', e.target.value)}
              error={errors.name?.message}
              fullWidth
            />
          </div>

          <div className={styles.field}>
            <Textarea
              label="Descrição"
              placeholder="Descrição detalhada da disciplina"
              value={watchedValues.description || ''}
              onChange={(e) => setValue('description', e.target.value)}
              fullWidth
              rows={4}
            />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>
          <Layers size={16} />
          Status da Disciplina
        </h4>

        <div className={styles.toggleGroup}>
          <label className={styles.toggleItem}>
            <input
              type="checkbox"
              checked={watchedValues.isActive ?? true}
              onChange={(e) => setValue('isActive', e.target.checked)}
            />
            <div className={styles.toggleContent}>
              <CheckCircle size={16} />
              <span>Disciplina Ativa</span>
            </div>
          </label>
          <p className={styles.toggleHelp}>
            Desative para ocultar a disciplina do sistema
          </p>
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
          {isEditing ? 'Atualizar' : 'Criar'} Disciplina
        </Button>
      </div>
    </form>
  );
};