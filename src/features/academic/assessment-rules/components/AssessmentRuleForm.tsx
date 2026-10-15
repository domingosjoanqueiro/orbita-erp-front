// src/features/academic/assessment-rules/components/AssessmentRuleForm.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    X,
    CheckCircle,
    Hash,
    FileText,
    Weight,
    Award,
    AlignLeft,
    Shield,
} from 'lucide-react';
import { Input } from '@/shared/components/ui/Input/Input';
import { Select } from '@/shared/components/ui/Select/Select';
import { Textarea } from '@/shared/components/ui/Textarea/Textarea';
import { Button } from '@/shared/components/ui/Button/Button';
import { Badge } from '@/shared/components/ui/Badge/Badge';
import { useToast } from '@/shared/contexts/ToastContext';
import { useLoading } from '@/shared/contexts/LoadingContext';
import { getApiErrorMessage, getApiFieldErrors } from '@/shared/utils/api.utils';
import { assessmentRuleService } from '../services/assessment-rule.service';
import type {
    AssessmentRule,
    CreateAssessmentRuleRequest,
    ProgramOption,
    WeightSummary,
} from '../types/assessment-rule.types';
import styles from './AssessmentRuleForm.module.css';

interface AssessmentRuleFormProps {
    onSuccess: () => void;
    onCancel: () => void;
    ruleToEdit?: AssessmentRule | null;
    isEditing?: boolean;
}

// Espelha createAssessmentRuleValidator do backend
const schema = z.object({
    programUuid: z.string().min(1, 'Programa é obrigatório'),
    code: z.string().trim().min(2, 'Código deve ter no mínimo 2 caracteres').max(20, 'Código deve ter no máximo 20 caracteres'),
    name: z.string().trim().min(2, 'Nome deve ter no mínimo 2 caracteres').max(150, 'Nome deve ter no máximo 150 caracteres'),
    sequence: z.number({ message: 'Sequência é obrigatória' }).int('A sequência deve ser um número inteiro').min(1, 'A sequência deve ser maior que zero'),
    weight: z.number({ message: 'Peso é obrigatório' }).gt(0, 'O peso deve ser maior que zero').max(100, 'O peso não pode ultrapassar 100%'),
    maximumScore: z.number({ message: 'Nota máxima é obrigatória' }).gt(0, 'A nota máxima deve ser maior que zero').max(20, 'A nota máxima deve ser menor ou igual a 20'),
    description: z.string().max(1000, 'Descrição deve ter no máximo 1000 caracteres'),
    isActive: z.boolean(),
});

type FormData = z.infer<typeof schema>;

const FORM_FIELDS: (keyof FormData)[] = ['programUuid', 'code', 'name', 'sequence', 'weight', 'maximumScore', 'description', 'isActive'];

const toNumber = (value: string): number => (value === '' ? Number.NaN : Number(value));

