'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Settings,
  BookOpen,
  Layers,
  X,
  CheckCircle,
  Shield,
  Eye,
  EyeOff,
  Zap,
  FileText,
  Calendar,
} from 'lucide-react';
import { Input } from '@/shared/components/ui/Input/Input';
import { Select } from '@/shared/components/ui/Select/Select';
import { Button } from '@/shared/components/ui/Button/Button';
import { useToast } from '@/shared/contexts/ToastContext';
import { useLoading } from '@/shared/contexts/LoadingContext';
import { programSettingService } from '../services/program-setting.service';
import { programService } from '@/features/academic/programs/services/program.service';
import type { ProgramAcademicSetting } from '../types/program-setting.types';
import styles from './ProgramSettingForm.module.css';

interface ProgramSettingFormProps {
  setting?: ProgramAcademicSetting | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const ACADEMIC_PERIODS = ['FIRST', 'SECOND', 'THIRD', 'FOURTH'] as const;
type AcademicPeriod = typeof ACADEMIC_PERIODS[number];

interface Period {
  academicPeriod: AcademicPeriod;
  displayName: string;
}

const createSchema = z.object({
  programUuid: z.string().min(1, 'Programa é obrigatório'),
  periodCount: z.string().min(1, 'Número de períodos é obrigatório'),
  assessmentWorkflow: z.string().min(1, 'Fluxo de avaliação é obrigatório'),
  publishMode: z.string().min(1, 'Modo de publicação é obrigatório'),
  allowStudentViewBeforePublication: z.boolean().default(false),
  allowTeacherEditAfterSubmission: z.boolean().default(false),
  periods: z.array(z.object({
    academicPeriod: z.enum(['FIRST', 'SECOND', 'THIRD', 'FOURTH']),
    displayName: z.string().min(1, 'Nome do período é obrigatório'),
  })).min(1, 'Pelo menos um período é obrigatório'),
});

const updateSchema = z.object({
  programUuid: z.string().min(1, 'Programa é obrigatório'),
  periodCount: z.string().min(1, 'Número de períodos é obrigatório').optional(),
  assessmentWorkflow: z.string().min(1, 'Fluxo de avaliação é obrigatório').optional(),
  publishMode: z.string().min(1, 'Modo de publicação é obrigatório').optional(),
  allowStudentViewBeforePublication: z.boolean().optional(),
  allowTeacherEditAfterSubmission: z.boolean().optional(),
  periods: z.array(z.object({
    academicPeriod: z.enum(['FIRST', 'SECOND', 'THIRD', 'FOURTH']),
    displayName: z.string().min(1, 'Nome do período é obrigatório'),
  })).min(1, 'Pelo menos um período é obrigatório').optional(),
});

type CreateFormData = z.infer<typeof createSchema>;
type UpdateFormData = z.infer<typeof updateSchema>;

// Função auxiliar para converter para booleano
const toBoolean = (value: any): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    return lower === '1' || lower === 'true' || lower === 'yes' || lower === 'on';
  }
  return false;
};

const getDefaultPeriodName = (index: number): string => {
  const names = ['1º Período', '2º Período', '3º Período', '4º Período'];
  return names[index] || `${index + 1}º Período`;
};

const generatePeriods = (count: number, existingPeriods?: Period[]): Period[] => {
  const periodKeys = ACADEMIC_PERIODS.slice(0, count);
  return periodKeys.map((key, index) => {
    const existing = existingPeriods?.find(p => p.academicPeriod === key);
    return {
      academicPeriod: key,
      displayName: existing?.displayName || getDefaultPeriodName(index),
    };
  });
};

