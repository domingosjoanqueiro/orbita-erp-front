// src/app/(dashboard)/academic/teacher-assignments/page.tsx

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
    Edit,
    Trash2,
    Power,
    PowerOff,
    LayoutGrid,
    List,
    User,
    Users,
    Award,
    Calendar,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button/Button';
import { Input } from '@/shared/components/ui/Input/Input';
import { Badge } from '@/shared/components/ui/Badge/Badge';
import { Table } from '@/shared/components/ui/Table/Table';
import { Modal } from '@/shared/components/ui/Modal/Modal';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog/ConfirmDialog';
import { SkeletonCard } from '@/shared/components/ui/Skeleton/SkeletonCard';
import { Select } from '@/shared/components/ui/Select/Select';
import { useLoading } from '@/shared/contexts/LoadingContext';
import { useToast } from '@/shared/contexts/ToastContext';
import { teacherAssignmentService } from '@/features/academic/teacher-assignments/services/teacher-assignment.service';
import { TeacherAssignmentForm } from '@/features/academic/teacher-assignments/components/TeacherAssignmentForm';
import type { TeacherAssignment, TeacherAssignmentFilters } from '@/features/academic/teacher-assignments/types/teacher-assignment.types';
import styles from './page.module.css';

type ViewMode = 'cards' | 'table';

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
                {active ? 'Ativo' : 'Inativo'}
            </span>
        </Badge>
    );
};

