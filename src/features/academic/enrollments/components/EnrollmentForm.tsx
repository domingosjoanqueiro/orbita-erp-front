// src/features/academic/enrollments/components/EnrollmentForm.tsx

'use client';

import React, { useState, useEffect, useRef } from 'react';
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
    GraduationCap,
    Users,
    Globe,
    Heart,
    Search,
    Edit,
} from 'lucide-react';
import { Input } from '@/shared/components/ui/Input/Input';
import { Select } from '@/shared/components/ui/Select/Select';
import { Textarea } from '@/shared/components/ui/Textarea/Textarea';
import { Button } from '@/shared/components/ui/Button/Button';
import { Modal } from '@/shared/components/ui/Modal/Modal';
import { useToast } from '@/shared/contexts/ToastContext';
import { useLoading } from '@/shared/contexts/LoadingContext';
import type {
    StudentSearchResult,
    Enrollment,
    EnrollmentResponse,
    CreateEnrollmentRequest,
    UpdateEnrollmentRequest,
} from '../types/enrollment.types';
import { enrollmentService } from '../services/enrollment.service';
import { studentService } from '@/features/academic/students/services/student.service';
import { academicAccessSettingsService } from '@/features/academic/academic-access-settings/services/academic-access-settings.service';
import { roleService } from '@/features/identity/roles/services/role.service';
import type { Role } from '@/features/identity/roles/types/role.types';
import type { Class, CreateStudentRequest, Grade } from '@/features/academic/students/types/student.types';
import type { DocumentType, StudentStatus } from '@/features/academic/students/types/student.types';
import styles from './EnrollmentForm.module.css';
import { Badge } from '@/shared/components/ui/Badge/Badge';

interface EnrollmentFormProps {
    onSuccess: () => void;
    onCancel: () => void;
    enrollmentToEdit?: Enrollment | null;
    isEditing?: boolean;
}

// ✅ Tipos do formulário de estudante
interface StudentFormData {
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

// ✅ Tipos do formulário de matrícula
interface EnrollmentFormData {
    gradeUuid: string;
    classUuid: string;
    enrollmentDate: string;
    enrollmentStatus: string;
    remarks: string | null;
    isActive: boolean;
}

// ✅ Tipos para estudante existente
interface ExistingStudentData {
    uuid: string;
    studentName: string;
    studentNumber: string;
    email: string | null;
    phone: string | null;
    hasUser: boolean;
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
        id: 'student',
        title: 'Estudante',
        icon: User,
        description: 'Selecione o tipo de estudante',
    },
    {
        id: 'personal',
        title: 'Dados Pessoais',
        icon: User,
        description: 'Informações do estudante',
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
        description: 'Informações académicas e matrícula',
    },
    {
        id: 'access',
        title: 'Acesso ao Sistema',
        icon: Shield,
        description: 'Perfil de acesso do estudante',
    },
];

// ✅ Opções de Status da Matrícula
const ENROLLMENT_STATUS_OPTIONS = [
    { value: 'ACTIVE', label: 'Ativa' },
    { value: 'CANCELLED', label: 'Cancelada' },
    { value: 'TRANSFERRED', label: 'Transferida' },
    { value: 'COMPLETED', label: 'Concluída' },
    { value: 'SUSPENDED', label: 'Suspensa' },
];

// ✅ Opções de Género
const GENDER_OPTIONS = [
    { value: 'MALE', label: 'Masculino' },
    { value: 'FEMALE', label: 'Feminino' },
];

// ✅ Opções de Status do Estudante
const STUDENT_STATUS_OPTIONS = [
    { value: 'ACTIVE', label: 'Ativo' },
    { value: 'INACTIVE', label: 'Inativo' },
    { value: 'GRADUATED', label: 'Graduado' },
    { value: 'TRANSFERRED', label: 'Transferido' },
    { value: 'SUSPENDED', label: 'Suspenso' },
];

// ✅ Opções de Documento
const DOCUMENT_TYPE_OPTIONS = [
    { value: '', label: 'Selecione...' },
    { value: 'BI', label: 'Bilhete de Identidade' },
    { value: 'PASSPORT', label: 'Passaporte' },
    { value: 'DIRE', label: 'DIRE' },
    { value: 'NUIT', label: 'NUIT' },
];

// ✅ Componente para mostrar credenciais
interface CredentialsModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentName: string;
    username: string;
    temporaryPassword: string;
    enrollmentNumber: string;
}

