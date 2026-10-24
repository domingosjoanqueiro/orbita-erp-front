// src/app/(dashboard)/academic/teachers/page.tsx

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
  Briefcase,
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
import { Pagination } from '@/shared/components/ui/Pagination/Pagination';
import { useLoading } from '@/shared/contexts/LoadingContext';
import { useToast } from '@/shared/contexts/ToastContext';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { usePermission } from '@/shared/hooks/usePermission';
import { getApiErrorMessage } from '@/shared/utils/api.utils';
import { formatDisplayDate } from '@/shared/utils/date.utils';
import { teacherService } from '@/features/academic/teachers/services/teacher.service';
import { TeacherForm } from '@/features/academic/teachers/components/TeacherForm';
import { TeacherDetails } from '@/features/academic/teachers/components/TeacherDetails';
import type { TeacherWithUser, TeacherFilters } from '@/features/academic/teachers/types/teacher.types';
import styles from './page.module.css';

type ViewMode = 'cards' | 'table';

const getStatusBadge = (isActive: boolean) => (
  <Badge variant={isActive ? 'success' : 'error'} size="sm">
    <span className={styles.statusBadge}>
      {isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
      {isActive ? 'Ativo' : 'Inativo'}
    </span>
  </Badge>
);

const getGenderBadge = (gender: string) => (
  <Badge variant="neutral" size="sm">
    <span className={styles.genderBadge}>
      <User size={10} />
      {gender === 'MALE' ? 'Masculino' : 'Feminino'}
    </span>
  </Badge>
);

const getAccessBadge = (teacher: TeacherWithUser) =>
  teacher.user ? (
    <Badge variant={teacher.user.isActive ? 'info' : 'warning'} size="sm">
      {teacher.user.isActive ? 'Com acesso' : 'Acesso inativo'}
    </Badge>
  ) : (
    <Badge variant="neutral" size="sm">Sem acesso</Badge>
  );

export default function TeachersPage() {
  const { startLoading, stopLoading, isLoading } = useLoading();
  const { showSuccess, showError } = useToast();
  const { hasPermission } = usePermission();
  const canCreate = hasPermission('teachers.create');
  const canUpdate = hasPermission('teachers.update');
  const canDelete = hasPermission('teachers.delete');
  const canReadAssignments = hasPermission('teacherAssignments.read');

  const [teachers, setTeachers] = useState<TeacherWithUser[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const [filters, setFilters] = useState<TeacherFilters>({ page: 1, limit: 10 });
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm.trim(), 400);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherWithUser | null>(null);
  const [detailsTeacher, setDetailsTeacher] = useState<TeacherWithUser | null>(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'delete' | 'toggle';
    teacher?: TeacherWithUser;
  }>({ isOpen: false, type: 'delete' });

  // Ignora respostas antigas quando os filtros mudam depressa
  const requestId = useRef(0);

  const loadTeachers = useCallback(async () => {
    const current = ++requestId.current;
    try {
      startLoading();
      const response = await teacherService.getAll({
        ...filters,
        search: debouncedSearch || undefined,
      });
      if (current !== requestId.current) return;
      setTeachers(response.data.map(t => ({ ...t, isActive: Boolean(t.isActive) })));
      setTotal(response.total);
      setTotalPages(Math.max(1, response.totalPages));
      // página vazia depois de excluir o último da página: recua uma
      if (response.data.length === 0 && (filters.page ?? 1) > 1) {
        setFilters(prev => ({ ...prev, page: Math.max(1, (prev.page ?? 1) - 1) }));
      }
    } catch (error) {
      if (current !== requestId.current) return;
      showError('Erro', getApiErrorMessage(error, 'Não foi possível carregar os professores'));
      setTeachers([]);
      setTotal(0);
    } finally {
      stopLoading();
      if (current === requestId.current) setLoaded(true);
    }
  }, [filters, debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  // Nova pesquisa volta à primeira página
  useEffect(() => {
    setFilters(prev => (prev.page === 1 ? prev : { ...prev, page: 1 }));
  }, [debouncedSearch]);

  const updateFilters = (changes: Partial<TeacherFilters>) =>
    setFilters(prev => ({ ...prev, ...changes, page: 1 }));

  // Recarrega a lista e a ficha aberta nos detalhes
  const refresh = useCallback(async () => {
    await loadTeachers();
    if (detailsTeacher) {
      try {
        const fresh = await teacherService.getByUuid(detailsTeacher.uuid);
        setDetailsTeacher({ ...fresh, isActive: Boolean(fresh.isActive) });
      } catch {
        setDetailsTeacher(null);
      }
    }
  }, [loadTeachers, detailsTeacher]);

  const handleCreate = () => {
    setEditingTeacher(null);
    setIsFormOpen(true);
  };

  const handleEdit = (teacher: TeacherWithUser) => {
    setEditingTeacher(teacher);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingTeacher(null);
  };

  const handleConfirmAction = async () => {
    const { type, teacher } = confirmDialog;
    if (!teacher) return;
    try {
      setIsSubmittingAction(true);
      startLoading();
      if (type === 'delete') {
        await teacherService.remove(teacher.uuid);
        showSuccess('Professor excluído', `${teacher.fullName} foi removido.`);
        if (detailsTeacher?.uuid === teacher.uuid) setDetailsTeacher(null);
        setConfirmDialog({ isOpen: false, type: 'delete' });
        await loadTeachers();
      } else {
        await teacherService.toggleStatus(teacher.uuid, !teacher.isActive);
        const newStatus = teacher.isActive ? 'desativado' : 'ativado';
        showSuccess(
          `Professor ${newStatus}`,
          teacher.user
            ? `${teacher.fullName} foi ${newStatus}; o acesso ao sistema acompanha o estado.`
            : `${teacher.fullName} foi ${newStatus}.`
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

  const renderActions = (teacher: TeacherWithUser, buttonClass: string) => (
    <>
      <button className={buttonClass} onClick={() => setDetailsTeacher(teacher)} title="Ver detalhes" aria-label={`Ver detalhes de ${teacher.fullName}`}>
        <Eye size={16} className={styles.actionView} />
      </button>
      {canUpdate && (
        <button
          className={buttonClass}
          onClick={() => setConfirmDialog({ isOpen: true, type: 'toggle', teacher })}
          title={teacher.isActive ? 'Desativar' : 'Ativar'}
          aria-label={teacher.isActive ? 'Desativar' : 'Ativar'}
        >
          {teacher.isActive ? <PowerOff size={16} className={styles.actionInactive} /> : <Power size={16} className={styles.actionActive} />}
        </button>
      )}
      {canUpdate && (
        <button className={buttonClass} onClick={() => handleEdit(teacher)} title="Editar" aria-label="Editar">
          <Edit size={16} />
        </button>
      )}
      {canDelete && (
        <button className={buttonClass} onClick={() => setConfirmDialog({ isOpen: true, type: 'delete', teacher })} title="Excluir" aria-label="Excluir">
          <Trash2 size={16} className={styles.actionDanger} />
        </button>
      )}
    </>
  );

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
      header: 'Contacto',
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
          {!item.email && !item.phone && <span className={styles.noUser}>-</span>}
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
      header: 'Género',
      render: (item: TeacherWithUser) => getGenderBadge(item.gender),
    },
    {
      key: 'access',
      header: 'Acesso',
      render: (item: TeacherWithUser) => getAccessBadge(item),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (item: TeacherWithUser) => getStatusBadge(item.isActive),
    },
    {
      key: 'actions',
      header: 'Ações',
      align: 'right' as const,
      render: (item: TeacherWithUser) => <div className={styles.actions}>{renderActions(item, styles.actionButton)}</div>,
    },
  ];

  const hasActiveFilters = !!debouncedSearch || filters.isActive !== undefined || !!filters.gender;

  const renderEmptyState = () => (
    <div className={styles.emptyState}>
      <div className={styles.emptyIconWrapper}>
        <Users size={48} className={styles.emptyIcon} />
      </div>
      <h3 className={styles.emptyTitle}>Nenhum professor</h3>
      <p className={styles.emptySubtext}>
        {hasActiveFilters ? 'Tente ajustar os filtros para encontrar o que procura' : 'Comece por registar um professor'}
      </p>
      {canCreate && !hasActiveFilters && (
        <Button icon={<Plus size={18} />} onClick={handleCreate}>
          Novo Professor
        </Button>
      )}
    </div>
  );

  const renderCardsView = () => (
    <div className={styles.cardsGrid}>
      {teachers.map(teacher => (
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
            <div className={styles.cardActions}>{renderActions(teacher, styles.iconButton)}</div>
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
                <span className={styles.infoLabel}>Género</span>
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
                  {formatDisplayDate(teacher.hireDate)}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Utilizador</span>
                <span className={styles.infoValue}>
                  {teacher.user ? (
                    <span className={styles.hasUser}>
                      <CheckCircle size={14} />
                      {teacher.user.username}
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
              {getStatusBadge(teacher.isActive)}
              {getAccessBadge(teacher)}
            </div>
            <span className={styles.cardDate}>
              <Clock size={12} />
              Registado em {formatDisplayDate(teacher.createdAt)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );

  if (!loaded) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Professores</h1>
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

  const confirmTeacher = confirmDialog.teacher;

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
            <p className={styles.subtitle}>Gerencie os professores da instituição</p>
          </div>
          <span className={styles.totalCount}>{total} professores</span>
        </div>
        {canCreate && (
          <div className={styles.headerActions}>
            <Button icon={<Plus size={18} />} onClick={handleCreate} className={styles.createButton}>
              Novo Professor
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
              placeholder="Pesquisar por nome, nº, email ou especialização..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className={styles.searchInput}
              aria-label="Pesquisar professores"
            />
          </div>
          <button className={`${styles.filterButton} ${showFilters ? styles.active : ''}`} onClick={() => setShowFilters(!showFilters)}>
            <Filter size={16} />
            Filtros
            {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewButton} ${viewMode === 'cards' ? styles.active : ''}`}
              onClick={() => setViewMode('cards')}
              title="Visualização em cartões"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              className={`${styles.viewButton} ${viewMode === 'table' ? styles.active : ''}`}
              onClick={() => setViewMode('table')}
              title="Visualização em tabela"
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
            <label className={styles.filterLabel}>Género</label>
            <div className={styles.filterOptions}>
              {[
                { value: undefined, label: 'Todos' },
                { value: 'MALE' as const, label: 'Masculino' },
                { value: 'FEMALE' as const, label: 'Feminino' },
              ].map(option => (
                <button
                  key={option.label}
                  className={`${styles.filterChip} ${filters.gender === option.value ? styles.active : ''}`}
                  onClick={() => updateFilters({ gender: option.value })}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Estado</label>
            <div className={styles.filterOptions}>
              {[
                { value: undefined, label: 'Todos' },
                { value: true, label: 'Ativos' },
                { value: false, label: 'Inativos' },
              ].map(option => (
                <button
                  key={option.label}
                  className={`${styles.filterChip} ${filters.isActive === option.value ? styles.active : ''}`}
                  onClick={() => updateFilters({ isActive: option.value })}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className={styles.content}>
        {teachers.length === 0 ? (
          renderEmptyState()
        ) : viewMode === 'cards' ? (
          renderCardsView()
        ) : (
          <div className={styles.tableContainer}>
            <Table columns={columns} data={teachers} emptyMessage="Nenhum professor encontrado" />
          </div>
        )}
        {total > 0 && (
          <Pagination
            page={filters.page || 1}
            totalPages={totalPages}
            total={total}
            limit={filters.limit || 10}
            onPageChange={page => setFilters(prev => ({ ...prev, page }))}
            onLimitChange={limit => updateFilters({ limit })}
            itemLabel="professores"
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
            ? 'Excluir Professor'
            : confirmTeacher?.isActive
              ? 'Desativar Professor'
              : 'Ativar Professor'
        }
        message={
          confirmDialog.type === 'delete'
            ? `Tem a certeza que deseja excluir o professor "${confirmTeacher?.fullName}"? O acesso ao sistema também deixa de funcionar.`
            : confirmTeacher?.isActive
              ? `Tem a certeza que deseja desativar o professor "${confirmTeacher?.fullName}"?${confirmTeacher?.user ? ' O acesso ao sistema também fica desativado.' : ''}`
              : `Tem a certeza que deseja ativar o professor "${confirmTeacher?.fullName}"?${confirmTeacher?.user ? ' O acesso ao sistema volta a ficar ativo.' : ''}`
        }
        type={confirmDialog.type === 'delete' ? 'danger' : 'warning'}
        confirmText={confirmDialog.type === 'delete' ? 'Excluir' : confirmTeacher?.isActive ? 'Desativar' : 'Ativar'}
        isLoading={isSubmittingAction}
      />

      {/* Formulário */}
      <Modal isOpen={isFormOpen} onClose={closeForm} title={editingTeacher ? 'Editar Professor' : 'Novo Professor'} size="lg">
        {isFormOpen && (
          <TeacherForm
            key={editingTeacher?.uuid ?? 'new'}
            teacher={editingTeacher}
            onSuccess={() => {
              closeForm();
              refresh();
            }}
            onCancel={closeForm}
          />
        )}
      </Modal>

      {/* Detalhes */}
      <TeacherDetails
        teacher={detailsTeacher}
        isOpen={!!detailsTeacher && !isFormOpen}
        onClose={() => setDetailsTeacher(null)}
        canManageAccess={canUpdate}
        canReadAssignments={canReadAssignments}
        onAccessChanged={refresh}
        onEdit={canUpdate && detailsTeacher ? () => handleEdit(detailsTeacher) : undefined}
        onToggleStatus={
          canUpdate && detailsTeacher ? () => setConfirmDialog({ isOpen: true, type: 'toggle', teacher: detailsTeacher }) : undefined
        }
        onDelete={canDelete && detailsTeacher ? () => setConfirmDialog({ isOpen: true, type: 'delete', teacher: detailsTeacher }) : undefined}
      />
    </div>
  );
}
