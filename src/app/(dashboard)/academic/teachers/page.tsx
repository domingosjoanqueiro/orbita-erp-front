// src/app/(dashboard)/academic/teachers/page.tsx

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
  Briefcase,
  Calendar,
  FileText,
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
import { teacherService } from '@/features/academic/teachers/services/teacher.service';
import { TeacherForm } from '@/features/academic/teachers/components/TeacherForm';
import type { TeacherWithUser, TeacherFilters } from '@/features/academic/teachers/types/teacher.types';
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

export default function TeachersPage() {
  const { startLoading, stopLoading, isLoading } = useLoading();
  const { showSuccess, showError } = useToast();

  const [teachers, setTeachers] = useState<TeacherWithUser[]>([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<TeacherFilters>({
    page: 1,
    limit: 10,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherWithUser | null>(null);
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

  const loadTeachers = async () => {
    try {
      startLoading();
      const response = await teacherService.getAll({
        ...filters,
        search: searchTerm || undefined,
      });
      const dataArray = response?.data || [];
      setTeachers(dataArray.map((t: any) => ({ ...t, isActive: isActiveBoolean(t.isActive) })));
      setTotal(response?.total || 0);
    } catch (error: any) {
      console.error('Erro ao carregar professores:', error);
      showError('Erro', 'Não foi possível carregar os professores');
      setTeachers([]);
      setTotal(0);
    } finally {
      stopLoading();
    }
  };

  useEffect(() => {
    loadTeachers();
  }, [filters.page, filters.limit, filters.isActive, filters.gender]);

  const handleSearch = () => {
    setFilters({ ...filters, page: 1 });
    loadTeachers();
  };

  const handleCreate = () => {
    setSelectedTeacher(null);
    setIsModalOpen(true);
  };

  const handleEdit = (teacher: TeacherWithUser) => {
    setSelectedTeacher(teacher);
    setIsModalOpen(true);
  };

  const handleDelete = (teacher: TeacherWithUser) => {
    setConfirmDialog({
      isOpen: true,
      type: 'delete',
      uuid: teacher.uuid,
      name: teacher.fullName,
    });
  };

  const handleToggleActive = (teacher: TeacherWithUser) => {
    setConfirmDialog({
      isOpen: true,
      type: 'toggle',
      uuid: teacher.uuid,
      name: teacher.firstName+' '+teacher.lastName,
      isActive: teacher.isActive,
    });
  };

  const handleConfirmAction = async () => {
    const { type, uuid, name, isActive } = confirmDialog;
    try {
      startLoading();
      if (type === 'delete') {
        await teacherService.remove(uuid!);
        showSuccess('Professor excluído', `Professor ${name} foi removido`);
      } else if (type === 'toggle') {
        await teacherService.toggleStatus(uuid!, !isActive);
        const newStatus = isActive ? 'desativado' : 'ativado';
        showSuccess(`Professor ${newStatus}`, `Professor ${name} foi ${newStatus}`);
      }
      setConfirmDialog({ isOpen: false, type: 'delete' });
      loadTeachers();
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
      header: 'Professor',
      render: (item: TeacherWithUser) => (
        <div className={styles.teacherCell}>
          <div className={styles.teacherIcon}>
            <User size={16} />
          </div>
          <div>
            <div className={styles.teacherName}>{item.fullName}</div>
            <div className={styles.teacherNumber}>
              <FileText size={12} />
              {item.teacherNumber}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contato',
      render: (item: TeacherWithUser) => (
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
      key: 'specialization',
      header: 'Especialização',
      render: (item: TeacherWithUser) => (
        <div className={styles.specializationCell}>
          <Briefcase size={14} />
          <span>{item.specialization || '-'}</span>
        </div>
      ),
    },
    {
      key: 'gender',
      header: 'Gênero',
      render: (item: TeacherWithUser) => getGenderBadge(item.gender),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: TeacherWithUser) => getStatusBadge(item.isActive),
    },
    {
      key: 'actions',
      header: 'Ações',
      align: 'right' as const,
      render: (item: TeacherWithUser) => (
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
      <h3 className={styles.emptyTitle}>Nenhum professor</h3>
      <p className={styles.emptySubtext}>
        {searchTerm || filters.isActive !== undefined || filters.gender
          ? 'Tente ajustar seus filtros para encontrar o que procura'
          : 'Comece cadastrando um professor'}
      </p>
      <Button icon={<Plus size={18} />} onClick={handleCreate}>
        Novo Professor
      </Button>
    </div>
  );

  const renderCardsView = () => {
    const items = Array.isArray(teachers) ? teachers : [];
    if (items.length === 0) return <EmptyState />;

    return (
      <div className={styles.cardsGrid}>
        {items.map((teacher) => (
          <div key={teacher.uuid} className={styles.teacherCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <div className={styles.teacherIconLarge}>
                  <User size={20} />
                </div>
                <div>
                  <h3 className={styles.itemName}>{teacher.fullName}</h3>
                  <p className={styles.itemNumber}>
                    <FileText size={12} />
                    {teacher.teacherNumber}
                  </p>
                </div>
              </div>
              <div className={styles.cardActions}>
                <button
                  className={styles.iconButton}
                  onClick={() => handleToggleActive(teacher)}
                  title={teacher.isActive ? 'Desativar' : 'Ativar'}
                >
                  {teacher.isActive ? (
                    <PowerOff size={16} className={styles.actionInactive} />
                  ) : (
                    <Power size={16} className={styles.actionActive} />
                  )}
                </button>
                <button
                  className={styles.iconButton}
                  onClick={() => handleEdit(teacher)}
                  title="Editar"
                >
                  <Edit size={16} />
                </button>
                <button
                  className={styles.iconButton}
                  onClick={() => handleDelete(teacher)}
                  title="Excluir"
                >
                  <Trash2 size={16} className={styles.actionDanger} />
                </button>
              </div>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Especialização</span>
                  <span className={styles.infoValue}>
                    <Briefcase size={14} />
                    {teacher.specialization || '-'}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Gênero</span>
                  {getGenderBadge(teacher.gender)}
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Email</span>
                  <span className={styles.infoValue}>
                    <Mail size={14} />
                    {teacher.email || '-'}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Telefone</span>
                  <span className={styles.infoValue}>
                    <Phone size={14} />
                    {teacher.phone || '-'}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Data de Contratação</span>
                  <span className={styles.infoValue}>
                    <Calendar size={14} />
                    {formatDate(teacher.hireDate)}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Usuário</span>
                  <span className={styles.infoValue}>
                    {teacher.user ? (
                      <span className={styles.hasUser}>
                        <CheckCircle size={14} />
                        {teacher.user.username}
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
                {getStatusBadge(teacher.isActive)}
              </div>
              <span className={styles.cardDate}>
                <Clock size={12} />
                Criado em {formatDate(teacher.createdAt)}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderTableView = () => {
    const items = Array.isArray(teachers) ? teachers : [];
    if (items.length === 0) return <EmptyState />;

    return (
      <div className={styles.tableContainer}>
        <Table
          columns={columns}
          data={items}
          emptyMessage="Nenhum professor encontrado"
        />
      </div>
    );
  };

  if (isLoading && teachers.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Professores</h1>
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
            <h1 className={styles.title}>Professores</h1>
            <p className={styles.subtitle}>
              Gerencie os professores da instituição
            </p>
          </div>
          <span className={styles.totalCount}>{total} professores</span>
        </div>
        <div className={styles.headerActions}>
          <Button icon={<Plus size={18} />} onClick={handleCreate} className={styles.createButton}>
            Novo Professor
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
              placeholder="Pesquisar professores..."
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
            {total} professores encontrados
          </span>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className={styles.filtersPanel}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Gênero</label>
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
            ? 'Excluir Professor'
            : confirmDialog.isActive
            ? 'Desativar Professor'
            : 'Ativar Professor'
        }
        message={
          confirmDialog.type === 'delete'
            ? `Tem certeza que deseja excluir o professor "${confirmDialog.name}"?`
            : confirmDialog.isActive
            ? `Tem certeza que deseja desativar o professor "${confirmDialog.name}"?`
            : `Tem certeza que deseja ativar o professor "${confirmDialog.name}"?`
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
        title={selectedTeacher ? 'Editar Professor' : 'Novo Professor'}
        size="lg"
      >
        <TeacherForm
          teacher={selectedTeacher}
          onSuccess={() => {
            setIsModalOpen(false);
            setSelectedTeacher(null);
            loadTeachers();
          }}
          onCancel={() => {
            setIsModalOpen(false);
            setSelectedTeacher(null);
          }}
        />
      </Modal>
    </div>
  );
}