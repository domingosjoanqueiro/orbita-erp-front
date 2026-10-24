// src/app/(dashboard)/academic/students/page.tsx

'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Users,
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
    Mail,
    Phone,
    GraduationCap,
    Calendar,
    FileText,
    Eye,
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
import { Pagination } from '@/shared/components/ui/Pagination/Pagination';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { usePermission } from '@/shared/hooks/usePermission';
import { getApiErrorMessage } from '@/shared/utils/api.utils';
import { formatDisplayDate } from '@/shared/utils/date.utils';
import { studentService } from '@/features/academic/students/services/student.service';
import { StudentForm } from '@/features/academic/students/components/StudentForm';
import { StudentDetails } from '@/features/academic/students/components/StudentDetails';
import type { StudentWithUser, StudentFilters } from '@/features/academic/students/types/student.types';
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

const getGenderBadge = (gender: string) => {
    const label = gender === 'MALE' ? 'Masculino' : 'Feminino';
    return (
        <Badge variant="neutral" size="sm">
            <span className={styles.genderBadge}>
                <User size={10} />
                {label}
            </span>
        </Badge>
    );
};

export default function StudentsPage() {
    const { startLoading, stopLoading, isLoading } = useLoading();
    const { showSuccess, showError } = useToast();
    const { hasPermission } = usePermission();
    const canCreate = hasPermission('students.create');
    const canUpdate = hasPermission('students.update');
    const canDelete = hasPermission('students.delete');

    const [students, setStudents] = useState<StudentWithUser[]>([]);
    const [classes, setClasses] = useState<{ uuid: string; name: string; code: string; gradeName: string }[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loaded, setLoaded] = useState(false);
    const [filters, setFilters] = useState<StudentFilters>({
        page: 1,
        limit: 10,
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<StudentWithUser | null>(null);
    const [detailsStudent, setDetailsStudent] = useState<StudentWithUser | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm.trim(), 400);
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('table');
    const [isSubmittingAction, setIsSubmittingAction] = useState(false);

    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        type: 'delete' | 'toggle';
        student?: StudentWithUser;
    }>({ isOpen: false, type: 'delete' });

    // Carregar turmas para o filtro
    useEffect(() => {
        studentService.getClasses()
            .then(data => setClasses(data || []))
            .catch(() => setClasses([]));
    }, []);

    // Ignora respostas antigas quando os filtros mudam depressa
    const requestId = useRef(0);

    const loadStudents = useCallback(async (): Promise<StudentWithUser[]> => {
        const current = ++requestId.current;
        try {
            startLoading();
            const response = await studentService.getAll({
                ...filters,
                search: debouncedSearch || undefined,
            });
            if (current !== requestId.current) return [];
            const list = response.data.map(s => ({ ...s, isActive: isActiveBoolean(s.isActive) }));
            setStudents(list);
            setTotal(response.total);
            setTotalPages(Math.max(1, response.totalPages));
            // página vazia depois de excluir o último da página: recua uma
            if (list.length === 0 && (filters.page ?? 1) > 1) {
                setFilters(prev => ({ ...prev, page: Math.max(1, (prev.page ?? 1) - 1) }));
            }
            return list;
        } catch (error) {
            if (current !== requestId.current) return [];
            showError('Erro', getApiErrorMessage(error, 'Não foi possível carregar os estudantes'));
            setStudents([]);
            setTotal(0);
            return [];
        } finally {
            stopLoading();
            if (current === requestId.current) setLoaded(true);
        }
    }, [filters, debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        loadStudents();
    }, [loadStudents]);

    // Nova pesquisa volta à primeira página
    useEffect(() => {
        setFilters(prev => (prev.page === 1 ? prev : { ...prev, page: 1 }));
    }, [debouncedSearch]);

    const updateFilters = (changes: Partial<StudentFilters>) =>
        setFilters(prev => ({ ...prev, ...changes, page: 1 }));

    // Recarrega a lista e a ficha aberta nos detalhes (a turma vem da lista)
    const refresh = useCallback(async () => {
        const list = await loadStudents();
        if (!detailsStudent) return;
        const fromList = list.find(item => item.uuid === detailsStudent.uuid);
        if (fromList) {
            setDetailsStudent(fromList);
            return;
        }
        try {
            const fresh = await studentService.getByUuid(detailsStudent.uuid);
            setDetailsStudent({ ...fresh, currentEnrollment: detailsStudent.currentEnrollment, isActive: isActiveBoolean(fresh.isActive) });
        } catch {
            setDetailsStudent(null);
        }
    }, [loadStudents, detailsStudent]);

    const handleCreate = () => {
        setEditingStudent(null);
        setIsModalOpen(true);
    };

    // Ações rápidas do painel: /...?new=1 abre logo o formulário
    useEffect(() => {
        if (new URLSearchParams(window.location.search).get('new') === '1') {
            window.history.replaceState(null, '', window.location.pathname);
            handleCreate();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleViewDetails = (student: StudentWithUser) => {
        setDetailsStudent(student);
    };

    const handleEdit = (student: StudentWithUser) => {
        setEditingStudent(student);
        setIsModalOpen(true);
    };

    const closeForm = () => {
        setIsModalOpen(false);
        setEditingStudent(null);
    };

    const handleDelete = (student: StudentWithUser) => {
        setConfirmDialog({ isOpen: true, type: 'delete', student });
    };

    const handleToggleActive = (student: StudentWithUser) => {
        setConfirmDialog({ isOpen: true, type: 'toggle', student });
    };

    const handleConfirmAction = async () => {
        const { type, student } = confirmDialog;
        if (!student) return;
        try {
            setIsSubmittingAction(true);
            startLoading();
            if (type === 'delete') {
                await studentService.remove(student.uuid);
                showSuccess('Estudante excluído', `${student.fullName} foi removido.`);
                if (detailsStudent?.uuid === student.uuid) setDetailsStudent(null);
                setConfirmDialog({ isOpen: false, type: 'delete' });
                await loadStudents();
            } else {
                await studentService.toggleStatus(student.uuid, !student.isActive);
                const newStatus = student.isActive ? 'desativado' : 'ativado';
                showSuccess(
                    `Estudante ${newStatus}`,
                    student.user
                        ? `${student.fullName} foi ${newStatus}; o acesso ao portal acompanha o estado.`
                        : `${student.fullName} foi ${newStatus}.`
                );
                setConfirmDialog({ isOpen: false, type: 'delete' });
                await refresh();
            }
        } catch (error) {
            showError('Erro', getApiErrorMessage(error, 'Ocorreu um erro'));
        } finally {
            setIsSubmittingAction(false);
            stopLoading();
        }
    };

    const formatDate = (date?: string | null) => formatDisplayDate(date);

    const columns = [
        {
            key: 'name',
            header: 'Estudante',
            render: (item: StudentWithUser) => (
                <div className={styles.studentCell}>
                    <div className={styles.studentIcon}>
                        <User size={16} />
                    </div>
                    <div>
                        <div className={styles.studentName}>{item.fullName}</div>
                        <div className={styles.studentNumber}>
                            <FileText size={12} />
                            {item.studentNumber}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            key: 'class',
            header: 'Turma',
            render: (item: StudentWithUser) => (
                <div className={styles.classCell}>
                    <GraduationCap size={14} />
                    <span>{item.currentEnrollment ? `${item.currentEnrollment.grade?.name} · Turma ${item.currentEnrollment.class?.name}` : 'Sem matrícula ativa'}</span>
                </div>
            ),
        },
        {
            key: 'gender',
            header: 'Género',
            render: (item: StudentWithUser) => getGenderBadge(item.gender),
        },
        {
            key: 'contact',
            header: 'Contacto',
            render: (item: StudentWithUser) => (
                <div className={styles.contactCell}>
                    {item.email && (
                        <div className={styles.contactItem}>
                            <Mail size={12} />
                            <span>{item.email}</span>
                        </div>
                    )}
                    {item.phone && (
                        <div className={styles.contactItem}>
                            <Phone size={12} />
                            <span>{item.phone}</span>
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'status',
            header: 'Estado',
            render: (item: StudentWithUser) => getStatusBadge(item.isActive),
        },
        {
            key: 'actions',
            header: 'Ações',
            align: 'right' as const,
            render: (item: StudentWithUser) => (
                <div className={styles.actions}>
                    {/* ✅ Botão Visualizar */}
                    <button
                        className={styles.actionButton}
                        onClick={() => handleViewDetails(item)}
                        title="Ver detalhes"
                    >
                        <Eye size={16} className={styles.actionView} />
                    </button>
                    {canUpdate && (<button
                        className={styles.actionButton}
                        onClick={() => handleToggleActive(item)}
                        title={item.isActive ? 'Desativar' : 'Ativar'}
                    >
                        {item.isActive ? (
                            <PowerOff size={16} className={styles.actionInactive} />
                        ) : (
                            <Power size={16} className={styles.actionActive} />
                        )}
                    </button>)}
                    {canUpdate && (<button
                        className={styles.actionButton}
                        onClick={() => handleEdit(item)}
                        title="Editar"
                    >
                        <Edit size={16} />
                    </button>)}
                    {canDelete && (<button
                        className={styles.actionButton}
                        onClick={() => handleDelete(item)}
                        title="Excluir"
                    >
                        <Trash2 size={16} className={styles.actionDanger} />
                    </button>)}
                </div>
            ),
        },
    ];

    const hasActiveFilters = !!debouncedSearch || filters.isActive !== undefined || !!filters.gender || !!filters.classUuid;

    const renderEmptyState = () => (
        <div className={styles.emptyState}>
            <div className={styles.emptyIconWrapper}>
                <Users size={48} className={styles.emptyIcon} />
            </div>
            <h3 className={styles.emptyTitle}>Nenhum estudante</h3>
            <p className={styles.emptySubtext}>
                {hasActiveFilters
                    ? 'Tente ajustar os filtros para encontrar o que procura'
                    : 'Comece por registar um estudante'}
            </p>
            {canCreate && !hasActiveFilters && (
                <Button icon={<Plus size={18} />} onClick={handleCreate}>
                    Novo Estudante
                </Button>
            )}
        </div>
    );

    const renderCardsView = () => {
        const items = Array.isArray(students) ? students : [];
        if (items.length === 0) return renderEmptyState();

        return (
            <div className={styles.cardsGrid}>
                {items.map((student) => (
                    <div key={student.uuid} className={styles.studentCard}>
                        <div className={styles.cardHeader}>
                            <div className={styles.cardHeaderLeft}>
                                <div className={styles.studentIconLarge}>
                                    <User size={20} />
                                </div>
                                <div>
                                    <h3 className={styles.itemName}>{student.fullName}</h3>
                                    <p className={styles.itemNumber}>
                                        <FileText size={12} />
                                        {student.studentNumber}
                                    </p>
                                </div>
                            </div>
                            <div className={styles.cardActions}>
                                {/* ✅ Botão Visualizar no Card */}
                                <button
                                    className={styles.iconButton}
                                    onClick={() => handleViewDetails(student)}
                                    title="Ver detalhes"
                                >
                                    <Eye size={16} className={styles.actionView} />
                                </button>
                                {canUpdate && (<button
                                    className={styles.iconButton}
                                    onClick={() => handleToggleActive(student)}
                                    title={student.isActive ? 'Desativar' : 'Ativar'}
                                >
                                    {student.isActive ? (
                                        <PowerOff size={16} className={styles.actionInactive} />
                                    ) : (
                                        <Power size={16} className={styles.actionActive} />
                                    )}
                                </button>)}
                                {canUpdate && (<button
                                    className={styles.iconButton}
                                    onClick={() => handleEdit(student)}
                                    title="Editar"
                                >
                                    <Edit size={16} />
                                </button>)}
                                {canDelete && (<button
                                    className={styles.iconButton}
                                    onClick={() => handleDelete(student)}
                                    title="Excluir"
                                >
                                    <Trash2 size={16} className={styles.actionDanger} />
                                </button>)}
                            </div>
                        </div>

                        <div className={styles.cardBody}>
                            <div className={styles.infoGrid}>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Turma</span>
                                    <span className={styles.infoValue}>
                                        <GraduationCap size={14} />
                                        {student.currentEnrollment?.class?.name || '-'}
                                    </span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Género</span>
                                    {getGenderBadge(student.gender)}
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Email</span>
                                    <span className={styles.infoValue}>
                                        <Mail size={14} />
                                        {student.email || '-'}
                                    </span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Telefone</span>
                                    <span className={styles.infoValue}>
                                        <Phone size={14} />
                                        {student.phone || '-'}
                                    </span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Data de Admissão</span>
                                    <span className={styles.infoValue}>
                                        <Calendar size={14} />
                                        {formatDate(student.admissionDate)}
                                    </span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Utilizador</span>
                                    <span className={styles.infoValue}>
                                        {student.user ? (
                                            <span className={styles.hasUser}>
                                                <CheckCircle size={14} />
                                                {student.user.username}
                                            </span>
                                        ) : (
                                            <span className={styles.noUser}>Sem acesso</span>
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.cardFooter}>
                            <div className={styles.cardTags}>
                                {getStatusBadge(student.isActive)}
                            </div>
                            <span className={styles.cardDate}>
                                <Clock size={12} />
                                Registado em {formatDate(student.createdAt)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderTableView = () => {
        const items = Array.isArray(students) ? students : [];
        if (items.length === 0) return renderEmptyState();

        return (
            <div className={styles.tableContainer}>
                <Table
                    columns={columns}
                    data={items}
                    emptyMessage="Nenhum estudante encontrado"
                />
            </div>
        );
    };

    if (!loaded) {
        return (
            <div className={styles.page}>
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>Estudantes</h1>
                        <p className={styles.subtitle}>A carregar...</p>
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
                        <Users size={24} />
                    </div>
                    <div>
                        <h1 className={styles.title}>Estudantes</h1>
                        <p className={styles.subtitle}>
                            Gerencie os estudantes da instituição
                        </p>
                    </div>
                    <span className={styles.totalCount}>{total} estudantes</span>
                </div>
                {canCreate && (
                    <div className={styles.headerActions}>
                        <Button icon={<Plus size={18} />} onClick={handleCreate} className={styles.createButton}>
                            Novo Estudante
                        </Button>
                    </div>
                )}
            </div>

            {/* Toolbar */}
            <div className={styles.toolbar}>
                <div className={styles.toolbarLeft}>
                    <div className={styles.searchWrapper}>
                        <Search size={16} className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Pesquisar por nome ou nº de estudante..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            aria-label="Pesquisar estudantes"
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
                        {total} estudantes encontrados
                    </span>
                </div>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className={styles.filtersPanel}>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Género</label>
                        <div className={styles.filterOptions}>
                            <button
                                className={`${styles.filterChip} ${filters.gender === undefined ? styles.active : ''}`}
                                onClick={() => updateFilters({ gender: undefined })}
                            >
                                Todos
                            </button>
                            <button
                                className={`${styles.filterChip} ${filters.gender === 'MALE' ? styles.active : ''}`}
                                onClick={() => updateFilters({ gender: 'MALE' })}
                            >
                                Masculino
                            </button>
                            <button
                                className={`${styles.filterChip} ${filters.gender === 'FEMALE' ? styles.active : ''}`}
                                onClick={() => updateFilters({ gender: 'FEMALE' })}
                            >
                                Feminino
                            </button>
                        </div>
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Turma</label>
                        <Select
                            value={filters.classUuid || ''}
                            onChange={(e) => updateFilters({ classUuid: e.target.value || undefined })}
                            options={[
                                { value: '', label: 'Todas as turmas' },
                                ...classes.map(c => ({ value: c.uuid, label: `${c.name} - ${c.gradeName}` })),
                            ]}
                            fullWidth
                        />
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Estado</label>
                        <div className={styles.filterOptions}>
                            <button
                                className={`${styles.filterChip} ${filters.isActive === undefined ? styles.active : ''}`}
                                onClick={() => updateFilters({ isActive: undefined })}
                            >
                                Todos
                            </button>
                            <button
                                className={`${styles.filterChip} ${filters.isActive === true ? styles.active : ''}`}
                                onClick={() => updateFilters({ isActive: true })}
                            >
                                Ativos
                            </button>
                            <button
                                className={`${styles.filterChip} ${filters.isActive === false ? styles.active : ''}`}
                                onClick={() => updateFilters({ isActive: false })}
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
                {total > 0 && (
                    <Pagination
                        page={filters.page || 1}
                        totalPages={totalPages}
                        total={total}
                        limit={filters.limit || 10}
                        onPageChange={(page) => setFilters(prev => ({ ...prev, page }))}
                        onLimitChange={(limit) => updateFilters({ limit })}
                        itemLabel="estudantes"
                        disabled={isLoading}
                    />
                )}
            </div>

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog({ isOpen: false, type: 'delete' })}
                onConfirm={handleConfirmAction}
                title={
                    confirmDialog.type === 'delete'
                        ? 'Excluir Estudante'
                        : confirmDialog.student?.isActive
                            ? 'Desativar Estudante'
                            : 'Ativar Estudante'
                }
                message={
                    confirmDialog.type === 'delete'
                        ? `Tem a certeza que deseja excluir o estudante "${confirmDialog.student?.fullName}"? O acesso ao portal também deixa de funcionar.`
                        : confirmDialog.student?.isActive
                            ? `Tem a certeza que deseja desativar o estudante "${confirmDialog.student?.fullName}"?${confirmDialog.student?.user ? ' O acesso ao portal também fica desativado.' : ''}`
                            : `Tem a certeza que deseja ativar o estudante "${confirmDialog.student?.fullName}"?${confirmDialog.student?.user ? ' O acesso ao portal volta a ficar ativo.' : ''}`
                }
                type={confirmDialog.type === 'delete' ? 'danger' : 'warning'}
                confirmText={
                    confirmDialog.type === 'delete'
                        ? 'Excluir'
                        : confirmDialog.student?.isActive
                            ? 'Desativar'
                            : 'Ativar'
                }
                isLoading={isSubmittingAction}
            />

            {/* Formulário */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeForm}
                title={editingStudent ? 'Editar Estudante' : 'Novo Estudante'}
                size="lg"
            >
                {isModalOpen && (
                    <StudentForm
                        key={editingStudent?.uuid ?? 'new'}
                        student={editingStudent}
                        onSuccess={() => {
                            closeForm();
                            refresh();
                        }}
                        onCancel={closeForm}
                    />
                )}
            </Modal>

            {/* Detalhes */}
            <StudentDetails
                student={detailsStudent}
                isOpen={!!detailsStudent && !isModalOpen}
                onClose={() => setDetailsStudent(null)}
                canManageAccess={canUpdate}
                onAccessChanged={refresh}
                onEdit={canUpdate && detailsStudent ? () => handleEdit(detailsStudent) : undefined}
                onToggleStatus={canUpdate && detailsStudent ? () => handleToggleActive(detailsStudent) : undefined}
                onDelete={canDelete && detailsStudent ? () => handleDelete(detailsStudent) : undefined}
            />
        </div>
    );
}