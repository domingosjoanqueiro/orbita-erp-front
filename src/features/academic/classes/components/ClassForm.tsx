'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Users,
  Calendar,
  GraduationCap,
  Clock,
  User,
  X,
  CheckCircle,
  Building2,
  School,
  Hash,
  Sun,
  Moon,
  Star,
} from 'lucide-react';
import { Input } from '@/shared/components/ui/Input/Input';
import { Select } from '@/shared/components/ui/Select/Select';
import { Button } from '@/shared/components/ui/Button/Button';
import { useToast } from '@/shared/contexts/ToastContext';
import { useLoading } from '@/shared/contexts/LoadingContext';
import { classService } from '../services/class.service';
import type { Class } from '../types/class.types';
import styles from './ClassForm.module.css';

interface ClassFormProps {
  classData?: Class | null;
  onSuccess: () => void;
  onCancel: () => void;
}

// Definindo o enum de turnos como const para inferência de tipo
const SHIFT_VALUES = ['MORNING', 'AFTERNOON', 'EVENING', 'FULL'] as const;
type ShiftType = typeof SHIFT_VALUES[number];

// Schema para criação - usando refinamento para validação personalizada
const createSchema = z.object({
  academicYearUuid: z.string().min(1, 'Ano académico é obrigatório'),
  gradeUuid: z.string().min(1, 'Classe é obrigatória'),
  name: z.string()
    .min(1, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  shift: z.enum(SHIFT_VALUES),
  capacity: z.string()
    .min(1, 'Capacidade é obrigatória')
    .regex(/^\d+$/, 'Capacidade deve ser um número'),
  room: z.string().max(50, 'Sala deve ter no máximo 50 caracteres').optional(),
  isActive: z.boolean().default(true),
});

// Schema para atualização
const updateSchema = z.object({
  academicYearUuid: z.string().min(1, 'Ano académico é obrigatório').optional(),
  gradeUuid: z.string().min(1, 'Classe é obrigatória').optional(),
  name: z.string()
    .min(1, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .optional(),
  shift: z.enum(SHIFT_VALUES).optional(),
  capacity: z.string()
    .regex(/^\d+$/, 'Capacidade deve ser um número')
    .optional(),
  room: z.string().max(50, 'Sala deve ter no máximo 50 caracteres').optional(),
  isActive: z.boolean().optional(),
});

// Tipos inferidos
type CreateFormData = z.infer<typeof createSchema>;
type UpdateFormData = z.infer<typeof updateSchema>;
type FormData = CreateFormData | UpdateFormData;

const SHIFT_OPTIONS = [
  { value: 'MORNING', label: 'Manhã', icon: Sun },
  { value: 'AFTERNOON', label: 'Tarde', icon: Sun },
  { value: 'EVENING', label: 'Noite', icon: Moon },
  { value: 'FULL', label: 'Integral', icon: Star },
];

export const ClassForm: React.FC<ClassFormProps> = ({
  classData,
  onSuccess,
  onCancel,
}) => {
  const isEditing = !!classData;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [academicYears, setAcademicYears] = useState<{ id: number; uuid: string; name: string; year: number }[]>([]);
  const [grades, setGrades] = useState<{ id: number; uuid: string; name: string; code: string; programName: string }[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const { showSuccess, showError } = useToast();
  const { startLoading, stopLoading } = useLoading();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        const [years, gradesList] = await Promise.all([
          classService.getAcademicYears(),
          classService.getGrades(),
        ]);

        console.log('years', years);
        console.log('grades', gradesList);
        setAcademicYears(years);
        setGrades(gradesList);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showError('Erro', 'Não foi possível carregar os dados necessários');
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, []);

  // Valores padrão para o formulário
  const getDefaultValues = (): FormData => {
    if (isEditing && classData) {
      return {
        academicYearUuid: classData.academicYearUuid || '',
        gradeUuid: classData.gradeUuid || '',
        name: classData.name || '',
        shift: classData.shift as ShiftType || 'MORNING',
        capacity: String(classData.capacity || ''),
        room: classData.room || '',
        isActive: classData.isActive ?? true,
      };
    }
    return {
      academicYearUuid: '',
      gradeUuid: '',
      name: '',
      shift: 'MORNING',
      capacity: '',
      room: '',
      isActive: true,
    };
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(isEditing ? updateSchema : createSchema),
    defaultValues: getDefaultValues(),
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      startLoading();

      // Validação adicional para criação
      if (!isEditing) {
        // Para criação, todos os campos obrigatórios devem estar presentes
        if (!data.academicYearUuid || !data.gradeUuid || !data.name || !data.shift || !data.capacity) {
          showError('Erro', 'Todos os campos obrigatórios devem ser preenchidos');
          return;
        }
      }

      // Preparar payload com validação de tipos
      const payload: any = {};

      // Para criação, campos são obrigatórios
      if (!isEditing) {
        payload.academicYearUuid = data.academicYearUuid!;
        payload.gradeUuid = data.gradeUuid!;
        payload.name = data.name!;
        payload.shift = data.shift!;
        payload.capacity = Number(data.capacity!);
      } else {
        // Para edição, apenas campos preenchidos
        if (data.academicYearUuid) payload.academicYearUuid = data.academicYearUuid;
        if (data.gradeUuid) payload.gradeUuid = data.gradeUuid;
        if (data.name) payload.name = data.name;
        if (data.shift) payload.shift = data.shift;
        if (data.capacity) payload.capacity = Number(data.capacity);
        if (data.room !== undefined) payload.room = data.room;
        if (data.isActive !== undefined) payload.isActive = data.isActive;
      }

      // Campos opcionais
      if (data.room !== undefined) payload.room = data.room;
      if (data.isActive !== undefined) payload.isActive = data.isActive;

      let response;
      if (isEditing && classData) {
        response = await classService.update(classData.uuid, payload);
        showSuccess('Turma atualizada', `Turma ${response.name} foi atualizada`);
      } else {
        response = await classService.create(payload);
        showSuccess('Turma criada', `Turma ${response.name} foi criada`);
      }

      onSuccess();
    } catch (error: any) {
      console.error('Erro ao salvar turma:', error);
      let errorMessage = 'Erro ao salvar turma. Tente novamente.';
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
  const selectedShift = watchedValues.shift;

  const academicYearOptions = academicYears.map(ay => ({
    value: ay.uuid,
    label: `${ay.name}`,
  }));

  const gradeOptions = grades.map(g => ({
    value: g.uuid,
    label: `${g.name} (${g.code}) - ${g.programName}`,
  }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>
          <School size={16} />
          Dados da Turma
        </h4>

        <div className={styles.fields}>
          <div className={styles.field}>
            <Select
              label="Ano Académico"
              options={academicYearOptions}
              placeholder={loadingData ? 'Carregando...' : 'Selecione o ano'}
              value={watchedValues.academicYearUuid || ''}
              onChange={(e) => setValue('academicYearUuid', e.target.value)}
              error={errors.academicYearUuid?.message}
              fullWidth
              disabled={loadingData}
            />
          </div>

          <div className={styles.field}>
            <Select
              label="Classe"
              options={gradeOptions}
              placeholder={loadingData ? 'Carregando...' : 'Selecione a classe'}
              value={watchedValues.gradeUuid || ''}
              onChange={(e) => setValue('gradeUuid', e.target.value)}
              error={errors.gradeUuid?.message}
              fullWidth
              disabled={loadingData}
            />
          </div>

          <div className={styles.field}>
            <Input
              label="Nome da Turma"
              placeholder="Ex: Turma A, 11ª A, Matutino"
              leftIcon={<Users size={16} />}
              value={watchedValues.name || ''}
              onChange={(e) => setValue('name', e.target.value)}
              error={errors.name?.message}
              fullWidth
              helpText="Nome único para identificar a turma"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Turno</label>
            <div className={styles.shiftOptions}>
              {SHIFT_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedShift === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`${styles.shiftOption} ${isSelected ? styles.selected : ''}`}
                    onClick={() => setValue('shift', option.value as any)}
                  >
                    <Icon size={18} className={isSelected ? styles.selectedIcon : ''} />
                    <span>{option.label}</span>
                    {isSelected && <CheckCircle size={14} className={styles.checkIcon} />}
                  </button>
                );
              })}
            </div>
            {errors.shift && (
              <span className={styles.errorMessage}>{errors.shift.message}</span>
            )}
          </div>

          <div className={styles.field}>
            <Input
              label="Capacidade"
              type="number"
              placeholder="Ex: 30"
              leftIcon={<User size={16} />}
              value={watchedValues.capacity || ''}
              onChange={(e) => setValue('capacity', e.target.value)}
              error={errors.capacity?.message}
              fullWidth
              helpText="Número máximo de alunos por turma"
            />
          </div>

          <div className={styles.field}>
            <Input
              label="Sala"
              placeholder="Ex: Sala 101, Bloco A"
              leftIcon={<Building2 size={16} />}
              value={watchedValues.room || ''}
              onChange={(e) => setValue('room', e.target.value)}
              error={errors.room?.message}
              fullWidth
              helpText="Opcional: local onde a turma irá lecionar"
            />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>
          <Clock size={16} />
          Status da Turma
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
              <span>Turma Ativa</span>
            </div>
          </label>
          <p className={styles.toggleHelp}>
            Desative para ocultar a turma do sistema
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
          {isEditing ? 'Atualizar' : 'Criar'} Turma
        </Button>
      </div>
    </form>
  );
};