// src/app/(dashboard)/academic/assessment-rules/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import {
    ClipboardList,
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
    Hash,
    Weight,
    Award,
    BookOpen,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button/Button';
import { Input } from '@/shared/components/ui/Input/Input';
import { Badge } from '@/shared/components/ui/Badge/Badge';
import { Table } from '@/shared/components/ui/Table/Table';
import { Modal } from '@/shared/components/ui/Modal/Modal';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog/ConfirmDialog';
import { SkeletonCard } from '@/shared/components/ui/Skeleton/SkeletonCard';
import { Select } from '@/shared/components/ui/Select/Select';
import { Pagination } from '@/shared/components/ui/Pagination/Pagination';
import { usePermission } from '@/shared/hooks/usePermission';
import { getApiErrorMessage } from '@/shared/utils/api.utils';
import { useLoading } from '@/shared/contexts/LoadingContext';
import { useToast } from '@/shared/contexts/ToastContext';
import { assessmentRuleService } from '@/features/academic/assessment-rules/services/assessment-rule.service';
import { AssessmentRuleForm } from '@/features/academic/assessment-rules/components/AssessmentRuleForm';
import type { 
    AssessmentRule, 
    AssessmentRuleFilters,
    ProgramOption,
} from '@/features/academic/assessment-rules/types/assessment-rule.types';
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

