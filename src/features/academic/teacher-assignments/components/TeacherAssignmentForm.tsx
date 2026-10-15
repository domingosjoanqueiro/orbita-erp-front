// src/features/academic/teacher-assignments/components/TeacherAssignmentForm.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
    User,
    X,
    CheckCircle,
    Calendar,
    BookOpen,
    Users,
    Clock,
    Award,
    ChevronRight,
    ChevronLeft,
    Plus,
    Trash2,
    Layers,
    CalendarDays,
} from 'lucide-react';
import { Input } from '@/shared/components/ui/Input/Input';
import { Select } from '@/shared/components/ui/Select/Select';
import { Button } from '@/shared/components/ui/Button/Button';
import { Badge } from '@/shared/components/ui/Badge/Badge';
import { useToast } from '@/shared/contexts/ToastContext';
import { useLoading } from '@/shared/contexts/LoadingContext';
import { teacherAssignmentService } from '../services/teacher-assignment.service';
import { teacherService } from '@/features/academic/teachers/services/teacher.service';
import type {
    TeacherAssignment,
    CreateTeacherAssignmentRequest,
    TeacherOption,
    AcademicYearOption,
    GradeOption,
    ClassOption,
    GradeSubjectOption,
    UpdateTeacherAssignmentRequest,
} from '../types/teacher-assignment.types';
import styles from './TeacherAssignmentForm.module.css';

interface TeacherAssignmentFormProps {
    onSuccess: () => void;
    onCancel: () => void;
    assignmentToEdit?: TeacherAssignment | null;
    isEditing?: boolean;
    preselectedClass?: string;
    preselectedTeacher?: string;
    preselectedAcademicYear?: string;
}

// ✅ Tipos do formulário
interface FormData {
    teacherUuid: string;
    academicYearUuid: string;
    gradeUuid: string;
    classUuid: string;
    subjectUuid: string;
    startDate: string;
    endDate?: string;
    isClassDirector: boolean;
    isActive: boolean;
}

// ✅ Step configuration
interface Step {
    id: string;
    title: string;
    icon: React.FC<{ size?: number; className?: string }>;
    description: string;
}

const STEPS: Step[] = [
    {
        id: 'academicYear',
        title: 'Ano Letivo',
        icon: CalendarDays,
        description: 'Selecione o ano letivo',
    },
    {
        id: 'teacher',
        title: 'Professor',
        icon: User,
        description: 'Selecione o professor',
    },
    {
        id: 'grade',
        title: 'Classe',
        icon: Layers,
        description: 'Selecione a classe',
    },
    {
        id: 'class',
        title: 'Turma',
        icon: Users,
        description: 'Selecione a turma',
    },
    {
        id: 'subject',
        title: 'Disciplina',
        icon: BookOpen,
        description: 'Selecione a disciplina',
    },
    {
        id: 'details',
        title: 'Período',
        icon: Calendar,
        description: 'Configure o período da atribuição',
    },
];

