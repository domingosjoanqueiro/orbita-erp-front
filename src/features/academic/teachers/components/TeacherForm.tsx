'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import {
    User,
    X,
    CheckCircle,
    Mail,
    Phone,
    Calendar,
    FileText,
    Briefcase,
    Award,
    Shield,
    AlertCircle,
    ChevronRight,
    ChevronLeft,
} from 'lucide-react';
import { Input } from '@/shared/components/ui/Input/Input';
import { Select } from '@/shared/components/ui/Select/Select';
import { Textarea } from '@/shared/components/ui/Textarea/Textarea';
import { Button } from '@/shared/components/ui/Button/Button';
import { useToast } from '@/shared/contexts/ToastContext';
import { useLoading } from '@/shared/contexts/LoadingContext';
import { teacherService } from '../services/teacher.service';
import { academicAccessSettingsService } from '@/features/academic/academic-access-settings/services/academic-access-settings.service';
import { roleService } from '@/features/identity/roles/services/role.service';
import { CredentialsDisplay } from '@/features/academic/shared/components/CredentialsDisplay';
import { DOCUMENT_TYPE_OPTIONS } from '@/shared/constants/document-types';
import { toDateInputValue } from '@/shared/utils/date.utils';
import { getApiErrorMessage, getApiFieldErrors } from '@/shared/utils/api.utils';
import type { Teacher, DocumentType } from '../types/teacher.types';
import type { Role } from '@/features/identity/roles/types/role.types';
import styles from './TeacherForm.module.css';

interface TeacherFormProps {
    teacher?: Teacher | null;
    onSuccess: () => void;
    onCancel: () => void;
}

// ✅ Tipos do formulário
interface TeacherFormData {
    firstName: string;
    middleName: string | null;
    lastName: string;
    gender: 'MALE' | 'FEMALE';
    birthDate: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    documentType: DocumentType | null; // ✅ Usando o tipo DocumentType do backend
    documentNumber: string | null;
    hireDate: string;
    specialization: string | null;
    isActive: boolean;
}

// Step configuration
interface Step {
    id: string;
    title: string;
    icon: React.FC<{ size?: number; className?: string }>;
    description: string;
}

const STEPS: Step[] = [
    {
        id: 'personal',
        title: 'Dados Pessoais',
        icon: User,
        description: 'Informações básicas do professor',
    },
    {
        id: 'contact',
        title: 'Contactos',
        icon: Phone,
        description: 'Dados de contacto e documentação',
    },
    {
        id: 'professional',
        title: 'Dados Profissionais',
        icon: Briefcase,
        description: 'Informações profissionais',
    },
    {
        id: 'access',
        title: 'Acesso ao Sistema',
        icon: Shield,
        description: 'Perfil de acesso do professor',
    },
];

const FIELD_LABELS: Record<string, string> = {
    firstName: 'Nome',
    middleName: 'Nome do meio',
    lastName: 'Apelido',
    gender: 'Género',
    birthDate: 'Data de nascimento',
    phone: 'Telefone',
    email: 'Email',
    documentType: 'Tipo de documento',
    documentNumber: 'Número do documento',
    hireDate: 'Data de contratação',
    specialization: 'Especialização',
    address: 'Endereço',
};