export default function TeacherAssignmentsPage() {
    const { startLoading, stopLoading, isLoading } = useLoading();
    const { showSuccess, showError } = useToast();

    const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
    const [total, setTotal] = useState(0);
    const [filters, setFilters] = useState<TeacherAssignmentFilters>({ page: 1, limit: 10, });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState<TeacherAssignment | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('table');
    const [formKey, setFormKey] = useState(0); // ✅ Adicionado para forçar recriação do formulário

    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        type: 'delete' | 'toggle';
        uuid?: string;
        name?: string;
        isActive?: boolean;
    }>({ isOpen: false, type: 'delete' });

    const loadAssignments = async () => {
        try {
            startLoading();
            const response = await teacherAssignmentService.getAll({
                ...filters,
                search: searchTerm || undefined,
            });
            const dataArray = response?.data || [];
            setAssignments(dataArray.map((a: any) => ({
                ...a,
                isActive: isActiveBoolean(a.isActive)
            })));
            setTotal(response?.total || 0);
        } catch (error: any) {
            console.error('Erro ao carregar atribuições:', error);
            showError('Erro', 'Não foi possível carregar as atribuições');
            setAssignments([]);
            setTotal(0);
        } finally {
            stopLoading();
        }
    };

    useEffect(() => {
        loadAssignments();
    }, [filters.page, filters.limit, filters.isActive, filters.teacherUuid, filters.classUuid]);

    const handleSearch = () => {
        setFilters({ ...filters, page: 1 });
        loadAssignments();
    };

    const handleCreate = () => {
        setEditingAssignment(null);
        setIsEditing(false);
        setFormKey(prev => prev + 1); // ✅ Força recriação do componente
        setIsModalOpen(true);
    };

    const handleEdit = (assignment: TeacherAssignment) => {
        setEditingAssignment(assignment);
        setIsEditing(true);
        setFormKey(prev => prev + 1); // ✅ Força recriação do componente
        setIsModalOpen(true);
    };

    const handleDelete = (assignment: TeacherAssignment) => {
        setConfirmDialog({
            isOpen: true,
            type: 'delete',
            uuid: assignment.uuid,
            name: `${assignment.teacher?.fullName || 'Professor'} - ${assignment.gradeSubject?.subject_name || 'Disciplina'}`,
        });
    };

    const handleToggleActive = (assignment: TeacherAssignment) => {
        setConfirmDialog({
            isOpen: true,
            type: 'toggle',
            uuid: assignment.uuid,
            name: `${assignment.teacher?.fullName || 'Professor'} - ${assignment.gradeSubject?.subject_name || 'Disciplina'}`,
            isActive: assignment.isActive,
        });
    };

    const handleConfirmAction = async () => {
        const { type, uuid, name, isActive } = confirmDialog;
        try {
            startLoading();
            if (type === 'delete') {
                await teacherAssignmentService.remove(uuid!);
                showSuccess('Atribuição removida', `Atribuição de ${name} foi removida`);
            } else if (type === 'toggle') {
                await teacherAssignmentService.toggleStatus(uuid!, !isActive);
                const newStatus = isActive ? 'desativada' : 'ativada';
                showSuccess(`Atribuição ${newStatus}`, `Atribuição de ${name} foi ${newStatus}`);
            }
            setConfirmDialog({ isOpen: false, type: 'delete' });
            loadAssignments();
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

    // ✅ Atualizar colunas para refletir os novos campos
    const columns = [
        {
            key: 'teacher',
            header: 'Professor',
            render: (item: TeacherAssignment) => (
                <div className={styles.teacherCell}>
                    <User size={14} />
                    <div>
                        <div className={styles.teacherName}>
                            {item.teacherName || 'N/A'}
                        </div>
                        <div className={styles.teacherNumber}>
                            {item.teacherNumber || ''}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            key: 'class',
            header: 'Turma',
            render: (item: TeacherAssignment) => (
                <div className={styles.classCell}>
                    <Users size={14} />
                    <span>{item.className || '-'}</span>
                    <span className={styles.classGrade}>
                        ({item.gradeName || '-'})
                    </span>
                </div>
            ),
        },
        {
            key: 'subject',
            header: 'Disciplina',
            render: (item: TeacherAssignment) => (
                <div className={styles.subjectCell}>
                    <BookOpen size={14} />
                    <span>{item.subjectName || '-'}</span>
                </div>
            ),
        },
        {
            key: 'period',
            header: 'Período',
            render: (item: TeacherAssignment) => (
                <div className={styles.periodCell}>
                    <Calendar size={14} />
                    <span>
                        {formatDate(item.startDate)}
                        {item.endDate ? ` - ${formatDate(item.endDate)}` : ' (Sem data fim)'}
                    </span>
                </div>
            ),
        },
        {
            key: 'classDirector',
            header: 'Diretor Turma',
            render: (item: TeacherAssignment) => (
                item.isClassDirector ? (
                    <Badge variant="success" size="sm">
                        <Award size={10} />
                        Sim
                    </Badge>
                ) : (
                    <Badge variant="neutral" size="sm">Não</Badge>
                )
            ),
        },
        {
            key: 'status',
            header: 'Status',
            render: (item: TeacherAssignment) => getStatusBadge(item.isActive),
        },
        {
            key: 'actions',
            header: 'Ações',
            align: 'right' as const,
            render: (item: TeacherAssignment) => (
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
                        onClick={() => handleEdit(item)}
                        title="Editar"
                    >
                        <Edit size={16} />
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

    const EmptyState = () => (
        <div className={styles.emptyState}>
            <div className={styles.emptyIconWrapper}>
                <BookOpen size={48} className={styles.emptyIcon} />
            </div>
            <h3 className={styles.emptyTitle}>Nenhuma atribuição</h3>
            <p className={styles.emptySubtext}>
                {searchTerm || filters.isActive !== undefined || filters.teacherUuid || filters.classUuid
                    ? 'Tente ajustar seus filtros para encontrar o que procura'
                    : 'Comece atribuindo um professor a uma disciplina'}
            </p>
            <Button icon={<Plus size={18} />} onClick={handleCreate}>
                Nova Atribuição
            </Button>
        </div>
    );

    const renderCardsView = () => {
        const items = Array.isArray(assignments) ? assignments : [];
        if (items.length === 0) return <EmptyState />;

        return (
            <div className={styles.cardsGrid}>
                {items.map((assignment) => (
                    <div key={assignment.uuid} className={styles.assignmentCard}>
                        <div className={styles.cardHeader}>
                            <div className={styles.cardHeaderLeft}>
                                <div className={styles.cardIcon}>
                                    <User size={20} />
                                </div>
                                <div>
                                    <h3 className={styles.itemName}>
                                        {assignment.teacherName || 'N/A'}
                                    </h3>
                                    <p className={styles.itemNumber}>
                                        {assignment.teacher?.teacherNumber || ''}
                                    </p>
                                </div>
                            </div>
                            <div className={styles.cardActions}>
                                <button
                                    className={styles.iconButton}
                                    onClick={() => handleToggleActive(assignment)}
                                    title={assignment.isActive ? 'Desativar' : 'Ativar'}
                                >
                                    {assignment.isActive ? (
                                        <PowerOff size={16} className={styles.actionInactive} />
                                    ) : (
                                        <Power size={16} className={styles.actionActive} />
                                    )}
                                </button>
                                <button
                                    className={styles.iconButton}
                                    onClick={() => handleEdit(assignment)}
                                    title="Editar"
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    className={styles.iconButton}
                                    onClick={() => handleDelete(assignment)}
                                    title="Excluir"
                                >
                                    <Trash2 size={16} className={styles.actionDanger} />
                                </button>
                            </div>
                        </div>

                        <div className={styles.cardBody}>
                            <div className={styles.infoGrid}>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Turma</span>
                                    <span className={styles.infoValue}>
                                        <Users size={14} />
                                        {assignment.className || '-'}
                                    </span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Disciplina</span>
                                    <span className={styles.infoValue}>
                                        <BookOpen size={14} />
                                        {assignment.gradeSubject?.subject_name || '-'}
                                    </span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Período</span>
                                    <span className={styles.infoValue}>
                                        <Calendar size={14} />
                                        {formatDate(assignment.startDate)}
                                        {assignment.endDate ? ` - ${formatDate(assignment.endDate)}` : ''}
                                    </span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Diretor de Turma</span>
                                    <span className={styles.infoValue}>
                                        {assignment.isClassDirector ? (
                                            <Badge variant="success" size="sm">
                                                <Award size={10} />
                                                Sim
                                            </Badge>
                                        ) : (
                                            <Badge variant="neutral" size="sm">Não</Badge>
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.cardFooter}>
                            <div className={styles.cardTags}>
                                {getStatusBadge(assignment.isActive)}
                            </div>
                            <span className={styles.cardDate}>
                                <Clock size={12} />
                                Criado em {formatDate(assignment.createdAt)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderTableView = () => {
        const items = Array.isArray(assignments) ? assignments : [];
        if (items.length === 0) return <EmptyState />;

        return (
            <div className={styles.tableContainer}>
                <Table
                    columns={columns}
                    data={items}
                    emptyMessage="Nenhuma atribuição encontrada"
                />
            </div>
        );
    };

    if (isLoading && assignments.length === 0) {
        return (
            <div className={styles.page}>
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>Atribuições de Professores</h1>
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
                        <h1 className={styles.title}>Atribuições de Professores</h1>
                        <p className={styles.subtitle}>
                            Gerencie a atribuição de professores às disciplinas
                        </p>
                    </div>
                    <span className={styles.totalCount}>{total} atribuições</span>
                </div>
                <div className={styles.headerActions}>
                    <Button icon={<Plus size={18} />} onClick={handleCreate} className={styles.createButton}>
                        Nova Atribuição
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
                            placeholder="Pesquisar atribuições..."
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
                        {total} atribuições encontradas
                    </span>
                </div>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className={styles.filtersPanel}>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Status</label>
                        <div className={styles.filterOptions}>
                            <button
                                className={`${styles.filterChip} ${filters.isActive === undefined ? styles.active : ''}`}
                                onClick={() => setFilters({ ...filters, isActive: undefined })}
                            >
                                Todos
                            </button>
                            <button
                                className={`${styles.filterChip} ${filters.isActive === true ? styles.active : ''}`}
                                onClick={() => setFilters({ ...filters, isActive: true })}
                            >
                                Ativos
                            </button>
                            <button
                                className={`${styles.filterChip} ${filters.isActive === false ? styles.active : ''}`}
                                onClick={() => setFilters({ ...filters, isActive: false })}
                            >
                                Inativos
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className={styles.content}>
                {viewMode === 'cards' ? renderCardsView() : renderTableView()}
            </div>

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog({ isOpen: false, type: 'delete' })}
                onConfirm={handleConfirmAction}
                title={
                    confirmDialog.type === 'delete'
                        ? 'Remover Atribuição'
                        : confirmDialog.isActive
                            ? 'Desativar Atribuição'
                            : 'Ativar Atribuição'
                }
                message={
                    confirmDialog.type === 'delete'
                        ? `Tem certeza que deseja remover a atribuição de "${confirmDialog.name}"?`
                        : confirmDialog.isActive
                            ? `Tem certeza que deseja desativar a atribuição de "${confirmDialog.name}"?`
                            : `Tem certeza que deseja ativar a atribuição de "${confirmDialog.name}"?`
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

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingAssignment(null);
                    setIsEditing(false);
                }}
                title={isEditing ? 'Editar Atribuição' : 'Nova Atribuição de Professor'}
                size="lg"
            >
                <TeacherAssignmentForm
                    key={formKey} // ✅ Adicionado key para forçar recriação
                    assignmentToEdit={editingAssignment}
                    isEditing={isEditing}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        setEditingAssignment(null);
                        setIsEditing(false);
                        loadAssignments();
                    }}
                    onCancel={() => {
                        setIsModalOpen(false);
                        setEditingAssignment(null);
                        setIsEditing(false);
                    }}
                />
            </Modal>
        </div>
    );
}