export const TeacherAssignmentForm: React.FC<TeacherAssignmentFormProps> = ({
    onSuccess,
    onCancel,
    assignmentToEdit,
    isEditing = false,
    preselectedClass,
    preselectedTeacher,
    preselectedAcademicYear,
}) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ✅ Dados das opções
    const [academicYears, setAcademicYears] = useState<AcademicYearOption[]>([]);
    const [teachers, setTeachers] = useState<TeacherOption[]>([]);
    const [grades, setGrades] = useState<GradeOption[]>([]);
    const [filteredClasses, setFilteredClasses] = useState<ClassOption[]>([]);
    const [filteredGradeSubjects, setFilteredGradeSubjects] = useState<GradeSubjectOption[]>([]);

    const [isLoadingAcademicYears, setIsLoadingAcademicYears] = useState(false);
    const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
    const [isLoadingGrades, setIsLoadingGrades] = useState(false);
    const [isLoadingClasses, setIsLoadingClasses] = useState(false);
    const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [isPopulating, setIsPopulating] = useState(false);

    const { showSuccess, showError } = useToast();
    const { startLoading, stopLoading } = useLoading();

    // ✅ Formulário
    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        setValue,
        getValues,
        reset,
        trigger,
    } = useForm<FormData>({
        defaultValues: {
            teacherUuid: preselectedTeacher || '',
            academicYearUuid: preselectedAcademicYear || '',
            gradeUuid: '',
            classUuid: preselectedClass || '',
            subjectUuid: '',
            startDate: '',
            endDate: '',
            isClassDirector: false,
            isActive: true,
        },
    });

    const watchedAcademicYear = watch('academicYearUuid');
    const watchedTeacher = watch('teacherUuid');
    const watchedGrade = watch('gradeUuid');
    const watchedClass = watch('classUuid');
    const watchedSubject = watch('subjectUuid');

    // ✅ Função para formatar datas - VERSÃO ULTRA ROBUSTA
    const formatDate = (dateStr: any): string => {
        if (!dateStr) return '';
        
        console.log('📅 Formatando data:', dateStr, 'tipo:', typeof dateStr);
        
        try {
            let date: Date;
            
            // Caso 1: Já é um objeto Date
            if (dateStr instanceof Date) {
                date = dateStr;
            }
            // Caso 2: É um número (timestamp)
            else if (typeof dateStr === 'number') {
                date = new Date(dateStr);
            }
            // Caso 3: É uma string
            else if (typeof dateStr === 'string') {
                // Remove espaços extras
                const cleanStr = dateStr.trim();
                
                // Verifica se já está no formato YYYY-MM-DD
                if (cleanStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    return cleanStr;
                }
                
                // Verifica se está no formato DD/MM/YYYY
                if (cleanStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                    const parts = cleanStr.split('/');
                    return `${parts[2]}-${parts[1]}-${parts[0]}`;
                }
                
                // Verifica se está no formato DD-MM-YYYY
                if (cleanStr.match(/^\d{2}-\d{2}-\d{4}$/)) {
                    const parts = cleanStr.split('-');
                    return `${parts[2]}-${parts[1]}-${parts[0]}`;
                }
                
                // Tenta extrair a data de uma string ISO
                const datePart = cleanStr.split('T')[0];
                if (datePart && datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    return datePart;
                }
                
                // Tenta criar uma data a partir da string
                date = new Date(cleanStr);
            }
            // Caso 4: Outro tipo
            else {
                console.warn('⚠️ Tipo de data não reconhecido:', typeof dateStr);
                return '';
            }
            
            // Verifica se a data é válida
            if (!date || isNaN(date.getTime())) {
                console.warn('⚠️ Data inválida após conversão:', dateStr);
                return '';
            }
            
            // Formata como YYYY-MM-DD
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const formatted = `${year}-${month}-${day}`;
            
            console.log('📅 Data formatada com sucesso:', formatted);
            return formatted;
        } catch (error) {
            console.error('❌ Erro ao formatar data:', dateStr, error);
            return '';
        }
    };

    // ✅ Carregar dados iniciais
    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoadingAcademicYears(true);
                setIsLoadingTeachers(true);
                setIsLoadingGrades(true);

                // Carregar Anos Académicos ativos
                const academicYearsData = await teacherAssignmentService.getAvailableAcademicYears();
                console.log('📥 Academic Years fetched:', academicYearsData);
                const activeAcademicYears = academicYearsData.filter(y => y.isActive);
                setAcademicYears(activeAcademicYears);

                // Se tiver anos ativos e não tiver preselecionado, selecionar o primeiro
                if (activeAcademicYears.length > 0 && !preselectedAcademicYear) {
                    setValue('academicYearUuid', activeAcademicYears[0].uuid);
                }

                // Carregar professores ativos
                const teachersResponse = await teacherService.getAll({ isActive: true, limit: 100 });
                const teacherOptions = (teachersResponse.data || []).map(t => ({
                    uuid: t.uuid,
                    label: `${t.firstName} ${t.middleName} ${t.lastName} (${t.teacherNumber})`,
                    teacherNumber: t.teacherNumber,
                    fullName: t.firstName + ' ' + t.middleName + ' ' + t.lastName,
                }));
                setTeachers(teacherOptions);

                // Carregar Classes (Grades)
                const gradesData = await teacherAssignmentService.getAvailableGrades();
                setGrades(gradesData || []);

                setIsDataLoaded(true);
                console.log('✅ Dados carregados:', {
                    academicYears: activeAcademicYears.length,
                    teachers: teacherOptions.length,
                    grades: gradesData.length,
                });

                // ✅ Se for edição, preencher os dados APÓS carregar os dados
                if (isEditing && assignmentToEdit) {
                    await populateEditForm(assignmentToEdit);
                }

            } catch (error) {
                console.error('Erro ao carregar dados:', error);
                showError('Erro', 'Não foi possível carregar os dados');
            } finally {
                setIsLoadingAcademicYears(false);
                setIsLoadingTeachers(false);
                setIsLoadingGrades(false);
            }
        };
        loadData();
    }, []);

    // ✅ Monitorar mudanças no assignmentToEdit
    useEffect(() => {
        if (isEditing && assignmentToEdit && isDataLoaded) {
            console.log('🔄 assignmentToEdit mudou, populando formulário...');
            populateEditForm(assignmentToEdit);
        }
    }, [assignmentToEdit, isEditing, isDataLoaded]);

    // ✅ Carregar turmas quando a classe mudar
    useEffect(() => {
        if (watchedGrade) {
            const loadClasses = async () => {
                try {
                    setIsLoadingClasses(true);
                    const classesData = await teacherAssignmentService.getAvailableClassesByGrade(watchedGrade);
                    setFilteredClasses(classesData || []);
                    
                    // Se tiver apenas uma turma, selecionar automaticamente
                    if (classesData.length === 1 && !isEditing) {
                        setValue('classUuid', classesData[0].uuid);
                    }
                } catch (error) {
                    console.error('Erro ao carregar turmas:', error);
                    showError('Erro', 'Não foi possível carregar as turmas');
                } finally {
                    setIsLoadingClasses(false);
                }
            };
            loadClasses();
        } else {
            setFilteredClasses([]);
            setValue('classUuid', '');
        }
    }, [watchedGrade]);

    // ✅ Carregar disciplinas disponíveis quando a turma mudar
    useEffect(() => {
        if (watchedClass) {
            const loadSubjects = async () => {
                try {
                    setIsLoadingSubjects(true);
                    const subjects = await teacherAssignmentService.getAvailableGradeSubjects(watchedClass);
                    setFilteredGradeSubjects(subjects || []);
                    
                    // Se tiver apenas uma disciplina, selecionar automaticamente
                    if (subjects.length === 1 && !isEditing) {
                        setValue('subjectUuid', subjects[0].uuid);
                    }
                } catch (error) {
                    console.error('Erro ao carregar disciplinas:', error);
                    showError('Erro', 'Não foi possível carregar as disciplinas');
                } finally {
                    setIsLoadingSubjects(false);
                }
            };
            loadSubjects();
        } else {
            setFilteredGradeSubjects([]);
            setValue('subjectUuid', '');
        }
    }, [watchedClass]);

    // ✅ Preencher formulário de edição - Versão melhorada
