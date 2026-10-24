// src/features/academic/students/components/StudentForm.tsx

'use client';

import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { DOCUMENT_TYPE_OPTIONS } from '@/shared/constants/document-types';
import { toDateInputValue } from '@/shared/utils/date.utils';
import { getApiErrorMessage, getApiFieldErrors } from '@/shared/utils/api.utils';
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
    Shield,
    AlertCircle,
    Copy,
    Check,
    ChevronRight,
    ChevronLeft,
    Users,
    Globe,
    Heart,
    GraduationCap,
} from 'lucide-react';
import { Input } from '@/shared/components/ui/Input/Input';
import { Select } from '@/shared/components/ui/Select/Select';
import { Textarea } from '@/shared/components/ui/Textarea/Textarea';
import { Button } from '@/shared/components/ui/Button/Button';
import { Modal } from '@/shared/components/ui/Modal/Modal';
import { useToast } from '@/shared/contexts/ToastContext';
import { useLoading } from '@/shared/contexts/LoadingContext';
import { studentService } from '../services/student.service';
import { academicAccessSettingsService } from '@/features/academic/academic-access-settings/services/academic-access-settings.service';
import { roleService } from '@/features/identity/roles/services/role.service';
import type { Student, Gender, DocumentType, StudentStatus, CreateStudentRequest } from '../types/student.types';
import type { Role } from '@/features/identity/roles/types/role.types';
import styles from './StudentForm.module.css';

// ✅ Interface para os dados do formulário
export interface StudentFormData {
    firstName: string;
    middleName: string | null;
    lastName: string;
    gender: 'MALE' | 'FEMALE';
    birthDate: string;
    birthPlace: string | null;
    nationality: string | null;
    province: string | null;
    district: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    documentType: DocumentType | null;
    documentNumber: string | null;
    fatherFullName: string | null;
    motherFullName: string | null;
    guardianName: string | null;
    guardianPhone: string | null;
    guardianRelationship: string | null;
    admissionDate: string;
    studentStatus: StudentStatus;
    remarks: string | null;
    isActive: boolean;
}

interface StudentFormProps {
    student?: Student | null;
    onSuccess?: () => void;
    onCancel?: () => void;
    onDataChange?: (data: StudentFormData) => void;
    readOnly?: boolean;
    hideActions?: boolean;
    isEmbedded?: boolean;
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
        description: 'Informações básicas do estudante',
    },
    {
        id: 'contact',
        title: 'Contactos',
        icon: Phone,
        description: 'Dados de contacto e documentação',
    },
    {
        id: 'guardian',
        title: 'Família',
        icon: Heart,
        description: 'Família e responsáveis',
    },
    {
        id: 'academic',
        title: 'Dados Académicos',
        icon: GraduationCap,
        description: 'Informações académicas',
    },
    {
        id: 'access',
        title: 'Acesso ao Sistema',
        icon: Shield,
        description: 'Perfil de acesso do estudante',
    },
];

// ✅ Opções para campos Select
const RELATIONSHIP_OPTIONS = [
    { value: 'FATHER', label: 'Pai' },
    { value: 'MOTHER', label: 'Mãe' },
    { value: 'BROTHER', label: 'Irmão' },
    { value: 'SISTER', label: 'Irmã' },
    { value: 'UNCLE', label: 'Tio' },
    { value: 'AUNT', label: 'Tia' },
    { value: 'GRANDFATHER', label: 'Avô' },
    { value: 'GRANDMOTHER', label: 'Avó' },
    { value: 'OTHER', label: 'Outro' },
];

const GENDER_OPTIONS = [
    { value: 'MALE', label: 'Masculino' },
    { value: 'FEMALE', label: 'Feminino' },
];

const STUDENT_STATUS_OPTIONS = [
    { value: 'ACTIVE', label: 'Ativo' },
    { value: 'INACTIVE', label: 'Inativo' },
    { value: 'GRADUATED', label: 'Graduado' },
    { value: 'TRANSFERRED', label: 'Transferido' },
    { value: 'SUSPENDED', label: 'Suspenso' },
];