export const AssessmentRuleForm: React.FC<AssessmentRuleFormProps> = ({
    onSuccess,
    onCancel,
    ruleToEdit,
    isEditing = false,
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [programs, setPrograms] = useState<ProgramOption[]>([]);
    const [weightSummary, setWeightSummary] = useState<WeightSummary | null>(null);
    const [isLoadingPrograms, setIsLoadingPrograms] = useState(false);

    const { showSuccess, showError } = useToast();
    const { startLoading, stopLoading } = useLoading();

    const {
        handleSubmit,
        formState: { errors },
        watch,
        setValue,
        setError,
        reset,
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            programUuid: '',
            code: '',
            name: '',
            sequence: Number.NaN,
            weight: Number.NaN,
            maximumScore: 20,
            description: '',
            isActive: true,
        },
    });

    const watchedProgram = watch('programUuid');
    const watchedWeight = watch('weight');
    const watchedActive = watch('isActive');

    // ✅ Carregar programas
    useEffect(() => {
        const loadPrograms = async () => {
            try {
                setIsLoadingPrograms(true);
                const data = await assessmentRuleService.getPrograms();
                setPrograms(data || []);
            } catch (error) {
                showError('Erro', getApiErrorMessage(error, 'Não foi possível carregar os programas'));
            } finally {
                setIsLoadingPrograms(false);
            }
        };
        loadPrograms();
    }, []);

    // ✅ Carregar resumo de pesos quando o programa mudar
    useEffect(() => {
        if (!watchedProgram) {
            setWeightSummary(null);
            return;
        }
        let cancelled = false;
        assessmentRuleService
            .getWeightSummary(watchedProgram)
            .then(summary => {
                if (!cancelled) setWeightSummary(summary);
            })
            .catch(() => {
                if (!cancelled) setWeightSummary(null);
            });
        return () => {
            cancelled = true;
        };
    }, [watchedProgram]);

    // ✅ Preencher formulário para edição
    useEffect(() => {
        if (isEditing && ruleToEdit) {
            reset({
                programUuid: ruleToEdit.programUuid || '',
                code: ruleToEdit.code || '',
                name: ruleToEdit.name || '',
                sequence: Number(ruleToEdit.sequence),
                weight: Number(ruleToEdit.weight),
                maximumScore: Number(ruleToEdit.maximumScore) || 20,
                description: ruleToEdit.description || '',
                isActive: Boolean(ruleToEdit.isActive),
            });
        }
    }, [isEditing, ruleToEdit, reset]);

    // Soma das outras regras ativas do programa (exclui a própria regra em edição)
    const otherRulesWeight = (() => {
        if (!weightSummary) return 0;
        const ownWeight =
            isEditing && ruleToEdit && ruleToEdit.isActive && ruleToEdit.programUuid === watchedProgram
                ? Number(ruleToEdit.weight)
                : 0;
        return Number((weightSummary.totalWeight - ownWeight).toFixed(2));
    })();

    const projectedWeight = Number(
        (otherRulesWeight + (watchedActive && Number.isFinite(watchedWeight) ? watchedWeight : 0)).toFixed(2)
    );
    const projectedExceeds = projectedWeight > 100;
    const projectedRemaining = Number(Math.max(0, 100 - projectedWeight).toFixed(2));

    const onSubmit = async (data: FormData) => {
        if (isSubmitting) return;

        try {
            setIsSubmitting(true);
            startLoading();

            const payload: CreateAssessmentRuleRequest = {
                programUuid: data.programUuid,
                code: data.code.trim().toUpperCase(),
                name: data.name.trim(),
                sequence: data.sequence,
                weight: data.weight,
                maximumScore: data.maximumScore,
                // O backend aceita string vazia ou null; envia-se sempre string
                description: data.description.trim(),
                isActive: data.isActive,
            };

            if (isEditing && ruleToEdit) {
                await assessmentRuleService.update(ruleToEdit.uuid, payload);
                showSuccess('Regra atualizada', 'Regra de avaliação atualizada com sucesso');
            } else {
                await assessmentRuleService.create(payload);
                showSuccess('Regra criada', 'Regra de avaliação criada com sucesso');
            }

            onSuccess();
        } catch (error) {
            const fieldErrors = getApiFieldErrors(error);
            Object.entries(fieldErrors).forEach(([field, message]) => {
                if ((FORM_FIELDS as string[]).includes(field)) {
                    setError(field as keyof FormData, { type: 'server', message });
                }
            });
            showError('Erro', getApiErrorMessage(error, 'Erro ao guardar a regra de avaliação. Tente novamente.'));
        } finally {
            setIsSubmitting(false);
            stopLoading();
        }
    };

    const programOptions = programs.map(p => ({
        value: p.uuid,
        label: `${p.name} (${p.code})`,
    }));

    const numberValue = (value: number) => (Number.isFinite(value) ? value : '');

    return (
        <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className={styles.content}>
                {/* Programa */}
                <div className={styles.field}>
                    <Select
                        label="Programa *"
                        options={[
                            { value: '', label: 'Selecione um programa...' },
                            ...programOptions,
                        ]}
                        value={watchedProgram || ''}
                        onChange={(e) => setValue('programUuid', e.target.value, { shouldValidate: true })}
                        error={errors.programUuid?.message}
                        fullWidth
                        disabled={isLoadingPrograms || isEditing}
                    />
                    {isEditing && (
                        <p className={styles.fieldHint}>Programa não pode ser alterado na edição</p>
                    )}
                </div>

                {/* Código e Nome */}
                <div className={styles.field}>
                    <Input
                        label="Código *"
                        placeholder="Ex: AVAL01"
                        leftIcon={<Hash size={16} />}
                        value={watch('code') || ''}
                        onChange={(e) => setValue('code', e.target.value.toUpperCase(), { shouldValidate: !!errors.code })}
                        error={errors.code?.message}
                        maxLength={20}
                        fullWidth
                    />
                </div>

                <div className={styles.field}>
                    <Input
                        label="Nome *"
                        placeholder="Ex: Avaliação Contínua"
                        leftIcon={<FileText size={16} />}
                        value={watch('name') || ''}
                        onChange={(e) => setValue('name', e.target.value, { shouldValidate: !!errors.name })}
                        error={errors.name?.message}
                        maxLength={150}
                        fullWidth
                    />
                </div>

                {/* Sequência e Peso */}
                <div className={styles.field}>
                    <Input
                        label="Sequência *"
                        type="number"
                        min={1}
                        step={1}
                        placeholder="Ex: 1"
                        leftIcon={<Hash size={16} />}
                        value={numberValue(watch('sequence'))}
                        onChange={(e) => setValue('sequence', toNumber(e.target.value), { shouldValidate: !!errors.sequence })}
                        error={errors.sequence?.message}
                        fullWidth
                    />
                    <p className={styles.fieldHint}>Ordem de exibição das regras (única no programa)</p>
                </div>

                <div className={styles.field}>
                    <Input
                        label="Peso (%) *"
                        type="number"
                        min={0.01}
                        max={100}
                        step={0.01}
                        placeholder="Ex: 40"
                        leftIcon={<Weight size={16} />}
                        value={numberValue(watchedWeight)}
                        onChange={(e) => setValue('weight', toNumber(e.target.value), { shouldValidate: !!errors.weight })}
                        error={errors.weight?.message}
                        fullWidth
                    />
                    <p className={styles.fieldHint}>Percentual de peso para esta avaliação</p>
                </div>

                {/* Nota Máxima */}
                <div className={styles.field}>
                    <Input
                        label="Nota Máxima *"
                        type="number"
                        min={0.5}
                        max={20}
                        step={0.5}
                        placeholder="Ex: 20"
                        leftIcon={<Award size={16} />}
                        value={numberValue(watch('maximumScore'))}
                        onChange={(e) => setValue('maximumScore', toNumber(e.target.value), { shouldValidate: !!errors.maximumScore })}
                        error={errors.maximumScore?.message}
                        fullWidth
                    />
                    <p className={styles.fieldHint}>Valor máximo da nota para esta avaliação (até 20)</p>
                </div>

                {/* Descrição */}
                <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                    <Textarea
                        label="Descrição"
                        placeholder="Descrição detalhada da regra de avaliação"
                        leftIcon={<AlignLeft size={16} />}
                        value={watch('description') || ''}
                        onChange={(e) => setValue('description', e.target.value, { shouldValidate: !!errors.description })}
                        error={errors.description?.message}
                        maxLength={1000}
                        fullWidth
                        rows={3}
                    />
                </div>

                {/* Ativo */}
                <div className={styles.field}>
                    <label className={styles.toggleLabel}>
                        <input
                            type="checkbox"
                            checked={watchedActive !== false}
                            onChange={(e) => setValue('isActive', e.target.checked)}
                        />
                        <span>Ativo</span>
                    </label>
                    <p className={styles.toggleHelp}>
                        Só as regras ativas contam para a soma dos pesos e para o cálculo das pautas
                    </p>
                </div>

                {/* Resumo de Pesos */}
                {watchedProgram && weightSummary && (
                    <div className={styles.weightSummary}>
                        <div className={styles.weightSummaryHeader}>
                            <Shield size={18} />
                            <span>Resumo de Pesos do Programa</span>
                        </div>
                        <div className={styles.weightSummaryGrid}>
                            <div className={styles.weightSummaryItem}>
                                <span className={styles.weightSummaryLabel}>Regras Ativas</span>
                                <span className={styles.weightSummaryValue}>
                                    {weightSummary.rulesCount}
                                </span>
                            </div>
                            <div className={styles.weightSummaryItem}>
                                <span className={styles.weightSummaryLabel}>Outras Regras</span>
                                <span className={styles.weightSummaryValue}>
                                    {otherRulesWeight}%
                                </span>
                            </div>
                            <div className={styles.weightSummaryItem}>
                                <span className={styles.weightSummaryLabel}>Total com esta regra</span>
                                <span className={styles.weightSummaryValue}>
                                    {projectedWeight}%
                                </span>
                            </div>
                            <div className={styles.weightSummaryItem}>
                                <span className={styles.weightSummaryLabel}>Status</span>
                                <span className={styles.weightSummaryValue}>
                                    {projectedExceeds ? (
                                        <Badge variant="error" size="sm">
                                            Excede 100%
                                        </Badge>
                                    ) : projectedWeight === 100 ? (
                                        <Badge variant="success" size="sm">
                                            <CheckCircle size={10} />
                                            100% Completo
                                        </Badge>
                                    ) : (
                                        <Badge variant="warning" size="sm">
                                            Faltam {projectedRemaining}%
                                        </Badge>
                                    )}
                                </span>
                            </div>
                        </div>
                        {projectedExceeds && (
                            <p className={styles.weightSummaryWarning}>
                                ⚠️ A soma dos pesos das regras ativas não pode ultrapassar 100%. Reduza o peso ou guarde a regra como inativa.
                            </p>
                        )}
                        {!projectedExceeds && projectedWeight < 100 && (
                            <p className={styles.weightSummaryHint}>
                                ℹ️ Faltam {projectedRemaining}% para o programa atingir 100%.
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className={styles.actions}>
                <div className={styles.actionsLeft}>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onCancel}
                        icon={<X size={18} />}
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </Button>
                </div>
                <div className={styles.actionsRight}>
                    <Button
                        type="submit"
                        variant="primary"
                        icon={<CheckCircle size={18} />}
                        isLoading={isSubmitting}
                        disabled={isSubmitting}
                    >
                        {isEditing ? 'Atualizar Regra' : 'Criar Regra'}
                    </Button>
                </div>
            </div>
        </form>
    );
};
