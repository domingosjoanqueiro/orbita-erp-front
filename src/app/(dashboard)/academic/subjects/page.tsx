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
  Hash,
  FileText,
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
import { subjectService } from '@/features/academic/subjects/services/subject.service';
import { SubjectForm } from '@/features/academic/subjects/components/SubjectForm';
import type { Subject, SubjectFilters } from '@/features/academic/subjects/types/subject.types';
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

export default function SubjectsPage() {
  const { startLoading, stopLoading, isLoading } = useLoading();
  const { showSuccess, showError } = useToast();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<SubjectFilters>({ page: 1, limit: 10 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
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

  const loadSubjects = async () => {
    try {
      startLoading();
      const response = await subjectService.getAll({
        ...filters,
        search: searchTerm || undefined,
      });
      const dataArray = response?.data || [];
      setSubjects(dataArray.map((s: any) => ({ ...s, isActive: isActiveBoolean(s.isActive) })));
      setTotal(response?.total || 0);
    } catch (error: any) {
      console.error('Erro ao carregar disciplinas:', error);
      showError('Erro', 'Não foi possível carregar as disciplinas');
      setSubjects([]);
      setTotal(0);
    } finally {
      stopLoading();
    }
  };

  useEffect(() => {
    loadSubjects();
  }, [filters.page, filters.limit, filters.isActive]);

  const handleSearch = () => {
    setFilters({ ...filters, page: 1 });
    loadSubjects();
  };

  const handleCreate = () => {
    setSelectedSubject(null);
    setIsModalOpen(true);
  };

  const handleEdit = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsModalOpen(true);
  };

  const handleDelete = (subject: Subject) => {
    setConfirmDialog({
      isOpen: true,
      type: 'delete',
      uuid: subject.uuid,
      name: subject.name,
    });
  };

  const handleToggleActive = (subject: Subject) => {
    setConfirmDialog({
      isOpen: true,
      type: 'toggle',
      uuid: subject.uuid,
      name: subject.name,
      isActive: subject.isActive,
    });
  };

  const handleConfirmAction = async () => {
    const { type, uuid, name, isActive } = confirmDialog;
    try {
      startLoading();
      if (type === 'delete') {
        await subjectService.remove(uuid!);
        showSuccess('Disciplina excluída', `Disciplina ${name} foi removida`);
      } else if (type === 'toggle') {
        await subjectService.toggleStatus(uuid!, !isActive);
        const newStatus = isActive ? 'desativada' : 'ativada';
        showSuccess(`Disciplina ${newStatus}`, `Disciplina ${name} foi ${newStatus}`);
      }
      setConfirmDialog({ isOpen: false, type: 'delete' });
      loadSubjects();
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
      key: 'code',
      header: 'Código',
      render: (item: Subject) => (
        <div className={styles.codeCell}>
          <Hash size={14} />
          <span className={styles.codeText}>{item.code}</span>
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Nome',
      render: (item: Subject) => (
        <div className={styles.subjectCell}>
          <div className={styles.subjectIcon}>
            <BookOpen size={16} />
          </div>
          <div>
            <div className={styles.subjectName}>{item.name}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Descrição',
      render: (item: Subject) => (
        <div className={styles.descriptionCell}>
          {item.description || <span className={styles.noDescription}>-</span>}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: Subject) => getStatusBadge(item.isActive),
    },
    {
      key: 'actions',
      header: 'Ações',
      align: 'right' as const,
      render: (item: Subject) => (
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
      <h3 className={styles.emptyTitle}>Nenhuma disciplina</h3>
      <p className={styles.emptySubtext}>
        {searchTerm || filters.isActive !== undefined
          ? 'Tente ajustar seus filtros para encontrar o que procura'
          : 'Comece criando a primeira disciplina'}
      </p>
      <Button icon={<Plus size={18} />} onClick={handleCreate}>
        Nova Disciplina
      </Button>
    </div>
  );

  const renderCardsView = () => {
    const items = Array.isArray(subjects) ? subjects : [];
    if (items.length === 0) return <EmptyState />;

    return (
      <div className={styles.cardsGrid}>
        {items.map((subject) => (
          <div key={subject.uuid} className={styles.subjectCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <div className={styles.subjectIconLarge}>
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className={styles.itemName}>{subject.name}</h3>
                  <p className={styles.itemCode}>
                    <Hash size={12} />
                    {subject.code}
                  </p>
                </div>
              </div>
              <div className={styles.cardActions}>
                <button
                  className={styles.iconButton}
                  onClick={() => handleToggleActive(subject)}
                  title={subject.isActive ? 'Desativar' : 'Ativar'}
                >
                  {subject.isActive ? (
                    <PowerOff size={16} className={styles.actionInactive} />
                  ) : (
                    <Power size={16} className={styles.actionActive} />
                  )}
                </button>
                <button
                  className={styles.iconButton}
                  onClick={() => handleEdit(subject)}
                  title="Editar"
                >
                  <Edit size={16} />
                </button>
                <button
                  className={styles.iconButton}
                  onClick={() => handleDelete(subject)}
                  title="Excluir"
                >
                  <Trash2 size={16} className={styles.actionDanger} />
                </button>
              </div>
            </div>

            <div className={styles.cardBody}>
              {subject.description && (
                <div className={styles.descriptionWrapper}>
                  <FileText size={14} className={styles.descriptionIcon} />
                  <p className={styles.descriptionText}>{subject.description}</p>
                </div>
              )}
            </div>

            <div className={styles.cardFooter}>
              <div className={styles.cardTags}>
                {getStatusBadge(subject.isActive)}
              </div>
              <span className={styles.cardDate}>
                <Clock size={12} />
                Criado em {formatDate(subject.createdAt)}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderTableView = () => {
    const items = Array.isArray(subjects) ? subjects : [];
    if (items.length === 0) return <EmptyState />;

    return (
      <div className={styles.tableContainer}>
        <Table
          columns={columns}
          data={items}
          emptyMessage="Nenhuma disciplina encontrada"
        />
      </div>
    );
  };

  if (isLoading && subjects.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Disciplinas</h1>
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
            <h1 className={styles.title}>Disciplinas</h1>
            <p className={styles.subtitle}>
              Gerencie as disciplinas da instituição
            </p>
          </div>
          <span className={styles.totalCount}>{total} disciplinas</span>
        </div>
        <div className={styles.headerActions}>
          <Button icon={<Plus size={18} />} onClick={handleCreate} className={styles.createButton}>
            Nova Disciplina
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
              placeholder="Pesquisar disciplinas..."
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
            {total} disciplinas encontradas
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
            ? 'Excluir Disciplina'
            : confirmDialog.isActive
            ? 'Desativar Disciplina'
            : 'Ativar Disciplina'
        }
        message={
          confirmDialog.type === 'delete'
            ? `Tem certeza que deseja excluir a disciplina "${confirmDialog.name}"?`
            : confirmDialog.isActive
            ? `Tem certeza que deseja desativar a disciplina "${confirmDialog.name}"?`
            : `Tem certeza que deseja ativar a disciplina "${confirmDialog.name}"?`
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
        title={selectedSubject ? 'Editar Disciplina' : 'Nova Disciplina'}
        size="lg"
      >
        <SubjectForm
          subject={selectedSubject}
          onSuccess={() => {
            setIsModalOpen(false);
            setSelectedSubject(null);
            showSuccess(
              selectedSubject ? 'Disciplina atualizada' : 'Disciplina criada',
              selectedSubject
                ? `Disciplina ${selectedSubject.name} foi atualizada`
                : 'Nova disciplina criada com sucesso'
            );
            loadSubjects();
          }}
          onCancel={() => {
            setIsModalOpen(false);
            setSelectedSubject(null);
          }}
        />
      </Modal>
    </div>
  );
}