export const ProgramSettingForm: React.FC<ProgramSettingFormProps> = ({
  setting,
  onSuccess,
  onCancel,
}) => {
  const isEditing = !!setting;
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [programs, setPrograms] = useState<{ id: number; uuid: string; name: string; code: string }[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [selectedPeriodCount, setSelectedPeriodCount] = useState(3);
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

  useEffect(() => {
    if (isEditing && setting) {
      const programUuid = setting.program?.uuid || setting.programUuid || '';
      const existingPeriods = setting.periods || [];
      const count = setting.periodCount || 3;
      const newPeriods = generatePeriods(count, existingPeriods);
      setPeriods(newPeriods);
      setSelectedPeriodCount(count);
    } else {
      const newPeriods = generatePeriods(3);
      setPeriods(newPeriods);
      setSelectedPeriodCount(3);
    }
  }, [isEditing, setting]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<CreateFormData | UpdateFormData>({
    resolver: zodResolver(isEditing ? updateSchema : createSchema),
    defaultValues: isEditing && setting ? {
      programUuid: setting.program?.uuid || setting.programUuid || '',
      periodCount: String(setting.periodCount || 3),
      assessmentWorkflow: setting.assessmentWorkflow || 'VALIDATION',
      publishMode: setting.publishMode || 'MANUAL',
      allowStudentViewBeforePublication: setting.allowStudentViewBeforePublication || false,
      allowTeacherEditAfterSubmission: setting.allowTeacherEditAfterSubmission || false,
      periods: generatePeriods(setting.periodCount || 3, setting.periods || []),
    } : {
      programUuid: '',
      periodCount: '3',
      assessmentWorkflow: 'VALIDATION',
      publishMode: 'MANUAL',
      allowStudentViewBeforePublication: false,
      allowTeacherEditAfterSubmission: false,
      periods: generatePeriods(3),
    },
  });

  useEffect(() => {
    if (isEditing && setting) {
      const defaultValues = {
        programUuid: setting.program?.uuid || setting.programUuid || '',
        periodCount: String(setting.periodCount || 3),
        assessmentWorkflow: setting.assessmentWorkflow || 'VALIDATION',
        publishMode: setting.publishMode || 'MANUAL',
        allowStudentViewBeforePublication: setting.allowStudentViewBeforePublication || false,
        allowTeacherEditAfterSubmission: setting.allowTeacherEditAfterSubmission || false,
        periods: generatePeriods(setting.periodCount || 3, setting.periods || []),
      };
      reset(defaultValues);
    }
  }, [isEditing, setting, reset]);

  const handlePeriodCountChange = (value: string) => {
    const count = parseInt(value, 10);
    setSelectedPeriodCount(count);
    const newPeriods = generatePeriods(count);
    setPeriods(newPeriods);
    setValue('periods', newPeriods as any);
  };

  const handlePeriodNameChange = (index: number, value: string) => {
    const updatedPeriods = [...periods];
    updatedPeriods[index] = {
      ...updatedPeriods[index],
      displayName: value,
    };
    setPeriods(updatedPeriods);
    setValue('periods', updatedPeriods as any);
  };

  const onSubmit = async (data: CreateFormData | UpdateFormData) => {
    console.log('🚀 onSubmit chamado com dados:', data);
    
    try {
      setIsSubmitting(true);
      startLoading();

      if (!data.programUuid || data.programUuid === '') {
        showError('Erro', 'Selecione um programa');
        setIsSubmitting(false);
        stopLoading();
        return;
      }

      const periodsData = (data.periods || periods) as Period[];
      
      const emptyPeriods = periodsData.some(p => !p.displayName || p.displayName.trim() === '');
      if (emptyPeriods) {
        showError('Erro', 'Todos os períodos devem ter um nome');
        setIsSubmitting(false);
        stopLoading();
        return;
      }

      const periodCount = parseInt(data.periodCount || '3', 10);
      if (periodsData.length !== periodCount) {
        showError('Erro', 'A quantidade de períodos não corresponde ao número selecionado');
        setIsSubmitting(false);
        stopLoading();
        return;
      }

      // CORREÇÃO: Usar a função toBoolean para converter valores booleanos
      const payload: any = {
        programUuid: data.programUuid,
        periodCount: periodCount,
        assessmentWorkflow: data.assessmentWorkflow,
        publishMode: data.publishMode,
        allowStudentViewBeforePublication: toBoolean(data.allowStudentViewBeforePublication),
        allowTeacherEditAfterSubmission: toBoolean(data.allowTeacherEditAfterSubmission),
        periods: periodsData.map(p => ({
          academicPeriod: p.academicPeriod,
          displayName: p.displayName.trim(),
        })),
      };

      console.log('📤 Payload final enviado:', JSON.stringify(payload, null, 2));

      let response;
      if (isEditing && setting) {
        response = await programSettingService.update(setting.uuid, payload);
        showSuccess('Configuração atualizada', `Configuração de ${response.program?.name || 'programa'} foi atualizada`);
      } else {
        response = await programSettingService.create(payload);
        showSuccess('Configuração criada', `Configuração de ${response.program?.name || 'programa'} foi criada`);
      }

      onSuccess();
    } catch (error: any) {
      console.error('❌ Erro ao salvar configuração:', error);
      console.error('❌ Detalhes do erro:', error.response?.data);
      
      let errorMessage = 'Erro ao salvar configuração. Tente novamente.';
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

  // Função para submeter diretamente (fallback)
  const handleDirectSubmit = async () => {
    console.log('🔘 handleDirectSubmit chamado');
    
    const data = {
      programUuid: watchedValues.programUuid || '',
      periodCount: watchedValues.periodCount || '3',
      assessmentWorkflow: watchedValues.assessmentWorkflow || 'VALIDATION',
      publishMode: watchedValues.publishMode || 'MANUAL',
      allowStudentViewBeforePublication: watchedValues.allowStudentViewBeforePublication || false,
      allowTeacherEditAfterSubmission: watchedValues.allowTeacherEditAfterSubmission || false,
      periods: periods,
    };
    
    console.log('📊 Dados coletados para submit direto:', data);
    await onSubmit(data as any);
  };

  const programOptions = programs.map(p => ({
    value: p.uuid,
    label: `${p.name} (${p.code})`,
  }));

  const workflowOptions = [
    { value: 'DIRECT', label: 'Avaliação direta' },
    { value: 'SUBMISSION', label: 'Submissão' },
    { value: 'VALIDATION', label: 'Submissão + Validação' },
  ];

  const publishOptions = [
    { value: 'MANUAL', label: 'Publicação manual' },
    { value: 'AUTOMATIC', label: 'Publicação automática' },
  ];

  const periodCountOptions = [
    { value: '1', label: '1 Período' },
    { value: '2', label: '2 Períodos' },
    { value: '3', label: '3 Períodos' },
    { value: '4', label: '4 Períodos' },
  ];

  const watchedValues = watch();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>
          <Settings size={16} />
          Configuração Académica
        </h4>

        <div className={styles.fields}>
          <div className={styles.field}>
            <Select
              label="Programa"
              options={programOptions}
              placeholder={loadingPrograms ? 'Carregando...' : 'Selecione um programa'}
              value={watchedValues.programUuid || ''}
              onChange={(e) => setValue('programUuid', e.target.value)}
              error={errors.programUuid?.message}
              fullWidth
              disabled={loadingPrograms || isEditing}
            />
            {isEditing && (
              <p className={styles.fieldHint}>O programa não pode ser alterado após a criação</p>
            )}
          </div>

          <div className={styles.field}>
            <Select
              label="Número de Períodos"
              options={periodCountOptions}
              value={watchedValues.periodCount || '3'}
              onChange={(e) => {
                setValue('periodCount', e.target.value);
                handlePeriodCountChange(e.target.value);
              }}
              error={errors.periodCount?.message}
              fullWidth
            />
          </div>

          <div className={styles.field}>
            <Select
              label="Fluxo de Avaliação"
              options={workflowOptions}
              value={watchedValues.assessmentWorkflow || 'VALIDATION'}
              onChange={(e) => setValue('assessmentWorkflow', e.target.value)}
              error={errors.assessmentWorkflow?.message}
              fullWidth
            />
          </div>

          <div className={styles.field}>
            <Select
              label="Modo de Publicação"
              options={publishOptions}
              value={watchedValues.publishMode || 'MANUAL'}
              onChange={(e) => setValue('publishMode', e.target.value)}
              error={errors.publishMode?.message}
              fullWidth
            />
          </div>
        </div>
      </div>

      {/* Períodos Académicos */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>
          <Calendar size={16} />
          Períodos Académicos
        </h4>
        <p className={styles.sectionDescription}>
          Configure os nomes dos períodos académicos.
        </p>

        <div className={styles.periodsContainer}>
          {periods.map((period, index) => (
            <div key={period.academicPeriod} className={styles.periodItem}>
              <div className={styles.periodHeader}>
                <span className={styles.periodBadge}>{period.academicPeriod}</span>
                <span className={styles.periodLabel}>Período {index + 1}</span>
              </div>
              <div className={styles.periodField}>
                <Input
                  label="Nome do período"
                  placeholder={`Ex: ${getDefaultPeriodName(index)}`}
                  value={period.displayName}
                  onChange={(e) => handlePeriodNameChange(index, e.target.value)}
                  error={!period.displayName?.trim() ? 'Nome é obrigatório' : undefined}
                  fullWidth
                />
              </div>
            </div>
          ))}
        </div>

        {errors.periods && (
          <span className={styles.errorMessage}>{errors.periods.message}</span>
        )}
      </div>

      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>
          <Shield size={16} />
          Permissões
        </h4>

        <div className={styles.toggleGroup}>
          <label className={styles.toggleItem}>
            <input
              type="checkbox"
              checked={watchedValues.allowStudentViewBeforePublication || false}
              onChange={(e) => setValue('allowStudentViewBeforePublication', e.target.checked)}
            />
            <div className={styles.toggleContent}>
              <Eye size={16} />
              <span>Permitir ao aluno visualizar antes da publicação</span>
            </div>
          </label>

          <label className={styles.toggleItem}>
            <input
              type="checkbox"
              checked={watchedValues.allowTeacherEditAfterSubmission || false}
              onChange={(e) => setValue('allowTeacherEditAfterSubmission', e.target.checked)}
            />
            <div className={styles.toggleContent}>
              <Zap size={16} />
              <span>Permitir ao professor editar depois da submissão</span>
            </div>
          </label>
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
          type="button"
          onClick={handleDirectSubmit}
          isLoading={isSubmitting}
          icon={<CheckCircle size={18} />}
        >
          {isEditing ? 'Atualizar' : 'Criar'} Configuração
        </Button>
      </div>
    </form>
  );
};