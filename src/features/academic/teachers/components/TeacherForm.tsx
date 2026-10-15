'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
    User,
    X,
    CheckCircle,
    Mail,
    Phone,
    Calendar,
    FileText,
    MapPin,
    Briefcase,
    Award,
    Shield,
    AlertCircle,
    Copy,
    Check,
    ChevronRight,
    ChevronLeft,
} from 'lucide-react';
import { Input } from '@/shared/components/ui/Input/Input';
import { Select } from '@/shared/components/ui/Select/Select';
import { Textarea } from '@/shared/components/ui/Textarea/Textarea';
import { Button } from '@/shared/components/ui/Button/Button';
import { Modal } from '@/shared/components/ui/Modal/Modal';
import { useToast } from '@/shared/contexts/ToastContext';
import { useLoading } from '@/shared/contexts/LoadingContext';
import { teacherService } from '../services/teacher.service';
import { academicAccessSettingsService } from '@/features/academic/academic-access-settings/services/academic-access-settings.service';
import { roleService } from '@/features/identity/roles/services/role.service';
import type { Teacher, Gender, DocumentType } from '../types/teacher.types';
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

// ✅ Componente para mostrar credenciais
interface CredentialsModalProps {
    isOpen: boolean;
    onClose: () => void;
    teacherName: string;
    username: string;
    temporaryPassword: string;
}