// ✅ Opções para Províncias de Moçambique
const PROVINCE_OPTIONS = [
    { value: '', label: 'Selecione...' },
    { value: 'MAPUTO_CIDADE', label: 'Maputo Cidade' },
    { value: 'MAPUTO_PROVINCIA', label: 'Maputo Província' },
    { value: 'GAZA', label: 'Gaza' },
    { value: 'INHAMBANE', label: 'Inhambane' },
    { value: 'SOFALA', label: 'Sofala' },
    { value: 'MANICA', label: 'Manica' },
    { value: 'TETE', label: 'Tete' },
    { value: 'ZAMBEZIA', label: 'Zambézia' },
    { value: 'NAMPULA', label: 'Nampula' },
    { value: 'CABO_DELGADO', label: 'Cabo Delgado' },
    { value: 'NIASSA', label: 'Niassa' },
];

// ✅ Opções para Nacionalidades
const NATIONALITY_OPTIONS = [
    { value: '', label: 'Selecione...' },
    { value: 'MOCAMBICANA', label: 'Moçambicana' },
    { value: 'PORTUGUESA', label: 'Portuguesa' },
    { value: 'BRASILEIRA', label: 'Brasileira' },
    { value: 'ANGOLANA', label: 'Angolana' },
    { value: 'SULAFRICANA', label: 'Sul-Africana' },
    { value: 'OUTRA', label: 'Outra' },
];

// ✅ Opções para Distritos (exemplo simplificado)
const DISTRICT_OPTIONS = [
    { value: '', label: 'Selecione...' },
    { value: 'KAMPFUMO', label: 'KaMpfumo' },
    { value: 'KAMUBUKWANA', label: 'KaMubukwana' },
    { value: 'KATEMBE', label: 'Katembe' },
    { value: 'KALAVELO', label: 'KaLavelo' },
    { value: 'KAMAXAKENI', label: 'KaMaxakeni' },
    { value: 'OUTRO', label: 'Outro' },
];

// ✅ Componente para mostrar credenciais
interface CredentialsModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentName: string;
    username: string;
    temporaryPassword: string;
}