export default function AssessmentRulesPage() {
    const { startLoading, stopLoading, isLoading } = useLoading();
    const { showSuccess, showError } = useToast();
    const { hasPermission } = usePermission();
    const canCreate = hasPermission('assessmentRules.create');
    const canUpdate = hasPermission('assessmentRules.update');
    const canDelete = hasPermission('assessmentRules.delete');

    const [rules, setRules] = useState<AssessmentRule[]>([]);
    const [programs, setPrograms] = useState<ProgramOption[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState<AssessmentRuleFilters>({
        page: 1,
        limit: 10,
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<AssessmentRule | null>(null);
    const [isEditing, setIsEditing] = useState(false);
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

    // Carregar programas para o filtro
    useEffect(() => {
        const loadPrograms = async () => {
            try {
                const data = await assessmentRuleService.getPrograms();
                setPrograms(data || []);
            } catch (error) {
                console.error('Erro ao carregar programas:', error);
            }
        };
        loadPrograms();
    }, []);

    const loadRules = async () => {
        try {
            startLoading();
            const response = await assessmentRuleService.getAll(filters);
            const dataArray = response?.data || [];
            setRules(dataArray.map((r: any) => ({
                ...r,
                isActive: isActiveBoolean(r.isActive)
            })));
            setTotal(response?.total || 0);
            setTotalPages(response?.totalPages || 1);
        } catch (error: any) {
            showError('Erro', getApiErrorMessage(error, 'Não foi possível carregar as regras de avaliação'));
            setRules([]);
            setTotal(0);
            setTotalPages(1);
        } finally {
            stopLoading();
        }
    };

    useEffect(() => {
        loadRules();
    }, [filters.page, filters.limit, filters.isActive, filters.programUuid, filters.search]);

    const handleSearch = () => {
        setFilters(prev => ({ ...prev, page: 1, search: searchTerm.trim() || undefined }));
    };

    // Alterar um filtro volta sempre à primeira página
    const updateFilters = (changes: Partial<AssessmentRuleFilters>) => {
        setFilters(prev => ({ ...prev, ...changes, page: 1 }));
    };

    const handleCreate = () => {
        setEditingRule(null);
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const handleEdit = (rule: AssessmentRule) => {
        setEditingRule(rule);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleDelete = (rule: AssessmentRule) => {
        setConfirmDialog({
            isOpen: true,
            type: 'delete',
            uuid: rule.uuid,
            name: rule.name,
        });
    };

    const handleToggleActive = (rule: AssessmentRule) => {
        setConfirmDialog({
            isOpen: true,
            type: 'toggle',
            uuid: rule.uuid,
            name: rule.name,
            isActive: rule.isActive,
        });
    };

    const handleConfirmAction = async () => {
        const { type, uuid, name, isActive } = confirmDialog;
        try {
            startLoading();
            if (type === 'delete') {
                await assessmentRuleService.remove(uuid!);
                showSuccess('Regra excluída', `Regra "${name}" foi removida`);
            } else if (type === 'toggle') {
                await assessmentRuleService.toggleStatus(uuid!, !isActive);
                const newStatus = isActive ? 'desativada' : 'ativada';
                showSuccess(`Regra ${newStatus}`, `Regra "${name}" foi ${newStatus}`);
            }
            setConfirmDialog({ isOpen: false, type: 'delete' });
            loadRules();
        } catch (error: any) {
            showError('Erro', getApiErrorMessage(error));
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
            key: 'code',
            header: 'Código',
            render: (item: AssessmentRule) => (
                <div className={styles.codeCell}>
                    <Hash size={14} />
                    <span className={styles.codeValue}>{item.code}</span>
                </div>
            ),
        },
        {
            key: 'name',
            header: 'Nome',
            render: (item: AssessmentRule) => (
                <div className={styles.nameCell}>
                    <ClipboardList size={14} />
                    <span>{item.name}</span>
                </div>
            ),
        },
        {
            key: 'program',
            header: 'Programa',
            render: (item: AssessmentRule) => (
                <div className={styles.programCell}>
                    <BookOpen size={14} />
                    <span>{item.programName || '-'}</span>
                </div>
            ),
        },
        {
            key: 'weight',
            header: 'Peso',
            render: (item: AssessmentRule) => (
                <div className={styles.weightCell}>
                    <Weight size={14} />
                    <span>{item.weight}%</span>
                </div>
            ),
        },
        {
            key: 'maximumScore',
            header: 'Nota Máx',
            render: (item: AssessmentRule) => (
                <div className={styles.scoreCell}>
                    <Award size={14} />
                    <span>{item.maximumScore}</span>
                </div>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            render: (item: AssessmentRule) => getStatusBadge(item.isActive),
        },
        {
            key: 'actions',
            header: 'Ações',
            align: 'right' as const,
            render: (item: AssessmentRule) => (
                <div className={styles.actions}>
                    {canUpdate && (
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
                    )}
                    {canUpdate && (
                        <button
                            className={styles.actionButton}
                            onClick={() => handleEdit(item)}
                            title="Editar"
                        >
                            <Edit size={16} />
                        </button>
                    )}
                    {canDelete && (
                        <button
                            className={styles.actionButton}
                            onClick={() => handleDelete(item)}
                            title="Excluir"
                        >
                            <Trash2 size={16} className={styles.actionDanger} />
                        </button>
                    )}
                </div>
            ),
        },
    ];

    const EmptyState = () => (
        <div className={styles.emptyState}>
            <div className={styles.emptyIconWrapper}>
                <ClipboardList size={48} className={styles.emptyIcon} />
            </div>
            <h3 className={styles.emptyTitle}>Nenhuma regra de avaliação</h3>
            <p className={styles.emptySubtext}>
                {filters.search || filters.isActive !== undefined || filters.programUuid
                    ? 'Tente ajustar seus filtros para encontrar o que procura'
                    : 'Comece criando uma regra de avaliação para um programa'}
            </p>
            {canCreate && (
                <Button icon={<Plus size={18} />} onClick={handleCreate}>
                    Nova Regra
                </Button>
            )}
        </div>
    );

    const renderCardsView = () => {
        const items = Array.isArray(rules) ? rules : [];
        if (items.length === 0) return <EmptyState />;

        return (
            <div className={styles.cardsGrid}>
                {items.map((rule) => (
                    <div key={rule.uuid} className={styles.ruleCard}>
                        <div className={styles.cardHeader}>
                            <div className={styles.cardHeaderLeft}>
                                <div className={styles.cardIcon}>
                                    <ClipboardList size={20} />
                                </div>
                                <div>
                                    <h3 className={styles.itemName}>{rule.name}</h3>
                                    <p className={styles.itemCode}>
                                        <Hash size={12} />
                                        {rule.code}
                                    </p>
                                </div>
                            </div>
                            <div className={styles.cardActions}>
                                {canUpdate && (
                                    <button
                                        className={styles.iconButton}
                                        onClick={() => handleToggleActive(rule)}
                                        title={rule.isActive ? 'Desativar' : 'Ativar'}
                                    >
                                        {rule.isActive ? (
                                            <PowerOff size={16} className={styles.actionInactive} />
                                        ) : (
                                            <Power size={16} className={styles.actionActive} />
                                        )}
                                    </button>
                                )}
                                {canUpdate && (
                                    <button
                                        className={styles.iconButton}
                                        onClick={() => handleEdit(rule)}
                                        title="Editar"
                                    >
                                        <Edit size={16} />
                                    </button>
                                )}
                                {canDelete && (
                                    <button
                                        className={styles.iconButton}
                                        onClick={() => handleDelete(rule)}
                                        title="Excluir"
                                    >
                                        <Trash2 size={16} className={styles.actionDanger} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className={styles.cardBody}>
                            <div className={styles.infoGrid}>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Programa</span>
                                    <span className={styles.infoValue}>
                                        <BookOpen size={14} />
                                        {rule.programName || '-'}
                                    </span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Sequência</span>
                                    <span className={styles.infoValue}>
                                        <Hash size={14} />
                                        {rule.sequence || 0}
                                    </span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Peso</span>
                                    <span className={styles.infoValue}>
                                        <Weight size={14} />
                                        {rule.weight}%
                                    </span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Nota Máxima</span>
                                    <span className={styles.infoValue}>
                                        <Award size={14} />
                                        {rule.maximumScore}
                                    </span>
                                </div>
                                {rule.description && (
                                    <div className={styles.infoItem} style={{ gridColumn: '1 / -1' }}>
                                        <span className={styles.infoLabel}>Descrição</span>
                                        <span className={styles.infoValue}>
                                            {rule.description}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={styles.cardFooter}>
                            <div className={styles.cardTags}>
                                {getStatusBadge(rule.isActive)}
                            </div>
                            <span className={styles.cardDate}>
                                <Clock size={12} />
                                Criado em {formatDate(rule.createdAt)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderTableView = () => {
        const items = Array.isArray(rules) ? rules : [];
        if (items.length === 0) return <EmptyState />;

        return (
            <div className={styles.tableContainer}>
                <Table
                    columns={columns}
                    data={items}
                    emptyMessage="Nenhuma regra de avaliação encontrada"
                />
            </div>
        );
    };

    if (isLoading && rules.length === 0) {
        return (
            <div className={styles.page}>
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>Regras de Avaliação</h1>
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
                        <ClipboardList size={24} />
                    </div>
                    <div>
                        <h1 className={styles.title}>Regras de Avaliação</h1>
                        <p className={styles.subtitle}>
                            Gerencie as regras de avaliação da instituição
                        </p>
                    </div>
                    <span className={styles.totalCount}>{total} regras</span>
                </div>
                <div className={styles.headerActions}>
                    {canCreate && (
                        <Button icon={<Plus size={18} />} onClick={handleCreate} className={styles.createButton}>
                            Nova Regra
                        </Button>
                    )}
                </div>
            </div>

            {/* Toolbar */}
            <div className={styles.toolbar}>
                <div className={styles.toolbarLeft}>
                    <div className={styles.searchWrapper}>
                        <Search size={16} className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Pesquisar regras..."
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
                        {total} regras encontradas
                    </span>
                </div>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className={styles.filtersPanel}>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Programa</label>
                        <Select
                            value={filters.programUuid || ''}
                            onChange={(e) => updateFilters({ programUuid: e.target.value || undefined })}
                            options={[
                                { value: '', label: 'Todos os programas' },
                                ...programs.map(p => ({ value: p.uuid, label: `${p.name} (${p.code})` })),
                            ]}
                            fullWidth
                        />
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Status</label>
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
                <Pagination
                    page={filters.page || 1}
                    totalPages={totalPages}
                    total={total}
                    limit={filters.limit || 10}
                    onPageChange={(page) => setFilters(prev => ({ ...prev, page }))}
                    onLimitChange={(limit) => updateFilters({ limit })}
                    itemLabel="regras"
                    disabled={isLoading}
                />
            </div>

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog({ isOpen: false, type: 'delete' })}
                onConfirm={handleConfirmAction}
                title={
                    confirmDialog.type === 'delete'
                        ? 'Excluir Regra'
                        : confirmDialog.isActive
                            ? 'Desativar Regra'
                            : 'Ativar Regra'
                }
                message={
                    confirmDialog.type === 'delete'
                        ? `Tem certeza que deseja excluir a regra "${confirmDialog.name}"?`
                        : confirmDialog.isActive
                            ? `Tem certeza que deseja desativar a regra "${confirmDialog.name}"?`
                            : `Tem certeza que deseja ativar a regra "${confirmDialog.name}"?`
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

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingRule(null);
                    setIsEditing(false);
                }}
                title={isEditing ? 'Editar Regra de Avaliação' : 'Nova Regra de Avaliação'}
                size="lg"
            >
                <AssessmentRuleForm
                    ruleToEdit={editingRule}
                    isEditing={isEditing}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        setEditingRule(null);
                        setIsEditing(false);
                        loadRules();
                    }}
                    onCancel={() => {
                        setIsModalOpen(false);
                        setEditingRule(null);
                        setIsEditing(false);
                    }}
                />
            </Modal>
        </div>
    );
}