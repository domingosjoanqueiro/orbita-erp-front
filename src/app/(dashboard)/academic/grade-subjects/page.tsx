'use client';

import React, { useState, useEffect } from 'react';
import {
    BookOpen,
    Plus,
    Search,
    Filter,
    ChevronDown,
    ChevronUp,
    Clock,
    CheckCircle,
    XCircle,
    Trash2,
    Power,
    PowerOff,
    LayoutGrid,
    List,
    GraduationCap,
    X,
    ChevronRight,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button/Button';
import { Badge } from '@/shared/components/ui/Badge/Badge';
import { Table } from '@/shared/components/ui/Table/Table';
import { Modal } from '@/shared/components/ui/Modal/Modal';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog/ConfirmDialog';
import { SkeletonCard } from '@/shared/components/ui/Skeleton/SkeletonCard';
import { Select } from '@/shared/components/ui/Select/Select';
import { useLoading } from '@/shared/contexts/LoadingContext';
import { useToast } from '@/shared/contexts/ToastContext';
import { gradeSubjectService } from '@/features/academic/grade-subjects/services/grade-subject.service';
import { GradeSubjectManager } from '@/features/academic/grade-subjects/components/GradeSubjectManager';
import type { GradeSubjectWithDetails, GradeSubjectFilters } from '@/features/academic/grade-subjects/types/grade-subject.types';
import styles from './page.module.css';

type ViewMode = 'cards' | 'table' | 'grouped';

interface Grade {
    id: number;
    uuid: string;
    name: string;
    code: string;
    order: number;
}

interface GroupedGrade {
    gradeUuid: string;
    gradeName: string;
    gradeCode: string;
    subjects: GradeSubjectWithDetails[];
    isExpanded: boolean;
}

const isActiveBoolean = (value: any): boolean => {
    if (value === undefined || value === null) return false;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
        const lower = value.toLowerCase().trim();
        return lower === '1' || lower === 'true' || lower === 'yes' || lower === 'on';
    }
    return false;
};

const getStatusBadge = (isActive: any) => {
    const active = isActiveBoolean(isActive);
    return (
        <Badge variant={active ? 'success' : 'error'} size="sm">
            <span className={styles.statusBadge}>
                {active ? <CheckCircle size={12} /> : <XCircle size={12} />}
                {active ? 'Ativa' : 'Inativa'}
            </span>
        </Badge>
    );
};

