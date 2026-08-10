'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  UserRound,
  Mail,
  Calendar,
  Shield,
  Building2,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  Users as UsersIcon,
  Sparkles,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Power,
  PowerOff,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button/Button';
import { Input } from '@/shared/components/ui/Input/Input';
import { Badge } from '@/shared/components/ui/Badge/Badge';
import { Modal } from '@/shared/components/ui/Modal/Modal';
import { SkeletonCard } from '@/shared/components/ui/Skeleton/SkeletonCard';
import { useLoading } from '@/shared/contexts/LoadingContext';
import { UserForm } from '@/features/identity/users/components/UserForm';
import type { User, UserFilters } from '@/features/identity/users/types/user.types';
import styles from './page.module.css';

// Dados mockados com os tipos corretos
const mockUsers: User[] = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao.silva@orbita.com',
    roleId: '1',
    role: {
      id: '1',
      name: 'Administrador',
      permissions: [
        { id: '1', name: 'users.read', resource: 'users', action: 'read' },
        { id: '2', name: 'users.write', resource: 'users', action: 'write' },
      ]
    },
    companyId: '1',
    isActive: true,
    mustChangePassword: false,
    createdAt: '2024-01-15T10:00:00',
    updatedAt: '2024-12-09T14:30:00',
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'maria.santos@orbita.com',
    roleId: '2',
    role: {
      id: '2',
      name: 'Gerente',
      permissions: [
        { id: '3', name: 'students.read', resource: 'students', action: 'read' },
        { id: '4', name: 'students.write', resource: 'students', action: 'write' },
      ]
    },
    companyId: '1',
    isActive: true,
    mustChangePassword: false,
    createdAt: '2024-02-20T09:00:00',
    updatedAt: '2024-12-09T13:00:00',
  },
  {
    id: '3',
    name: 'Pedro Oliveira',
    email: 'pedro.oliveira@orbita.com',
    roleId: '3',
    role: {
      id: '3',
      name: 'Usuário',
      permissions: []
    },
    companyId: '2',
    isActive: false,
    mustChangePassword: true,
    createdAt: '2024-03-10T11:00:00',
    updatedAt: '2024-12-01T10:00:00',
  },
];

// Mock de empresas e roles para filtros
const mockCompanies = [
  { id: '1', name: 'Orbita Educação' },
  { id: '2', name: 'Orbita Tech' },
];

const mockRoles = [
  { id: '1', name: 'Administrador' },
  { id: '2', name: 'Gerente' },
  { id: '3', name: 'Usuário' },
];

