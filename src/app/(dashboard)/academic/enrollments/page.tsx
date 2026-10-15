// src/app/(dashboard)/academic/enrollments/page.tsx

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
  Trash2,
  Power,
  PowerOff,
  LayoutGrid,
  List,
  User,
  BookOpen,
  Edit,
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
import { enrollmentService } from '@/features/academic/enrollments/services/enrollment.service';
import { EnrollmentForm } from '@/features/academic/enrollments/components/EnrollmentForm';
import { studentService } from '@/features/academic/students/services/student.service';
import type { Enrollment, EnrollmentFilters } from '@/features/academic/enrollments/types/enrollment.types';
import type { Class } from '@/features/academic/students/types/student.types';
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

export default function EnrollmentsPage() {
  const { startLoading, stopLoading, isLoading } = useLoading();
  const { showSuccess, showError } = useToast();

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<EnrollmentFilters>({
    page: 1,
    limit: 10,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState<Enrollment | null>(null);
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

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const data = await studentService.getClasses();
        setClasses(data || []);
      } catch (error) {
        console.error('Erro ao carregar turmas:', error);
      }
    };
    loadClasses();
  }, []);

  const loadEnrollments = async () => {
    try {
      startLoading();
      const response = await enrollmentService.getAll({
        ...filters,
        search: searchTerm || undefined,
      });
      const dataArray = response?.data || [];
      setEnrollments(dataArray.map((e: any) => ({ ...e, isActive: isActiveBoolean(e.isActive) })));
      setTotal(response?.total || 0);
    } catch (error: any) {
      console.error('Erro ao carregar matrículas:', error);
      showError('Erro', 'Não foi possível carregar as matrículas');
      setEnrollments([]);
      setTotal(0);
    } finally {
      stopLoading();
    }
  };

  useEffect(() => {
    loadEnrollments();
  }, [filters.page, filters.limit, filters.isActive, filters.classUuid]);

  const handleSearch = () => {
    setFilters({ ...filters, page: 1 });
    loadEnrollments();
  };

  const handleCreate = () => {
    setEditingEnrollment(null);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEdit = (enrollment: Enrollment) => {
    setEditingEnrollment(enrollment);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = (enrollment: Enrollment) => {
    setConfirmDialog({
      isOpen: true,
      type: 'delete',
      uuid: enrollment.uuid,
      name: enrollment.enrollmentNumber,
    });
  };

  const handleToggleActive = (enrollment: Enrollment) => {
    setConfirmDialog({
      isOpen: true,
      type: 'toggle',
      uuid: enrollment.uuid,
      name: enrollment.enrollmentNumber,
      isActive: enrollment.isActive,
    });
  };

  const handleConfirmAction = async () => {
    const { type, uuid, name, isActive } = confirmDialog;
    try {
      startLoading();
      if (type === 'delete') {
        await enrollmentService.remove(uuid!);
        showSuccess('Matrícula excluída', `Matrícula ${name} foi removida`);
      } else if (type === 'toggle') {
        await enrollmentService.toggleStatus(uuid!, !isActive);
        const newStatus = isActive ? 'desativada' : 'ativada';
        showSuccess(`Matrícula ${newStatus}`, `Matrícula ${name} foi ${newStatus}`);
      }
      setConfirmDialog({ isOpen: false, type: 'delete' });
      loadEnrollments();
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
      key: 'student',
      header: 'Estudante',
      render: (item: Enrollment) => (
        <div className={styles.studentCell}>
          <User size={14} />
          <div>
            <div className={styles.studentName}>{item.studentName || ''}</div>
            <div className={styles.studentNumber}>{item.student?.studentNumber || ''}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'enrollment',
      header: 'Matrícula',
      render: (item: Enrollment) => (
        <div className={styles.enrollmentCell}>
          <GraduationCap size={14} />
          <div>
            <div className={styles.enrollmentNumber}>{item.enrollmentNumber}</div>
            <div className={styles.enrollmentClass}>
              Turma: {item.className || '-'} - {item.gradeName || '-'}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Data',
      render: (item: Enrollment) => formatDate(item.enrollmentDate),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: Enrollment) => getStatusBadge(item.isActive),
    },
    {
      key: 'actions',
      header: 'Ações',
      align: 'right' as const,
      render: (item: Enrollment) => (
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
          {/* ✅ Botão Editar */}
          <button
            className={styles.actionButton}
            onClick={() => handleEdit(item)}
            title="Editar matrícula"
          >
            <Edit size={16} className={styles.actionEdit} />
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
      <h3 className={styles.emptyTitle}>Nenhuma matrícula</h3>
      <p className={styles.emptySubtext}>
        {searchTerm || filters.isActive !== undefined || filters.classUuid
          ? 'Tente ajustar seus filtros para encontrar o que procura'
          : 'Comece realizando uma nova matrícula'}
      </p>
      <Button icon={<Plus size={18} />} onClick={handleCreate}>
        Nova Matrícula
      </Button>
    </div>
  );

  const renderCardsView = () => {
    const items = Array.isArray(enrollments) ? enrollments : [];
    if (items.length === 0) return <EmptyState />;

    return (
      <div className={styles.cardsGrid}>
        {items.map((enrollment) => (
          <div key={enrollment.uuid} className={styles.enrollmentCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <div className={styles.cardIcon}>
                  <GraduationCap size={20} />
                </div>
                <div>
                  <h3 className={styles.itemName}>
                    {enrollment.student?.fullName || 'N/A'}
                  </h3>
                  <p className={styles.itemNumber}>
                    {enrollment.enrollmentNumber}
                  </p>
                </div>
              </div>
              <div className={styles.cardActions}>
                <button
                  className={styles.iconButton}
                  onClick={() => handleToggleActive(enrollment)}
                  title={enrollment.isActive ? 'Desativar' : 'Ativar'}
                >
                  {enrollment.isActive ? (
                    <PowerOff size={16} className={styles.actionInactive} />
                  ) : (
                    <Power size={16} className={styles.actionActive} />
                  )}
                </button>
                <button
                  className={styles.iconButton}
                  onClick={() => handleEdit(enrollment)}
                  title="Editar"
                >
                  <Edit size={16} className={styles.actionEdit} />
                </button>
                <button
                  className={styles.iconButton}
                  onClick={() => handleDelete(enrollment)}
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
                    <BookOpen size={14} />
                    {enrollment.class?.name || '-'}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Data</span>
                  <span className={styles.infoValue}>
                    <Clock size={14} />
                    {formatDate(enrollment.enrollmentDate)}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Estudante</span>
                  <span className={styles.infoValue}>
                    <User size={14} />
                    {enrollment.student?.studentNumber || '-'}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Status</span>
                  {getStatusBadge(enrollment.isActive)}
                </div>
              </div>
            </div>

            <div className={styles.cardFooter}>
              <span className={styles.cardDate}>
                <Clock size={12} />
                Criado em {formatDate(enrollment.createdAt)}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderTableView = () => {
    const items = Array.isArray(enrollments) ? enrollments : [];
    if (items.length === 0) return <EmptyState />;

    return (
      <div className={styles.tableContainer}>
        <Table
          columns={columns}
          data={items}
          emptyMessage="Nenhuma matrícula encontrada"
        />
      </div>
    );
  };

  if (isLoading && enrollments.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Matrículas</h1>
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
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <GraduationCap size={24} />
          </div>
          <div>
            <h1 className={styles.title}>Matrículas</h1>
            <p className={styles.subtitle}>
              Gerencie as matrículas dos estudantes
            </p>
          </div>
          <span className={styles.totalCount}>{total} matrículas</span>
        </div>
        <div className={styles.headerActions}>
          <Button icon={<Plus size={18} />} onClick={handleCreate} className={styles.createButton}>
            Nova Matrícula
          </Button>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Pesquisar matrículas..."
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
            {total} matrículas encontradas
          </span>
        </div>
      </div>

      {showFilters && (
        <div className={styles.filtersPanel}>
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

      <div className={styles.content}>
        {viewMode === 'cards' ? renderCardsView() : renderTableView()}
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, type: 'delete' })}
        onConfirm={handleConfirmAction}
        title={
          confirmDialog.type === 'delete'
            ? 'Excluir Matrícula'
            : confirmDialog.isActive
            ? 'Desativar Matrícula'
            : 'Ativar Matrícula'
        }
        message={
          confirmDialog.type === 'delete'
            ? `Tem certeza que deseja excluir a matrícula "${confirmDialog.name}"?`
            : confirmDialog.isActive
            ? `Tem certeza que deseja desativar a matrícula "${confirmDialog.name}"?`
            : `Tem certeza que deseja ativar a matrícula "${confirmDialog.name}"?`
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEnrollment(null);
          setIsEditing(false);
        }}
        title={isEditing ? 'Editar Matrícula' : 'Nova Matrícula'}
        size="lg"
      >
        <EnrollmentForm
          enrollmentToEdit={editingEnrollment}
          isEditing={isEditing}
          onSuccess={() => {
            setIsModalOpen(false);
            setEditingEnrollment(null);
            setIsEditing(false);
            // showSuccess(
            //   isEditing ? 'Matrícula atualizada' : 'Matrícula realizada',
            //   isEditing ? 'Matrícula atualizada com sucesso' : 'Matrícula realizada com sucesso'
            // );
            loadEnrollments();
          }}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingEnrollment(null);
            setIsEditing(false);
          }}
        />
      </Modal>
    </div>
  );
}