export default function GradeSubjectsPage() {
    const { startLoading, stopLoading, isLoading } = useLoading();
    const { showSuccess, showError } = useToast();

    const [associations, setAssociations] = useState<GradeSubjectWithDetails[]>([]);
    const [groupedAssociations, setGroupedAssociations] = useState<GroupedGrade[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [total, setTotal] = useState(0);
    const [filters, setFilters] = useState<GradeSubjectFilters>({
        page: 1,
        limit: 100,
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedGradeUuid, setSelectedGradeUuid] = useState<string | null>(null);
    const [selectedGradeName, setSelectedGradeName] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('grouped');

    const [showClassSelector, setShowClassSelector] = useState(false);
    const [tempSelectedClass, setTempSelectedClass] = useState<string>('');

    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        type: 'delete' | 'toggle';
        uuid?: string;
        name?: string;
        isActive?: boolean;
    }>({ isOpen: false, type: 'delete' });

    // Carregar grades
    useEffect(() => {
        const loadGrades = async () => {
            try {
                const gradesData = await gradeSubjectService.getAllGrades();
                setGrades(gradesData);
                console.log('📚 Grades carregadas:', gradesData);
            } catch (error) {
                console.error('Erro ao carregar grades:', error);
                showError('Erro', 'Não foi possível carregar as classes');
            }
        };
        loadGrades();
    }, []);

    const loadAssociations = async () => {
        try {
            startLoading();
            const response = await gradeSubjectService.getAll({
                ...filters,
                search: searchTerm || undefined,
            });
            const dataArray = response?.data || [];
            const mappedData = dataArray.map((a: any) => ({
                ...a,
                isActive: isActiveBoolean(a.isActive)
            }));
            setAssociations(mappedData);
            setTotal(response?.total || 0);

            const grouped = groupByGrade(mappedData);
            setGroupedAssociations(grouped);
        } catch (error: any) {
            console.error('Erro ao carregar associações:', error);
            showError('Erro', 'Não foi possível carregar as associações');
            setAssociations([]);
            setTotal(0);
        } finally {
            stopLoading();
        }
    };

    const groupByGrade = (data: GradeSubjectWithDetails[]): GroupedGrade[] => {
        const gradeMap = new Map<string, GroupedGrade>();

        data.forEach((item) => {
            const key = item.gradeUuid || item.gradeId?.toString() || 'unknown';

            if (!gradeMap.has(key)) {
                gradeMap.set(key, {
                    gradeUuid: key,
                    gradeName: item.gradeName || 'Classe sem nome',
                    gradeCode: item.gradeCode || '',
                    subjects: [],
                    isExpanded: false,
                });
            }

            gradeMap.get(key)!.subjects.push(item);
        });

        return Array.from(gradeMap.values()).sort((a, b) =>
            a.gradeName.localeCompare(b.gradeName)
        );
    };

    const toggleGradeExpansion = (gradeUuid: string) => {
        setGroupedAssociations(prev =>
            prev.map(group =>
                group.gradeUuid === gradeUuid
                    ? { ...group, isExpanded: !group.isExpanded }
                    : group
            )
        );
    };

    useEffect(() => {
        loadAssociations();
    }, [filters.page, filters.limit, filters.isActive, filters.gradeUuid]);

    const handleSearch = () => {
        setFilters({ ...filters, page: 1 });
        loadAssociations();
    };

    const handleOpenManager = (gradeData?: Grade) => {
        if (gradeData) {
            setSelectedGradeUuid(gradeData.uuid);
            setSelectedGradeName(gradeData.name);
            setIsModalOpen(true);
        } else {
            setTempSelectedClass('');
            setShowClassSelector(true);
        }
    };

    const handleConfirmClassSelection = () => {
        if (!tempSelectedClass) {
            showError('Erro', 'Por favor, selecione uma classe');
            return;
        }

        const selectedGrade = grades.find(g => g.uuid === tempSelectedClass);
        if (selectedGrade) {
            setSelectedGradeUuid(selectedGrade.uuid);
            setSelectedGradeName(selectedGrade.name);
            setShowClassSelector(false);
            setIsModalOpen(true);
        }
    };

    const handleCloseManager = () => {
        setIsModalOpen(false);
        setShowClassSelector(false);
        setSelectedGradeUuid(null);
        setSelectedGradeName('');
        setTempSelectedClass('');
    };

    const handleDelete = (association: GradeSubjectWithDetails) => {
        setConfirmDialog({
            isOpen: true,
            type: 'delete',
            uuid: association.uuid,
            name: `${association.gradeName} - ${association.subjectName}`,
        });
    };

    const handleToggleActive = (association: GradeSubjectWithDetails) => {
        setConfirmDialog({
            isOpen: true,
            type: 'toggle',
            uuid: association.uuid,
            name: `${association.gradeName} - ${association.subjectName}`,
            isActive: association.isActive,
        });
    };

    const handleConfirmAction = async () => {
        const { type, uuid, name, isActive } = confirmDialog;
        try {
            startLoading();
            if (type === 'delete') {
                await gradeSubjectService.remove(uuid!);
                showSuccess('Associação removida', `Associação ${name} foi removida`);
            } else if (type === 'toggle') {
                await gradeSubjectService.toggleStatus(uuid!, !isActive);
                const newStatus = isActive ? 'desativada' : 'ativada';
                showSuccess(`Associação ${newStatus}`, `Associação ${name} foi ${newStatus}`);
            }
            setConfirmDialog({ isOpen: false, type: 'delete' });
            loadAssociations();
        } catch (error: any) {
            console.error('Erro:', error);
            showError('Erro', error.response?.data?.message || 'Ocorreu um erro');
        } finally {
            stopLoading();
        }
    };

    const formatDate = (date: string) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const renderGroupedView = () => {
        if (groupedAssociations.length === 0) {
            return <EmptyState />;
        }

        return (
            <div className={styles.groupedContainer}>
                {groupedAssociations.map((group) => {
                    // Encontrar a grade correspondente para abrir o gerenciador
                    const grade = grades.find(g => g.uuid === group.gradeUuid);

                    return (
                        <div key={group.gradeUuid} className={styles.gradeGroup}>
                            {/* Cabeçalho da Classe */}
                            <div
                                className={styles.gradeGroupHeader}
                                onClick={() => toggleGradeExpansion(group.gradeUuid)}
                            >
                                <div className={styles.gradeGroupHeaderLeft}>
                                    <GraduationCap size={20} className={styles.gradeGroupIcon} />
                                    <div>
                                        <span className={styles.gradeGroupName}>{group.gradeName}</span>
                                        <span className={styles.gradeGroupCode}>{group.gradeCode}</span>
                                    </div>
                                </div>
                                <div className={styles.gradeGroupHeaderRight}>
                                    <Badge variant="info" size="sm">
                                        {group.subjects.length} disciplinas
                                    </Badge>

                                    {/* Botão Gerenciar - Apenas Ícone */}
                                    <button
                                        className={styles.gradeGroupManageBtn}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (grade) {
                                                handleOpenManager(grade);
                                            }
                                        }}
                                        title="Gerenciar disciplinas desta classe"
                                    >
                                        <Plus size={14} />
                                    </button>

                                    <button
                                        className={styles.gradeGroupToggle}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleGradeExpansion(group.gradeUuid);
                                        }}
                                    >
                                        <ChevronRight
                                            size={18}
                                            className={`${styles.gradeGroupChevron} ${group.isExpanded ? styles.expanded : ''
                                                }`}
                                        />
                                    </button>
                                </div>
                            </div>

                            {/* Lista de Disciplinas da Classe */}
                            {group.isExpanded && (
                                <div className={styles.gradeGroupBody}>
                                    <div className={styles.gradeGroupGrid}>
                                        {group.subjects.map((subject) => (
                                            <div key={subject.uuid} className={styles.subjectItem}>
                                                <div className={styles.subjectItemContent}>
                                                    <BookOpen size={14} className={styles.subjectItemIcon} />
                                                    <div className={styles.subjectItemInfo}>
                                                        <span className={styles.subjectItemName}>
                                                            {subject.subjectName}
                                                        </span>
                                                        <span className={styles.subjectItemCode}>
                                                            {subject.subjectCode}
                                                        </span>
                                                        {subject.weeklyWorkload !== undefined && (
                                                            <span className={styles.subjectItemWorkload}>
                                                                {subject.weeklyWorkload}h
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className={styles.subjectItemActions}>
                                                    {getStatusBadge(subject.isActive)}
                                                    <button
                                                        className={styles.subjectItemAction}
                                                        onClick={() => handleToggleActive(subject)}
                                                        title={subject.isActive ? 'Desativar' : 'Ativar'}
                                                    >
                                                        {subject.isActive ? (
                                                            <PowerOff size={14} className={styles.actionInactive} />
                                                        ) : (
                                                            <Power size={14} className={styles.actionActive} />
                                                        )}
                                                    </button>
                                                    <button
                                                        className={styles.subjectItemAction}
                                                        onClick={() => handleDelete(subject)}
                                                        title="Excluir"
                                                    >
                                                        <Trash2 size={14} className={styles.actionDanger} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    const EmptyState = () => (
        <div className={styles.emptyState}>
            <div className={styles.emptyIconWrapper}>
                <BookOpen size={48} className={styles.emptyIcon} />
            </div>
            <h3 className={styles.emptyTitle}>Nenhuma associação</h3>
            <p className={styles.emptySubtext}>
                {searchTerm || filters.gradeUuid || filters.isActive !== undefined
                    ? 'Tente ajustar seus filtros para encontrar o que procura'
                    : 'Associe disciplinas a uma classe para começar'}
            </p>
            <Button icon={<Plus size={18} />} onClick={() => handleOpenManager()}>
                Nova Associação
            </Button>
        </div>
    );

    const columns = [
        {
            key: 'grade',
            header: 'Classe',
            render: (item: GradeSubjectWithDetails) => (
                <div className={styles.gradeCell}>
                    <GraduationCap size={14} />
                    <div>
                        <div className={styles.gradeName}>{item.gradeName}</div>
                        <div className={styles.gradeCode}>{item.gradeCode}</div>
                    </div>
                </div>
            ),
        },
        {
            key: 'subject',
            header: 'Disciplina',
            render: (item: GradeSubjectWithDetails) => (
                <div className={styles.subjectCell}>
                    <BookOpen size={14} />
                    <div>
                        <div className={styles.subjectName}>{item.subjectName}</div>
                        <div className={styles.subjectCode}>{item.subjectCode}</div>
                        {item.weeklyWorkload !== undefined && (
                            <div className={styles.subjectWorkload}>
                                {item.weeklyWorkload}h/semana
                            </div>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            render: (item: GradeSubjectWithDetails) => getStatusBadge(item.isActive),
        },
        {
            key: 'createdAt',
            header: 'Criado em',
            render: (item: GradeSubjectWithDetails) => formatDate(item.createdAt),
        },
        {
            key: 'actions',
            header: 'Ações',
            align: 'right' as const,
            render: (item: GradeSubjectWithDetails) => (
                <div className={styles.actions}>
                    <button
                        className={styles.actionButton}
                        onClick={() => handleToggleActive(item)}
                        title={item.isActive ? 'Desativar' : 'Ativar'}
                    >
                        {item.isActive ? (
                            <PowerOff size={16} className={styles.actionInactive} />
                        ) : (
                            <Power size={16} className={styles.actionActive} />
                        )}
                    </button>
                    <button
                        className={styles.actionButton}
                        onClick={() => handleDelete(item)}
                        title="Excluir"
                    >
                        <Trash2 size={16} className={styles.actionDanger} />
                    </button>
                </div>
            ),
        },
    ];

    const renderCardsView = () => {
        const items = Array.isArray(associations) ? associations : [];
        if (items.length === 0) return <EmptyState />;

        return (
            <div className={styles.cardsGrid}>
                {items.map((association) => (
                    <div key={association.uuid} className={styles.associationCard}>
                        <div className={styles.cardHeader}>
                            <div className={styles.cardHeaderLeft}>
                                <div className={styles.cardIcon}>
                                    <BookOpen size={20} />
                                </div>
                                <div>
                                    <h3 className={styles.itemName}>{association.subjectName}</h3>
                                    <p className={styles.itemGrade}>
                                        <GraduationCap size={12} />
                                        {association.gradeName}
                                    </p>
                                </div>
                            </div>
                            <div className={styles.cardActions}>
                                <button
                                    className={styles.iconButton}
                                    onClick={() => handleToggleActive(association)}
                                    title={association.isActive ? 'Desativar' : 'Ativar'}
                                >
                                    {association.isActive ? (
                                        <PowerOff size={16} className={styles.actionInactive} />
                                    ) : (
                                        <Power size={16} className={styles.actionActive} />
                                    )}
                                </button>
                                <button
                                    className={styles.iconButton}
                                    onClick={() => handleDelete(association)}
                                    title="Excluir"
                                >
                                    <Trash2 size={16} className={styles.actionDanger} />
                                </button>
                            </div>
                        </div>

                        <div className={styles.cardBody}>
                            <div className={styles.infoGrid}>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Código da Disciplina</span>
                                    <span className={styles.infoValue}>{association.subjectCode}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Código da Classe</span>
                                    <span className={styles.infoValue}>{association.gradeCode}</span>
                                </div>
                                {association.weeklyWorkload !== undefined && (
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Carga Horária</span>
                                        <span className={styles.infoValue}>{association.weeklyWorkload}h</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={styles.cardFooter}>
                            <div className={styles.cardTags}>
                                {getStatusBadge(association.isActive)}
                            </div>
                            <span className={styles.cardDate}>
                                <Clock size={12} />
                                Criado em {formatDate(association.createdAt)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderTableView = () => {
        const items = Array.isArray(associations) ? associations : [];
        if (items.length === 0) return <EmptyState />;

        return (
            <div className={styles.tableContainer}>
                <Table
                    columns={columns}
                    data={items}
                    emptyMessage="Nenhuma associação encontrada"
                />
            </div>
        );
    };

    if (isLoading && associations.length === 0) {
        return (
            <div className={styles.page}>
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>Associações Classe-Disciplina</h1>
                        <p className={styles.subtitle}>Carregando...</p>
                    </div>
                </div>
                <div className={styles.toolbar}>
                    <SkeletonCard variant="default" />
                </div>
                <div className={styles.cardsGrid}>
                    {[...Array(3)].map((_, i) => (
                        <SkeletonCard key={i} variant="default" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <div className={styles.headerIcon}>
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <h1 className={styles.title}>Associações Classe-Disciplina</h1>
                        <p className={styles.subtitle}>
                            Gerencie quais disciplinas estão associadas a cada classe
                        </p>
                    </div>
                    <span className={styles.totalCount}>{total} associações</span>
                </div>
                <div className={styles.headerActions}>
                    <Button icon={<Plus size={18} />} onClick={() => handleOpenManager()} className={styles.createButton}>
                        Nova Associação
                    </Button>
                </div>
            </div>

            {/* Toolbar */}
            <div className={styles.toolbar}>
                <div className={styles.toolbarLeft}>
                    <div className={styles.searchWrapper}>
                        <Search size={16} className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Pesquisar associações..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className={styles.searchInput}
                        />
                    </div>
                    <button
                        className={`${styles.filterButton} ${showFilters ? styles.active : ''}`}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter size={16} />
                        Filtros
                        {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    <div className={styles.viewToggle}>
                        <button
                            className={`${styles.viewButton} ${viewMode === 'grouped' ? styles.active : ''}`}
                            onClick={() => setViewMode('grouped')}
                            title="Visualização Agrupada por Classe"
                        >
                            <GraduationCap size={16} />
                        </button>
                        <button
                            className={`${styles.viewButton} ${viewMode === 'cards' ? styles.active : ''}`}
                            onClick={() => setViewMode('cards')}
                            title="Visualização em Cards"
                        >
                            <LayoutGrid size={16} />
                        </button>
                        <button
                            className={`${styles.viewButton} ${viewMode === 'table' ? styles.active : ''}`}
                            onClick={() => setViewMode('table')}
                            title="Visualização em Tabela"
                        >
                            <List size={16} />
                        </button>
                    </div>
                </div>
                <div className={styles.toolbarRight}>
                    <span className={styles.lastUpdate}>
                        <Clock size={12} />
                        {total} associações encontradas
                    </span>
                </div>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className={styles.filtersPanel}>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Classe</label>
                        <Select
                            value={filters.gradeUuid || ''}
                            onChange={(e) => setFilters({ ...filters, gradeUuid: e.target.value || undefined })}
                            options={[
                                { value: '', label: 'Todas as classes' },
                                ...grades.map(g => ({ value: g.uuid, label: `${g.name} (${g.code})` })),
                            ]}
                            fullWidth
                        />
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Status</label>
                        <div className={styles.filterOptions}>
                            <button
                                className={`${styles.filterChip} ${filters.isActive === undefined ? styles.active : ''}`}
                                onClick={() => setFilters({ ...filters, isActive: undefined })}
                            >
                                Todas
                            </button>
                            <button
                                className={`${styles.filterChip} ${filters.isActive === true ? styles.active : ''}`}
                                onClick={() => setFilters({ ...filters, isActive: true })}
                            >
                                Ativas
                            </button>
                            <button
                                className={`${styles.filterChip} ${filters.isActive === false ? styles.active : ''}`}
                                onClick={() => setFilters({ ...filters, isActive: false })}
                            >
                                Inativas
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className={styles.content}>
                {viewMode === 'grouped' && renderGroupedView()}
                {viewMode === 'cards' && renderCardsView()}
                {viewMode === 'table' && renderTableView()}
            </div>

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog({ isOpen: false, type: 'delete' })}
                onConfirm={handleConfirmAction}
                title={
                    confirmDialog.type === 'delete'
                        ? 'Remover Associação'
                        : confirmDialog.isActive
                            ? 'Desativar Associação'
                            : 'Ativar Associação'
                }
                message={
                    confirmDialog.type === 'delete'
                        ? `Tem certeza que deseja remover a associação "${confirmDialog.name}"?`
                        : confirmDialog.isActive
                            ? `Tem certeza que deseja desativar a associação "${confirmDialog.name}"?`
                            : `Tem certeza que deseja ativar a associação "${confirmDialog.name}"?`
                }
                type={confirmDialog.type === 'delete' ? 'danger' : 'warning'}
                confirmText={
                    confirmDialog.type === 'delete'
                        ? 'Remover'
                        : confirmDialog.isActive
                            ? 'Desativar'
                            : 'Ativar'
                }
                isLoading={isLoading}
            />

            {/* Modal de Seleção de Classe */}
            <Modal
                isOpen={showClassSelector}
                onClose={() => setShowClassSelector(false)}
                title="Selecionar Classe"
                size="md"
            >
                <div className={styles.classSelector}>
                    <p className={styles.classSelectorHelp}>
                        Selecione uma classe para gerenciar suas disciplinas
                    </p>

                    <Select
                        label="Classe"
                        value={tempSelectedClass}
                        onChange={(e) => setTempSelectedClass(e.target.value)}
                        options={[
                            { value: '', label: 'Selecione uma classe...' },
                            ...grades.map(g => ({
                                value: g.uuid,
                                label: `${g.name} (${g.code})`
                            })),
                        ]}
                        fullWidth
                    />

                    <div className={styles.classSelectorActions}>
                        <Button
                            variant="secondary"
                            onClick={() => setShowClassSelector(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleConfirmClassSelection}
                            disabled={!tempSelectedClass}
                        >
                            Continuar
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Modal do Gerenciador */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseManager}
                title={`Gerenciar Disciplinas - ${selectedGradeName || ''}`}
                size="lg"
            >
                {isModalOpen && selectedGradeUuid && (
                    <GradeSubjectManager
                        key={selectedGradeUuid}
                        gradeUuid={selectedGradeUuid}
                        gradeName={selectedGradeName}
                        onClose={handleCloseManager}
                        onSuccess={() => {
                            loadAssociations();
                        }}
                    />
                )}
            </Modal>
        </div>
    );
}