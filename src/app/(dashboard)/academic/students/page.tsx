// src/app/(dashboard)/academic/students/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
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
    Heart,
    Globe,
    MapPin,
    Eye,
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

    const [students, setStudents] = useState<StudentWithUser[]>([]);
    const [classes, setClasses] = useState<{ uuid: string; name: string; code: string; gradeName: string }[]>([]);
    const [total, setTotal] = useState(0);
    const [filters, setFilters] = useState<StudentFilters>({
        page: 1,
        limit: 10,
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<StudentWithUser | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('table');

    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        type: 'delete' | 'toggle';
        uuid?: string;
        name?: string;
        isActive?: boolean;
    }>({ isOpen: false, type: 'delete' });

    // Carregar classes para o filtro
    useEffect(() => {
        const loadClasses = async () => {
            try {
                const data = await studentService.getClasses();
                setClasses(data || []);
            } catch (error) {
                console.error('Erro ao carregar classes:', error);
            }
        };
        loadClasses();
    }, []);

    const loadStudents = async () => {
        try {
            startLoading();
            const response = await studentService.getAll({
                ...filters,
                search: searchTerm || undefined,
            });
            const dataArray = response?.data || [];
            setStudents(dataArray.map((s: any) => ({
                ...s,
                isActive: isActiveBoolean(s.isActive)
            })));
            setTotal(response?.total || 0);
        } catch (error: any) {
            console.error('Erro ao carregar estudantes:', error);
            showError('Erro', 'Não foi possível carregar os estudantes');
            setStudents([]);
            setTotal(0);
        } finally {
            stopLoading();
        }
    };

    useEffect(() => {
        loadStudents();
    }, [filters.page, filters.limit, filters.isActive, filters.gender, filters.classUuid]);

    const handleSearch = () => {
        setFilters({ ...filters, page: 1 });
        loadStudents();
    };

    const handleCreate = () => {
        setSelectedStudent(null);
        setIsModalOpen(true);
    };

    const handleViewDetails = (student: StudentWithUser) => {
        setSelectedStudent(student);
        setIsDetailsOpen(true);
    };

    const handleEdit = (student: StudentWithUser) => {
        setSelectedStudent(student);
        setIsDetailsOpen(false);
        setIsModalOpen(true);
    };

    const handleDelete = (student: StudentWithUser) => {
        setConfirmDialog({
            isOpen: true,
            type: 'delete',
            uuid: student.uuid,
            name: student.fullName,
        });
    };

    const handleToggleActive = (student: StudentWithUser) => {
        setConfirmDialog({
            isOpen: true,
            type: 'toggle',
            uuid: student.uuid,
            name: student.fullName,
            isActive: student.isActive,
        });
    };

    const handleConfirmAction = async () => {
        const { type, uuid, name, isActive } = confirmDialog;
        try {
            startLoading();
            if (type === 'delete') {
                await studentService.remove(uuid!);
                showSuccess('Estudante excluído', `Estudante ${name} foi removido`);
            } else if (type === 'toggle') {
                await studentService.toggleStatus(uuid!, !isActive);
                const newStatus = isActive ? 'desativado' : 'ativado';
                showSuccess(`Estudante ${newStatus}`, `Estudante ${name} foi ${newStatus}`);
            }
            setConfirmDialog({ isOpen: false, type: 'delete' });
            loadStudents();
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
                    <span>Turma {item.currentEnrollment?.class?.name || '-'} - {item.currentEnrollment?.grade?.name || '-'}</span>
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
            header: 'Status',
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
                <Users size={48} className={styles.emptyIcon} />
            </div>
            <h3 className={styles.emptyTitle}>Nenhum estudante</h3>
            <p className={styles.emptySubtext}>
                {searchTerm || filters.isActive !== undefined || filters.gender || filters.classUuid
                    ? 'Tente ajustar seus filtros para encontrar o que procura'
                    : 'Comece cadastrando um estudante'}
            </p>
            <Button icon={<Plus size={18} />} onClick={handleCreate}>
                Novo Estudante
            </Button>
        </div>
    );

    const renderCardsView = () => {
        const items = Array.isArray(students) ? students : [];
        if (items.length === 0) return <EmptyState />;

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
                                <button
                                    className={styles.iconButton}
                                    onClick={() => handleToggleActive(student)}
                                    title={student.isActive ? 'Desativar' : 'Ativar'}
                                >
                                    {student.isActive ? (
                                        <PowerOff size={16} className={styles.actionInactive} />
                                    ) : (
                                        <Power size={16} className={styles.actionActive} />
                                    )}
                                </button>
                                <button
                                    className={styles.iconButton}
                                    onClick={() => handleEdit(student)}
                                    title="Editar"
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    className={styles.iconButton}
                                    onClick={() => handleDelete(student)}
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
                                        {student.admissionDate}
                                    </span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Usuário</span>
                                    <span className={styles.infoValue}>
                                        {student.user ? (
                                            <span className={styles.hasUser}>
                                                <CheckCircle size={14} />
                                                {student.user.username}
                                            </span>
                                        ) : (
                                            <span className={styles.noUser}>Sem usuário</span>
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
                                Criado em {formatDate(student.createdAt)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderTableView = () => {
        const items = Array.isArray(students) ? students : [];
        if (items.length === 0) return <EmptyState />;

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

    if (isLoading && students.length === 0) {
        return (
            <div className={styles.page}>
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>Estudantes</h1>
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
                <div className={styles.headerActions}>
                    <Button icon={<Plus size={18} />} onClick={handleCreate} className={styles.createButton}>
                        Novo Estudante
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
                            placeholder="Pesquisar estudantes..."
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
                                onClick={() => setFilters({ ...filters, gender: undefined })}
                            >
                                Todos
                            </button>
                            <button
                                className={`${styles.filterChip} ${filters.gender === 'MALE' ? styles.active : ''}`}
                                onClick={() => setFilters({ ...filters, gender: 'MALE' })}
                            >
                                Masculino
                            </button>
                            <button
                                className={`${styles.filterChip} ${filters.gender === 'FEMALE' ? styles.active : ''}`}
                                onClick={() => setFilters({ ...filters, gender: 'FEMALE' })}
                            >
                                Feminino
                            </button>
                        </div>
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Turma</label>
                        <Select
                            value={filters.classUuid || ''}
                            onChange={(e) => setFilters({ ...filters, classUuid: e.target.value || undefined })}
                            options={[
                                { value: '', label: 'Todas as turmas' },
                                ...classes.map(c => ({ value: c.uuid, label: `${c.name} - ${c.gradeName}` })),
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
                        ? 'Excluir Estudante'
                        : confirmDialog.isActive
                            ? 'Desativar Estudante'
                            : 'Ativar Estudante'
                }
                message={
                    confirmDialog.type === 'delete'
                        ? `Tem certeza que deseja excluir o estudante "${confirmDialog.name}"?`
                        : confirmDialog.isActive
                            ? `Tem certeza que deseja desativar o estudante "${confirmDialog.name}"?`
                            : `Tem certeza que deseja ativar o estudante "${confirmDialog.name}"?`
                }
                type={confirmDialog.type === 'delete' ? 'danger' : 'warning'}
                confirmText={
                    confirmDialog.type === 'delete'
                        ? 'Excluir'
                        : confirmDialog.isActive
                            ? 'Desativar'
                            : 'Ativar'
                }
                isLoading={isLoading}
            />

            {/* Modal de Edição */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedStudent(null);
                }}
                title={selectedStudent ? 'Editar Estudante' : 'Novo Estudante'}
                size="lg"
            >
                <StudentForm
                    student={selectedStudent}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        setSelectedStudent(null);
                        loadStudents();
                    }}
                    onCancel={() => {
                        setIsModalOpen(false);
                        setSelectedStudent(null);
                    }}
                />
            </Modal>

            {/* ✅ Modal de Detalhes */}
            <StudentDetails
                student={selectedStudent}
                isOpen={isDetailsOpen}
                onClose={() => {
                    setIsDetailsOpen(false);
                    setSelectedStudent(null);
                }}
                onEdit={() => {
                    if (selectedStudent) {
                        handleEdit(selectedStudent);
                    }
                }}
                onToggleStatus={() => {
                    if (selectedStudent) {
                        handleToggleActive(selectedStudent);
                        setIsDetailsOpen(false);
                    }
                }}
                onDelete={() => {
                    if (selectedStudent) {
                        handleDelete(selectedStudent);
                        setIsDetailsOpen(false);
                    }
                }}
            />
        </div>
    );
}