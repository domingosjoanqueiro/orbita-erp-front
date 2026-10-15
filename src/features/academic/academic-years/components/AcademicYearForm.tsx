'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, CalendarDays, X, CheckCircle } from 'lucide-react';
import { Input } from '@/shared/components/ui/Input/Input';
import { Button } from '@/shared/components/ui/Button/Button';
import { useToast } from '@/shared/contexts/ToastContext';
import { useLoading } from '@/shared/contexts/LoadingContext';
import { academicYearService } from '../services/academic-year.service';
import type { AcademicYear } from '../types/academic-year.types';
import styles from './AcademicYearForm.module.css';

interface AcademicYearFormProps {
  year?: AcademicYear | null;
  onSuccess: (created?: AcademicYear) => void;
  onCancel: () => void;
}

const createSchema = z.object({
  name: z.string()
    .min(4, 'Nome deve ter no mínimo 4 caracteres')
    .max(9, 'Nome deve ter no máximo 9 caracteres')
    .regex(/^\d{4}$/, 'Digite um ano válido (ex: 2026)'),
  startDate: z.string().min(1, 'Data de início é obrigatória'),
  endDate: z.string().min(1, 'Data de fim é obrigatória'),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end >= start;
}, {
  message: 'A data de fim deve ser maior ou igual à data de início',
  path: ['endDate'],
});

const updateSchema = z.object({
  name: z.string()
    .min(4, 'Nome deve ter no mínimo 4 caracteres')
    .max(9, 'Nome deve ter no máximo 9 caracteres')
    .regex(/^\d{4}$/, 'Digite um ano válido (ex: 2026)')
    .optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
}).refine((data) => {
  if (!data.startDate || !data.endDate) return true;
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end >= start;
}, {
  message: 'A data de fim deve ser maior ou igual à data de início',
  path: ['endDate'],
});

type CreateFormData = z.infer<typeof createSchema>;
type UpdateFormData = z.infer<typeof updateSchema>;

// Função para formatar data para o input type="date" (YYYY-MM-DD)
const formatDateForInput = (date: string | undefined): string => {
  if (!date) return '';
  
  // Se já estiver no formato YYYY-MM-DD, retorna
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }
  
  try {
    const parsedDate = new Date(date);
    // Verificar se a data é válida
    if (isNaN(parsedDate.getTime())) {
      return '';
    }
    // Formatar para YYYY-MM-DD
    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const day = String(parsedDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
};

export const AcademicYearForm: React.FC<AcademicYearFormProps> = ({
  year,
  onSuccess,
  onCancel,
}) => {
  const isEditing = !!year;
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { showSuccess, showError } = useToast();
  const { startLoading, stopLoading } = useLoading();

  // Formatar as datas para o input type="date"
  const formattedStartDate = formatDateForInput(year?.startDate);
  const formattedEndDate = formatDateForInput(year?.endDate);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CreateFormData | UpdateFormData>({
    resolver: zodResolver(isEditing ? updateSchema : createSchema),
    defaultValues: isEditing && year ? {
      name: year.name || '',
      startDate: formattedStartDate,
      endDate: formattedEndDate,
    } : {
      name: new Date().getFullYear().toString(),
      startDate: '',
      endDate: '',
    },
  });

  const startDate = watch('startDate');

  const onSubmit = async (data: CreateFormData | UpdateFormData) => {
    try {
      setIsSubmitting(true);
      startLoading();

      const payload: any = {
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
      };

      let response;
      if (isEditing && year) {
        response = await academicYearService.update(year.uuid, payload);
        showSuccess('Ano atualizado', `${response.name} foi atualizado com sucesso`);
      } else {
        response = await academicYearService.create(payload);
        showSuccess('Ano criado', `${response.name} foi criado com sucesso`);
      }

      onSuccess(isEditing ? undefined : response);
    } catch (error: any) {
      console.error('Erro ao salvar ano:', error);
      let errorMessage = 'Erro ao salvar ano. Tente novamente.';
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
          <CalendarDays size={16} />
          Informações do Ano Académico
        </h4>
        <div className={styles.fields}>
          <div className={styles.field}>
            <Input
              label="Ano"
              placeholder="Ex: 2026"
              leftIcon={<Calendar size={16} />}
              {...register('name')}
              error={errors.name?.message}
              fullWidth
            />
          </div>
          <div className={styles.field}>
            <Input
              label="Data de Início"
              type="date"
              {...register('startDate')}
              error={errors.startDate?.message}
              fullWidth
            />
          </div>
          <div className={styles.field}>
            <Input
              label="Data de Fim"
              type="date"
              {...register('endDate')}
              error={errors.endDate?.message}
              fullWidth
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
          {isEditing ? 'Atualizar' : 'Criar'} Ano
        </Button>
      </div>
    </form>
  );
};