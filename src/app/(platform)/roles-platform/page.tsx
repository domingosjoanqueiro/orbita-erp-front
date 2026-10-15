'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Shield,
  Users,
  Building2,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Power,
  PowerOff,
  MoreVertical,
  Crown,
  LayoutGrid,
  List,
  Key,
  Lock,
  Unlock,
  UserCog,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button/Button';
import { Input } from '@/shared/components/ui/Input/Input';
import { Badge } from '@/shared/components/ui/Badge/Badge';
import { Modal } from '@/shared/components/ui/Modal/Modal';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog/ConfirmDialog';
import { SkeletonCard } from '@/shared/components/ui/Skeleton/SkeletonCard';
import { useLoading } from '@/shared/contexts/LoadingContext';
import { useToast } from '@/shared/contexts/ToastContext';
import { platformRoleService } from '@/features/platform/roles/services/platform-role.service';
import { PlatformRoleForm } from '@/features/platform/roles/components/PlatformRoleForm';
import type { PlatformRole, PlatformRoleFilters } from '@/features/platform/roles/types/platform-role.types';
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

const getTypeBadge = (isSystem: boolean, isAdmin: boolean) => {
  if (isSystem) {
    return (
      <Badge variant="warning" size="sm">
        <span className={styles.typeBadge}>
          <Lock size={10} />
          Sistema
        </span>
      </Badge>
    );
  }
  if (isAdmin) {
    return (
      <Badge variant="primary" size="sm">
        <span className={styles.typeBadge}>
          <Crown size={10} />
          Admin
        </span>
      </Badge>
    );
  }
  return (
    <Badge variant="neutral" size="sm">
      <span className={styles.typeBadge}>
        <Unlock size={10} />
        Custom
      </span>
    </Badge>
  );
};

