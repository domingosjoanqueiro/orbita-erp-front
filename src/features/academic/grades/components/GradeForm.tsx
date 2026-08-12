'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  GraduationCap,
  Hash,
  FileText,
  BookOpen,
  Layers,
  X,
  CheckCircle,
  Award,
  TrendingUp,
} from 'lucide-react';
import { Input } from '@/shared/components/ui/Input/Input';
import { Select } from '@/shared/components/ui/Select/Select';
import { Textarea } from '@/shared/components/ui/Textarea/Textarea';
import { Button } from '@/shared/components/ui/Button/Button';
import { useToast } from '@/shared/contexts/ToastContext';
import { useLoading } from '@/shared/contexts/LoadingContext';
import { gradeService } from '../services/grade.service';
import { programService } from '@/features/academic/programs/services/program.service';
import type { Grade } from '../types/grade.types';
import styles from './GradeForm.module.css';

interface GradeFormProps {
  grade?: Grade | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const createSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100, 'Nome deve ter no máximo 100 caracteres'),
  code: z.string().min(2, 'Código deve ter no mínimo 2 caracteres').max(20, 'Código deve ter no máximo 20 caracteres'),
  programUuid: z.string().min(1, 'Programa é obrigatório'),
  order: z.string().min(1, 'Ordem é obrigatória').regex(/^\d+$/, 'A ordem deve ser um número'),
  isTerminal: z.boolean().default(false),
  description: z.string().max(255, 'Descrição deve ter no máximo 255 caracteres').optional(),
});

const updateSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100, 'Nome deve ter no máximo 100 caracteres').optional(),
  code: z.string().min(2, 'Código deve ter no mínimo 2 caracteres').max(20, 'Código deve ter no máximo 20 caracteres').optional(),
  programUuid: z.string().min(1, 'Programa é obrigatório').optional(),
  order: z.string().min(1, 'Ordem é obrigatória').regex(/^\d+$/, 'A ordem deve ser um número').optional(),
  isTerminal: z.boolean().optional(),
  description: z.string().max(255, 'Descrição deve ter no máximo 255 caracteres').optional(),
});

type CreateFormData = z.infer<typeof createSchema>;
type UpdateFormData = z.infer<typeof updateSchema>;

export const GradeForm: React.FC<GradeFormProps> = ({
  grade,
  onSuccess,
  onCancel,
}) => {
  const isEditing = !!grade;
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [programs, setPrograms] = useState<{ id: number; uuid: string; name: string; code: string }[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const { showSuccess, showError } = useToast();
  const { startLoading, stopLoading } = useLoading();

  useEffect(() => {
    const loadPrograms = async () => {
      try {
        setLoadingPrograms(true);
        const response = await programService.getAll({ limit: 100 });
        const items = response?.data || [];
        setPrograms(items);
      } catch (error) {
        console.error('Erro ao carregar programas:', error);
        showError('Erro', 'Não foi possível carregar os programas');
      } finally {
        setLoadingPrograms(false);
      }
    };
    loadPrograms();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CreateFormData | UpdateFormData>({
    resolver: zodResolver(isEditing ? updateSchema : createSchema),
    defaultValues: isEditing && grade ? {
      name: grade.name || '',
      code: grade.code || '',
      programUuid: String(grade.programUuid),
      order: String(grade.order),
      isTerminal: grade.isTerminal || false,
      description: grade.description || '',
    } : {
      name: '',
      code: '',
      programUuid: '',
      order: '',
      isTerminal: false,
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
        programUuid: data.programUuid,
        order: Number(data.order),
        isTerminal: data.isTerminal || false,
        description: data.description || '',
      };

      let response;
      if (isEditing && grade) {
        response = await gradeService.update(grade.uuid, payload);
        showSuccess('Classe atualizada', `Classe ${response.name} foi atualizada`);
      } else {
        response = await gradeService.create(payload);
        showSuccess('Classe criada', `Classe ${response.name} foi criada`);
      }

      onSuccess();
    } catch (error: any) {
      console.error('Erro ao salvar classe:', error);
      let errorMessage = 'Erro ao salvar classe. Tente novamente.';
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

  const programOptions = programs.map(p => ({
    value: String(p.uuid),
    label: `${p.name} (${p.code})`,
  }));

  const watchedValues = watch();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>
          <GraduationCap size={16} />
          Informações da Classe
        </h4>

        <div className={styles.fields}>
          <div className={styles.field}>
            <Input
              label="Nome"
              placeholder="Ex: 11ª Classe"
              leftIcon={<GraduationCap size={16} />}
              value={watchedValues.name || ''}
              onChange={(e) => setValue('name', e.target.value)}
              error={errors.name?.message}
              fullWidth
            />
          </div>
          <div className={styles.field}>
            <Input
              label="Código"
              placeholder="Ex: G011"
              leftIcon={<Hash size={16} />}
              value={watchedValues.code || ''}
              onChange={(e) => setValue('code', e.target.value)}
              error={errors.code?.message}
              fullWidth
            />
          </div>
          <div className={styles.field}>
            <Select
              label="Programa"
              options={programOptions}
              placeholder={loadingPrograms ? 'Carregando...' : 'Selecione um programa'}
              value={watchedValues.programUuid || ''}
              onChange={(e) => setValue('programUuid', e.target.value)}
              error={errors.programUuid?.message}
              fullWidth
              disabled={loadingPrograms}
            />
          </div>
          <div className={styles.field}>
            <Input
              label="Ordem"
              type="number"
              placeholder="Ex: 11"
              value={watchedValues.order || ''}
              onChange={(e) => setValue('order', e.target.value)}
              error={errors.order?.message}
              fullWidth
            />
          </div>
          <div className={styles.field}>
            <Textarea
              label="Descrição"
              placeholder="Descreva a classe"
              value={watchedValues.description || ''}
              onChange={(e) => setValue('description', e.target.value)}
              fullWidth
              rows={3}
            />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>
          <Award size={16} />
          Tipo de Classe
        </h4>

        <div className={styles.toggleGroup}>
          <label className={styles.toggleItem}>
            <input
              type="checkbox"
              checked={watchedValues.isTerminal || false}
              onChange={(e) => setValue('isTerminal', e.target.checked)}
            />
            <div className={styles.toggleContent}>
              <Award size={16} />
              <span>Classe Terminal</span>
            </div>
          </label>
          <p className={styles.toggleHelp}>
            Classes terminais são o último ano de um ciclo (ex: 12ª Classe)
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
          {isEditing ? 'Atualizar' : 'Criar'} Classe
        </Button>
      </div>
    </form>
  );
};