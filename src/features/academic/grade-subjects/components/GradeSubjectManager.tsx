'use client';

import React, { useState, useEffect } from 'react';
import {
    BookOpen,
    GraduationCap,
    X,
    CheckCircle,
    Search,
    Loader2,
    AlertCircle,
    Clock,
} from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/Button';
import { Badge } from '@/shared/components/ui/Badge/Badge';
import { Input } from '@/shared/components/ui/Input/Input';
import { useToast } from '@/shared/contexts/ToastContext';
import { gradeSubjectService } from '../services/grade-subject.service';

import styles from './GradeSubjectManager.module.css';

interface SubjectItem {
    id: number;
    uuid: string;
    name: string;
    code: string;
    is_active?: boolean;
    weeklyWorkload?: number;
}

interface GradeSubjectManagerProps {
    gradeUuid: string;
    // Ano letivo do plano curricular a editar
    academicYearUuid?: string;
    gradeName: string;
    onClose: () => void;
    onSuccess?: () => void;
}

export const GradeSubjectManager: React.FC<GradeSubjectManagerProps> = ({
    gradeUuid,
    academicYearUuid,
    gradeName,
    onClose,
    onSuccess,
}) => {
    const { showSuccess, showError } = useToast();

    const [assignedSubjects, setAssignedSubjects] = useState<SubjectItem[]>([]);
    const [availableSubjects, setAvailableSubjects] = useState<SubjectItem[]>([]);
    const [allSubjects, setAllSubjects] = useState<SubjectItem[]>([]);
    const [filteredSubjects, setFilteredSubjects] = useState<SubjectItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    // ✅ Carga horária por disciplina
    const [workloads, setWorkloads] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!gradeUuid) {
            console.warn('⚠️ gradeUuid não fornecido');
            setIsLoading(false);
            setLoadError('ID da classe não fornecido');
            return;
        }
        loadData();
    }, [gradeUuid, academicYearUuid]);

    useEffect(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) {
            setFilteredSubjects(allSubjects);
            return;
        }
        const filtered = allSubjects.filter(
            (subject) =>
                subject.name.toLowerCase().includes(term) ||
                subject.code.toLowerCase().includes(term)
        );
        setFilteredSubjects(filtered);
    }, [searchTerm, allSubjects]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            setLoadError(null);

            const [assigned, available] = await Promise.all([
                gradeSubjectService.getAssignedSubjects(gradeUuid, academicYearUuid),
                gradeSubjectService.getAvailableSubjects(gradeUuid, academicYearUuid),
            ]);

            const assignedList = assigned || [];
            const availableList = available || [];

            setAssignedSubjects(assignedList);
            setAvailableSubjects(availableList);

            // ✅ Inicializar cargas horárias
            const initialWorkloads: Record<string, string> = {};
            assignedList.forEach(subject => {
                if (subject?.uuid) {
                    initialWorkloads[subject.uuid] = String(subject.weeklyWorkload || 0);
                }
            });
            setWorkloads(initialWorkloads);

            const subjectsMap = new Map<string, SubjectItem>();
            assignedList.forEach(subject => {
                if (subject?.uuid) subjectsMap.set(subject.uuid, subject);
            });
            availableList.forEach(subject => {
                if (subject?.uuid) subjectsMap.set(subject.uuid, subject);
            });

            const all = Array.from(subjectsMap.values());
            setAllSubjects(all);
            setFilteredSubjects(all);

            const assignedUuids = new Set(assignedList.map(subject => subject.uuid));
            setSelectedSubjects(assignedUuids);

            if (all.length === 0) {
                setLoadError('Nenhuma disciplina cadastrada no sistema');
            }
        } catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
            setLoadError('Não foi possível carregar as disciplinas');
            showError('Erro', 'Não foi possível carregar as disciplinas');
            setAllSubjects([]);
            setFilteredSubjects([]);
            setAssignedSubjects([]);
            setAvailableSubjects([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleSubject = (subjectUuid: string) => {
        setSelectedSubjects((previous) => {
            const next = new Set(previous);
            if (next.has(subjectUuid)) {
                next.delete(subjectUuid);
                // ✅ Remover carga horária se desmarcar
                setWorkloads(prev => {
                    const newWorkloads = { ...prev };
                    delete newWorkloads[subjectUuid];
                    return newWorkloads;
                });
            } else {
                next.add(subjectUuid);
                // ✅ Inicializar carga horária
                const existing = assignedSubjects.find(s => s.uuid === subjectUuid);
                setWorkloads(prev => ({
                    ...prev,
                    [subjectUuid]: String(existing?.weeklyWorkload || 0),
                }));
            }
            return next;
        });
    };

    const handleSelectAll = () => {
        const allUuids = allSubjects.map((subject) => subject.uuid);
        setSelectedSubjects(new Set(allUuids));

        const newWorkloads: Record<string, string> = {};
        allUuids.forEach(uuid => {
            const existing = assignedSubjects.find(s => s.uuid === uuid);
            newWorkloads[uuid] = String(existing?.weeklyWorkload || 0);
        });
        setWorkloads(prev => ({ ...prev, ...newWorkloads }));
    };

    const handleDeselectAll = () => {
        setSelectedSubjects(new Set());
        setWorkloads({});
    };

    const handleWorkloadChange = (subjectUuid: string, value: string) => {
        setWorkloads(prev => ({
            ...prev,
            [subjectUuid]: value,
        }));
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);

            // ✅ Disciplinas que realmente já estão atribuídas no backend
            const backendAssignedUuids = new Set(
                assignedSubjects.map((subject) => subject.uuid)
            );

            const currentSelected = selectedSubjects;

            const toAdd: string[] = [];
            const toRemove: string[] = [];

            // ✅ Selecionadas agora, mas que ainda não existem no backend
            currentSelected.forEach((uuid) => {
                if (!backendAssignedUuids.has(uuid)) {
                    toAdd.push(uuid);
                }
            });

            // ✅ Existiam no backend, mas foram desmarcadas
            backendAssignedUuids.forEach((uuid) => {
                if (!currentSelected.has(uuid)) {
                    toRemove.push(uuid);
                }
            });

            console.log('📌 Disciplinas já atribuídas:', [
                ...backendAssignedUuids,
            ]);

            console.log('➕ Para adicionar:', toAdd);
            console.log('➖ Para remover:', toRemove);
            console.log('📚 Cargas horárias:', workloads);

            const operations: Promise<any>[] = [];

            // ============================================
            // ADICIONAR NOVAS DISCIPLINAS
            // ============================================

            if (toAdd.length > 0) {
                const subjectsWithWorkload = toAdd.map((uuid) => ({
                    subjectUuid: uuid,
                    weeklyWorkload: parseInt(workloads[uuid] || '0', 10) || 0,
                }));

                console.log(
                    '📤 Criando alocações:',
                    {
                        gradeUuid,
                        subjects: subjectsWithWorkload,
                    }
                );

                operations.push(
                    gradeSubjectService.bulkCreateWithWorkload({
                        gradeUuid,
                        academicYearUuid,
                        subjects: subjectsWithWorkload,
                    })
                );
            }

            // ============================================
            // REMOVER DISCIPLINAS
            // ============================================

            if (toRemove.length > 0) {
                console.log('📤 Removendo alocações:', {
                    gradeUuid,
                    subjectUuids: toRemove,
                });

                operations.push(
                    gradeSubjectService.bulkRemove({
                        gradeUuid,
                        academicYearUuid,
                        subjectUuids: toRemove,
                    })
                );
            }

            // ============================================
            // ATUALIZAR CARGA HORÁRIA
            // ============================================

            const toUpdate = assignedSubjects
                .filter((subject) => currentSelected.has(subject.uuid))
                .filter((subject) => {
                    const currentWorkload =
                        parseInt(workloads[subject.uuid] || '0', 10) || 0;

                    return (
                        Number(subject.weeklyWorkload || 0) !== currentWorkload
                    );
                });

            for (const subject of toUpdate) {
                const newWorkload =
                    parseInt(workloads[subject.uuid] || '0', 10) || 0;

                console.log('🔄 Atualizando carga horária:', {
                    subjectUuid: subject.uuid,
                    weeklyWorkload: newWorkload,
                });

                operations.push(
                    gradeSubjectService.update(subject.uuid, {
                        weeklyWorkload: newWorkload,
                    })
                );
            }

            // ============================================
            // EXECUTAR OPERAÇÕES
            // ============================================

            if (operations.length > 0) {
                await Promise.all(operations);

                showSuccess(
                    'Associações atualizadas',
                    `Disciplinas da classe "${gradeName}" foram atualizadas com sucesso`
                );
            } else {
                showSuccess(
                    'Nenhuma alteração',
                    'Nenhuma alteração foi feita'
                );
            }

            // Recarregar dados
            await loadData();

            if (onSuccess) {
                onSuccess();
            }

        } catch (error: any) {
            console.error(
                '❌ Erro ao salvar associações:',
                error
            );

            console.error(
                '❌ Response:',
                error?.response?.data
            );

            showError(
                'Erro',
                error?.response?.data?.message ||
                'Erro ao salvar associações'
            );

        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <Loader2 size={32} className={styles.spinner} />
                <p>Carregando disciplinas...</p>
            </div>
        );
    }

    const totalSelected = selectedSubjects.size;
    const totalSubjects = allSubjects.length;
    const assignedCount = assignedSubjects.length;
    const totalWorkload = assignedSubjects.reduce((sum, s) => sum + (s.weeklyWorkload || 0), 0);

    return (
        <div className={styles.container}>
            {/* HEADER */}
            <div className={styles.header}>
                <div className={styles.headerInfo}>
                    <GraduationCap size={20} />
                    <div>
                        <h3 className={styles.title}>Gerenciar Disciplinas</h3>
                        <p className={styles.subtitle}>
                            Classe: <strong>{gradeName}</strong>
                        </p>
                    </div>
                </div>
                <button className={styles.closeButton} onClick={onClose}>
                    <X size={20} />
                </button>
            </div>

            {/* STATS */}
            <div className={styles.stats}>
                <div className={styles.statItem}>
                    <span className={styles.statLabel}>Total de Disciplinas</span>
                    <span className={styles.statValue}>{totalSubjects}</span>
                </div>
                <div className={styles.statItem}>
                    <span className={styles.statLabel}>Disciplinas Atribuídas</span>
                    <span className={styles.statValue}>{assignedCount}</span>
                </div>
                <div className={styles.statItem}>
                    <span className={styles.statLabel}>Carga Horária Total</span>
                    <span className={styles.statValue}>{totalWorkload}h</span>
                </div>
                <div className={styles.statItem}>
                    <span className={styles.statLabel}>Disciplinas Selecionadas</span>
                    <span className={`${styles.statValue} ${styles.statHighlight}`}>
                        {totalSelected}
                    </span>
                </div>
            </div>

            {/* TOOLBAR */}
            <div className={styles.toolbar}>
                <div className={styles.searchWrapper}>
                    <Search size={16} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Buscar disciplinas..."
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        className={styles.searchInput}
                    />
                </div>
                <div className={styles.toolbarActions}>
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleSelectAll}
                        disabled={allSubjects.length === 0}
                    >
                        Selecionar Todas
                    </Button>
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleDeselectAll}
                        disabled={selectedSubjects.size === 0}
                    >
                        Desmarcar Todas
                    </Button>
                </div>
            </div>

            {/* SUBJECT LIST */}
            <div className={styles.subjectList}>
                {loadError && totalSubjects === 0 ? (
                    <div className={styles.emptyState}>
                        <AlertCircle size={32} />
                        <p>{loadError}</p>
                    </div>
                ) : filteredSubjects.length === 0 ? (
                    <div className={styles.emptyState}>
                        <AlertCircle size={32} />
                        <p>
                            {searchTerm
                                ? 'Nenhuma disciplina encontrada com esse termo'
                                : 'Nenhuma disciplina cadastrada'}
                        </p>
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {filteredSubjects.map((subject) => {
                            const isSelected = selectedSubjects.has(subject.uuid);
                            const isBackendAssigned = availableSubjects.some(
                                (s) => s.uuid === subject.uuid
                            );
                            const assignedSubject = assignedSubjects.find(
                                (s) => s.uuid === subject.uuid
                            );

                            const workloadValue = workloads[subject.uuid] !== undefined
                                ? workloads[subject.uuid]
                                : String(assignedSubject?.weeklyWorkload || 0);

                            return (
                                <div
                                    key={subject.uuid}
                                    className={`${styles.subjectCard} ${isSelected ? styles.selected : ''
                                        }`}
                                >
                                    <div
                                        className={styles.subjectClickArea}
                                        onClick={() => handleToggleSubject(subject.uuid)}
                                    >
                                        <div className={styles.subjectContent}>
                                            <div className={styles.subjectIcon}>
                                                <BookOpen size={16} />
                                            </div>
                                            <div className={styles.subjectInfo}>
                                                <span className={styles.subjectName}>
                                                    {subject.name}
                                                </span>
                                                <span className={styles.subjectCode}>
                                                    {subject.code}
                                                </span>
                                            </div>
                                        </div>

                                        <div className={styles.subjectStatus}>
                                            {isSelected ? (
                                                <CheckCircle size={20} className={styles.checked} />
                                            ) : (
                                                <div className={styles.unchecked} />
                                            )}

                                            {isBackendAssigned && isSelected && (
                                                <Badge variant="info" size="sm">
                                                    Manter
                                                </Badge>
                                            )}

                                            {!isBackendAssigned && isSelected && (
                                                <Badge variant="success" size="sm">
                                                    Adicionar
                                                </Badge>
                                            )}

                                            {isBackendAssigned && !isSelected && (
                                                <Badge variant="warning" size="sm">
                                                    Remover
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* ✅ Campo de carga horária individual */}
                                    {isSelected && (
                                        <div className={styles.workloadInputRow}>
                                            <Clock size={14} className={styles.workloadInputRowIcon} />
                                            <Input
                                                type="number"
                                                value={workloadValue}
                                                onChange={(e) => handleWorkloadChange(subject.uuid, e.target.value)}
                                                min={0}
                                                max={40}
                                                placeholder="Carga horária"
                                                className={styles.workloadIndividualInput}
                                            />
                                            <span className={styles.workloadInputRowLabel}>h/semana</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* FOOTER */}
            <div className={styles.footer}>
                <div className={styles.footerInfo}>
                    {totalSelected} de {totalSubjects} disciplinas selecionadas
                    {assignedCount > 0 && ` · ${totalWorkload}h total`}
                </div>
                <div className={styles.footerActions}>
                    <Button variant="secondary" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        isLoading={isSaving}
                        icon={<CheckCircle size={18} />}
                    >
                        Salvar Associações
                    </Button>
                </div>
            </div>
        </div>
    );
};