export default function PlatformRolesPage() {
  const { startLoading, stopLoading, isLoading } = useLoading();
  const { showSuccess, showError } = useToast();
  
  const [roles, setRoles] = useState<PlatformRole[]>([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<PlatformRoleFilters>({ page: 1, limit: 10 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<PlatformRole | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'delete' | 'toggle';
    roleUuid?: string;
    roleName?: string;
    isActive?: boolean;
  }>({ isOpen: false, type: 'delete' });

  const loadRoles = async () => {
    try {
      startLoading();
      const response = await platformRoleService.getAll({
        ...filters,
        search: searchTerm || undefined,
      });
      
      
      let rolesArray: PlatformRole[] = [];
      let totalItems = 0;
      
      const responseData = response || {};
      
      if (Array.isArray(responseData)) {
        rolesArray = responseData;
        totalItems = responseData.length;
      } else if (responseData && typeof responseData === 'object') {
        const data = (responseData as any).data || responseData;
        
        if (Array.isArray(data)) {
          rolesArray = data;
          totalItems = data.length;
        } else if (data && typeof data === 'object') {
          if (data.items && Array.isArray(data.items)) {
            rolesArray = data.items;
            totalItems = data.pagination?.total || data.items.length;
          } else if (data.data && Array.isArray(data.data)) {
            rolesArray = data.data;
            totalItems = data.pagination?.total || data.data.length;
          }
        }
      }
      
      if (rolesArray.length === 0 && responseData && typeof responseData === 'object') {
        for (const key of Object.keys(responseData)) {
          const value = (responseData as any)[key];
          if (Array.isArray(value) && value.length > 0) {
            rolesArray = value;
            totalItems = value.length;
            break;
          }
        }
      }
      
      const normalizedRoles = rolesArray.map((role: any) => ({
        ...role,
        isActive: isActiveBoolean(role.isActive !== undefined ? role.isActive : role.is_active),
      }));
      
      setRoles(normalizedRoles);
      setTotal(totalItems || normalizedRoles.length);
    } catch (error: any) {
      console.error('Erro ao carregar roles:', error);
      showError('Erro', error.response?.data?.message || 'Não foi possível carregar as roles');
      setRoles([]);
      setTotal(0);
    } finally {
      stopLoading();
    }
  };

  useEffect(() => {
    loadRoles();
  }, [filters.page, filters.limit, filters.isActive, filters.isAdmin, filters.isSystem]);

  const handleSearch = () => {
    setFilters({ ...filters, page: 1 });
    loadRoles();
  };

  const handleCreate = () => {
    setSelectedRole(null);
    setIsModalOpen(true);
  };

  const handleEdit = (role: PlatformRole) => {
    setSelectedRole(role);
    setIsModalOpen(true);
  };

  const handleDelete = (role: PlatformRole) => {
    if (role.isSystem) {
      showError('Ação não permitida', 'Roles do sistema não podem ser excluídas');
      return;
    }
    setConfirmDialog({
      isOpen: true,
      type: 'delete',
      roleUuid: role.uuid,
      roleName: role.name,
    });
  };

  const handleToggleActive = (role: PlatformRole) => {
    if (role.isSystem) {
      showError('Ação não permitida', 'Roles do sistema não podem ser desativadas');
      return;
    }
    setConfirmDialog({
      isOpen: true,
      type: 'toggle',
      roleUuid: role.uuid,
      roleName: role.name,
      isActive: role.isActive,
    });
  };

  const handleConfirmAction = async () => {
    const { type, roleUuid, roleName, isActive } = confirmDialog;
    
    try {
      startLoading();

      if (type === 'delete') {
        await platformRoleService.remove(roleUuid!);
        showSuccess('Role excluída', `${roleName} foi removida com sucesso`);
      } else if (type === 'toggle') {
        await platformRoleService.toggleStatus(roleUuid!, !isActive);
        const newStatus = isActive ? 'desativada' : 'ativada';
        showSuccess(`Role ${newStatus}`, `${roleName} foi ${newStatus} com sucesso`);
      }
      
      setConfirmDialog({ isOpen: false, type: 'delete' });
      await loadRoles();
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

  // Empty State Component
  const EmptyState = () => (
    <div className={styles.emptyState}>
      <div className={styles.emptyIconWrapper}>
        <Shield size={48} className={styles.emptyIcon} />
      </div>
      <h3 className={styles.emptyTitle}>Nenhuma role encontrada</h3>
      <p className={styles.emptySubtext}>
        {searchTerm || filters.isActive !== undefined
          ? 'Tente ajustar seus filtros para encontrar o que procura'
          : 'Comece criando sua primeira role de administrador'}
      </p>
      <Button icon={<Plus size={18} />} onClick={handleCreate}>
        Criar role
      </Button>
    </div>
  );

  // Render Cards View
  const renderCardsView = () => {
    const rolesArray = Array.isArray(roles) ? roles : [];
    
    if (rolesArray.length === 0) {
      return <EmptyState />;
    }

    return (
      <div className={styles.cardsGrid}>
        {rolesArray.map((role) => (
          <div key={role.uuid || role.id} className={styles.roleCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <div className={styles.roleIcon}>
                  {role.isAdmin ? <Crown size={20} /> : <Shield size={20} />}
                </div>
                <div>
                  <h3 className={styles.roleName}>{role.name}</h3>
                  {role.description && (
                    <p className={styles.roleDescription}>{role.description}</p>
                  )}
                </div>
              </div>
              <div className={styles.cardActions}>
                {getTypeBadge(role.isSystem, role.isAdmin)}
                {!role.isSystem && (
                  <>
                    <button
                      className={styles.iconButton}
                      onClick={() => handleToggleActive(role)}
                      title={role.isActive ? 'Desativar' : 'Ativar'}
                    >
                      {role.isActive ? (
                        <PowerOff size={16} className={styles.actionInactive} />
                      ) : (
                        <Power size={16} className={styles.actionActive} />
                      )}
                    </button>
                    <button
                      className={styles.iconButton}
                      onClick={() => handleEdit(role)}
                      title="Editar"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className={styles.iconButton}
                      onClick={() => handleDelete(role)}
                      title="Excluir"
                    >
                      <Trash2 size={16} className={styles.actionDanger} />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.cardInfo}>
                <div className={styles.infoItem}>
                  <Users size={14} />
                  <span>{role.usersCount || 0} usuários</span>
                </div>
                {role.permissions && (
                  <div className={styles.infoItem}>
                    <Key size={14} />
                    <span>{role.permissions.length} permissões</span>
                  </div>
                )}
                {role.companyId && (
                  <div className={styles.infoItem}>
                    <Building2 size={14} />
                    <span>Empresa ID: {role.companyId}</span>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.cardFooter}>
              <div className={styles.cardTags}>
                {getStatusBadge(role.isActive)}
              </div>
              <span className={styles.cardDate}>
                <Clock size={12} />
                {formatDate(role.createdAt)}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render Table View
  const renderTableView = () => {
    const rolesArray = Array.isArray(roles) ? roles : [];
    
    if (rolesArray.length === 0) {
      return <EmptyState />;
    }

    return (
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Role</th>
              <th className={styles.th}>Tipo</th>
              <th className={styles.th}>Usuários</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th} style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {rolesArray.map((role) => (
              <tr key={role.uuid || role.id} className={styles.tr}>
                <td className={styles.td}>
                  <div className={styles.roleCell}>
                    <div className={styles.roleIconSmall}>
                      {role.isAdmin ? <Crown size={16} /> : <Shield size={16} />}
                    </div>
                    <div>
                      <div className={styles.roleName}>{role.name}</div>
                      {role.description && (
                        <div className={styles.roleDescription}>{role.description}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className={styles.td}>
                  {getTypeBadge(role.isSystem, role.isAdmin)}
                </td>
                <td className={styles.td}>
                  <div className={styles.usersCell}>
                    <Users size={14} />
                    <span>{role.usersCount || 0}</span>
                  </div>
                </td>
                <td className={styles.td}>{getStatusBadge(role.isActive)}</td>
                <td className={styles.td} style={{ textAlign: 'right' }}>
                  <div className={styles.actions}>
                    {!role.isSystem && (
                      <>
                        <button
                          className={styles.actionButton}
                          onClick={() => handleToggleActive(role)}
                          title={role.isActive ? 'Desativar' : 'Ativar'}
                        >
                          {role.isActive ? (
                            <PowerOff size={16} className={styles.actionInactive} />
                          ) : (
                            <Power size={16} className={styles.actionActive} />
                          )}
                        </button>
                        <button
                          className={styles.actionButton}
                          onClick={() => handleEdit(role)}
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className={styles.actionButton}
                          onClick={() => handleDelete(role)}
                          title="Excluir"
                        >
                          <Trash2 size={16} className={styles.actionDanger} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (isLoading && roles.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Roles da Plataforma</h1>
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
            <Shield size={20} />
          </div>
          <div>
            <h1 className={styles.title}>Roles da Plataforma</h1>
            <p className={styles.subtitle}>
              Gerencie as roles de administração da plataforma
            </p>
          </div>
          <span className={styles.totalCount}>
            {total} roles
          </span>
        </div>
        <div className={styles.headerActions}>
          <Button
            icon={<Plus size={18} />}
            onClick={handleCreate}
            className={styles.createButton}
          >
            Nova Role
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
              placeholder="Pesquisar roles..."
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
            {total} roles encontradas
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
            <label className={styles.filterLabel}>Tipo</label>
            <div className={styles.filterOptions}>
              <button
                className={`${styles.filterChip} ${filters.isSystem === undefined && filters.isAdmin === undefined ? styles.active : ''}`}
                onClick={() => setFilters({ ...filters, isSystem: undefined, isAdmin: undefined })}
              >
                Todas
              </button>
              <button
                className={`${styles.filterChip} ${filters.isSystem === true ? styles.active : ''}`}
                onClick={() => setFilters({ ...filters, isSystem: true, isAdmin: undefined })}
              >
                <Lock size={12} />
                Sistema
              </button>
              <button
                className={`${styles.filterChip} ${filters.isAdmin === true ? styles.active : ''}`}
                onClick={() => setFilters({ ...filters, isAdmin: true, isSystem: undefined })}
              >
                <Crown size={12} />
                Admin
              </button>
              <button
                className={`${styles.filterChip} ${filters.isSystem === false && filters.isAdmin === false ? styles.active : ''}`}
                onClick={() => setFilters({ ...filters, isSystem: false, isAdmin: false })}
              >
                <Unlock size={12} />
                Custom
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
            ? 'Excluir Role'
            : confirmDialog.isActive
            ? 'Desativar Role'
            : 'Ativar Role'
        }
        message={
          confirmDialog.type === 'delete'
            ? `Tem certeza que deseja excluir a role "${confirmDialog.roleName}"? Esta ação não pode ser desfeita.`
            : confirmDialog.isActive
            ? `Tem certeza que deseja desativar a role "${confirmDialog.roleName}"?`
            : `Tem certeza que deseja ativar a role "${confirmDialog.roleName}"?`
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
        title={selectedRole ? 'Editar Role' : 'Nova Role'}
        size="lg"
      >
        <PlatformRoleForm
          role={selectedRole}
          onSuccess={() => {
            setIsModalOpen(false);
            setSelectedRole(null);
            showSuccess(
              selectedRole ? 'Role atualizada' : 'Role criada',
              selectedRole 
                ? `${selectedRole.name} foi atualizada com sucesso`
                : 'Nova role criada com sucesso'
            );
            loadRoles();
          }}
          onCancel={() => {
            setIsModalOpen(false);
            setSelectedRole(null);
          }}
        />
      </Modal>
    </div>
  );
}