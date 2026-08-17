'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
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
  Users,
  MoreVertical,
  Sparkles,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Copy,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button/Button';
import { Input } from '@/shared/components/ui/Input/Input';
import { Badge } from '@/shared/components/ui/Badge/Badge';
import { Modal } from '@/shared/components/ui/Modal/Modal';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog/ConfirmDialog';
import { SkeletonCard } from '@/shared/components/ui/Skeleton/SkeletonCard';
import { useLoading } from '@/shared/contexts/LoadingContext';
import { useToast } from '@/shared/contexts/ToastContext';
import { RoleForm } from '@/features/identity/roles/components/RoleForm';
import { roleService } from '@/features/identity/roles/services/role.service';
import { permissionService } from '@/features/identity/permissions/services/permission.service';
import { roleColors } from '@/features/identity/roles/types/role.types';
import type { Role, RoleFilters, Permission } from '@/features/identity/roles/types/role.types';
import styles from './page.module.css';

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

const getStatusBadge = (isDefault: boolean) => {
  return (
    <Badge variant={isDefault ? 'info' : 'neutral'} size="sm">
      <span className={styles.statusBadge}>
        {isDefault ? <CheckCircle size={12} /> : <XCircle size={12} />}
        {isDefault ? 'Padrão' : 'Personalizada'}
      </span>
    </Badge>
  );
};

const getSystemBadge = (isSystem: boolean) => {
  return (
    <Badge variant={isSystem ? 'warning' : 'neutral'} size="sm">
      <span className={styles.systemBadge}>
        {isSystem ? <Lock size={10} /> : <Unlock size={10} />}
        {isSystem ? 'Sistema' : 'Custom'}
      </span>
    </Badge>
  );
};