const populateEditForm = async (assignment: TeacherAssignment) => {
    if (isPopulating) return;
    
    console.log('🔄 Populando formulário de edição:', assignment);
    
    if (!assignment || !assignment.uuid) {
        console.warn('⚠️ Assignment inválido para edição');
        return;
    }

    try {
        setIsPopulating(true);

        // ✅ Buscar todas as turmas para encontrar a classe
        const allClasses = await teacherAssignmentService.getAvailableClasses();
        const classItem = allClasses.find(c => c.uuid === assignment.classUuid);
        const gradeUuid = classItem?.gradeUuid || '';

        console.log('📌 Class encontrada:', { classItem, gradeUuid });

        // ✅ Carregar turmas para a classe selecionada
        if (gradeUuid) {
            const classesData = await teacherAssignmentService.getAvailableClassesByGrade(gradeUuid);
            setFilteredClasses(classesData || []);
            console.log('📌 Turmas carregadas:', classesData);
        }

        // ✅ Carregar disciplinas para a turma selecionada
        if (assignment.classUuid) {
            const subjects = await teacherAssignmentService.getAvailableGradeSubjects(assignment.classUuid);
            setFilteredGradeSubjects(subjects || []);
            console.log('📌 Disciplinas carregadas:', subjects);
        }

        // ✅ Formatar datas
        const startDateFormatted = formatDate(assignment.startDate);
        const endDateFormatted = formatDate(assignment.endDate);

        console.log('📌 Datas formatadas:', { 
            startDateOriginal: assignment.startDate, 
            startDateFormatted,
            endDateOriginal: assignment.endDate,
            endDateFormatted 
        });

        // ✅ Converter para booleano (tratar números 0/1 e valores truthy/falsy)
        const isClassDirectorBoolean = Boolean(assignment.isClassDirector);
        const isActiveBoolean = assignment.isActive !== undefined ? Boolean(assignment.isActive) : true;

        console.log('📌 Boolean convertidos:', {
            isClassDirectorOriginal: assignment.isClassDirector,
            isClassDirectorBoolean,
            isActiveOriginal: assignment.isActive,
            isActiveBoolean
        });

        // ✅ Resetar o formulário com os dados
        reset({
            teacherUuid: assignment.teacherUuid || '',
            academicYearUuid: assignment.academicYearUuid || '',
            gradeUuid: gradeUuid,
            classUuid: assignment.classUuid || '',
            subjectUuid: assignment.subjectUuid || '',
            startDate: startDateFormatted,
            endDate: endDateFormatted,
            isClassDirector: isClassDirectorBoolean,
            isActive: isActiveBoolean,
        });

        console.log('✅ Formulário populado com sucesso');
    } catch (error) {
        console.error('❌ Erro ao popular formulário:', error);
        showError('Erro', 'Não foi possível carregar os dados para edição');
    } finally {
        setIsPopulating(false);
    }
};

    // ✅ Handlers
    const handleAcademicYearChange = (value: string) => {
        setValue('academicYearUuid', value);
        trigger('academicYearUuid');
    };

    const handleTeacherChange = (value: string) => {
        setValue('teacherUuid', value);
        trigger('teacherUuid');
    };

    const handleGradeChange = (value: string) => {
        setValue('gradeUuid', value);
        setValue('classUuid', '');
        setValue('subjectUuid', '');
        trigger('gradeUuid');
    };

    const handleClassChange = (value: string) => {
        setValue('classUuid', value);
        setValue('subjectUuid', '');
        trigger('classUuid');
    };

    const handleSubjectChange = (value: string) => {
        setValue('subjectUuid', value);
        trigger('subjectUuid');
    };

    // ✅ Validar step atual
    const validateStep = async (step: number): Promise<boolean> => {
        const values = getValues();

        switch (step) {
            case 0:
                if (!values.academicYearUuid) {
                    showError('Validação', 'Selecione um ano letivo');
                    return false;
                }
                return true;
            case 1:
                if (!values.teacherUuid) {
                    showError('Validação', 'Selecione um professor');
                    return false;
                }
                return true;
            case 2:
                if (!values.gradeUuid) {
                    showError('Validação', 'Selecione uma classe');
                    return false;
                }
                return true;
            case 3:
                if (!values.classUuid) {
                    showError('Validação', 'Selecione uma turma');
                    return false;
                }
                return true;
            case 4:
                if (!values.subjectUuid) {
                    showError('Validação', 'Selecione uma disciplina');
                    return false;
                }
                return true;
            case 5:
                if (!values.startDate) {
                    showError('Validação', 'Informe a data de início');
                    return false;
                }
                if (values.endDate && values.endDate < values.startDate) {
                    showError('Validação', 'A data de fim deve ser posterior à data de início');
                    return false;
                }
                return true;
            default:
                return true;
        }
    };

    // ✅ Avançar step
    const handleNext = async () => {
        const isValid = await validateStep(currentStep);
        if (isValid) {
            if (currentStep === STEPS.length - 1) {
                const isFormValid = await trigger();
                if (isFormValid) {
                    handleSubmit(onSubmit)();
                } else {
                    showError('Validação', 'Preencha todos os campos obrigatórios');
                }
            } else {
                setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
            }
        }
    };

    // ✅ Voltar step
    const handlePrevious = () => {
        setCurrentStep(prev => Math.max(prev - 1, 0));
    };

    // ✅ Submit