const CredentialsModal: React.FC<CredentialsModalProps> = ({
    isOpen,
    onClose,
    teacherName,
    username,
    temporaryPassword,
}) => {
    const [copied, setCopied] = useState<'username' | 'password' | null>(null);

    const handleCopy = async (text: string, type: 'username' | 'password') => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(type);
            setTimeout(() => setCopied(null), 2000);
        } catch (error) {
            console.error('Erro ao copiar:', error);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Professor Cadastrado!" size="md">
            <div className={styles.credentialsModal}>
                <div className={styles.credentialsSuccessIcon}>
                    <CheckCircle size={48} className={styles.credentialsSuccessIconSvg} />
                </div>

                <h3 className={styles.credentialsTitle}>
                    Professor {teacherName} cadastrado com sucesso!
                </h3>

                <div className={styles.credentialsInfo}>
                    <p className={styles.credentialsSubtitle}>
                        Acesso ao sistema criado. Guarde as credenciais abaixo:
                    </p>

                    <div className={styles.credentialsItems}>
                        <div className={styles.credentialsItem}>
                            <div className={styles.credentialsItemLabel}>
                                <User size={14} />
                                <span>Utilizador</span>
                            </div>
                            <div className={styles.credentialsItemValue}>
                                <span>{username}</span>
                                <button
                                    className={styles.credentialsCopyBtn}
                                    onClick={() => handleCopy(username, 'username')}
                                    title="Copiar utilizador"
                                >
                                    {copied === 'username' ? (
                                        <Check size={14} className={styles.credentialsCopied} />
                                    ) : (
                                        <Copy size={14} />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className={styles.credentialsItem}>
                            <div className={styles.credentialsItemLabel}>
                                <Shield size={14} />
                                <span>Senha temporária</span>
                            </div>
                            <div className={styles.credentialsItemValue}>
                                <span>{temporaryPassword}</span>
                                <button
                                    className={styles.credentialsCopyBtn}
                                    onClick={() => handleCopy(temporaryPassword, 'password')}
                                    title="Copiar senha"
                                >
                                    {copied === 'password' ? (
                                        <Check size={14} className={styles.credentialsCopied} />
                                    ) : (
                                        <Copy size={14} />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className={styles.credentialsWarning}>
                        <AlertCircle size={16} />
                        <span>O professor deverá alterar a senha no primeiro acesso.</span>
                    </div>

                    <Button
                        variant="primary"
                        onClick={onClose}
                        className={styles.credentialsCloseBtn}
                        fullWidth
                    >
                        Entendi, continuar
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export const TeacherForm: React.FC<TeacherFormProps> = ({
    teacher,
    onSuccess,
    onCancel,
}) => {
    const isEditing = !!teacher;
    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [roles, setRoles] = useState<Role[]>([]);
    const [teacherRole, setTeacherRole] = useState<Role | null>(null);
    const [isLoadingConfig, setIsLoadingConfig] = useState(true);
    const [showCredentialsModal, setShowCredentialsModal] = useState(false);
    const [credentials, setCredentials] = useState<{ username: string; temporaryPassword: string } | null>(null);
    const { showSuccess, showError } = useToast();
    const { startLoading, stopLoading } = useLoading();

    // ✅ Carregar configuração académica e roles
    useEffect(() => {
        const loadConfig = async () => {
            try {
                setIsLoadingConfig(true);

                const rolesResponse = await roleService.getAll({ limit: 100 });
                setRoles(rolesResponse.data || []);

                const config = await academicAccessSettingsService.getAcademicSettings();

                if (config.teacherRoleId) {
                    const foundRole = (rolesResponse.data || []).find(r => r.id === config.teacherRoleId);
                    setTeacherRole(foundRole || null);
                } else {
                    setTeacherRole(null);
                }
            } catch (error) {
                console.error('Erro ao carregar configuração:', error);
                showError('Erro', 'Não foi possível carregar a configuração académica');
            } finally {
                setIsLoadingConfig(false);
            }
        };
        loadConfig();
    }, []);

    // ✅ useForm sem zodResolver
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting: isFormSubmitting },
        watch,
        setValue,
        trigger,
    } = useForm<TeacherFormData>({
        defaultValues: {
            firstName: teacher?.firstName || '',
            middleName: teacher?.middleName || null,
            lastName: teacher?.lastName || '',
            gender: teacher?.gender || 'MALE',
            birthDate: teacher?.birthDate ? new Date(teacher.birthDate).toISOString().split('T')[0] : '',
            phone: teacher?.phone || null,
            email: teacher?.email || null,
            address: teacher?.address || null,
            documentType: (teacher?.documentType as DocumentType) || null,
            documentNumber: teacher?.documentNumber || null,
            hireDate: teacher?.hireDate ? new Date(teacher.hireDate).toISOString().split('T')[0] : '',
            specialization: teacher?.specialization || '',
            isActive: true,
        },
    });

    const watchedValues = watch();

    // ✅ Validação manual
    const validateStepFields = (step: number): boolean => {
        const fields = getFieldsForStep(step);
        let isValid = true;
        
        fields.forEach(field => {
            const value = watchedValues[field as keyof TeacherFormData];
            if (field === 'firstName' && !value) {
                isValid = false;
                showError('Validação', 'Nome é obrigatório');
            } else if (field === 'lastName' && !value) {
                isValid = false;
                showError('Validação', 'Apelido é obrigatório');
            } else if (field === 'gender' && !value) {
                isValid = false;
                showError('Validação', 'Género é obrigatório');
            } else if (field === 'birthDate' && !value) {
                isValid = false;
                showError('Validação', 'Data de nascimento é obrigatória');
            } else if (field === 'hireDate' && !value) {
                isValid = false;
                showError('Validação', 'Data de contratação é obrigatória');
            } else if (field === 'specialization' && !value) {
                isValid = false;
                showError('Validação', 'Especialização é obrigatória');
            }

        });
        
        return isValid;
    };

    const getFieldsForStep = (step: number): (keyof TeacherFormData)[] => {
        switch (step) {
            case 0:
                return ['firstName', 'middleName', 'lastName', 'gender', 'birthDate'];
            case 1:
                return ['phone', 'email', 'address', 'documentType', 'documentNumber'];
            case 2:
                return ['hireDate', 'specialization'];
            case 3:
                return [];
            default:
                return [];
        }
    };

    const handleNext = async () => {
        if (currentStep === 3) {
            if (!teacherRole) {
                showError('Configuração necessária', 'A Role de Professor ainda não foi configurada para esta empresa.');
                return;
            }
        }

        const isValid = validateStepFields(currentStep);
        if (isValid) {
            if (currentStep === STEPS.length - 1) {
                handleSubmit(onSubmit)();
            } else {
                setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
            }
        }
    };

    const handlePrevious = () => {
        setCurrentStep(prev => Math.max(prev - 1, 0));
    };

    // ✅ Função de submit
    const onSubmit = async (data: TeacherFormData) => {
        try {
            setIsSubmitting(true);
            startLoading();

            // ✅ Garantir que documentType seja o tipo correto
            const documentTypeValue = data.documentType as DocumentType | null;

            const payload = {
                firstName: data.firstName,
                middleName: data.middleName || null,
                lastName: data.lastName,
                gender: data.gender,
                birthDate: data.birthDate,
                phone: data.phone || null,
                email: data.email || null,
                address: data.address || null,
                documentType: documentTypeValue,
                documentNumber: data.documentNumber || null,
                hireDate: data.hireDate,
                specialization: data.specialization || null,
                isActive: data.isActive,
            };

            let response;

            if (isEditing && teacher) {
                const updatePayload: any = { ...payload };
                delete updatePayload.isActive;
                response = await teacherService.update(teacher.uuid, updatePayload);
                showSuccess('Professor atualizado', `Professor ${response.firstName} ${response.lastName} foi atualizado`);
                onSuccess();
            } else {
                response = await teacherService.create(payload);
                showSuccess('Professor criado', `Professor ${response.firstName} ${response.lastName} foi criado com sucesso`);
                if (response.credentials) {
                    setCredentials(response.credentials);
                    setShowCredentialsModal(true);
                } else {
                    onSuccess();
                }
            }
        } catch (error: any) {
            console.error('Erro ao salvar professor:', error);

            let errorMessage = 'Erro ao salvar professor. Tente novamente.';
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

    const handleCredentialsClose = () => {
        setShowCredentialsModal(false);
        setCredentials(null);
        onSuccess();
    };

    const renderStep = () => {
        const step = STEPS[currentStep];
        const StepIcon = step.icon;

        switch (currentStep) {
            case 0:
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
                                    error={errors.firstName?.message}
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
                                    error={errors.lastName?.message}
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
                                    error={errors.middleName?.message}
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
                                    error={errors.birthDate?.message}
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
                                    error={errors.gender?.message}
                                    fullWidth
                                />
                            </div>
                        </div>
                    </div>
                );

            case 1:
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
                                    error={errors.email?.message}
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
                                    error={errors.phone?.message}
                                    fullWidth
                                />
                            </div>

                            <div className={styles.field}>
                                <Select
                                    label="Tipo de Documento"
                                    options={[
                                        { value: '', label: 'Selecione...' },
                                        { value: 'BI', label: 'Bilhete de Identidade' },
                                        { value: 'PASSPORT', label: 'Passaporte' },
                                        { value: 'DIRE', label: 'DIRE' },
                                        { value: 'NUIT', label: 'NUIT' },
                                    ]}
                                    value={watchedValues.documentType || ''}
                                    onChange={(e) => setValue('documentType', e.target.value as DocumentType | null)}
                                    error={errors.documentType?.message}
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
                                    error={errors.documentNumber?.message}
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

            case 2:
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
                                    error={errors.hireDate?.message}
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
                                    error={errors.specialization?.message}
                                    fullWidth
                                    helpText="Área de atuação do professor"
                                />
                            </div>

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
                                    Professores inativos não aparecem nas listas do sistema
                                </p>
                            </div>
                        </div>
                    </div>
                );

            case 3:
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
                                            onClick={() => {
                                                window.location.href = '/academic/program-settings';
                                            }}
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

    const isLastStep = currentStep === STEPS.length - 1;
    const isFirstStep = currentStep === 0;
    const progress = ((currentStep + 1) / STEPS.length) * 100;

    const isNextDisabled = () => {
        if (currentStep === 3) {
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
                        {STEPS.map((step, index) => {
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
                            isLoading={isSubmitting || isFormSubmitting}
                            disabled={isSubmitting || isFormSubmitting || isNextDisabled()}
                        >
                            {isLastStep ? (isEditing ? 'Atualizar' : 'Cadastrar Professor') : 'Próximo'}
                        </Button>
                    </div>
                </div>
            </form>

            {/* Credentials Modal */}
            {credentials && (
                <CredentialsModal
                    isOpen={showCredentialsModal}
                    onClose={handleCredentialsClose}
                    teacherName={`${watchedValues.firstName} ${watchedValues.lastName}`}
                    username={credentials.username}
                    temporaryPassword={credentials.temporaryPassword}
                />
            )}
        </>
    );
};