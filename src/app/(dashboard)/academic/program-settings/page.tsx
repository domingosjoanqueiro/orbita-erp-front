'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
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
  BookOpen,
  Eye,
  EyeOff,
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
import { programSettingService } from '@/features/academic/program-settings/services/program-setting.service';
import { ProgramSettingForm } from '@/features/academic/program-settings/components/ProgramSettingForm';
import type { ProgramAcademicSetting, ProgramSettingFilters } from '@/features/academic/program-settings/types/program-setting.types';
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

const getWorkflowBadge = (workflow: string) => {
  const configs: Record<string, { label: string; color: string }> = {
    DIRECT: { label: 'Direta', color: '#10B981' },
    SUBMISSION: { label: 'Submissão', color: '#2563EB' },
    VALIDATION: { label: 'Submissão + Validação', color: '#8B5CF6' },
  };
  const config = configs[workflow] || { label: workflow, color: '#6B7280' };
  return (
    <Badge variant="neutral" size="sm">
      <span className={styles.workflowBadge} style={{ color: config.color }}>
        {config.label}
      </span>
    </Badge>
  );
};

const getPublishModeBadge = (mode: string) => {
  const configs: Record<string, { label: string; color: string }> = {
    MANUAL: { label: 'Manual', color: '#F59E0B' },
    AUTOMATIC: { label: 'Automática', color: '#10B981' },
  };
  const config = configs[mode] || { label: mode, color: '#6B7280' };
  return (
    <Badge variant="neutral" size="sm">
      <span className={styles.publishBadge} style={{ color: config.color }}>
        {config.label}
      </span>
    </Badge>
  );
};

