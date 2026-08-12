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
  Calendar,
  GraduationCap,
  User,
  Building2,
  Sun,
  Moon,
  Star,
  School,
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
import { classService } from '@/features/academic/classes/services/class.service';
import { ClassForm } from '@/features/academic/classes/components/ClassForm';
import type { ClassWithDetails, ClassFilters } from '@/features/academic/classes/types/class.types';
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

// ✅ CORRIGIDO: Usando apenas variantes válidas do Badge
const getShiftBadge = (shift: string) => {
  const shiftMap: Record<string, { label: string; icon: React.ReactNode; variant: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral' }> = {
    MORNING: { label: 'Manhã', icon: <Sun size={12} />, variant: 'info' },
    AFTERNOON: { label: 'Tarde', icon: <Sun size={12} />, variant: 'warning' },
    EVENING: { label: 'Noite', icon: <Moon size={12} />, variant: 'neutral' },
    FULL: { label: 'Integral', icon: <Star size={12} />, variant: 'success' },
  };

  const info = shiftMap[shift] || { 
    label: shift, 
    icon: <Clock size={12} />, 
    variant: 'neutral' as const 
  };
  
  return (
    <Badge variant={info.variant} size="sm">
      <span className={styles.shiftBadge}>
        {info.icon}
        {info.label}
      </span>
    </Badge>
  );
};