// Passo de cada campo (para voltar ao passo com erro devolvido pela API)
const FIELD_STEP: Record<string, number> = {
    firstName: 0, middleName: 0, lastName: 0, gender: 0, birthDate: 0,
    phone: 1, email: 1, documentType: 1, documentNumber: 1, address: 1,
    hireDate: 2, specialization: 2,
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const TeacherForm: React.FC<TeacherFormProps> = ({
    teacher,
    onSuccess,
    onCancel,
}) => {
    const router = useRouter();
    const isEditing = !!teacher;
    // Na edição não há passo de acesso (o acesso gere-se nos detalhes do professor)
    const steps = isEditing ? STEPS.filter(step => step.id !== 'access') : STEPS;
    const accessStep = steps.findIndex(step => step.id === 'access');
    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [teacherRole, setTeacherRole] = useState<Role | null>(null);
    const [isLoadingConfig, setIsLoadingConfig] = useState(!isEditing);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [credentials, setCredentials] = useState<{ name: string; username: string; temporaryPassword: string } | null>(null);
    const { showSuccess, showError, showWarning } = useToast();
    const { startLoading, stopLoading } = useLoading();

    // Role configurada para professores (só é precisa para criar)
    useEffect(() => {
        if (isEditing) return;
        const loadConfig = async () => {
            try {
                setIsLoadingConfig(true);
                const [rolesResponse, config] = await Promise.all([
                    roleService.getAll({ limit: 100 }),
                    academicAccessSettingsService.getAcademicSettings(),
                ]);
                const found = config.teacherRoleId
                    ? (rolesResponse.data || []).find(r => r.id === config.teacherRoleId)
                    : null;
                setTeacherRole(found || null);
            } catch {
                showError('Erro', 'Não foi possível carregar a configuração académica');
            } finally {
                setIsLoadingConfig(false);
            }
        };
        loadConfig();
    }, [isEditing]); // eslint-disable-line react-hooks/exhaustive-deps

    const {
        handleSubmit,
        watch,
        setValue: setFormValue,
    } = useForm<TeacherFormData>({
        defaultValues: {
            firstName: teacher?.firstName || '',
            middleName: teacher?.middleName || null,
            lastName: teacher?.lastName || '',
            gender: teacher?.gender || 'MALE',
            birthDate: toDateInputValue(teacher?.birthDate),
            phone: teacher?.phone || null,
            email: teacher?.email || null,
            address: teacher?.address || null,
            documentType: (teacher?.documentType as DocumentType) || null,
            documentNumber: teacher?.documentNumber || null,
            hireDate: toDateInputValue(teacher?.hireDate),
            specialization: teacher?.specialization || '',
            isActive: teacher?.isActive ?? true,
        },
    });

    const watchedValues = watch();

    // Ao corrigir um campo o erro desaparece
    const setValue = <K extends keyof TeacherFormData>(field: K, value: TeacherFormData[K]) => {
        setFormValue(field, value as never);
        if (fieldErrors[field]) {
            setFieldErrors(prev => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    };

    const validateStep = (step: number): Record<string, string> => {
        const v = watchedValues;
        const found: Record<string, string> = {};
        const today = toDateInputValue(new Date());
        if (steps[step]?.id === 'personal') {
            if (!v.firstName?.trim() || v.firstName.trim().length < 2) found.firstName = 'Nome é obrigatório (mínimo 2 letras)';
            if (!v.lastName?.trim() || v.lastName.trim().length < 2) found.lastName = 'Apelido é obrigatório (mínimo 2 letras)';
            if (!v.gender) found.gender = 'Género é obrigatório';
            if (!v.birthDate) found.birthDate = 'Data de nascimento é obrigatória';
            else if (v.birthDate > today) found.birthDate = 'A data de nascimento não pode ser futura';
        }
        if (steps[step]?.id === 'contact') {
            if (v.email && !EMAIL_PATTERN.test(v.email.trim())) found.email = 'Email inválido';
            if (v.documentType && !v.documentNumber?.trim()) found.documentNumber = 'Indique o número do documento';
            if (!v.documentType && v.documentNumber?.trim()) found.documentType = 'Indique o tipo de documento';
        }
        if (steps[step]?.id === 'professional') {
            if (!v.hireDate) found.hireDate = 'Data de contratação é obrigatória';
            else if (v.birthDate && v.hireDate < v.birthDate) found.hireDate = 'Não pode ser anterior à data de nascimento';
        }
        return found;
    };

    const handleNext = async () => {
        if (currentStep === accessStep && !teacherRole) {
            showError('Configuração necessária', 'A Role de Professor ainda não foi configurada para esta empresa.');
            return;
        }

        const stepErrors = validateStep(currentStep);
        if (Object.keys(stepErrors).length > 0) {
            setFieldErrors(stepErrors);
            showError('Verifique os campos', Object.values(stepErrors)[0]);
            return;
        }

        if (currentStep === steps.length - 1) {
            handleSubmit(onSubmit)();
        } else {
            setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
        }
    };

    const handlePrevious = () => {
        setCurrentStep(prev => Math.max(prev - 1, 0));
    };

    const onSubmit = async (data: TeacherFormData) => {
        // garante que os passos anteriores continuam válidos
        for (let step = 0; step < steps.length; step++) {
            const stepErrors = validateStep(step);
            if (Object.keys(stepErrors).length > 0) {
                setFieldErrors(stepErrors);
                setCurrentStep(step);
                showError('Verifique os campos', Object.values(stepErrors)[0]);
                return;
            }
        }

        try {
            setIsSubmitting(true);
            startLoading();

            const payload = {
                firstName: data.firstName.trim(),
                middleName: data.middleName?.trim() || null,
                lastName: data.lastName.trim(),
                gender: data.gender,
                birthDate: data.birthDate,
                phone: data.phone?.trim() || null,
                email: data.email?.trim() || null,
                address: data.address?.trim() || null,
                documentType: data.documentType || null,
                documentNumber: data.documentNumber?.trim() || null,
                hireDate: data.hireDate,
                specialization: data.specialization?.trim() || null,
            };

            if (isEditing && teacher) {
                const response = await teacherService.update(teacher.uuid, payload);
                showSuccess('Professor atualizado', `${response.fullName} foi atualizado.`);
                onSuccess();
                return;
            }

            const response = await teacherService.create({ ...payload, isActive: data.isActive });
            if (response.portal) {
                showSuccess('Professor criado', `${response.fullName} foi registado com acesso ao sistema.`);
                setCredentials({ name: response.fullName, username: response.portal.username, temporaryPassword: response.portal.temporaryPassword });
            } else {
                showWarning('Professor criado sem acesso', 'O professor ficou inativo. Crie o acesso nos detalhes depois de o ativar.');
                onSuccess();
            }
        } catch (error) {
            const apiFieldErrors = getApiFieldErrors(error);
            if (Object.keys(apiFieldErrors).length > 0) {
                setFieldErrors(apiFieldErrors);
                const firstField = Object.keys(apiFieldErrors)[0];
                const step = FIELD_STEP[firstField];
                if (step !== undefined && step < steps.length) setCurrentStep(step);
                showError('Verifique os campos', `${FIELD_LABELS[firstField] ?? firstField}: ${apiFieldErrors[firstField]}`);
            } else {
                showError('Erro', getApiErrorMessage(error, 'Erro ao guardar o professor. Tente novamente.'));
            }
        } finally {
            setIsSubmitting(false);
            stopLoading();
        }
    };

    const handleCredentialsClose = () => {
        setCredentials(null);
        onSuccess();
    };

    const renderStep = () => {
        const step = steps[currentStep];
        const StepIcon = step.icon;

        switch (step.id) {
            case 'personal':
                return (
                    <div className={styles.stepContent}>
                        <div className={styles.stepHeader}>
                            <div className={styles.stepIconWrapper}>
                                <StepIcon size={24} />
                            </div>
                            <div>
                                <h3 className={styles.stepTitle}>{step.title}</h3>
                                <p className={styles.stepDescription}>{step.description}</p>
                            </div>
                        </div>

                        <div className={styles.fields}>
                            <div className={styles.field}>
                                <Input
                                    label="Nome *"
                                    placeholder="Ex: João"
                                    leftIcon={<User size={16} />}
                                    value={watchedValues.firstName || ''}
                                    onChange={(e) => setValue('firstName', e.target.value)}
                                    error={fieldErrors.firstName}
                                    fullWidth
                                />
                            </div>

                            <div className={styles.field}>
                                <Input
                                    label="Apelido *"
                                    placeholder="Ex: Silva"
                                    leftIcon={<User size={16} />}
                                    value={watchedValues.lastName || ''}
                                    onChange={(e) => setValue('lastName', e.target.value)}
                                    error={fieldErrors.lastName}
                                    fullWidth
                                />
                            </div>

                            <div className={styles.field}>
                                <Input
                                    label="Nome do Meio"
                                    placeholder="Ex: Carlos"
                                    leftIcon={<User size={16} />}
                                    value={watchedValues.middleName || ''}
                                    onChange={(e) => setValue('middleName', e.target.value)}
                                    error={fieldErrors.middleName}
                                    fullWidth
                                />
                            </div>

                            <div className={styles.field}>
                                <Input
                                    label="Data de Nascimento *"
                                    type="date"
                                    leftIcon={<Calendar size={16} />}
                                    value={watchedValues.birthDate || ''}
                                    onChange={(e) => setValue('birthDate', e.target.value)}
                                    error={fieldErrors.birthDate}
                                    fullWidth
                                />
                            </div>

                            <div className={styles.field}>
                                <Select
                                    label="Género *"
                                    options={[
                                        { value: 'MALE', label: 'Masculino' },
                                        { value: 'FEMALE', label: 'Feminino' },
                                    ]}
                                    value={watchedValues.gender || 'MALE'}
                                    onChange={(e) => setValue('gender', e.target.value as any)}
                                    error={fieldErrors.gender}
                                    fullWidth
                                />
                            </div>
                        </div>
                    </div>
                );

            case 'contact':
                return (
                    <div className={styles.stepContent}>
                        <div className={styles.stepHeader}>
                            <div className={styles.stepIconWrapper}>
                                <StepIcon size={24} />
                            </div>
                            <div>
                                <h3 className={styles.stepTitle}>{step.title}</h3>
                                <p className={styles.stepDescription}>{step.description}</p>
                            </div>
                        </div>

                        <div className={styles.fields}>
                            <div className={styles.field}>
                                <Input
                                    label="Email"
                                    type="email"
                                    placeholder="Ex: professor@email.com"
                                    leftIcon={<Mail size={16} />}
                                    value={watchedValues.email || ''}
                                    onChange={(e) => setValue('email', e.target.value)}
                                    error={fieldErrors.email}
                                    fullWidth
                                />
                            </div>

                            <div className={styles.field}>
                                <Input
                                    label="Telefone"
                                    placeholder="Ex: 84 123 4567"
                                    leftIcon={<Phone size={16} />}
                                    value={watchedValues.phone || ''}
                                    onChange={(e) => setValue('phone', e.target.value)}
                                    error={fieldErrors.phone}
                                    fullWidth
                                />
                            </div>

                            <div className={styles.field}>
                                <Select
                                    label="Tipo de Documento"
                                    options={DOCUMENT_TYPE_OPTIONS}
                                    value={watchedValues.documentType || ''}
                                    onChange={(e) => setValue('documentType', (e.target.value || null) as DocumentType | null)}
                                    error={fieldErrors.documentType}
                                    fullWidth
                                />
                            </div>

                            <div className={styles.field}>
                                <Input
                                    label="Número do Documento"
                                    placeholder="Ex: 123456789"
                                    leftIcon={<FileText size={16} />}
                                    value={watchedValues.documentNumber || ''}
                                    onChange={(e) => setValue('documentNumber', e.target.value)}
                                    error={fieldErrors.documentNumber}
                                    fullWidth
                                />
                            </div>

                            <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                                <Textarea
                                    label="Endereço"
                                    placeholder="Ex: Av. 25 de Setembro, 123"
                                    value={watchedValues.address || ''}
                                    onChange={(e) => setValue('address', e.target.value)}
                                    fullWidth
                                    rows={3}
                                />
                            </div>
                        </div>
                    </div>
                );

            case 'professional':
                return (
                    <div className={styles.stepContent}>
                        <div className={styles.stepHeader}>
                            <div className={styles.stepIconWrapper}>
                                <StepIcon size={24} />
                            </div>
                            <div>
                                <h3 className={styles.stepTitle}>{step.title}</h3>
                                <p className={styles.stepDescription}>{step.description}</p>
                            </div>
                        </div>

                        <div className={styles.fields}>
                            <div className={styles.field}>
                                <Input
                                    label="Data de Contratação *"
                                    type="date"
                                    leftIcon={<Calendar size={16} />}
                                    value={watchedValues.hireDate || ''}
                                    onChange={(e) => setValue('hireDate', e.target.value)}
                                    error={fieldErrors.hireDate}
                                    fullWidth
                                />
                            </div>

                            <div className={styles.field}>
                                <Input
                                    label="Especialização"
                                    placeholder="Ex: Matemática, Física, Biologia"
                                    leftIcon={<Award size={16} />}
                                    value={watchedValues.specialization || ''}
                                    onChange={(e) => setValue('specialization', e.target.value)}
                                    error={fieldErrors.specialization}
                                    fullWidth
                                    helpText="Área de atuação do professor"
                                />
                            </div>

                            {!isEditing && (
                            <div className={styles.field}>
                                <label className={styles.toggleLabel}>
                                    <input
                                        type="checkbox"
                                        checked={watchedValues.isActive ?? true}
                                        onChange={(e) => setValue('isActive', e.target.checked)}
                                    />
                                    <span>Professor Ativo</span>
                                </label>
                                <p className={styles.toggleHelp}>
                                    Professores inativos não aparecem nas listas e ficam sem acesso até serem ativados
                                </p>
                            </div>
                            )}
                        </div>
                    </div>
                );

            case 'access':
                return (
                    <div className={styles.stepContent}>
                        <div className={styles.stepHeader}>
                            <div className={styles.stepIconWrapper}>
                                <StepIcon size={24} />
                            </div>
                            <div>
                                <h3 className={styles.stepTitle}>{step.title}</h3>
                                <p className={styles.stepDescription}>{step.description}</p>
                            </div>
                        </div>

                        <div className={styles.accessInfo}>
                            {isLoadingConfig ? (
                                <div className={styles.accessLoading}>
                                    <div className={styles.spinner} />
                                    <span>Carregando configuração...</span>
                                </div>
                            ) : teacherRole ? (
                                <>
                                    <div className={styles.accessRoleCard}>
                                        <div className={styles.accessRoleIcon}>
                                            <User size={24} />
                                        </div>
                                        <div className={styles.accessRoleInfo}>
                                            <span className={styles.accessRoleName}>{teacherRole.name}</span>
                                            <span className={styles.accessRoleLabel}>Perfil do Professor</span>
                                        </div>
                                    </div>
                                    <p className={styles.accessDescription}>
                                        Este professor será cadastrado com o perfil <strong>{teacherRole.name}</strong>.
                                        <br />
                                        <span className={styles.accessSubtext}>
                                            Perfil definido pela Configuração Académica da empresa.
                                        </span>
                                    </p>
                                </>
                            ) : (
                                <div className={styles.accessMissing}>
                                    <div className={styles.accessMissingIcon}>
                                        <AlertCircle size={32} />
                                    </div>
                                    <div>
                                        <h4 className={styles.accessMissingTitle}>Configuração necessária</h4>
                                        <p className={styles.accessMissingText}>
                                            A Role de Professor ainda não foi configurada para esta empresa.
                                        </p>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => router.push('/academic/program-settings')}
                                        >
                                            Configurar agora
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    const isLastStep = currentStep === steps.length - 1;
    const isFirstStep = currentStep === 0;
    const progress = ((currentStep + 1) / steps.length) * 100;

    const isNextDisabled = () => {
        if (currentStep === accessStep) {
            return !teacherRole || isLoadingConfig;
        }
        return false;
    };

    return (
        <>
            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                {/* Progress Bar */}
                <div className={styles.progressContainer}>
                    <div className={styles.progressBar}>
                        <div
                            className={styles.progressFill}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className={styles.progressSteps}>
                        {steps.map((step, index) => {
                            const StepIcon = step.icon;
                            const isActive = index <= currentStep;
                            const isCurrent = index === currentStep;
                            return (
                                <div
                                    key={step.id}
                                    className={`${styles.progressStep} ${isActive ? styles.active : ''} ${isCurrent ? styles.current : ''}`}
                                    onClick={() => {
                                        if (index <= currentStep) {
                                            setCurrentStep(index);
                                        }
                                    }}
                                >
                                    <div className={styles.progressStepCircle}>
                                        <StepIcon size={14} />
                                    </div>
                                    <span className={styles.progressStepLabel}>{step.title}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Step Content */}
                <div className={styles.stepContainer}>
                    {renderStep()}
                </div>

                {/* Actions */}
                <div className={styles.actions}>
                    <div className={styles.actionsLeft}>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onCancel}
                            icon={<X size={18} />}
                        >
                            Cancelar
                        </Button>
                    </div>
                    <div className={styles.actionsRight}>
                        {!isFirstStep && (
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={handlePrevious}
                                icon={<ChevronLeft size={18} />}
                            >
                                Anterior
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="primary"
                            onClick={handleNext}
                            icon={isLastStep ? <CheckCircle size={18} /> : <ChevronRight size={18} />}
                            isLoading={isSubmitting}
                            disabled={isSubmitting || isNextDisabled()}
                        >
                            {isLastStep ? (isEditing ? 'Atualizar' : 'Cadastrar Professor') : 'Próximo'}
                        </Button>
                    </div>
                </div>
            </form>

            {/* Credenciais do acesso criado com o professor */}
            {credentials && typeof document !== 'undefined' && createPortal(
                <CredentialsDisplay
                    title={`Professor ${credentials.name} registado`}
                    username={credentials.username}
                    password={credentials.temporaryPassword}
                    personLabel="O professor"
                    onClose={handleCredentialsClose}
                />,
                document.body
            )}
        </>
    );
};