const CredentialsModal: React.FC<CredentialsModalProps> = ({
    isOpen,
    onClose,
    studentName,
    username,
    temporaryPassword,
    enrollmentNumber,
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
        <Modal isOpen={isOpen} onClose={onClose} title="Matrícula Realizada!" size="md">
            <div className={styles.credentialsModal}>
                <div className={styles.credentialsSuccessIcon}>
                    <CheckCircle size={48} className={styles.credentialsSuccessIconSvg} />
                </div>

                <h3 className={styles.credentialsTitle}>
                    Matrícula realizada com sucesso!
                </h3>

                <div className={styles.credentialsInfo}>
                    <div className={styles.credentialsStudent}>
                        <div className={styles.credentialsStudentItem}>
                            <span className={styles.credentialsStudentLabel}>Estudante</span>
                            <span className={styles.credentialsStudentValue}>{studentName}</span>
                        </div>
                        <div className={styles.credentialsStudentItem}>
                            <span className={styles.credentialsStudentLabel}>Matrícula</span>
                            <span className={styles.credentialsStudentValue}>{enrollmentNumber}</span>
                        </div>
                        {username && (
                            <div className={styles.credentialsStudentItem}>
                                <span className={styles.credentialsStudentLabel}>Utilizador</span>
                                <span className={styles.credentialsStudentValue}>{username}</span>
                            </div>
                        )}
                    </div>

                    {temporaryPassword && (
                        <>
                            <p className={styles.credentialsSubtitle}>
                                Acesso ao Portal criado. Guarde as credenciais abaixo:
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
                        </>
                    )}

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

export const EnrollmentForm: React.FC<EnrollmentFormProps> = ({
    onSuccess,
    onCancel,
    enrollmentToEdit,
    isEditing = false,
}) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [studentType, setStudentType] = useState<'new' | 'existing'>('new');
    const [selectedStudent, setSelectedStudent] = useState<ExistingStudentData | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ✅ Estados para Classe e Turma
    const [grades, setGrades] = useState<Grade[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);
    const [isLoadingGrades, setIsLoadingGrades] = useState(false);
    const [isLoadingClasses, setIsLoadingClasses] = useState(false);
    const [isDataLoaded, setIsDataLoaded] = useState(false);

    const [studentRole, setStudentRole] = useState<Role | null>(null);
    const [isLoadingConfig, setIsLoadingConfig] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<ExistingStudentData[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showCredentialsModal, setShowCredentialsModal] = useState(false);
    const [credentials, setCredentials] = useState<{ username: string; temporaryPassword: string; enrollmentNumber: string } | null>(null);
    const { showSuccess, showError } = useToast();
    const { startLoading, stopLoading } = useLoading();

    // ✅ Referência para controlar se os dados de edição já foram aplicados
    const editDataApplied = useRef(false);

    // ✅ Função auxiliar para formatar data para input type="date"
    const formatDateToInput = (date: string | undefined | null): string => {
        if (!date) return new Date().toISOString().split('T')[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
        try {
            const d = new Date(date);
            if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
            return d.toISOString().split('T')[0];
        } catch {
            return new Date().toISOString().split('T')[0];
        }
    };

    // ✅ Formulário do Estudante
    const {
        register: registerStudent,
        handleSubmit: handleSubmitStudent,
        formState: { errors: studentErrors, isSubmitting: isStudentSubmitting },
        watch: watchStudent,
        setValue: setStudentValue,
        getValues: getStudentValues,
        reset: resetStudent,
    } = useForm<StudentFormData>({
        defaultValues: {
            firstName: '',
            middleName: null,
            lastName: '',
            gender: 'MALE',
            birthDate: '',
            birthPlace: null,
            nationality: null,
            province: null,
            district: null,
            address: null,
            phone: null,
            email: null,
            documentType: null,
            documentNumber: null,
            fatherFullName: null,
            motherFullName: null,
            guardianName: null,
            guardianPhone: null,
            guardianRelationship: null,
            admissionDate: new Date().toISOString().split('T')[0],
            studentStatus: 'ACTIVE',
            remarks: null,
            isActive: true,
        },
    });

    // ✅ Formulário da Matrícula
    const {
        register: registerEnrollment,
        formState: { errors: enrollmentErrors, isSubmitting: isEnrollmentSubmitting },
        watch: watchEnrollment,
        setValue: setEnrollmentValue,
        getValues: getEnrollmentValues,
        reset: resetEnrollment,
    } = useForm<EnrollmentFormData>({
        defaultValues: {
            gradeUuid: '',
            classUuid: '',
            enrollmentDate: new Date().toISOString().split('T')[0],
            enrollmentStatus: 'ACTIVE',
            remarks: null,
            isActive: true,
        },
    });

    const watchedStudent = watchStudent();
    const watchedEnrollment = watchEnrollment();
    const selectedGradeUuid = watchEnrollment('gradeUuid');

    // ✅ Função para preencher o formulário de edição
    const populateEditForm = (enrollment: Enrollment, classesList: Class[]) => {
        if (!enrollment || !classesList.length) return;

        console.log('🔄 Populando formulário de edição:', enrollment);

        const classItem = classesList.find(c => c.uuid === enrollment.classUuid);
        const gradeUuid = classItem?.gradeUuid || '';

        const formattedDate = formatDateToInput(enrollment.enrollmentDate);

        resetEnrollment({
            gradeUuid: gradeUuid,
            classUuid: enrollment.classUuid || '',
            enrollmentDate: formattedDate,
            enrollmentStatus: enrollment.isActive ? 'ACTIVE' : 'CANCELLED',
            remarks: enrollment.remarks || null,
            isActive: enrollment.isActive,
        });

        if (gradeUuid) {
            const filtered = classesList.filter(c => c.gradeUuid === gradeUuid);
            setFilteredClasses(filtered);
        }

        if (enrollment.student) {
            setSelectedStudent({
                uuid: enrollment.student.uuid,
                studentName: enrollment.studentName || `${enrollment.student.firstName} ${enrollment.student.lastName}`,
                studentNumber: enrollment.studentNumber || '',
                email: enrollment.student.email || null,
                phone: enrollment.student.phone || null,
                hasUser: !!enrollment.student.userId,
            });


            setStudentType('existing');
        }

        editDataApplied.current = true;
        console.log('✅ Formulário de edição populado com sucesso');
    };

    // ✅ Carregar dados iniciais (grades, classes, configuração)
    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoadingConfig(true);
                setIsLoadingGrades(true);

                const gradesData = await studentService.getGrades();
                setGrades(gradesData || []);

                const classesData = await studentService.getClasses();
                setClasses(classesData || []);
                setFilteredClasses(classesData || []);

                const config = await academicAccessSettingsService.getAcademicSettings();
                if (config.studentRoleId) {
                    const rolesResponse = await roleService.getAll({ limit: 100 });
                    const foundRole = (rolesResponse.data || []).find(r => r.id === config.studentRoleId);
                    setStudentRole(foundRole || null);
                } else {
                    setStudentRole(null);
                }

                setIsDataLoaded(true);
                console.log('✅ Dados carregados:', { grades: gradesData.length, classes: classesData.length });

            } catch (error) {
                console.error('Erro ao carregar dados:', error);
                showError('Erro', 'Não foi possível carregar os dados');
            } finally {
                setIsLoadingConfig(false);
                setIsLoadingGrades(false);
            }
        };
        loadData();
    }, []);

    // ✅ Efeito para preencher o formulário quando os dados estiverem carregados E for edição
    useEffect(() => {
        if (isEditing && enrollmentToEdit && isDataLoaded && classes.length > 0 && !editDataApplied.current) {
            populateEditForm(enrollmentToEdit, classes);
        }
    }, [isEditing, enrollmentToEdit, isDataLoaded, classes]);

    // ✅ Filtrar turmas quando a classe mudar
    useEffect(() => {
        if (selectedGradeUuid) {
            setIsLoadingClasses(true);
            const filtered = classes.filter(c => c.gradeUuid === selectedGradeUuid);
            setFilteredClasses(filtered);
            if (watchedEnrollment.classUuid) {
                const classStillValid = filtered.some(c => c.uuid === watchedEnrollment.classUuid);
                if (!classStillValid) {
                    setEnrollmentValue('classUuid', '');
                }
            }
            setIsLoadingClasses(false);
        } else {
            setFilteredClasses([]);
            setEnrollmentValue('classUuid', '');
        }
    }, [selectedGradeUuid, classes]);

    const gradeOptions = grades.map(g => ({
        value: g.uuid,
        label: `${g.name} (${g.code})`,
    }));

    const classOptions = filteredClasses.map(c => ({
        value: c.uuid,
        label: `${c.name}`,
    }));

    // ✅ Buscar estudantes - FUNÇÃO RESTAURADA
    const handleSearch = async () => {
        if (!searchTerm || searchTerm.length < 2) {
            showError('Validação', 'Digite pelo menos 2 caracteres para buscar');
            return;
        }

        try {
            setIsSearching(true);
            const results = await enrollmentService.searchStudents(searchTerm);
            console.log('📥 EnrollmentService- Resposta:', results);
            setSearchResults(results.map(r => ({
                uuid: r.uuid,
                studentName: r.studentName,
                studentNumber: r.studentNumber,
                email: r.email || null,
                phone: r.phone || null,
                hasUser: r.hasUser,
            })));
        } catch (error) {
            console.error('Erro ao buscar estudantes:', error);
            showError('Erro', 'Não foi possível buscar estudantes');
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    // ✅ Validar step atual
    const validateStepFields = (step: number): boolean => {
        if (isEditing) {
            return true;
        }

        if (step === 0) {
            if (studentType === 'new') return true;
            if (studentType === 'existing' && !selectedStudent) {
                showError('Validação', 'Selecione um estudante');
                return false;
            }
            return true;
        }

        if (studentType === 'existing') {
            return true;
        }

        const fields = getFieldsForStep(step);
        let isValid = true;

        fields.forEach(field => {
            const value = watchedStudent[field as keyof StudentFormData];
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
            } else if (field === 'admissionDate' && !value) {
                isValid = false;
                showError('Validação', 'Data de admissão é obrigatória');
            }
        });

        return isValid;
    };

    const getFieldsForStep = (step: number): (keyof StudentFormData)[] => {
        switch (step) {
            case 1:
                return ['firstName', 'middleName', 'lastName', 'gender', 'birthDate'];
            case 2:
                return ['phone', 'email', 'address', 'documentType', 'documentNumber', 'birthPlace', 'nationality', 'province', 'district'];
            case 3:
                return ['fatherFullName', 'motherFullName', 'guardianName', 'guardianPhone', 'guardianRelationship'];
            case 4:
                return ['admissionDate', 'studentStatus'];
            case 5:
                return [];
            default:
                return [];
        }
    };

    // ✅ Função handleNext corrigida
    const handleNext = async () => {
        // ✅ Se for edição, valida e submete diretamente
        if (isEditing) {
            const enrollmentData = getEnrollmentValues();
            if (!enrollmentData.classUuid) {
                showError('Validação', 'Selecione uma turma');
                return;
            }
            if (!enrollmentData.enrollmentDate) {
                showError('Validação', 'Selecione a data da matrícula');
                return;
            }

            handleSubmitStudent(onSubmit)();
            return;
        }

        // ✅ Se não for edição, valida o step atual
        const isValid = validateStepFields(currentStep);
        if (isValid) {
            if (currentStep === STEPS.length - 1) {
                const enrollmentData = getEnrollmentValues();
                if (!enrollmentData.classUuid) {
                    showError('Validação', 'Selecione uma turma');
                    return;
                }
                if (!enrollmentData.enrollmentDate) {
                    showError('Validação', 'Selecione a data da matrícula');
                    return;
                }
                handleSubmitStudent(onSubmit)();
            } else {
                if (studentType === 'existing' && currentStep < 4) {
                    setCurrentStep(4);
                } else {
                    setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
                }
            }
        }
    };

    const handlePrevious = () => {
        if (studentType === 'existing' && currentStep === 4) {
            setCurrentStep(0);
        } else {
            setCurrentStep(prev => Math.max(prev - 1, 0));
        }
    };

    const handleSelectStudent = (student: ExistingStudentData) => {
        setSelectedStudent(student);
        setSearchResults([]);
        setSearchTerm('');
    };

    // ✅ Função handleSubmitWrapper para o form (evita conflitos)
    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditing) {
            handleSubmitStudent(onSubmit)();
        }
    };

    // ✅ Função de submit corrigida
    const onSubmit = async (data: StudentFormData) => {
        if (isSubmitting) return;

        try {
            setIsSubmitting(true);
            startLoading();

            const enrollmentData = getEnrollmentValues();

            if (!enrollmentData.classUuid) {
                showError('Validação', 'Selecione uma turma');
                setIsSubmitting(false);
                stopLoading();
                return;
            }

            if (!enrollmentData.enrollmentDate) {
                showError('Validação', 'Selecione a data da matrícula');
                setIsSubmitting(false);
                stopLoading();
                return;
            }

            let response;

            if (isEditing && enrollmentToEdit) {
                const payload: UpdateEnrollmentRequest = {
                    studentUuid: enrollmentToEdit.studentUuid,
                    classUuid: enrollmentData.classUuid,
                    enrollmentDate: enrollmentData.enrollmentDate,
                    status: enrollmentData.enrollmentStatus,
                    remarks: enrollmentData.remarks || null,
                    isActive: enrollmentData.enrollmentStatus === 'ACTIVE',
                };

                console.log('📤 Atualizando matrícula:', payload);
                response = await enrollmentService.update(enrollmentToEdit.uuid, payload);
                showSuccess('Matrícula atualizada', 'Matrícula atualizada com sucesso');
                onSuccess();
                return;

            } else if (studentType === 'existing') {
                if (!selectedStudent) {
                    showError('Validação', 'Selecione um estudante');
                    setIsSubmitting(false);
                    stopLoading();
                    return;
                }

                const payload: CreateEnrollmentRequest = {
                    studentUuid: selectedStudent.uuid,
                    classUuid: enrollmentData.classUuid,
                    enrollmentDate: enrollmentData.enrollmentDate,
                    enrollmentStatus: enrollmentData.enrollmentStatus,
                    remarks: enrollmentData.remarks || null,
                    isActive: enrollmentData.enrollmentStatus === 'ACTIVE',
                };

                response = await enrollmentService.create(payload);
            } else {
                const documentTypeValue = data.documentType as DocumentType | null;

                const studentPayload: CreateStudentRequest = {
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
                    documentType: documentTypeValue,
                    documentNumber: data.documentNumber || null,
                    fatherFullName: data.fatherFullName || null,
                    motherFullName: data.motherFullName || null,
                    guardianName: data.guardianName || null,
                    guardianPhone: data.guardianPhone || null,
                    guardianRelationship: data.guardianRelationship || null,
                    admissionDate: data.admissionDate,
                    studentStatus: data.studentStatus,
                    remarks: data.remarks || null,
                    isActive: data.isActive,
                };

                const enrollmentPayload = {
                    classUuid: enrollmentData.classUuid,
                    enrollmentDate: enrollmentData.enrollmentDate,
                    enrollmentStatus: enrollmentData.enrollmentStatus,
                    remarks: enrollmentData.remarks || null,
                    isActive: enrollmentData.enrollmentStatus === 'ACTIVE',
                };

                response = await enrollmentService.createWithStudent({
                    student: studentPayload,
                    enrollment: enrollmentPayload,
                });
            }

            console.log('✅ Matrícula salva:', response);

            if (!isEditing && studentType === 'new') {
                const enrollmentResponse = response as EnrollmentResponse;
                const credentialsData = enrollmentResponse?.credentials;

                if (credentialsData) {
                    setCredentials({
                        username: credentialsData.username,
                        temporaryPassword: credentialsData.temporaryPassword,
                        enrollmentNumber: enrollmentResponse?.enrollment?.enrollmentNumber || `MAT-${Date.now().toString().slice(-6)}`,
                    });
                    setShowCredentialsModal(true);
                } else {
                    onSuccess();
                }
            } else {
                onSuccess();
            }

        } catch (error: any) {
            console.error('Erro ao salvar matrícula:', error);

            let errorMessage = 'Erro ao salvar matrícula. Tente novamente.';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;

                if (errorMessage.includes('já possui uma matrícula')) {
                    errorMessage = 'Este estudante já possui uma matrícula neste ano letivo.';
                } else if (errorMessage.includes('documento')) {
                    errorMessage = 'Já existe um estudante com este documento.';
                } else if (errorMessage.includes('email')) {
                    errorMessage = 'Já existe um estudante com este email.';
                }
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

    // ✅ Renderizar step atual
    const renderStep = () => {
        const step = STEPS[currentStep];
        const StepIcon = step.icon;

        if (studentType === 'existing' && currentStep > 0 && currentStep < 4) {
            return null;
        }

        if (isEditing) {
            return (
                <div className={styles.stepContent}>
                    <div className={styles.stepHeader}>
                        <div className={styles.stepIconWrapper}>
                            <Edit size={24} />
                        </div>
                        <div>
                            <h3 className={styles.stepTitle}>Editar Matrícula</h3>
                            <p className={styles.stepDescription}>
                                {enrollmentToEdit?.studentName} - {enrollmentToEdit?.studentNumber}
                            </p>
                        </div>
                    </div>

                    <div className={styles.editInfo}>
                        <div className={styles.editInfoItem}>
                            <span className={styles.editInfoLabel}>Estudante</span>
                            <span className={styles.editInfoValue}>: {enrollmentToEdit?.studentName}</span>
                        </div>
                        <div className={styles.editInfoItem}>
                            <span className={styles.editInfoLabel}>Número</span>
                            <span className={styles.editInfoValue}>: {enrollmentToEdit?.studentNumber}</span>
                        </div>
                        <div className={styles.editInfoItem}>
                            <span className={styles.editInfoLabel}>Matrícula</span>
                            <span className={styles.editInfoValue}>: {enrollmentToEdit?.enrollmentNumber}</span>
                        </div>
                    </div>

                    <div className={styles.fields}>
                        <div className={styles.field}>
                            <Select
                                label="Classe *"
                                options={[
                                    { value: '', label: 'Selecione uma classe...' },
                                    ...gradeOptions,
                                ]}
                                value={watchedEnrollment.gradeUuid || ''}
                                onChange={(e) => setEnrollmentValue('gradeUuid', e.target.value)}
                                error={enrollmentErrors.gradeUuid?.message}
                                fullWidth
                                disabled={!isDataLoaded}
                            />
                        </div>

                        <div className={styles.field}>
                            <Select
                                label="Turma *"
                                options={[
                                    { value: '', label: 'Selecione uma turma...' },
                                    ...classOptions,
                                ]}
                                value={watchedEnrollment.classUuid || ''}
                                onChange={(e) => setEnrollmentValue('classUuid', e.target.value)}
                                error={enrollmentErrors.classUuid?.message}
                                fullWidth
                                disabled={!watchedEnrollment.gradeUuid || isLoadingClasses || !isDataLoaded}
                            />
                        </div>

                        <div className={styles.field}>
                            <Input
                                label="Data da Matrícula *"
                                type="date"
                                leftIcon={<Calendar size={16} />}
                                value={formatDateToInput(watchedEnrollment.enrollmentDate)}
                                onChange={(e) => setEnrollmentValue('enrollmentDate', e.target.value)}
                                error={enrollmentErrors.enrollmentDate?.message}
                                fullWidth
                            />
                        </div>

                        <div className={styles.field}>
                            <Select
                                label="Status da Matrícula *"
                                options={ENROLLMENT_STATUS_OPTIONS}
                                value={watchedEnrollment.enrollmentStatus || 'ACTIVE'}
                                onChange={(e) => setEnrollmentValue('enrollmentStatus', e.target.value)}
                                error={enrollmentErrors.enrollmentStatus?.message}
                                fullWidth
                            />
                        </div>

                        <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                            <Textarea
                                label="Observações"
                                placeholder="Observações adicionais sobre a matrícula"
                                value={watchedEnrollment.remarks || ''}
                                onChange={(e) => setEnrollmentValue('remarks', e.target.value)}
                                fullWidth
                                rows={3}
                            />
                        </div>
                    </div>
                </div>
            );
        }

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

                        <div className={styles.studentTypeSection}>
                            <div className={styles.studentTypeOptions}>
                                <button
                                    type="button"
                                    className={`${styles.studentTypeOption} ${studentType === 'new' ? styles.active : ''}`}
                                    onClick={() => {
                                        setStudentType('new');
                                        setSelectedStudent(null);
                                    }}
                                >
                                    <div className={styles.studentTypeIcon}>
                                        <User size={24} />
                                    </div>
                                    <div>
                                        <span className={styles.studentTypeLabel}>Novo estudante</span>
                                        <span className={styles.studentTypeDesc}>Cadastrar um novo estudante</span>
                                    </div>
                                    {studentType === 'new' && (
                                        <CheckCircle size={20} className={styles.studentTypeCheck} />
                                    )}
                                </button>

                                <button
                                    type="button"
                                    className={`${styles.studentTypeOption} ${studentType === 'existing' ? styles.active : ''}`}
                                    onClick={() => setStudentType('existing')}
                                >
                                    <div className={styles.studentTypeIcon}>
                                        <Search size={24} />
                                    </div>
                                    <div>
                                        <span className={styles.studentTypeLabel}>Estudante já cadastrado</span>
                                        <span className={styles.studentTypeDesc}>Buscar estudante existente</span>
                                    </div>
                                    {studentType === 'existing' && (
                                        <CheckCircle size={20} className={styles.studentTypeCheck} />
                                    )}
                                </button>
                            </div>

                            {studentType === 'existing' && (
                                <div className={styles.searchSection}>
                                    <div className={styles.searchWrapper}>
                                        <Search size={18} className={styles.searchIcon} />
                                        <input
                                            type="text"
                                            placeholder="Pesquisar por nome, número ou documento..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                            className={styles.searchInput}
                                        />
                                        <Button
                                            size="sm"
                                            variant="primary"
                                            onClick={handleSearch}
                                            isLoading={isSearching}
                                            disabled={searchTerm.length < 2}
                                        >
                                            Buscar
                                        </Button>
                                    </div>

                                    {searchResults.length > 0 && (
                                        <div className={styles.searchResults}>
                                            {searchResults.map((student) => (
                                                <div
                                                    key={student.uuid}
                                                    className={styles.searchResultItem}
                                                    onClick={() => handleSelectStudent(student)}
                                                >
                                                    <div className={styles.searchResultInfo}>
                                                        <span className={styles.searchResultName}>
                                                            {student.studentName}
                                                        </span>
                                                        <span className={styles.searchResultNumber}>
                                                            {student.studentNumber}
                                                        </span>
                                                        {student.email && (
                                                            <span className={styles.searchResultEmail}>
                                                                {student.email}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className={styles.searchResultBadge}>
                                                        {student.hasUser ? (
                                                            <Badge variant="success" size="sm">Com conta</Badge>
                                                        ) : (
                                                            <Badge variant="warning" size="sm">Sem conta</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {selectedStudent && (
                                        <div className={styles.selectedStudentCard}>
                                            <div className={styles.selectedStudentIcon}>
                                                <User size={20} />
                                            </div>
                                            <div className={styles.selectedStudentInfo}>
                                                <span className={styles.selectedStudentName}>
                                                    {selectedStudent.studentName}
                                                </span>
                                                <span className={styles.selectedStudentNumber}>
                                                    {selectedStudent.studentNumber}
                                                </span>
                                            </div>
                                            <div className={styles.selectedStudentBadges}>
                                                {selectedStudent.hasUser ? (
                                                    <Badge variant="success" size="sm">Com conta</Badge>
                                                ) : (
                                                    <Badge variant="warning" size="sm">Sem conta</Badge>
                                                )}
                                            </div>
                                            <button
                                                className={styles.selectedStudentChange}
                                                onClick={() => setSelectedStudent(null)}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
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
                                    label="Nome *"
                                    placeholder="Ex: João"
                                    leftIcon={<User size={16} />}
                                    value={watchedStudent.firstName || ''}
                                    onChange={(e) => setStudentValue('firstName', e.target.value)}
                                    error={studentErrors.firstName?.message}
                                    fullWidth
                                />
                            </div>

                            <div className={styles.field}>
                                <Input
                                    label="Apelido *"
                                    placeholder="Ex: Silva"
                                    leftIcon={<User size={16} />}
                                    value={watchedStudent.lastName || ''}
                                    onChange={(e) => setStudentValue('lastName', e.target.value)}
                                    error={studentErrors.lastName?.message}
                                    fullWidth
                                />
                            </div>

                            <div className={styles.field}>
                                <Input
                                    label="Nome do Meio"
                                    placeholder="Ex: Carlos"
                                    leftIcon={<User size={16} />}
                                    value={watchedStudent.middleName || ''}
                                    onChange={(e) => setStudentValue('middleName', e.target.value)}
                                    error={studentErrors.middleName?.message}
                                    fullWidth
                                />
                            </div>

                            <div className={styles.field}>
                                <Input
                                    label="Data de Nascimento *"
                                    type="date"
                                    leftIcon={<Calendar size={16} />}
                                    value={watchedStudent.birthDate || ''}
                                    onChange={(e) => setStudentValue('birthDate', e.target.value)}
                                    error={studentErrors.birthDate?.message}
                                    fullWidth
                                />
                            </div>

                            <div className={styles.field}>
                                <Select
                                    label="Género *"
                                    options={GENDER_OPTIONS}
                                    value={watchedStudent.gender || 'MALE'}
                                    onChange={(e) => setStudentValue('gender', e.target.value as any)}
                                    error={studentErrors.gender?.message}
                                    fullWidth
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
                                    label="Email"
                                    type="email"
                                    placeholder="Ex: estudante@email.com"
                                    leftIcon={<Mail size={16} />}
                                    value={watchedStudent.email || ''}
                                    onChange={(e) => setStudentValue('email', e.target.value)}
                                    error={studentErrors.email?.message}
                                    fullWidth
                                />
                            </div>

                            <div className={styles.field}>
                                <Input
                                    label="Telefone"
                                    placeholder="Ex: 84 123 4567"
                                    leftIcon={<Phone size={16} />}
                                    value={watchedStudent.phone || ''}
                                    onChange={(e) => setStudentValue('phone', e.target.value)}
                                    error={studentErrors.phone?.message}
                                    fullWidth
                                />
                            </div>

                            <div className={styles.field}>
                                <Input
                                    label="Naturalidade"
                                    placeholder="Ex: Maputo"
                                    leftIcon={<Globe size={16} />}
                                    value={watchedStudent.birthPlace || ''}
                                    onChange={(e) => setStudentValue('birthPlace', e.target.value)}
                                    error={studentErrors.birthPlace?.message}
                                    fullWidth
                                />
                            </div>

                            <div className={styles.field}>
                                <Input
                                    label="Nacionalidade"
                                    placeholder="Ex: Moçambicana"
                                    leftIcon={<Globe size={16} />}
                                    value={watchedStudent.nationality || ''}
                                    onChange={(e) => setStudentValue('nationality', e.target.value)}
                                    error={studentErrors.nationality?.message}
                                    fullWidth
                                />
                            </div>

                            <div className={styles.field}>
                                <Input
                                    label="Província"
                                    placeholder="Ex: Maputo"
                                    leftIcon={<MapPin size={16} />}
                                    value={watchedStudent.province || ''}
                                    onChange={(e) => setStudentValue('province', e.target.value)}
                                    error={studentErrors.province?.message}
                                    fullWidth
                                />
                            </div>

                            <div className={styles.field}>
                                <Input
                                    label="Distrito"
                                    placeholder="Ex: KaMpfumo"
                                    leftIcon={<MapPin size={16} />}
                                    value={watchedStudent.district || ''}
                                    onChange={(e) => setStudentValue('district', e.target.value)}
                                    error={studentErrors.district?.message}
                                    fullWidth
                                />
                            </div>

                            <div className={styles.field}>
                                <Select
                                    label="Tipo de Documento"
                                    options={DOCUMENT_TYPE_OPTIONS}
                                    value={watchedStudent.documentType || ''}
                                    onChange={(e) => setStudentValue('documentType', e.target.value as DocumentType | null)}
                                    error={studentErrors.documentType?.message}
                                    fullWidth
                                />
                            </div>

                            <div className={styles.field}>
                                <Input
                                    label="Número do Documento"
                                    placeholder="Ex: 123456789"
                                    leftIcon={<FileText size={16} />}
                                    value={watchedStudent.documentNumber || ''}
                                    onChange={(e) => setStudentValue('documentNumber', e.target.value)}
                                    error={studentErrors.documentNumber?.message}
                                    fullWidth
                                />
                            </div>

                            <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                                <Textarea
                                    label="Endereço"
                                    placeholder="Ex: Av. 25 de Setembro, 123"
                                    value={watchedStudent.address || ''}
                                    onChange={(e) => setStudentValue('address', e.target.value)}
                                    fullWidth
                                    rows={3}
                                />
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

                        <div className={styles.fields}>
                            <div className={styles.field}>
                                <Input
                                    label="Nome do Pai"
                                    placeholder="Ex: João Silva"
                                    leftIcon={<User size={16} />}
                                    value={watchedStudent.fatherFullName || ''}
                                    onChange={(e) => setStudentValue('fatherFullName', e.target.value)}
                                    error={studentErrors.fatherFullName?.message}
                                    fullWidth
                                />
                            </div>

                            <div className={styles.field}>
                                <Input
                                    label="Nome da Mãe"
                                    placeholder="Ex: Maria Silva"
                                    leftIcon={<User size={16} />}
                                    value={watchedStudent.motherFullName || ''}
                                    onChange={(e) => setStudentValue('motherFullName', e.target.value)}
                                    error={studentErrors.motherFullName?.message}
                                    fullWidth
                                />
                            </div>

                            <div className={styles.field}>
                                <Input
                                    label="Nome do Responsável"
                                    placeholder="Ex: Carlos Santos"
                                    leftIcon={<User size={16} />}
                                    value={watchedStudent.guardianName || ''}
                                    onChange={(e) => setStudentValue('guardianName', e.target.value)}
                                    error={studentErrors.guardianName?.message}
                                    fullWidth
                                />
                            </div>

                            <div className={styles.field}>
                                <Input
                                    label="Telefone do Responsável"
                                    placeholder="Ex: 84 123 4567"
                                    leftIcon={<Phone size={16} />}
                                    value={watchedStudent.guardianPhone || ''}
                                    onChange={(e) => setStudentValue('guardianPhone', e.target.value)}
                                    error={studentErrors.guardianPhone?.message}
                                    fullWidth
                                />
                            </div>

                            <div className={styles.field}>
                                <Input
                                    label="Parentesco"
                                    placeholder="Ex: Pai, Mãe, Tio"
                                    leftIcon={<Heart size={16} />}
                                    value={watchedStudent.guardianRelationship || ''}
                                    onChange={(e) => setStudentValue('guardianRelationship', e.target.value)}
                                    error={studentErrors.guardianRelationship?.message}
                                    fullWidth
                                />
                            </div>
                        </div>
                    </div>
                );

            case 4:
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
                            {studentType === 'new' && (
                                <>
                                    <div className={styles.field}>
                                        <Input
                                            label="Data de Admissão *"
                                            type="date"
                                            leftIcon={<Calendar size={16} />}
                                            value={watchedStudent.admissionDate || ''}
                                            onChange={(e) => setStudentValue('admissionDate', e.target.value)}
                                            error={studentErrors.admissionDate?.message}
                                            fullWidth
                                        />
                                    </div>

                                    <div className={styles.field}>
                                        <Select
                                            label="Status do Estudante"
                                            options={STUDENT_STATUS_OPTIONS}
                                            value={watchedStudent.studentStatus || 'ACTIVE'}
                                            onChange={(e) => setStudentValue('studentStatus', e.target.value as StudentStatus)}
                                            error={studentErrors.studentStatus?.message}
                                            fullWidth
                                        />
                                    </div>

                                    <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                                        <Textarea
                                            label="Observações"
                                            placeholder="Observações adicionais sobre o estudante"
                                            value={watchedStudent.remarks || ''}
                                            onChange={(e) => setStudentValue('remarks', e.target.value)}
                                            fullWidth
                                            rows={3}
                                        />
                                    </div>

                                    <div className={styles.field}>
                                        <label className={styles.toggleLabel}>
                                            <input
                                                type="checkbox"
                                                checked={watchedStudent.isActive ?? true}
                                                onChange={(e) => setStudentValue('isActive', e.target.checked)}
                                            />
                                            <span>Estudante Ativo</span>
                                        </label>
                                        <p className={styles.toggleHelp}>
                                            Estudantes inativos não aparecem nas listas do sistema
                                        </p>
                                    </div>
                                </>
                            )}

                            <div className={styles.field}>
                                <Select
                                    label="Classe *"
                                    options={[
                                        { value: '', label: 'Selecione uma classe...' },
                                        ...gradeOptions,
                                    ]}
                                    value={watchedEnrollment.gradeUuid || ''}
                                    onChange={(e) => setEnrollmentValue('gradeUuid', e.target.value)}
                                    error={enrollmentErrors.gradeUuid?.message}
                                    fullWidth
                                    disabled={isLoadingGrades || !isDataLoaded}
                                />
                            </div>

                            <div className={styles.field}>
                                <Select
                                    label="Turma *"
                                    options={[
                                        { value: '', label: 'Selecione uma turma...' },
                                        ...classOptions,
                                    ]}
                                    value={watchedEnrollment.classUuid || ''}
                                    onChange={(e) => setEnrollmentValue('classUuid', e.target.value)}
                                    error={enrollmentErrors.classUuid?.message}
                                    fullWidth
                                    disabled={!watchedEnrollment.gradeUuid || isLoadingClasses || !isDataLoaded}
                                />
                            </div>

                            <div className={styles.field}>
                                <Input
                                    label="Data da Matrícula *"
                                    type="date"
                                    leftIcon={<Calendar size={16} />}
                                    value={formatDateToInput(watchedEnrollment.enrollmentDate)}
                                    onChange={(e) => setEnrollmentValue('enrollmentDate', e.target.value)}
                                    error={enrollmentErrors.enrollmentDate?.message}
                                    fullWidth
                                />
                            </div>

                            <div className={styles.field}>
                                <Select
                                    label="Status da Matrícula *"
                                    options={ENROLLMENT_STATUS_OPTIONS}
                                    value={watchedEnrollment.enrollmentStatus || 'ACTIVE'}
                                    onChange={(e) => setEnrollmentValue('enrollmentStatus', e.target.value)}
                                    error={enrollmentErrors.enrollmentStatus?.message}
                                    fullWidth
                                />
                            </div>

                            <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                                <Textarea
                                    label="Observações da Matrícula"
                                    placeholder="Observações adicionais sobre a matrícula"
                                    value={watchedEnrollment.remarks || ''}
                                    onChange={(e) => setEnrollmentValue('remarks', e.target.value)}
                                    fullWidth
                                    rows={2}
                                />
                            </div>
                        </div>
                    </div>
                );

            case 5:
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
        if (isEditing) return isSubmitting;
        if (currentStep === 5) {
            return !studentRole || isLoadingConfig || isSubmitting;
        }
        if (currentStep === 0 && studentType === 'existing' && !selectedStudent) {
            return true;
        }
        return isSubmitting;
    };

    const shouldShowNext = () => {
        if (isEditing) return false;
        if (studentType === 'existing' && currentStep > 0 && currentStep < 4) {
            return false;
        }
        return true;
    };

    const getButtonLabel = () => {
        if (isEditing) return 'Atualizar Matrícula';
        if (isLastStep) return 'Matricular';
        return 'Próximo';
    };

    const renderActions = () => {
        return (
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
                    {!isEditing && !isFirstStep && shouldShowNext() && (
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handlePrevious}
                            icon={<ChevronLeft size={18} />}
                            disabled={isSubmitting}
                        >
                            Anterior
                        </Button>
                    )}
                    <Button
                        type="button"
                        variant="primary"
                        onClick={handleNext}
                        icon={isLastStep || isEditing ? <CheckCircle size={18} /> : <ChevronRight size={18} />}
                        isLoading={isSubmitting}
                        disabled={isNextDisabled()}
                    >
                        {getButtonLabel()}
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <>
            <form className={styles.form} onSubmit={handleFormSubmit}>
                {!isEditing && (
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
                                const isHidden = studentType === 'existing' && index > 0 && index < 4;

                                if (isHidden) return null;

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
                )}

                <div className={styles.stepContainer}>
                    {renderStep()}
                </div>

                {renderActions()}
            </form>

            {credentials && (
                <CredentialsModal
                    isOpen={showCredentialsModal}
                    onClose={handleCredentialsClose}
                    studentName={selectedStudent?.studentName || `${watchedStudent.firstName} ${watchedStudent.lastName}`}
                    username={credentials.username}
                    temporaryPassword={credentials.temporaryPassword}
                    enrollmentNumber={credentials.enrollmentNumber}
                />
            )}
        </>
    );
};