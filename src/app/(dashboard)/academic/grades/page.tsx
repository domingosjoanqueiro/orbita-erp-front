'use client';

import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
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
  FileText,
  BookOpen,
  Layers,
  Award,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button/Button';
import { Input } from '@/shared/components/ui/Input/Input';
import { Badge } from '@/shared/components/ui/Badge/Badge';
import { Table } from '@/shared/components/ui/Table/Table';
import { Modal } from '@/shared/components/ui/Modal/Modal';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog/ConfirmDialog';
import { SkeletonCard } from '@/shared/components/ui/Skeleton/SkeletonCard';
import { useLoading } from '@/shared/contexts/LoadingContext';
import { useToast } from '@/shared/contexts/ToastContext';
import { gradeService } from '@/features/academic/grades/services/grade.service';
import { GradeForm } from '@/features/academic/grades/components/GradeForm';
import type { Grade, GradeFilters } from '@/features/academic/grades/types/grade.types';
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
        {active ? 'Ativa' : 'Inativa'}
      </span>
    </Badge>
  );
};

const getTerminalBadge = (isTerminal: boolean) => {
  return (
    <Badge variant={isTerminal ? 'warning' : 'info'} size="sm">
      <span className={styles.terminalBadge}>
        {isTerminal ? <Award size={10} /> : <TrendingUp size={10} />}
        {isTerminal ? 'Terminal' : 'Continuidade'}
      </span>
    </Badge>
  );
};