export default function UsersPage() {
  const { startLoading, stopLoading, isLoading } = useLoading();
  const [users, setUsers] = useState<User[]>([]);
  const [filters, setFilters] = useState<UserFilters>({ page: 1, limit: 10 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      startLoading();
      await new Promise(resolve => setTimeout(resolve, 1500));
      setUsers(mockUsers);
      stopLoading();
    };
    loadUsers();
  }, []);

  const handleCreate = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      startLoading();
      await new Promise(resolve => setTimeout(resolve, 1000));
      setUsers(users.filter(u => u.id !== id));
      stopLoading();
    }
  };

  const handleToggleActive = async (id: string) => {
    startLoading();
    await new Promise(resolve => setTimeout(resolve, 1000));
    setUsers(users.map(u => 
      u.id === id 
        ? { ...u, isActive: !u.isActive }
        : u
    ));
    stopLoading();
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesActive = filters.isActive === undefined || user.isActive === filters.isActive;
    const matchesRole = !filters.roleId || user.roleId === filters.roleId;
    const matchesCompany = !filters.companyId || user.companyId === filters.companyId;
    return matchesSearch && matchesActive && matchesRole && matchesCompany;
  });

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? 'success' : 'error'} size="sm">
        <span className={styles.statusBadge}>
          {isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
          {isActive ? 'Ativo' : 'Inativo'}
        </span>
      </Badge>
    );
  };

  const getCompanyName = (companyId: string) => {
    return mockCompanies.find(c => c.id === companyId)?.name || companyId;
  };

  const getRoleName = (roleId: string) => {
    return mockRoles.find(r => r.id === roleId)?.name || roleId;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Usuários</h1>
            <p className={styles.subtitle}>Carregando...</p>
          </div>
        </div>
        <div className={styles.toolbar}>
          <SkeletonCard variant="default" />
        </div>
        <div className={styles.tableContainer}>
          <SkeletonCard variant="table" />
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
            <UsersIcon size={20} />
          </div>
          <div>
            <h1 className={styles.title}>Usuários</h1>
            <p className={styles.subtitle}>
              Gerencie todos os usuários do sistema
            </p>
          </div>
          <span className={styles.totalCount}>
            {filteredUsers.length} usuários
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
            Atualizado agora
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
            <label className={styles.filterLabel}>Role</label>
            <div className={styles.filterOptions}>
              <button
                className={`${styles.filterChip} ${!filters.roleId ? styles.active : ''}`}
                onClick={() => setFilters({ ...filters, roleId: undefined })}
              >
                Todas
              </button>
              {mockRoles.map(role => (
                <button
                  key={role.id}
                  className={`${styles.filterChip} ${filters.roleId === role.id ? styles.active : ''}`}
                  onClick={() => setFilters({ ...filters, roleId: role.id })}
                >
                  {role.name}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Empresa</label>
            <div className={styles.filterOptions}>
              <button
                className={`${styles.filterChip} ${!filters.companyId ? styles.active : ''}`}
                onClick={() => setFilters({ ...filters, companyId: undefined })}
              >
                Todas
              </button>
              {mockCompanies.map(company => (
                <button
                  key={company.id}
                  className={`${styles.filterChip} ${filters.companyId === company.id ? styles.active : ''}`}
                  onClick={() => setFilters({ ...filters, companyId: company.id })}
                >
                  {company.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className={styles.tableContainer}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Usuário</th>
                <th className={styles.th}>Email</th>
                <th className={styles.th}>Role</th>
                <th className={styles.th}>Empresa</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Criado em</th>
                <th className={styles.th} style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className={styles.tr}>
                  <td className={styles.td}>
                    <div className={styles.userCell}>
                      <div className={styles.userAvatar}>
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className={styles.userName}>{user.name}</div>
                        {user.mustChangePassword && (
                          <span className={styles.passwordBadge}>
                            <AlertCircle size={10} />
                            Trocar senha
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className={styles.td}>
                    <div className={styles.emailCell}>
                      <Mail size={14} />
                      <span>{user.email}</span>
                    </div>
                  </td>
                  <td className={styles.td}>
                    <div className={styles.roleCell}>
                      <span className={styles.roleName}>
                        {getRoleName(user.roleId)}
                      </span>
                      {user.role?.permissions && user.role.permissions.length > 0 && (
                        <span className={styles.permissionCount}>
                          {user.role.permissions.length} perms
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={styles.td}>
                    <div className={styles.companyCell}>
                      <Building2 size={14} />
                      <span>{getCompanyName(user.companyId)}</span>
                    </div>
                  </td>
                  <td className={styles.td}>
                    {getStatusBadge(user.isActive)}
                  </td>
                  <td className={styles.td}>
                    <div className={styles.createdAtCell}>
                      <Clock size={12} />
                      <span>{formatDate(user.createdAt)}</span>
                    </div>
                  </td>
                  <td className={styles.td} style={{ textAlign: 'right' }}>
                    <div className={styles.actions}>
                      <button
                        className={styles.actionButton}
                        onClick={() => handleToggleActive(user.id)}
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
                        <UserRound size={16} />
                      </button>
                      <button
                        className={styles.actionButton}
                        onClick={() => handleDelete(user.id)}
                        title="Excluir"
                      >
                        <XCircle size={16} className={styles.actionDanger} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>👥</div>
            <h3 className={styles.emptyTitle}>Nenhum usuário encontrado</h3>
            <p className={styles.emptySubtext}>
              Tente ajustar seus filtros ou criar um novo usuário
            </p>
            <Button icon={<Plus size={18} />} onClick={handleCreate}>
              Criar usuário
            </Button>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedUser ? 'Editar Usuário' : 'Novo Usuário'}
        size="lg"
      >
        <UserForm
          user={selectedUser}
          onSuccess={() => {
            setIsModalOpen(false);
            setSelectedUser(null);
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