export default function ProgramSettingsPage() {
  const { startLoading, stopLoading, isLoading } = useLoading();
  const { showSuccess, showError } = useToast();

  const [settings, setSettings] = useState<ProgramAcademicSetting[]>([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<ProgramSettingFilters>({ page: 1, limit: 10 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<ProgramAcademicSetting | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'delete' | 'toggle';
    uuid?: string;
    name?: string;
    isActive?: boolean;
  }>({ isOpen: false, type: 'delete' });

  const loadSettings = async () => {
    try {
      startLoading();
      const response = await programSettingService.getAll({
        ...filters,
        search: searchTerm || undefined,
      });

      console.log('📥 ProgramSettingService.getAll - Resposta:', response);
      const dataArray = response?.data || [];
      setSettings(dataArray.map((s: any) => ({ ...s, isActive: isActiveBoolean(s.isActive) })));
      setTotal(response?.total || 0);
    } catch (error: any) {
      console.error('Erro ao carregar configurações:', error);
      showError('Erro', 'Não foi possível carregar as configurações');
      setSettings([]);
      setTotal(0);
    } finally {
      stopLoading();
    }
  };

  useEffect(() => {
    loadSettings();
  }, [filters.page, filters.limit, filters.isActive]);

  const handleSearch = () => {
    setFilters({ ...filters, page: 1 });
    loadSettings();
  };

  const handleCreate = () => {
    setSelectedSetting(null);
    setIsModalOpen(true);
  };

  const handleEdit = (setting: ProgramAcademicSetting) => {
    setSelectedSetting(setting);
    setIsModalOpen(true);
  };

  const handleDelete = (setting: ProgramAcademicSetting) => {
    setConfirmDialog({
      isOpen: true,
      type: 'delete',
      uuid: setting.uuid,
      name: setting.programName || setting.uuid,
    });
  };

  const handleToggleActive = (setting: ProgramAcademicSetting) => {
    setConfirmDialog({
      isOpen: true,
      type: 'toggle',
      uuid: setting.uuid,
      name: setting.programName || setting.uuid,
      isActive: setting.isActive,
    });
  };

  const handleConfirmAction = async () => {
    const { type, uuid, name, isActive } = confirmDialog;
    try {
      startLoading();
      if (type === 'delete') {
        await programSettingService.remove(uuid!);
        showSuccess('Configuração excluída', `Configuração de ${name} foi removida`);
      } else if (type === 'toggle') {
        await programSettingService.toggleStatus(uuid!, !isActive);
        const newStatus = isActive ? 'desativada' : 'ativada';
        showSuccess(`Configuração ${newStatus}`, `Configuração de ${name} foi ${newStatus}`);
      }
      setConfirmDialog({ isOpen: false, type: 'delete' });
      loadSettings();
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

  // Definição das colunas para a tabela
  const columns = [
    {
      key: 'program',
      header: 'Programa',
      render: (item: ProgramAcademicSetting) => (
        <div className={styles.programCell}>
          <div className={styles.programIcon}>
            <Settings size={16} />
          </div>
          <div>
            <div className={styles.programName}>{item.programName || 'N/A'}</div>
            <div className={styles.programCode}>{item.program?.code || ''}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'periodCount',
      header: 'Períodos',
      render: (item: ProgramAcademicSetting) => (
        <span className={styles.periodBadge}>{item.periodCount}</span>
      ),
    },
    {
      key: 'assessmentWorkflow',
      header: 'Fluxo',
      render: (item: ProgramAcademicSetting) => getWorkflowBadge(item.assessmentWorkflow),
    },
    {
      key: 'publishMode',
      header: 'Publicação',
      render: (item: ProgramAcademicSetting) => getPublishModeBadge(item.publishMode),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: ProgramAcademicSetting) => getStatusBadge(item.isActive),
    },
    {
      key: 'actions',
      header: 'Ações',
      align: 'right' as const,
      render: (item: ProgramAcademicSetting) => (
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
        <Settings size={48} className={styles.emptyIcon} />
      </div>
      <h3 className={styles.emptyTitle}>Nenhuma configuração</h3>
      <p className={styles.emptySubtext}>
        {searchTerm || filters.isActive !== undefined
          ? 'Tente ajustar seus filtros para encontrar o que procura'
          : 'Comece configurando um programa'}
      </p>
      <Button icon={<Plus size={18} />} onClick={handleCreate}>
        Nova Configuração
      </Button>
    </div>
  );

  const renderCardsView = () => {
    const items = Array.isArray(settings) ? settings : [];
    if (items.length === 0) return <EmptyState />;

    return (
      <div className={styles.cardsGrid}>
        {items.map((setting) => (
          <div key={setting.uuid} className={styles.settingCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <div className={styles.settingIcon}>
                  <Settings size={20} />
                </div>
                <div>
                  <h3 className={styles.itemName}>
                    {setting.programName || 'Programa'}
                  </h3>
                  <p className={styles.itemCode}>
                    <BookOpen size={12} />
                    {setting.programCode || 'N/A'}
                  </p>
                </div>
              </div>
              <div className={styles.cardActions}>
                <button
                  className={styles.iconButton}
                  onClick={() => handleToggleActive(setting)}
                  title={setting.isActive ? 'Desativar' : 'Ativar'}
                >
                  {setting.isActive ? (
                    <PowerOff size={16} className={styles.actionInactive} />
                  ) : (
                    <Power size={16} className={styles.actionActive} />
                  )}
                </button>
                <button
                  className={styles.iconButton}
                  onClick={() => handleEdit(setting)}
                  title="Editar"
                >
                  <Edit size={16} />
                </button>
                <button
                  className={styles.iconButton}
                  onClick={() => handleDelete(setting)}
                  title="Excluir"
                >
                  <Trash2 size={16} className={styles.actionDanger} />
                </button>
              </div>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Períodos</span>
                  <span className={styles.infoValue}>{setting.periodCount}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Fluxo</span>
                  {getWorkflowBadge(setting.assessmentWorkflow)}
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Publicação</span>
                  {getPublishModeBadge(setting.publishMode)}
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Aluno visualiza</span>
                  <span className={styles.infoValue}>
                    {setting.allowStudentViewBeforePublication ? (
                      <span className={styles.enabled}><CheckCircle size={14} /> Sim</span>
                    ) : (
                      <span className={styles.disabled}><XCircle size={14} /> Não</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.cardFooter}>
              <div className={styles.cardTags}>
                {getStatusBadge(setting.isActive)}
              </div>
              <span className={styles.cardDate}>
                <Clock size={12} />
                Criado em {formatDate(setting.createdAt)}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderTableView = () => {
    const items = Array.isArray(settings) ? settings : [];
    if (items.length === 0) return <EmptyState />;

    return (
      <div className={styles.tableContainer}>
        <Table
          columns={columns}
          data={items}
          emptyMessage="Nenhuma configuração encontrada"
        />
      </div>
    );
  };

  if (isLoading && settings.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Configuração Académica</h1>
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
            <Settings size={24} />
          </div>
          <div>
            <h1 className={styles.title}>Configuração Académica</h1>
            <p className={styles.subtitle}>
              Configure os parâmetros académicos dos programas
            </p>
          </div>
          <span className={styles.totalCount}>{total} configurações</span>
        </div>
        <div className={styles.headerActions}>
          <Button icon={<Plus size={18} />} onClick={handleCreate} className={styles.createButton}>
            Nova Configuração
          </Button>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Pesquisar por programa..."
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
            {total} configurações encontradas
          </span>
        </div>
      </div>

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

      <div className={styles.content}>
        {viewMode === 'cards' ? renderCardsView() : renderTableView()}
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, type: 'delete' })}
        onConfirm={handleConfirmAction}
        title={
          confirmDialog.type === 'delete'
            ? 'Excluir Configuração'
            : confirmDialog.isActive
            ? 'Desativar Configuração'
            : 'Ativar Configuração'
        }
        message={
          confirmDialog.type === 'delete'
            ? `Tem certeza que deseja excluir a configuração de "${confirmDialog.name}"?`
            : confirmDialog.isActive
            ? `Tem certeza que deseja desativar a configuração de "${confirmDialog.name}"?`
            : `Tem certeza que deseja ativar a configuração de "${confirmDialog.name}"?`
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
        onClose={() => setIsModalOpen(false)}
        title={selectedSetting ? 'Editar Configuração Académica' : 'Nova Configuração Académica'}
        size="lg"
      >
        <ProgramSettingForm
          setting={selectedSetting}
          onSuccess={() => {
            setIsModalOpen(false);
            setSelectedSetting(null);
            showSuccess(
              selectedSetting ? 'Configuração atualizada' : 'Configuração criada',
              selectedSetting
                ? `Configuração de ${selectedSetting.programName} foi atualizada`
                : 'Nova configuração criada com sucesso'
            );
            loadSettings();
          }}
          onCancel={() => {
            setIsModalOpen(false);
            setSelectedSetting(null);
          }}
        />
      </Modal>
    </div>
  );
}