export default function GradesPage() {
  const { startLoading, stopLoading, isLoading } = useLoading();
  const { showSuccess, showError } = useToast();

  const [grades, setGrades] = useState<Grade[]>([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<GradeFilters>({ page: 1, limit: 10 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
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

  const loadGrades = async () => {
    try {
      startLoading();
      const response = await gradeService.getAll({
        ...filters,
        search: searchTerm || undefined,
      });
      const dataArray = response?.data || [];
      setGrades(dataArray.map((g: any) => ({ ...g, isActive: isActiveBoolean(g.isActive) })));
      setTotal(response?.total || 0);
    } catch (error: any) {
      console.error('Erro ao carregar classes:', error);
      showError('Erro', 'Não foi possível carregar as classes');
      setGrades([]);
      setTotal(0);
    } finally {
      stopLoading();
    }
  };

  useEffect(() => {
    loadGrades();
  }, [filters.page, filters.limit, filters.isActive, filters.programId]);

  const handleSearch = () => {
    setFilters({ ...filters, page: 1 });
    loadGrades();
  };

  const handleCreate = () => {
    setSelectedGrade(null);
    setIsModalOpen(true);
  };

  const handleEdit = (grade: Grade) => {
    setSelectedGrade(grade);
    setIsModalOpen(true);
  };

  const handleDelete = (grade: Grade) => {
    setConfirmDialog({
      isOpen: true,
      type: 'delete',
      uuid: grade.uuid,
      name: grade.name,
    });
  };

  const handleToggleActive = (grade: Grade) => {
    setConfirmDialog({
      isOpen: true,
      type: 'toggle',
      uuid: grade.uuid,
      name: grade.name,
      isActive: grade.isActive,
    });
  };

  const handleConfirmAction = async () => {
    const { type, uuid, name, isActive } = confirmDialog;
    try {
      startLoading();
      if (type === 'delete') {
        await gradeService.remove(uuid!);
        showSuccess('Classe excluída', `Classe ${name} foi removida`);
      } else if (type === 'toggle') {
        await gradeService.toggleStatus(uuid!, !isActive);
        const newStatus = isActive ? 'desativada' : 'ativada';
        showSuccess(`Classe ${newStatus}`, `Classe ${name} foi ${newStatus}`);
      }
      setConfirmDialog({ isOpen: false, type: 'delete' });
      loadGrades();
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
      header: 'Classe',
      render: (item: Grade) => (
        <div className={styles.gradeCell}>
          <div className={styles.gradeIcon}>
            <GraduationCap size={16} />
          </div>
          <div>
            <div className={styles.gradeName}>{item.name}</div>
            <div className={styles.gradeCode}>
              <Hash size={12} />
              {item.code}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'program',
      header: 'Programa',
      render: (item: Grade) => (
        <div className={styles.programCell}>
          <BookOpen size={14} />
          <span>{item.program?.name || '-'}</span>
        </div>
      ),
    },
    {
      key: 'order',
      header: 'Ordem',
      render: (item: Grade) => (
        <span className={styles.orderBadge}>{item.order}</span>
      ),
    },
    {
      key: 'isTerminal',
      header: 'Tipo',
      render: (item: Grade) => getTerminalBadge(item.isTerminal),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: Grade) => getStatusBadge(item.isActive),
    },
    {
      key: 'actions',
      header: 'Ações',
      align: 'right' as const,
      render: (item: Grade) => (
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
        <GraduationCap size={48} className={styles.emptyIcon} />
      </div>
      <h3 className={styles.emptyTitle}>Nenhuma classe</h3>
      <p className={styles.emptySubtext}>
        {searchTerm || filters.isActive !== undefined || filters.programId
          ? 'Tente ajustar seus filtros para encontrar o que procura'
          : 'Comece criando a primeira classe'}
      </p>
      <Button icon={<Plus size={18} />} onClick={handleCreate}>
        Nova Classe
      </Button>
    </div>
  );

  const renderCardsView = () => {
    const items = Array.isArray(grades) ? grades : [];
    if (items.length === 0) return <EmptyState />;

    return (
      <div className={styles.cardsGrid}>
        {items.map((grade) => (
          <div key={grade.uuid} className={styles.gradeCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <div className={styles.gradeIconLarge}>
                  <GraduationCap size={20} />
                </div>
                <div>
                  <h3 className={styles.itemName}>{grade.name}</h3>
                  <p className={styles.itemCode}>
                    <Hash size={12} />
                    {grade.code}
                  </p>
                </div>
              </div>
              <div className={styles.cardActions}>
                <button
                  className={styles.iconButton}
                  onClick={() => handleToggleActive(grade)}
                  title={grade.isActive ? 'Desativar' : 'Ativar'}
                >
                  {grade.isActive ? (
                    <PowerOff size={16} className={styles.actionInactive} />
                  ) : (
                    <Power size={16} className={styles.actionActive} />
                  )}
                </button>
                <button
                  className={styles.iconButton}
                  onClick={() => handleEdit(grade)}
                  title="Editar"
                >
                  <Edit size={16} />
                </button>
                <button
                  className={styles.iconButton}
                  onClick={() => handleDelete(grade)}
                  title="Excluir"
                >
                  <Trash2 size={16} className={styles.actionDanger} />
                </button>
              </div>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Programa</span>
                  <span className={styles.infoValue}>
                    <BookOpen size={14} />
                    {grade.programName || '-'}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Ordem</span>
                  <span className={styles.infoValue}>{grade.order}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Tipo</span>
                  {getTerminalBadge(grade.isTerminal)}
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Descrição</span>
                  <span className={styles.infoValue}>
                    {grade.description || '-'}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.cardFooter}>
              <div className={styles.cardTags}>
                {getStatusBadge(grade.isActive)}
              </div>
              <span className={styles.cardDate}>
                <Clock size={12} />
                Criado em {formatDate(grade.createdAt)}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderTableView = () => {
    const items = Array.isArray(grades) ? grades : [];
    if (items.length === 0) return <EmptyState />;

    return (
      <div className={styles.tableContainer}>
        <Table
          columns={columns}
          data={items}
          emptyMessage="Nenhuma classe encontrada"
        />
      </div>
    );
  };

  if (isLoading && grades.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Classes</h1>
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
            <GraduationCap size={24} />
          </div>
          <div>
            <h1 className={styles.title}>Classes</h1>
            <p className={styles.subtitle}>
              Gerencie as classes da instituição
            </p>
          </div>
          <span className={styles.totalCount}>{total} classes</span>
        </div>
        <div className={styles.headerActions}>
          <Button icon={<Plus size={18} />} onClick={handleCreate} className={styles.createButton}>
            Nova Classe
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
              placeholder="Pesquisar classes..."
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
            {total} classes encontradas
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
        {viewMode === 'cards' ? renderCardsView() : renderTableView()}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, type: 'delete' })}
        onConfirm={handleConfirmAction}
        title={
          confirmDialog.type === 'delete'
            ? 'Excluir Classe'
            : confirmDialog.isActive
            ? 'Desativar Classe'
            : 'Ativar Classe'
        }
        message={
          confirmDialog.type === 'delete'
            ? `Tem certeza que deseja excluir a classe "${confirmDialog.name}"?`
            : confirmDialog.isActive
            ? `Tem certeza que deseja desativar a classe "${confirmDialog.name}"?`
            : `Tem certeza que deseja ativar a classe "${confirmDialog.name}"?`
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
        onClose={() => setIsModalOpen(false)}
        title={selectedGrade ? 'Editar Classe' : 'Nova Classe'}
        size="lg"
      >
        <GradeForm
          grade={selectedGrade}
          onSuccess={() => {
            setIsModalOpen(false);
            setSelectedGrade(null);
            showSuccess(
              selectedGrade ? 'Classe atualizada' : 'Classe criada',
              selectedGrade
                ? `Classe ${selectedGrade.name} foi atualizada`
                : 'Nova classe criada com sucesso'
            );
            loadGrades();
          }}
          onCancel={() => {
            setIsModalOpen(false);
            setSelectedGrade(null);
          }}
        />
      </Modal>
    </div>
  );
}