const onSubmit = async (data: FormData) => {
    if (isSubmitting) return;

    try {
        setIsSubmitting(true);
        startLoading();

        // ✅ Garantir que os booleanos sejam enviados corretamente
        const payload: CreateTeacherAssignmentRequest = {
            teacherUuid: data.teacherUuid,
            academicYearUuid: data.academicYearUuid,
            classUuid: data.classUuid,
            subjectUuid: data.subjectUuid,
            startDate: data.startDate,
            isClassDirector: Boolean(data.isClassDirector),
            isActive: Boolean(data.isActive),
        };

        if (data.endDate && data.endDate.trim() !== '') {
            if (data.endDate > data.startDate) {
                payload.endDate = data.endDate;
            } else {
                showError('Validação', 'A data de fim deve ser posterior à data de início');
                return;
            }
        }

        let response;

        if (isEditing && assignmentToEdit) {
            const updatePayload: UpdateTeacherAssignmentRequest = {
                teacherUuid: data.teacherUuid,
                academicYearUuid: data.academicYearUuid,
                classUuid: data.classUuid,
                subjectUuid: data.subjectUuid,
                startDate: data.startDate,
                isClassDirector: Boolean(data.isClassDirector),
                isActive: Boolean(data.isActive),
            };

            if (data.endDate && data.endDate.trim() !== '') {
                if (data.endDate > data.startDate) {
                    updatePayload.endDate = data.endDate;
                } else {
                    showError('Validação', 'A data de fim deve ser posterior à data de início');
                    return;
                }
            }

            response = await teacherAssignmentService.update(assignmentToEdit.uuid, updatePayload);
            showSuccess('Atribuição atualizada', 'Atribuição do professor atualizada com sucesso');
        } else {
            response = await teacherAssignmentService.create(payload);
            showSuccess('Atribuição criada', 'Professor atribuído com sucesso');
        }

        console.log('✅ Atribuição salva:', response);
        onSuccess();

    } catch (error: any) {
        console.error('Erro ao salvar atribuição:', error);
        let errorMessage = 'Erro ao salvar atribuição. Tente novamente.';
        if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
            if (errorMessage.includes('already assigned')) {
                errorMessage = 'Este professor já está atribuído a esta disciplina nesta turma para este ano letivo.';
            }
        }
        showError('Erro', errorMessage);
    } finally {
        setIsSubmitting(false);
        stopLoading();
    }
};

    // ✅ Renderizar step atual
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
                                <Select
                                    label="Ano Letivo *"
                                    options={[
                                        { value: '', label: 'Selecione um ano letivo...' },
                                        ...academicYears.map(ay => ({
                                            value: ay.uuid,
                                            label: `${ay.name} ${ay.isActive ? ' - Ativo' : ''}`,
                                        })),
                                    ]}
                                    value={watchedAcademicYear || ''}
                                    onChange={(e) => handleAcademicYearChange(e.target.value)}
                                    error={errors.academicYearUuid?.message}
                                    fullWidth
                                    disabled={isLoadingAcademicYears}
                                />
                                {isLoadingAcademicYears && (
                                    <p className={styles.fieldHint}>Carregando anos letivos...</p>
                                )}
                                {isEditing && (
                                    <p className={styles.fieldHint}>Ano letivo não pode ser alterado na edição</p>
                                )}
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
                                <Select
                                    label="Professor *"
                                    options={[
                                        { value: '', label: 'Selecione um professor...' },
                                        ...teachers.map(t => ({
                                            value: t.uuid,
                                            label: t.label,
                                        })),
                                    ]}
                                    value={watchedTeacher || ''}
                                    onChange={(e) => handleTeacherChange(e.target.value)}
                                    error={errors.teacherUuid?.message}
                                    fullWidth
                                    disabled={isLoadingTeachers}
                                />
                                {isEditing && (
                                    <p className={styles.fieldHint}>Para alterar, edite diretamente na lista.</p>
                                )}
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
                                <Select
                                    label="Classe *"
                                    options={[
                                        { value: '', label: 'Selecione uma classe...' },
                                        ...grades.map(g => ({
                                            value: g.uuid,
                                            label: `${g.name} (${g.code})`,
                                        })),
                                    ]}
                                    value={watchedGrade || ''}
                                    onChange={(e) => handleGradeChange(e.target.value)}
                                    error={errors.gradeUuid?.message}
                                    fullWidth
                                    disabled={isLoadingGrades}
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
                                <Select
                                    label="Turma *"
                                    options={[
                                        { value: '', label: 'Selecione uma turma...' },
                                        ...filteredClasses.map(c => ({
                                            value: c.uuid,
                                            label: `${c.name}`,
                                        })),
                                    ]}
                                    value={watchedClass || ''}
                                    onChange={(e) => handleClassChange(e.target.value)}
                                    error={errors.classUuid?.message}
                                    fullWidth
                                    disabled={!watchedGrade || isLoadingClasses}
                                />
                                {!watchedGrade && (
                                    <p className={styles.fieldHint}>Selecione uma classe primeiro</p>
                                )}
                                {isLoadingClasses && (
                                    <p className={styles.fieldHint}>Carregando turmas...</p>
                                )}
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
                            <div className={styles.field}>
                                <Select
                                    label="Disciplina *"
                                    options={[
                                        { value: '', label: 'Selecione uma disciplina...' },
                                        ...filteredGradeSubjects.map(s => ({
                                            value: s.uuid,
                                            label: `${s.subject_name} (${s.grade_name}) - ${s.weekly_workload}h`,
                                        })),
                                    ]}
                                    value={watchedSubject || ''}
                                    onChange={(e) => handleSubjectChange(e.target.value)}
                                    error={errors.subjectUuid?.message}
                                    fullWidth
                                    disabled={!watchedClass || isLoadingSubjects}
                                />
                                {!watchedClass && (
                                    <p className={styles.fieldHint}>Selecione uma turma primeiro</p>
                                )}
                                {isLoadingSubjects && (
                                    <p className={styles.fieldHint}>Carregando disciplinas...</p>
                                )}
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

                        <div className={styles.fields}>
                            <div className={styles.field}>
                                <Input
                                    label="Data de Início *"
                                    type="date"
                                    value={watch('startDate') || ''}
                                    onChange={(e) => {
                                        setValue('startDate', e.target.value);
                                        trigger('startDate');
                                    }}
                                    error={errors.startDate?.message}
                                    fullWidth
                                    required
                                />
                                {!watch('startDate') && (
                                    <p className={styles.fieldError}>Data de início é obrigatória</p>
                                )}
                            </div>

                            <div className={styles.field}>
                                <Input
                                    label="Data de Fim"
                                    type="date"
                                    value={watch('endDate') || ''}
                                    onChange={(e) => {
                                        setValue('endDate', e.target.value);
                                        trigger('endDate');
                                    }}
                                    error={errors.endDate?.message}
                                    fullWidth
                                />
                                <p className={styles.fieldHint}>Deixe em branco para atribuição sem data de término</p>
                            </div>

                            <div className={styles.field}>
                                <label className={styles.toggleLabel}>
                                    <input
                                        type="checkbox"
                                        checked={watch('isClassDirector') || false}
                                        onChange={(e) => setValue('isClassDirector', e.target.checked)}
                                    />
                                    <span>Diretor de Turma</span>
                                </label>
                                <p className={styles.toggleHelp}>
                                    Define este professor como diretor da turma
                                </p>
                            </div>

                            <div className={styles.field}>
                                <label className={styles.toggleLabel}>
                                    <input
                                        type="checkbox"
                                        checked={watch('isActive') !== false}
                                        onChange={(e) => setValue('isActive', e.target.checked)}
                                    />
                                    <span>Ativo</span>
                                </label>
                                <p className={styles.toggleHelp}>
                                    Atribuição ativa para o período selecionado
                                </p>
                            </div>

                            {/* Resumo da atribuição */}
                            <div className={styles.summary}>
                                <h4 className={styles.summaryTitle}>Resumo da Atribuição</h4>
                                <div className={styles.summaryGrid}>
                                    <div className={styles.summaryItem}>
                                        <span className={styles.summaryLabel}>Ano Letivo</span>
                                        <span className={styles.summaryValue}>
                                            {academicYears.find(ay => ay.uuid === watchedAcademicYear)?.name || '-'}
                                        </span>
                                    </div>
                                    <div className={styles.summaryItem}>
                                        <span className={styles.summaryLabel}>Professor</span>
                                        <span className={styles.summaryValue}>
                                            {teachers.find(t => t.uuid === watchedTeacher)?.label || '-'}
                                        </span>
                                    </div>
                                    <div className={styles.summaryItem}>
                                        <span className={styles.summaryLabel}>Classe</span>
                                        <span className={styles.summaryValue}>
                                            {grades.find(g => g.uuid === watchedGrade)?.name || '-'}
                                        </span>
                                    </div>
                                    <div className={styles.summaryItem}>
                                        <span className={styles.summaryLabel}>Turma</span>
                                        <span className={styles.summaryValue}>
                                            {filteredClasses.find(c => c.uuid === watchedClass)?.name || '-'}
                                        </span>
                                    </div>
                                    <div className={styles.summaryItem}>
                                        <span className={styles.summaryLabel}>Disciplina</span>
                                        <span className={styles.summaryValue}>
                                            {filteredGradeSubjects.find(s => s.uuid === watchedSubject)?.subject_name || '-'}
                                        </span>
                                    </div>
                                    <div className={styles.summaryItem}>
                                        <span className={styles.summaryLabel}>Data Início</span>
                                        <span className={styles.summaryValue}>
                                            {watch('startDate') ? new Date(watch('startDate') + 'T00:00:00').toLocaleDateString('pt-PT') : '-'}
                                        </span>
                                    </div>
                                    <div className={styles.summaryItem}>
                                        <span className={styles.summaryLabel}>Data Fim</span>
                                        <span className={styles.summaryValue}>
                                            {watch('endDate') ? new Date(watch('endDate') + 'T00:00:00').toLocaleDateString('pt-PT') : 'Sem data de fim'}
                                        </span>
                                    </div>
                                    <div className={styles.summaryItem}>
                                        <span className={styles.summaryLabel}>Diretor de Turma</span>
                                        <span className={styles.summaryValue}>
                                            {watch('isClassDirector') ? (
                                                <Badge variant="success" size="sm">Sim</Badge>
                                            ) : (
                                                <Badge variant="neutral" size="sm">Não</Badge>
                                            )}
                                        </span>
                                    </div>
                                    <div className={styles.summaryItem}>
                                        <span className={styles.summaryLabel}>Status</span>
                                        <span className={styles.summaryValue}>
                                            {watch('isActive') ? (
                                                <Badge variant="success" size="sm">Ativo</Badge>
                                            ) : (
                                                <Badge variant="error" size="sm">Inativo</Badge>
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
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

    return (
        <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
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
                        disabled={isSubmitting}
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
                            disabled={isSubmitting}
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
                        disabled={isSubmitting}
                    >
                        {isLastStep ? (isEditing ? 'Atualizar' : 'Atribuir') : 'Próximo'}
                    </Button>
                </div>
            </div>
        </form>
    );
};