'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
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
  CalendarDays,
  Award,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button/Button';
import { Input } from '@/shared/components/ui/Input/Input';
import { Badge } from '@/shared/components/ui/Badge/Badge';
import { Modal } from '@/shared/components/ui/Modal/Modal';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog/ConfirmDialog';
import { SkeletonCard } from '@/shared/components/ui/Skeleton/SkeletonCard';
import { useLoading } from '@/shared/contexts/LoadingContext';
import { useToast } from '@/shared/contexts/ToastContext';
import { academicYearService } from '@/features/academic/academic-years/services/academic-year.service';
import { AcademicYearForm } from '@/features/academic/academic-years/components/AcademicYearForm';
import type { AcademicYear, AcademicYearFilters } from '@/features/academic/academic-years/types/academic-year.types';
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

export default function AcademicYearsPage() {
  const { startLoading, stopLoading, isLoading } = useLoading();
  const { showSuccess, showError } = useToast();

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<AcademicYearFilters>({ page: 1, limit: 10 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'delete' | 'toggle';
    yearUuid?: string;
    yearName?: string;
    isActive?: boolean;
  }>({ isOpen: false, type: 'delete' });

const loadAcademicYears = async () => {
  try {
    startLoading();
    const response = await academicYearService.getAll({
      ...filters,
      search: searchTerm || undefined,
    });
    
    // O service já retorna { data: [], total, page, limit, totalPages }
    const yearsArray = response?.data || [];
    const totalItems = response?.total || 0;
    
    const normalizedYears = yearsArray.map((year: any) => ({
      ...year,
      isActive: isActiveBoolean(year.isActive !== undefined ? year.isActive : year.is_active),
    }));
    
    setAcademicYears(normalizedYears);
    setTotal(totalItems);
  } catch (error: any) {
    console.error('Erro ao carregar anos académicos:', error);
    showError('Erro', error.response?.data?.message || 'Não foi possível carregar os anos académicos');
    setAcademicYears([]);
    setTotal(0);
  } finally {
    stopLoading();
  }
};

  useEffect(() => {
    loadAcademicYears();
  }, [filters.page, filters.limit, filters.isActive]);

  const handleSearch = () => {
    setFilters({ ...filters, page: 1 });
    loadAcademicYears();
  };

  const handleCreate = () => {
    setSelectedYear(null);
    setIsModalOpen(true);
  };

  const handleEdit = (year: AcademicYear) => {
    setSelectedYear(year);
    setIsModalOpen(true);
  };

  const handleDelete = (year: AcademicYear) => {
    setConfirmDialog({
      isOpen: true,
      type: 'delete',
      yearUuid: year.uuid,
      yearName: year.name,
    });
  };

  const handleToggleActive = (year: AcademicYear) => {
    setConfirmDialog({
      isOpen: true,
      type: 'toggle',
      yearUuid: year.uuid,
      yearName: year.name,
      isActive: year.isActive,
    });
  };

  const handleConfirmAction = async () => {
    const { type, yearUuid, yearName, isActive } = confirmDialog;
    
    try {
      startLoading();

      if (type === 'delete') {
        await academicYearService.remove(yearUuid!);
        showSuccess('Ano excluído', `${yearName} foi removido com sucesso`);
      } else if (type === 'toggle') {
        await academicYearService.toggleStatus(yearUuid!, !isActive);
        const newStatus = isActive ? 'desativado' : 'ativado';
        showSuccess(`Ano ${newStatus}`, `${yearName} foi ${newStatus} com sucesso`);
      }
      
      setConfirmDialog({ isOpen: false, type: 'delete' });
      await loadAcademicYears();
    } catch (error: any) {
      console.error('Erro:', error);
      showError('Erro', error.response?.data?.message || 'Ocorreu um erro ao processar sua solicitação');
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

  // Empty State
  const EmptyState = () => (
    <div className={styles.emptyState}>
      <div className={styles.emptyIconWrapper}>
        <Calendar size={48} className={styles.emptyIcon} />
      </div>
      <h3 className={styles.emptyTitle}>Nenhum ano académico</h3>
      <p className={styles.emptySubtext}>
        {searchTerm || filters.isActive !== undefined
          ? 'Tente ajustar seus filtros para encontrar o que procura'
          : 'Comece criando o primeiro ano académico'}
      </p>
      <Button icon={<Plus size={18} />} onClick={handleCreate}>
        Criar ano académico
      </Button>
    </div>
  );

  // Cards View
  const renderCardsView = () => {
    const yearsArray = Array.isArray(academicYears) ? academicYears : [];
    
    if (yearsArray.length === 0) return <EmptyState />;

    return (
      <div className={styles.cardsGrid}>
        {yearsArray.map((year) => (
          <div key={year.uuid || year.id} className={styles.yearCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <div className={styles.yearIcon}>
                  <CalendarDays size={20} />
                </div>
                <div>
                  <h3 className={styles.yearName}>{year.name}</h3>
                  <p className={styles.yearDate}>
                    {formatDate(year.startDate)} — {formatDate(year.endDate)}
                  </p>
                </div>
              </div>
              <div className={styles.cardActions}>
                <button
                  className={styles.iconButton}
                  onClick={() => handleToggleActive(year)}
                  title={year.isActive ? 'Desativar' : 'Ativar'}
                >
                  {year.isActive ? (
                    <PowerOff size={16} className={styles.actionInactive} />
                  ) : (
                    <Power size={16} className={styles.actionActive} />
                  )}
                </button>
                <button
                  className={styles.iconButton}
                  onClick={() => handleEdit(year)}
                  title="Editar"
                >
                  <Edit size={16} />
                </button>
                <button
                  className={styles.iconButton}
                  onClick={() => handleDelete(year)}
                  title="Excluir"
                >
                  <Trash2 size={16} className={styles.actionDanger} />
                </button>
              </div>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.cardInfo}>
                <div className={styles.infoItem}>
                  <Clock size={14} />
                  <span>Início: {formatDate(year.startDate)}</span>
                </div>
                <div className={styles.infoItem}>
                  <Clock size={14} />
                  <span>Fim: {formatDate(year.endDate)}</span>
                </div>
                {year.isActive && (
                  <div className={styles.activeBadge}>
                    <Award size={14} />
                    <span>Ano ativo</span>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.cardFooter}>
              <div className={styles.cardTags}>
                {getStatusBadge(year.isActive)}
              </div>
              <span className={styles.cardDate}>
                <Calendar size={12} />
                Criado em {formatDate(year.createdAt)}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Table View
  const renderTableView = () => {
    const yearsArray = Array.isArray(academicYears) ? academicYears : [];
    
    if (yearsArray.length === 0) return <EmptyState />;

    return (
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Ano</th>
              <th className={styles.th}>Período</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th} style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {yearsArray.map((year) => (
              <tr key={year.uuid || year.id} className={styles.tr}>
                <td className={styles.td}>
                  <div className={styles.yearCell}>
                    <div className={styles.yearIconSmall}>
                      <CalendarDays size={16} />
                    </div>
                    <div>
                      <div className={styles.yearName}>{year.name}</div>
                      {year.isActive && (
                        <span className={styles.activeTag}>Ativo</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className={styles.td}>
                  <div className={styles.periodCell}>
                    <span>{formatDate(year.startDate)}</span>
                    <span className={styles.periodSeparator}>—</span>
                    <span>{formatDate(year.endDate)}</span>
                  </div>
                </td>
                <td className={styles.td}>{getStatusBadge(year.isActive)}</td>
                <td className={styles.td} style={{ textAlign: 'right' }}>
                  <div className={styles.actions}>
                    <button
                      className={styles.actionButton}
                      onClick={() => handleToggleActive(year)}
                      title={year.isActive ? 'Desativar' : 'Ativar'}
                    >
                      {year.isActive ? (
                        <PowerOff size={16} className={styles.actionInactive} />
                      ) : (
                        <Power size={16} className={styles.actionActive} />
                      )}
                    </button>
                    <button
                      className={styles.actionButton}
                      onClick={() => handleEdit(year)}
                      title="Editar"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className={styles.actionButton}
                      onClick={() => handleDelete(year)}
                      title="Excluir"
                    >
                      <Trash2 size={16} className={styles.actionDanger} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (isLoading && academicYears.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Anos Académicos</h1>
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
            <Calendar size={24} />
          </div>
          <div>
            <h1 className={styles.title}>Anos Académicos</h1>
            <p className={styles.subtitle}>
              Gerencie os anos académicos da instituição
            </p>
          </div>
          <span className={styles.totalCount}>
            {total} anos
          </span>
        </div>
        <div className={styles.headerActions}>
          <Button
            icon={<Plus size={18} />}
            onClick={handleCreate}
            className={styles.createButton}
          >
            Novo Ano
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
              placeholder="Pesquisar anos..."
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
            {total} anos encontrados
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
      {viewMode === 'cards' ? renderCardsView() : renderTableView()}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, type: 'delete' })}
        onConfirm={handleConfirmAction}
        title={
          confirmDialog.type === 'delete'
            ? 'Excluir Ano Académico'
            : confirmDialog.isActive
            ? 'Desativar Ano Académico'
            : 'Ativar Ano Académico'
        }
        message={
          confirmDialog.type === 'delete'
            ? `Tem certeza que deseja excluir o ano "${confirmDialog.yearName}"? Esta ação não pode ser desfeita.`
            : confirmDialog.isActive
            ? `Tem certeza que deseja desativar o ano "${confirmDialog.yearName}"?`
            : `Tem certeza que deseja ativar o ano "${confirmDialog.yearName}"?`
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
        title={selectedYear ? 'Editar Ano Académico' : 'Novo Ano Académico'}
        size="md"
      >
        <AcademicYearForm
          year={selectedYear}
          onSuccess={() => {
            setIsModalOpen(false);
            setSelectedYear(null);
            showSuccess(
              selectedYear ? 'Ano atualizado' : 'Ano criado',
              selectedYear 
                ? `${selectedYear.name} foi atualizado com sucesso`
                : 'Novo ano académico criado com sucesso'
            );
            loadAcademicYears();
          }}
          onCancel={() => {
            setIsModalOpen(false);
            setSelectedYear(null);
          }}
        />
      </Modal>
    </div>
  );
}