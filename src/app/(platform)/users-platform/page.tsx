'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Users,
  User,
  Mail,
  Phone,
  Shield,
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
  UserPlus,
  Key,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button/Button';
import { Input } from '@/shared/components/ui/Input/Input';
import { Badge } from '@/shared/components/ui/Badge/Badge';
import { Modal } from '@/shared/components/ui/Modal/Modal';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog/ConfirmDialog';
import { SkeletonCard } from '@/shared/components/ui/Skeleton/SkeletonCard';
import { useLoading } from '@/shared/contexts/LoadingContext';
import { useToast } from '@/shared/contexts/ToastContext';
import { platformUsersService } from '@/features/platform/services/platform-users.service';
import { PlatformUserForm } from '@/features/platform/components/PlatformUserForm';
import type { PlatformUser, PlatformUserFilters } from '@/features/platform/types/platform-user.types';
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

const getRootBadge = (isRoot: boolean) => {
  return (
    <Badge variant="warning" size="sm">
      <span className={styles.rootBadge}>
        <Crown size={10} />
        Root
      </span>
    </Badge>
  );
};

export default function PlatformUsersPage() {
  const { startLoading, stopLoading, isLoading } = useLoading();
  const { showSuccess, showError } = useToast();
  
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<PlatformUserFilters>({ page: 1, limit: 10 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'delete' | 'toggle' | 'reset';
    userUuid?: string;
    userName?: string;
    isActive?: boolean;
  }>({ isOpen: false, type: 'delete' });

 const loadUsers = async () => {
  try {
    startLoading();
    const response = await platformUsersService.getAll({
      ...filters,
      search: searchTerm || undefined,
    });
    
    console.log('📊 Resposta da API:', response);
    
    let usersArray: PlatformUser[] = [];
    let totalItems = 0;
    
    // Garantir que response seja um objeto
    const responseData = response || {};
    
    if (Array.isArray(responseData)) {
      usersArray = responseData;
      totalItems = responseData.length;
    } else if (responseData && typeof responseData === 'object') {
      const data = (responseData as any).data || responseData;
      
      if (Array.isArray(data)) {
        usersArray = data;
        totalItems = data.length;
      } else if (data && typeof data === 'object') {
        // Verificar se tem items
        if (data.items && Array.isArray(data.items)) {
          usersArray = data.items;
          totalItems = data.pagination?.total || data.items.length;
        } 
        // Verificar se tem data dentro de data
        else if (data.data && Array.isArray(data.data)) {
          usersArray = data.data;
          totalItems = data.pagination?.total || data.data.length;
        }
      }
    }
    
    // Se ainda estiver vazio, tentar extrair qualquer array do objeto
    if (usersArray.length === 0 && responseData && typeof responseData === 'object') {
      for (const key of Object.keys(responseData)) {
        const value = (responseData as any)[key];
        if (Array.isArray(value) && value.length > 0) {
          usersArray = value;
          totalItems = value.length;
          break;
        }
      }
    }
    
    console.log('📊 Usuários extraídos:', usersArray);
    console.log('📊 Total:', totalItems);
    
    const normalizedUsers = usersArray.map((user: any) => ({
      ...user,
      isActive: isActiveBoolean(user.isActive !== undefined ? user.isActive : user.is_active),
    }));
    
    setUsers(normalizedUsers);
    setTotal(totalItems || normalizedUsers.length);
  } catch (error: any) {
    console.error('Erro ao carregar usuários:', error);
    showError('Erro', error.response?.data?.message || 'Não foi possível carregar os usuários');
    setUsers([]);
    setTotal(0);
  } finally {
    stopLoading();
  }
};

  useEffect(() => {
    loadUsers();
  }, [filters.page, filters.limit, filters.isActive, filters.isRoot]);

  const handleSearch = () => {
    setFilters({ ...filters, page: 1 });
    loadUsers();
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user: PlatformUser) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = (user: PlatformUser) => {
    setConfirmDialog({
      isOpen: true,
      type: 'delete',
      userUuid: user.uuid,
      userName: `${user.firstName} ${user.lastName}`,
    });
  };

  const handleToggleActive = (user: PlatformUser) => {
    setConfirmDialog({
      isOpen: true,
      type: 'toggle',
      userUuid: user.uuid,
      userName: `${user.firstName} ${user.lastName}`,
      isActive: user.isActive,
    });
  };

  const handleResetPassword = (user: PlatformUser) => {
    setConfirmDialog({
      isOpen: true,
      type: 'reset',
      userUuid: user.uuid,
      userName: `${user.firstName} ${user.lastName}`,
    });
  };

  const handleConfirmAction = async () => {
    const { type, userUuid, userName, isActive } = confirmDialog;
    
    try {
      startLoading();

      if (type === 'delete') {
        await platformUsersService.remove(userUuid!);
        showSuccess('Usuário excluído', `${userName} foi removido com sucesso`);
      } else if (type === 'toggle') {
        await platformUsersService.toggleStatus(userUuid!, !isActive);
        const newStatus = isActive ? 'desativado' : 'ativado';
        showSuccess(`Usuário ${newStatus}`, `${userName} foi ${newStatus} com sucesso`);
      } else if (type === 'reset') {
        const result = await platformUsersService.resetPassword(userUuid!);
        showSuccess('Senha redefinida', `Nova senha: ${result.temporaryPassword}`);
      }
      
      setConfirmDialog({ isOpen: false, type: 'delete' });
      await loadUsers();
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
        <Users size={48} className={styles.emptyIcon} />
      </div>
      <h3 className={styles.emptyTitle}>Nenhum usuário encontrado</h3>
      <p className={styles.emptySubtext}>
        {searchTerm || filters.isActive !== undefined
          ? 'Tente ajustar seus filtros para encontrar o que procura'
          : 'Comece criando seu primeiro usuário da plataforma'}
      </p>
      <Button icon={<Plus size={18} />} onClick={handleCreate}>
        Criar usuário
      </Button>
    </div>
  );

  // Render Cards View
  const renderCardsView = () => {
    const usersArray = Array.isArray(users) ? users : [];
    
    if (usersArray.length === 0) {
      return <EmptyState />;
    }

    return (
      <div className={styles.cardsGrid}>
        {usersArray.map((user) => (
          <div key={user.uuid || user.id} className={styles.userCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <div className={styles.userAvatar}>
                  {user.firstName?.charAt(0) || 'U'}
                  {user.lastName?.charAt(0) || ''}
                </div>
                <div>
                  <h3 className={styles.userName}>
                    {user.firstName} {user.lastName}
                  </h3>
                  <div className={styles.userUsername}>
                    @{user.username}
                  </div>
                </div>
              </div>
              <div className={styles.cardActions}>
                {user.isRoot && getRootBadge(user.isRoot)}
                <button
                  className={styles.iconButton}
                  onClick={() => handleToggleActive(user)}
                  title={user.isActive ? 'Desativar' : 'Ativar'}
                >
                  {user.isActive ? (
                    <PowerOff size={16} className={styles.actionInactive} />
                  ) : (
                    <Power size={16} className={styles.actionActive} />
                  )}
                </button>
                <button
                  className={styles.iconButton}
                  onClick={() => handleEdit(user)}
                  title="Editar"
                >
                  <Edit size={16} />
                </button>
                <button
                  className={styles.iconButton}
                  onClick={() => handleDelete(user)}
                  title="Excluir"
                >
                  <Trash2 size={16} className={styles.actionDanger} />
                </button>
              </div>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.cardInfo}>
                <div className={styles.infoItem}>
                  <Mail size={14} />
                  <span>{user.email || 'N/A'}</span>
                </div>
                {user.phone && (
                  <div className={styles.infoItem}>
                    <Phone size={14} />
                    <span>{user.phone}</span>
                  </div>
                )}
                <div className={styles.infoItem}>
                  <Shield size={14} />
                  <span>{user.roles?.map(r => r.name).join(', ') || 'Sem role'}</span>
                </div>
              </div>
            </div>

            <div className={styles.cardFooter}>
              <div className={styles.cardTags}>
                {getStatusBadge(user.isActive)}
              </div>
              <span className={styles.cardDate}>
                <Clock size={12} />
                {formatDate(user.createdAt)}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render Table View
  const renderTableView = () => {
    const usersArray = Array.isArray(users) ? users : [];
    
    if (usersArray.length === 0) {
      return <EmptyState />;
    }

    return (
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Usuário</th>
              <th className={styles.th}>Email</th>
              <th className={styles.th}>Roles</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th} style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {usersArray.map((user) => (
              <tr key={user.uuid || user.id} className={styles.tr}>
                <td className={styles.td}>
                  <div className={styles.userCell}>
                    <div className={styles.userAvatar}>{user.firstName?.charAt(0) || 'U'}</div>
                    <div>
                      <div className={styles.userName}>
                        {user.firstName} {user.lastName}
                        {user.isRoot && <span className={styles.rootTag}>👑 Root</span>}
                      </div>
                      <div className={styles.userUsername}>@{user.username}</div>
                    </div>
                  </div>
                </td>
                <td className={styles.td}>
                  <div className={styles.emailCell}>
                    <Mail size={14} />
                    <span>{user.email || 'N/A'}</span>
                  </div>
                </td>
                <td className={styles.td}>
                  <div className={styles.rolesCell}>
                    {user.roles?.map(r => r.name).join(', ') || 'Sem role'}
                  </div>
                </td>
                <td className={styles.td}>{getStatusBadge(user.isActive)}</td>
                <td className={styles.td} style={{ textAlign: 'right' }}>
                  <div className={styles.actions}>
                    <button
                      className={styles.actionButton}
                      onClick={() => handleResetPassword(user)}
                      title="Resetar Senha"
                    >
                      <Key size={16} />
                    </button>
                    <button
                      className={styles.actionButton}
                      onClick={() => handleToggleActive(user)}
                      title={user.isActive ? 'Desativar' : 'Ativar'}
                    >
                      {user.isActive ? (
                        <PowerOff size={16} className={styles.actionInactive} />
                      ) : (
                        <Power size={16} className={styles.actionActive} />
                      )}
                    </button>
                    <button
                      className={styles.actionButton}
                      onClick={() => handleEdit(user)}
                      title="Editar"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className={styles.actionButton}
                      onClick={() => handleDelete(user)}
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

  if (isLoading && users.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Usuários da Plataforma</h1>
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
            <Users size={20} />
          </div>
          <div>
            <h1 className={styles.title}>Usuários da Plataforma</h1>
            <p className={styles.subtitle}>
              Gerencie os administradores da plataforma
            </p>
          </div>
          <span className={styles.totalCount}>
            {total} usuários
          </span>
        </div>
        <div className={styles.headerActions}>
          <Button
            icon={<Plus size={18} />}
            onClick={handleCreate}
            className={styles.createButton}
          >
            Novo Usuário
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
              placeholder="Pesquisar usuários..."
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
            {total} usuários encontrados
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

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Tipo</label>
            <div className={styles.filterOptions}>
              <button
                className={`${styles.filterChip} ${filters.isRoot === undefined ? styles.active : ''}`}
                onClick={() => setFilters({ ...filters, isRoot: undefined })}
              >
                Todos
              </button>
              <button
                className={`${styles.filterChip} ${filters.isRoot === true ? styles.active : ''}`}
                onClick={() => setFilters({ ...filters, isRoot: true })}
              >
                <Crown size={12} />
                Root
              </button>
              <button
                className={`${styles.filterChip} ${filters.isRoot === false ? styles.active : ''}`}
                onClick={() => setFilters({ ...filters, isRoot: false })}
              >
                Admin
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
            ? 'Excluir Usuário'
            : confirmDialog.type === 'toggle'
            ? confirmDialog.isActive
              ? 'Desativar Usuário'
              : 'Ativar Usuário'
            : 'Resetar Senha'
        }
        message={
          confirmDialog.type === 'delete'
            ? `Tem certeza que deseja excluir o usuário "${confirmDialog.userName}"? Esta ação não pode ser desfeita.`
            : confirmDialog.type === 'toggle'
            ? confirmDialog.isActive
              ? `Tem certeza que deseja desativar o usuário "${confirmDialog.userName}"?`
              : `Tem certeza que deseja ativar o usuário "${confirmDialog.userName}"?`
            : `Tem certeza que deseja resetar a senha do usuário "${confirmDialog.userName}"? Uma nova senha temporária será gerada.`
        }
        type={
          confirmDialog.type === 'delete' 
            ? 'danger' 
            : confirmDialog.type === 'toggle'
            ? 'warning'
            : 'info'
        }
        confirmText={
          confirmDialog.type === 'delete'
            ? 'Excluir'
            : confirmDialog.type === 'toggle'
            ? confirmDialog.isActive
              ? 'Desativar'
              : 'Ativar'
            : 'Resetar'
        }
        isLoading={isLoading}
      />

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedUser ? 'Editar Usuário' : 'Novo Usuário'}
        size="lg"
      >
        <PlatformUserForm
          user={selectedUser}
          onSuccess={() => {
            setIsModalOpen(false);
            setSelectedUser(null);
            showSuccess(
              selectedUser ? 'Usuário atualizado' : 'Usuário criado',
              selectedUser 
                ? `${selectedUser.firstName} ${selectedUser.lastName} foi atualizado com sucesso`
                : 'Novo usuário criado com sucesso'
            );
            loadUsers();
          }}
          onCancel={() => {
            setIsModalOpen(false);
            setSelectedUser(null);
          }}
        />
      </Modal>
    </div>
  );
}