const CredentialsModal: React.FC<CredentialsModalProps> = ({
    isOpen,
    onClose,
    studentName,
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
        <Modal isOpen={isOpen} onClose={onClose} title="Estudante Cadastrado!" size="md">
            <div className={styles.credentialsModal}>
                <div className={styles.credentialsSuccessIcon}>
                    <CheckCircle size={48} className={styles.credentialsSuccessIconSvg} />
                </div>

                <h3 className={styles.credentialsTitle}>
                    Estudante {studentName} cadastrado com sucesso!
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
                        <span>O estudante deverá alterar a senha no primeiro acesso.</span>
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

export const StudentForm = forwardRef<{ getData: () => StudentFormData | null }, StudentFormProps>(({
    student,
    onSuccess,
    onCancel,
    onDataChange,
    readOnly = false,
    hideActions = false,
    isEmbedded = false,
}, ref) => {
    const isEditing = !!student;
    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [studentRole, setStudentRole] = useState<Role | null>(null);
    const [isLoadingConfig, setIsLoadingConfig] = useState(true);
    const [showCredentialsModal, setShowCredentialsModal] = useState(false);
    const [credentials, setCredentials] = useState<{ username: string; temporaryPassword: string } | null>(null);
    const { showSuccess, showError } = useToast();
    const { startLoading, stopLoading } = useLoading();

    // ✅ Carregar configuração académica
    useEffect(() => {
        const loadConfig = async () => {
            try {
                setIsLoadingConfig(true);

                const config = await academicAccessSettingsService.getAcademicSettings();

                if (config.studentRoleId) {
                    const rolesResponse = await roleService.getAll({ limit: 100 });
                    const foundRole = (rolesResponse.data || []).find(r => r.id === config.studentRoleId);
                    setStudentRole(foundRole || null);
                } else {
                    setStudentRole(null);
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

    // ✅ useForm
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting: isFormSubmitting },
        watch,
        setValue,
        getValues,
        trigger,
    } = useForm<StudentFormData>({
        defaultValues: {
            firstName: student?.firstName || '',
            middleName: student?.middleName || null,
            lastName: student?.lastName || '',
            gender: student?.gender || 'MALE',
            birthDate: toDateInputValue(student?.birthDate),
            birthPlace: student?.birthPlace || null,
            nationality: student?.nationality || null,
            province: student?.province || null,
            district: student?.district || null,
            address: student?.address || null,
            phone: student?.phone || null,
            email: student?.email || null,
            documentType: (student?.documentType as DocumentType) || null,
            documentNumber: student?.documentNumber || null,
            fatherFullName: student?.fatherFullName || null,
            motherFullName: student?.motherFullName || null,
            guardianName: student?.guardianName || null,
            guardianPhone: student?.guardianPhone || null,
            guardianRelationship: student?.guardianRelationship || null,
            admissionDate: toDateInputValue(student?.admissionDate),
            studentStatus: student?.studentStatus || 'ACTIVE',
            remarks: student?.remarks || null,
            isActive: true,
        },
    });

    const watchedValues = watch();

    // ✅ Expor método getData via ref
    useImperativeHandle(ref, () => ({
        getData: (): StudentFormData | null => {
            const values = getValues();
            return {
                firstName: values.firstName,
                middleName: values.middleName || null,
                lastName: values.lastName,
                gender: values.gender,
                birthDate: values.birthDate,
                birthPlace: values.birthPlace || null,
                nationality: values.nationality || null,
                province: values.province || null,
                district: values.district || null,
                address: values.address || null,
                phone: values.phone || null,
                email: values.email || null,
                documentType: values.documentType || null,
                documentNumber: values.documentNumber || null,
                fatherFullName: values.fatherFullName || null,
                motherFullName: values.motherFullName || null,
                guardianName: values.guardianName || null,
                guardianPhone: values.guardianPhone || null,
                guardianRelationship: values.guardianRelationship || null,
                admissionDate: values.admissionDate,
                studentStatus: values.studentStatus || 'ACTIVE',
                remarks: values.remarks || null,
                isActive: values.isActive ?? true,
            };
        },
    }));

    // ✅ Notificar mudanças nos dados
    useEffect(() => {
        if (onDataChange) {
            const values = getValues();
            onDataChange({
                firstName: values.firstName,
                middleName: values.middleName || null,
                lastName: values.lastName,
                gender: values.gender,
                birthDate: values.birthDate,
                birthPlace: values.birthPlace || null,
                nationality: values.nationality || null,
                province: values.province || null,
                district: values.district || null,
                address: values.address || null,
                phone: values.phone || null,
                email: values.email || null,
                documentType: values.documentType || null,
                documentNumber: values.documentNumber || null,
                fatherFullName: values.fatherFullName || null,
                motherFullName: values.motherFullName || null,
                guardianName: values.guardianName || null,
                guardianPhone: values.guardianPhone || null,
                guardianRelationship: values.guardianRelationship || null,
                admissionDate: values.admissionDate,
                studentStatus: values.studentStatus || 'ACTIVE',
                remarks: values.remarks || null,
                isActive: values.isActive ?? true,
            });
        }
    }, [watch, onDataChange]);

    // ✅ Validar step atual
    const validateStep = async (step: number): Promise<boolean> => {
        const fields = getFieldsForStep(step);
        const result = await trigger(fields as any);
        return result;
    };

    const getFieldsForStep = (step: number): (keyof StudentFormData)[] => {
        switch (step) {
            case 0:
                return ['firstName', 'middleName', 'lastName', 'gender', 'birthDate'];
            case 1:
                return ['phone', 'email', 'address', 'documentType', 'documentNumber', 'birthPlace', 'nationality', 'province', 'district'];
            case 2:
                return ['fatherFullName', 'motherFullName', 'guardianName', 'guardianPhone', 'guardianRelationship'];
            case 3:
                return ['admissionDate', 'studentStatus', 'remarks'];
            case 4:
                return [];
            default:
                return [];
        }
    };

    const handleNext = async () => {
        if (currentStep === 4) {
            if (!studentRole) {
                showError('Configuração necessária', 'A Role de Estudante ainda não foi configurada para esta empresa.');
                return;
            }
        }

        const isValid = await validateStep(currentStep);
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
    const onSubmit = async (data: StudentFormData) => {
        if (isEmbedded || hideActions) {
            if (onDataChange) {
                onDataChange({
                    firstName: data.firstName,
                    middleName: data.middleName || null,
                    lastName: data.lastName,
                    gender: data.gender,
                    birthDate: data.birthDate,
                    birthPlace: data.birthPlace || null,
                    nationality: data.nationality || null,
                    province: data.province || null,
                    district: data.district || null,
                    address: data.address || null,
                    phone: data.phone || null,
                    email: data.email || null,
                    documentType: data.documentType || null,
                    documentNumber: data.documentNumber || null,
                    fatherFullName: data.fatherFullName || null,
                    motherFullName: data.motherFullName || null,
                    guardianName: data.guardianName || null,
                    guardianPhone: data.guardianPhone || null,
                    guardianRelationship: data.guardianRelationship || null,
                    admissionDate: data.admissionDate,
                    studentStatus: data.studentStatus || 'ACTIVE',
                    remarks: data.remarks || null,
                    isActive: data.isActive ?? true,
                });
            }
            return;
        }

        try {
            setIsSubmitting(true);
            startLoading();

            const documentTypeValue = data.documentType as DocumentType | null;

            // ✅ Payload com todos os campos
            const payload: CreateStudentRequest = {
                firstName: data.firstName,
                middleName: data.middleName || null,
                lastName: data.lastName,
                gender: data.gender,
                birthDate: data.birthDate,
                birthPlace: data.birthPlace || null,
                nationality: data.nationality || null,
                province: data.province || null,
                district: data.district || null,
                address: data.address || null,
                phone: data.phone || null,
                email: data.email || null,
                documentType: documentTypeValue || null,
                documentNumber: data.documentNumber || null,
                fatherFullName: data.fatherFullName || null,
                motherFullName: data.motherFullName || null,
                guardianName: data.guardianName || null,
                guardianPhone: data.guardianPhone || null,
                guardianRelationship: data.guardianRelationship || null,
                admissionDate: data.admissionDate,
                studentStatus: data.studentStatus || 'ACTIVE',
                remarks: data.remarks || null,
                isActive: data.isActive,
            };

            let response;
            if (isEditing && student) {
                const updatePayload: any = { ...payload };
                delete updatePayload.isActive;
                
                response = await studentService.update(student.uuid, updatePayload);
                showSuccess('Estudante atualizado', `Estudante ${response.firstName} ${response.lastName} foi atualizado`);
            } else {
                response = await studentService.create(payload);
                showSuccess('Estudante criado', `Estudante ${response.firstName} ${response.lastName} foi criado com sucesso`);
                if (response.credentials) {
                    setCredentials(response.credentials);
                    setShowCredentialsModal(true);
                }
            }

            if (onSuccess) {
                onSuccess();
            }
        } catch (error: any) {
            // mostra o primeiro erro de campo devolvido pela API (ex.: email inválido)
            const apiFieldErrors = getApiFieldErrors(error);
            const firstField = Object.keys(apiFieldErrors)[0];
            showError(
                firstField ? 'Verifique os campos' : 'Erro',
                firstField
                    ? `${firstField}: ${apiFieldErrors[firstField]}`
                    : getApiErrorMessage(error, 'Erro ao guardar o estudante. Tente novamente.')
            );
        } finally {
            setIsSubmitting(false);
            stopLoading();
        }
    };

    const handleCredentialsClose = () => {
        setShowCredentialsModal(false);
        setCredentials(null);
        if (onSuccess) {
            onSuccess();
        }
    };

    // ✅ Renderizar step
    const renderStep = () => {
        const step = STEPS[currentStep];
        const StepIcon = step.icon;

        switch (currentStep) {
            case 0: // Dados Pessoais
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
                                    disabled={readOnly}
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
                                    disabled={readOnly}
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
                                    disabled={readOnly}
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
                                    disabled={readOnly}
                                />
                            </div>

                            <div className={styles.field}>
                                <Select
                                    label="Género *"
                                    options={GENDER_OPTIONS}
                                    value={watchedValues.gender || 'MALE'}
                                    onChange={(e) => setValue('gender', e.target.value as any)}
                                    error={errors.gender?.message}
                                    fullWidth
                                    disabled={readOnly}
                                />
                            </div>
                        </div>
                    </div>
                );

            case 1: // Contactos e Localização
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
                                    placeholder="Ex: estudante@email.com"
                                    leftIcon={<Mail size={16} />}
                                    value={watchedValues.email || ''}
                                    onChange={(e) => setValue('email', e.target.value)}
                                    error={errors.email?.message}
                                    fullWidth
                                    disabled={readOnly}
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
                                    disabled={readOnly}
                                />
                            </div>

                            <div className={styles.field}>
                                <Input
                                    label="Naturalidade"
                                    placeholder="Ex: Maputo"
                                    leftIcon={<Globe size={16} />}
                                    value={watchedValues.birthPlace || ''}
                                    onChange={(e) => setValue('birthPlace', e.target.value)}
                                    error={errors.birthPlace?.message}
                                    fullWidth
                                    disabled={readOnly}
                                />
                            </div>

                            <div className={styles.field}>
                                <Select
                                    label="Nacionalidade"
                                    options={NATIONALITY_OPTIONS}
                                    value={watchedValues.nationality || ''}
                                    onChange={(e) => setValue('nationality', e.target.value)}
                                    error={errors.nationality?.message}
                                    fullWidth
                                    disabled={readOnly}
                                />
                            </div>

                            <div className={styles.field}>
                                <Select
                                    label="Província"
                                    options={PROVINCE_OPTIONS}
                                    value={watchedValues.province || ''}
                                    onChange={(e) => setValue('province', e.target.value)}
                                    error={errors.province?.message}
                                    fullWidth
                                    disabled={readOnly}
                                />
                            </div>

                            <div className={styles.field}>
                                <Select
                                    label="Distrito"
                                    options={DISTRICT_OPTIONS}
                                    value={watchedValues.district || ''}
                                    onChange={(e) => setValue('district', e.target.value)}
                                    error={errors.district?.message}
                                    fullWidth
                                    disabled={readOnly}
                                />
                            </div>

                            <div className={styles.field}>
                                <Select
                                    label="Tipo de Documento"
                                    options={DOCUMENT_TYPE_OPTIONS}
                                    value={watchedValues.documentType || ''}
                                    onChange={(e) => setValue('documentType', e.target.value as DocumentType | null)}
                                    error={errors.documentType?.message}
                                    fullWidth
                                    disabled={readOnly}
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
                                    disabled={readOnly}
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
                                    disabled={readOnly}
                                />
                            </div>
                        </div>
                    </div>
                );

            case 2: // Família
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
                                    label="Nome do Pai"
                                    placeholder="Ex: João Silva"
                                    leftIcon={<User size={16} />}
                                    value={watchedValues.fatherFullName || ''}
                                    onChange={(e) => setValue('fatherFullName', e.target.value)}
                                    error={errors.fatherFullName?.message}
                                    fullWidth
                                    disabled={readOnly}
                                />
                            </div>

                            <div className={styles.field}>
                                <Input
                                    label="Nome da Mãe"
                                    placeholder="Ex: Maria Silva"
                                    leftIcon={<User size={16} />}
                                    value={watchedValues.motherFullName || ''}
                                    onChange={(e) => setValue('motherFullName', e.target.value)}
                                    error={errors.motherFullName?.message}
                                    fullWidth
                                    disabled={readOnly}
                                />
                            </div>

                            <div className={styles.field}>
                                <Input
                                    label="Nome do Responsável"
                                    placeholder="Ex: Carlos Santos"
                                    leftIcon={<User size={16} />}
                                    value={watchedValues.guardianName || ''}
                                    onChange={(e) => setValue('guardianName', e.target.value)}
                                    error={errors.guardianName?.message}
                                    fullWidth
                                    disabled={readOnly}
                                />
                            </div>

                            <div className={styles.field}>
                                <Input
                                    label="Telefone do Responsável"
                                    placeholder="Ex: 84 123 4567"
                                    leftIcon={<Phone size={16} />}
                                    value={watchedValues.guardianPhone || ''}
                                    onChange={(e) => setValue('guardianPhone', e.target.value)}
                                    error={errors.guardianPhone?.message}
                                    fullWidth
                                    disabled={readOnly}
                                />
                            </div>

                            <div className={styles.field}>
                                <Select
                                    label="Parentesco *"
                                    options={RELATIONSHIP_OPTIONS}
                                    value={watchedValues.guardianRelationship || ''}
                                    onChange={(e) => setValue('guardianRelationship', e.target.value)}
                                    error={errors.guardianRelationship?.message}
                                    fullWidth
                                    disabled={readOnly}
                                />
                            </div>
                        </div>
                    </div>
                );

            case 3: // Dados Académicos
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
                                    label="Data de Admissão *"
                                    type="date"
                                    leftIcon={<Calendar size={16} />}
                                    value={watchedValues.admissionDate || ''}
                                    onChange={(e) => setValue('admissionDate', e.target.value)}
                                    error={errors.admissionDate?.message}
                                    fullWidth
                                    disabled={readOnly}
                                />
                            </div>

                            <div className={styles.field}>
                                <Select
                                    label="Status do Estudante *"
                                    options={STUDENT_STATUS_OPTIONS}
                                    value={watchedValues.studentStatus || 'ACTIVE'}
                                    onChange={(e) => setValue('studentStatus', e.target.value as StudentStatus)}
                                    error={errors.studentStatus?.message}
                                    fullWidth
                                    disabled={readOnly}
                                />
                            </div>

                            <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                                <Textarea
                                    label="Observações"
                                    placeholder="Observações adicionais sobre o estudante"
                                    value={watchedValues.remarks || ''}
                                    onChange={(e) => setValue('remarks', e.target.value)}
                                    fullWidth
                                    rows={3}
                                    disabled={readOnly}
                                />
                            </div>

                            <div className={styles.field}>
                                <label className={styles.toggleLabel}>
                                    <input
                                        type="checkbox"
                                        checked={watchedValues.isActive ?? true}
                                        onChange={(e) => setValue('isActive', e.target.checked)}
                                    />
                                    <span>Estudante Ativo</span>
                                </label>
                                <p className={styles.toggleHelp}>
                                    Estudantes inativos não aparecem nas listas do sistema
                                </p>
                            </div>
                        </div>
                    </div>
                );

            case 4: // Acesso ao Sistema
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
                            ) : studentRole ? (
                                <>
                                    <div className={styles.accessRoleCard}>
                                        <div className={styles.accessRoleIcon}>
                                            <Users size={24} />
                                        </div>
                                        <div className={styles.accessRoleInfo}>
                                            <span className={styles.accessRoleName}>{studentRole.name}</span>
                                            <span className={styles.accessRoleLabel}>Perfil do Estudante</span>
                                        </div>
                                    </div>
                                    <p className={styles.accessDescription}>
                                        Este estudante será cadastrado com o perfil <strong>{studentRole.name}</strong>.
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
                                            A Role de Estudante ainda não foi configurada para esta empresa.
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
        if (currentStep === 4) {
            return !studentRole || isLoadingConfig;
        }
        return false;
    };

    // ✅ Se estiver em modo embed, renderizar apenas os campos
    if (isEmbedded) {
        return (
            <div className={styles.embeddedForm}>
                <div className={styles.progressContainer}>
                    <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
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

                <div className={styles.stepContainer}>
                    {renderStep()}
                </div>

                {!hideActions && (
                    <div className={styles.actions}>
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
                                disabled={isNextDisabled()}
                            >
                                {isLastStep ? 'Finalizar' : 'Próximo'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ✅ Modo standalone
    return (
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            <div className={styles.progressContainer}>
                <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${progress}%` }} />
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

            <div className={styles.stepContainer}>
                {renderStep()}
            </div>

            {!hideActions && (
                <div className={styles.actions}>
                    <div className={styles.actionsLeft}>
                        {onCancel && (
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={onCancel}
                                icon={<X size={18} />}
                            >
                                Cancelar
                            </Button>
                        )}
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
                            {isLastStep ? (isEditing ? 'Atualizar' : 'Cadastrar') : 'Próximo'}
                        </Button>
                    </div>
                </div>
            )}
        </form>
    );
});

StudentForm.displayName = 'StudentForm';