export default function RolesPage() {
  const { startLoading, stopLoading, isLoading } = useLoading();
  const { showSuccess, showError } = useToast();

  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<RoleFilters>({
    page: 1,
    limit: 10,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    roleId?: string;
    roleName?: string;
  }>({ isOpen: false });

  // ============================================================
  // Carregar Permissões
  // ============================================================

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const response = await permissionService.getAll({ limit: 100 });
        setPermissions(response.data || []);
        console.log('📚 Permissões carregadas:', response.data?.length);
      } catch (error) {
        console.error('Erro ao carregar permissões:', error);
        showError('Erro', 'Não foi possível carregar as permissões');
      }
    };
    loadPermissions();
  }, []);

  // ============================================================
  // Carregar Roles
  // ============================================================

  const loadRoles = async () => {
    try {
      startLoading();
      const response = await roleService.getAll({
        ...filters,
        search: searchTerm || undefined,
      });
      const dataArray = response?.data || [];
      setRoles(dataArray.map((r: any) => ({ 
        ...r, 
        isActive: isActiveBoolean(r.isActive),
        permissions: r.permissions || [],
        usersCount: r.usersCount || 0,
      })));
      setTotal(response?.total || 0);
    } catch (error: any) {
      console.error('Erro ao carregar roles:', error);
      showError('Erro', 'Não foi possível carregar as roles');
      setRoles([]);
      setTotal(0);
    } finally {
      stopLoading();
    }
  };

  useEffect(() => {
    loadRoles();
  }, [filters.page, filters.limit, filters.isDefault, filters.isSystem]);

  const handleSearch = () => {
    setFilters({ ...filters, page: 1 });
    loadRoles();
  };

  const handleCreate = () => {
    setSelectedRole(null);
    setIsModalOpen(true);
  };

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setIsModalOpen(true);
  };

  const handleDelete = (role: Role) => {
    if (role.isSystem) {
      showError('Não permitido', 'Roles do sistema não podem ser excluídas');
      return;
    }
    setConfirmDialog({
      isOpen: true,
      roleId: role.id,
      roleName: role.name,
    });
  };

  const handleConfirmDelete = async () => {
    const { roleId, roleName } = confirmDialog;
    try {
      startLoading();
      await roleService.remove(roleId!);
      showSuccess('Role excluída', `${roleName} foi removida com sucesso`);
      setConfirmDialog({ isOpen: false });
      loadRoles();
    } catch (error: any) {
      console.error('Erro ao excluir role:', error);
      showError('Erro', error.response?.data?.message || 'Ocorreu um erro ao excluir a role');
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

  // Filtrar roles localmente para busca
  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (role.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesDefault = filters.isDefault === undefined || role.isDefault === filters.isDefault;
    const matchesSystem = filters.isSystem === undefined || role.isSystem === filters.isSystem;
    return matchesSearch && matchesDefault && matchesSystem;
  });

  if (isLoading && roles.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Roles</h1>
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
            <Shield size={24} />
          </div>
          <div>
            <h1 className={styles.title}>Roles</h1>
            <p className={styles.subtitle}>
              Gerencie as roles e permissões do sistema
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
        </div>
        <div className={styles.toolbarRight}>
          <span className={styles.lastUpdate}>
            <Clock size={12} />
            {filteredRoles.length} roles encontradas
          </span>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className={styles.filtersPanel}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Tipo</label>
            <div className={styles.filterOptions}>
              <button
                className={`${styles.filterChip} ${filters.isSystem === undefined ? styles.active : ''}`}
                onClick={() => setFilters({ ...filters, isSystem: undefined })}
              >
                Todas
              </button>
              <button
                className={`${styles.filterChip} ${filters.isSystem === true ? styles.active : ''}`}
                onClick={() => setFilters({ ...filters, isSystem: true })}
              >
                <Lock size={12} />
                Sistema
              </button>
              <button
                className={`${styles.filterChip} ${filters.isSystem === false ? styles.active : ''}`}
                onClick={() => setFilters({ ...filters, isSystem: false })}
              >
                <Unlock size={12} />
                Custom
              </button>
            </div>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Status</label>
            <div className={styles.filterOptions}>
              <button
                className={`${styles.filterChip} ${filters.isDefault === undefined ? styles.active : ''}`}
                onClick={() => setFilters({ ...filters, isDefault: undefined })}
              >
                Todos
              </button>
              <button
                className={`${styles.filterChip} ${filters.isDefault === true ? styles.active : ''}`}
                onClick={() => setFilters({ ...filters, isDefault: true })}
              >
                Padrão
              </button>
              <button
                className={`${styles.filterChip} ${filters.isDefault === false ? styles.active : ''}`}
                onClick={() => setFilters({ ...filters, isDefault: false })}
              >
                Personalizada
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cards Grid */}
      <div className={styles.cardsGrid}>
        {filteredRoles.map((role) => (
          <div key={role.id} className={styles.roleCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <div
                  className={styles.roleColor}
                  style={{ backgroundColor: role.color || '#8B5CF6' }}
                />
                <div>
                  <h3 className={styles.roleName}>{role.name}</h3>
                  {role.description && (
                    <p className={styles.roleDescription}>{role.description}</p>
                  )}
                </div>
              </div>
              <div className={styles.cardActions}>
                {role.isSystem && (
                  <span className={styles.systemBadge}>
                    <Lock size={12} />
                  </span>
                )}
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
                  disabled={role.isSystem}
                >
                  <Trash2 size={16} className={role.isSystem ? styles.actionDisabled : styles.actionDanger} />
                </button>
              </div>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.permissionsPreview}>
                <div className={styles.permissionsHeader}>
                  <span className={styles.permissionsLabel}>
                    <Shield size={14} />
                    {(role.permissions || []).length} permissões
                  </span>
                </div>
                <div className={styles.permissionsTags}>
                  {(role.permissions || []).slice(0, 4).map((perm) => (
                    <span key={perm.id} className={styles.permissionTag}>
                      {perm.resource}.{perm.action}
                    </span>
                  ))}
                  {(role.permissions || []).length > 4 && (
                    <span className={styles.permissionMore}>
                      +{(role.permissions || []).length - 4}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.cardFooter}>
              <div className={styles.cardTags}>
                {getStatusBadge(role.isDefault)}
                {getSystemBadge(role.isSystem)}
              </div>
              <div className={styles.cardStats}>
                <span className={styles.statItem}>
                  <Users size={12} />
                  {role.usersCount || 0} usuários
                </span>
                <span className={styles.statItem}>
                  <Clock size={12} />
                  {formatDate(role.createdAt)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredRoles.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIconWrapper}>
            <Shield size={48} className={styles.emptyIcon} />
          </div>
          <h3 className={styles.emptyTitle}>Nenhuma role encontrada</h3>
          <p className={styles.emptySubtext}>
            {searchTerm || filters.isDefault !== undefined || filters.isSystem !== undefined
              ? 'Tente ajustar seus filtros para encontrar o que procura'
              : 'Comece criando uma nova role para o sistema'}
          </p>
          <Button icon={<Plus size={18} />} onClick={handleCreate}>
            Criar role
          </Button>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false })}
        onConfirm={handleConfirmDelete}
        title="Excluir Role"
        message={`Tem certeza que deseja excluir a role "${confirmDialog.roleName}"? Esta ação não pode ser desfeita.`}
        type="danger"
        confirmText="Excluir"
        isLoading={isLoading}
      />

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedRole ? 'Editar Role' : 'Nova Role'}
        size="lg"
      >
        <RoleForm
          role={selectedRole}
          permissions={permissions}
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