export default function ClassesPage() {
  const { startLoading, stopLoading, isLoading } = useLoading();
  const { showSuccess, showError } = useToast();

  const [classes, setClasses] = useState<ClassWithDetails[]>([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<ClassFilters>({ page: 1, limit: 10 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassWithDetails | null>(null);
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

  const loadClasses = async () => {
    try {
      startLoading();
      const response = await classService.getAll({
        ...filters,
        search: searchTerm || undefined,
      });
      const dataArray = response?.data || [];
      setClasses(dataArray.map((c: any) => ({ ...c, isActive: isActiveBoolean(c.isActive) })));
      setTotal(response?.total || 0);
    } catch (error: any) {
      console.error('Erro ao carregar turmas:', error);
      showError('Erro', 'Não foi possível carregar as turmas');
      setClasses([]);
      setTotal(0);
    } finally {
      stopLoading();
    }
  };

  useEffect(() => {
    loadClasses();
  }, [filters.page, filters.limit, filters.isActive, filters.shift]);

  const handleSearch = () => {
    setFilters({ ...filters, page: 1 });
    loadClasses();
  };

  const handleCreate = () => {
    setSelectedClass(null);
    setIsModalOpen(true);
  };

  const handleEdit = (classData: ClassWithDetails) => {
    setSelectedClass(classData);
    setIsModalOpen(true);
  };

  const handleDelete = (classData: ClassWithDetails) => {
    setConfirmDialog({
      isOpen: true,
      type: 'delete',
      uuid: classData.uuid,
      name: classData.name,
    });
  };

  const handleToggleActive = (classData: ClassWithDetails) => {
    setConfirmDialog({
      isOpen: true,
      type: 'toggle',
      uuid: classData.uuid,
      name: classData.name,
      isActive: classData.isActive,
    });
  };

  const handleConfirmAction = async () => {
    const { type, uuid, name, isActive } = confirmDialog;
    try {
      startLoading();
      if (type === 'delete') {
        await classService.remove(uuid!);
        showSuccess('Turma excluída', `Turma ${name} foi removida`);
      } else if (type === 'toggle') {
        await classService.toggleStatus(uuid!, !isActive);
        const newStatus = isActive ? 'desativada' : 'ativada';
        showSuccess(`Turma ${newStatus}`, `Turma ${name} foi ${newStatus}`);
      }
      setConfirmDialog({ isOpen: false, type: 'delete' });
      loadClasses();
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
      header: 'Turma',
      render: (item: ClassWithDetails) => (
        <div className={styles.classCell}>
          <div className={styles.classIcon}>
            <Users size={16} />
          </div>
          <div>
            <div className={styles.className}>{item.name}</div>
            <div className={styles.classGrade}>
              <GraduationCap size={12} />
              {item.gradeName || '-'}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'academicYear',
      header: 'Ano Académico',
      render: (item: ClassWithDetails) => (
        <div className={styles.academicYearCell}>
          <Calendar size={14} />
          <span>{item.academicYearName || '-'}</span>
        </div>
      ),
    },
    {
      key: 'shift',
      header: 'Turno',
      render: (item: ClassWithDetails) => getShiftBadge(item.shift),
    },
    {
      key: 'capacity',
      header: 'Capacidade',
      render: (item: ClassWithDetails) => (
        <div className={styles.capacityCell}>
          <User size={14} />
          <span>{item.capacity || 0} alunos</span>
        </div>
      ),
    },
    {
      key: 'room',
      header: 'Sala',
      render: (item: ClassWithDetails) => (
        <div className={styles.roomCell}>
          <Building2 size={14} />
          <span>{item.room || '-'}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: ClassWithDetails) => getStatusBadge(item.isActive),
    },
    {
      key: 'actions',
      header: 'Ações',
      align: 'right' as const,
      render: (item: ClassWithDetails) => (
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
        <Users size={48} className={styles.emptyIcon} />
      </div>
      <h3 className={styles.emptyTitle}>Nenhuma turma</h3>
      <p className={styles.emptySubtext}>
        {searchTerm || filters.isActive !== undefined || filters.shift
          ? 'Tente ajustar seus filtros para encontrar o que procura'
          : 'Comece criando a primeira turma'}
      </p>
      <Button icon={<Plus size={18} />} onClick={handleCreate}>
        Nova Turma
      </Button>
    </div>
  );

  const renderCardsView = () => {
    const items = Array.isArray(classes) ? classes : [];
    if (items.length === 0) return <EmptyState />;

    return (
      <div className={styles.cardsGrid}>
        {items.map((classData) => (
          <div key={classData.uuid} className={styles.classCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <div className={styles.classIconLarge}>
                  <Users size={20} />
                </div>
                <div>
                  <h3 className={styles.itemName}>{classData.name}</h3>
                  <p className={styles.itemGrade}>
                    <GraduationCap size={12} />
                    {classData.gradeName || '-'}
                  </p>
                </div>
              </div>
              <div className={styles.cardActions}>
                <button
                  className={styles.iconButton}
                  onClick={() => handleToggleActive(classData)}
                  title={classData.isActive ? 'Desativar' : 'Ativar'}
                >
                  {classData.isActive ? (
                    <PowerOff size={16} className={styles.actionInactive} />
                  ) : (
                    <Power size={16} className={styles.actionActive} />
                  )}
                </button>
                <button
                  className={styles.iconButton}
                  onClick={() => handleEdit(classData)}
                  title="Editar"
                >
                  <Edit size={16} />
                </button>
                <button
                  className={styles.iconButton}
                  onClick={() => handleDelete(classData)}
                  title="Excluir"
                >
                  <Trash2 size={16} className={styles.actionDanger} />
                </button>
              </div>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Ano Académico</span>
                  <span className={styles.infoValue}>
                    <Calendar size={14} />
                    {classData.academicYearName || '-'}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Turno</span>
                  {getShiftBadge(classData.shift)}
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Capacidade</span>
                  <span className={styles.infoValue}>
                    <User size={14} />
                    {classData.capacity || 0} alunos
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Sala</span>
                  <span className={styles.infoValue}>
                    <Building2 size={14} />
                    {classData.room || '-'}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.cardFooter}>
              <div className={styles.cardTags}>
                {getStatusBadge(classData.isActive)}
              </div>
              <span className={styles.cardDate}>
                <Clock size={12} />
                Criado em {formatDate(classData.createdAt)}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderTableView = () => {
    const items = Array.isArray(classes) ? classes : [];
    if (items.length === 0) return <EmptyState />;

    return (
      <div className={styles.tableContainer}>
        <Table
          columns={columns}
          data={items}
          emptyMessage="Nenhuma turma encontrada"
        />
      </div>
    );
  };

  if (isLoading && classes.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Turmas</h1>
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
            <h1 className={styles.title}>Turmas</h1>
            <p className={styles.subtitle}>
              Gerencie as turmas da instituição
            </p>
          </div>
          <span className={styles.totalCount}>{total} turmas</span>
        </div>
        <div className={styles.headerActions}>
          <Button icon={<Plus size={18} />} onClick={handleCreate} className={styles.createButton}>
            Nova Turma
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
              placeholder="Pesquisar turmas..."
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
            {total} turmas encontradas
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

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Turno</label>
            <div className={styles.filterOptions}>
              <button
                className={`${styles.filterChip} ${filters.shift === undefined ? styles.active : ''}`}
                onClick={() => setFilters({ ...filters, shift: undefined })}
              >
                Todos
              </button>
              <button
                className={`${styles.filterChip} ${filters.shift === 'MORNING' ? styles.active : ''}`}
                onClick={() => setFilters({ ...filters, shift: 'MORNING' })}
              >
                <Sun size={12} /> Manhã
              </button>
              <button
                className={`${styles.filterChip} ${filters.shift === 'AFTERNOON' ? styles.active : ''}`}
                onClick={() => setFilters({ ...filters, shift: 'AFTERNOON' })}
              >
                <Sun size={12} /> Tarde
              </button>
              <button
                className={`${styles.filterChip} ${filters.shift === 'EVENING' ? styles.active : ''}`}
                onClick={() => setFilters({ ...filters, shift: 'EVENING' })}
              >
                <Moon size={12} /> Noite
              </button>
              <button
                className={`${styles.filterChip} ${filters.shift === 'FULL' ? styles.active : ''}`}
                onClick={() => setFilters({ ...filters, shift: 'FULL' })}
              >
                <Star size={12} /> Integral
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
            ? 'Excluir Turma'
            : confirmDialog.isActive
            ? 'Desativar Turma'
            : 'Ativar Turma'
        }
        message={
          confirmDialog.type === 'delete'
            ? `Tem certeza que deseja excluir a turma "${confirmDialog.name}"?`
            : confirmDialog.isActive
            ? `Tem certeza que deseja desativar a turma "${confirmDialog.name}"?`
            : `Tem certeza que deseja ativar a turma "${confirmDialog.name}"?`
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
        title={selectedClass ? 'Editar Turma' : 'Nova Turma'}
        size="lg"
      >
        <ClassForm
          classData={selectedClass}
          onSuccess={() => {
            setIsModalOpen(false);
            setSelectedClass(null);
            showSuccess(
              selectedClass ? 'Turma atualizada' : 'Turma criada',
              selectedClass
                ? `Turma ${selectedClass.name} foi atualizada`
                : 'Nova turma criada com sucesso'
            );
            loadClasses();
          }}
          onCancel={() => {
            setIsModalOpen(false);
            setSelectedClass(null);
          }}
        />
      </Modal>
    </div>
  );
}