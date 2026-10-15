'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Building2,
  Mail,
  Users,
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
  Package,
  Crown,
  Star,
  LayoutGrid,
  List,
  Building,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button/Button';
import { Input } from '@/shared/components/ui/Input/Input';
import { Badge } from '@/shared/components/ui/Badge/Badge';
import { Modal } from '@/shared/components/ui/Modal/Modal';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog/ConfirmDialog';
import { SkeletonCard } from '@/shared/components/ui/Skeleton/SkeletonCard';
import { useLoading } from '@/shared/contexts/LoadingContext';
import { useToast } from '@/shared/contexts/ToastContext';
import { CompanyForm } from '@/features/identity/companies/components/CompanyForm';
import { companyService } from '@/shared/services/core/company.service';
import type { Company, CompanyFilters } from '@/shared/services/core/company.service';
import styles from './page.module.css';

type ViewMode = 'cards' | 'table';

// Função para converter isActive para booleano
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

export default function CompaniesPage() {
  const { startLoading, stopLoading, isLoading } = useLoading();
  const { showSuccess, showError } = useToast();
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<CompanyFilters>({ page: 1, limit: 10 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'delete' | 'toggle';
    companyUuid?: string;
    companyName?: string;
    isActive?: boolean;
  }>({ isOpen: false, type: 'delete' });

  const loadCompanies = async () => {
    try {
      startLoading();
      const response = await companyService.getAll({
        ...filters,
        search: searchTerm || undefined,
      });
      
      
      // Garantir que response seja um objeto
      const responseData = response || {};
      let companiesArray: Company[] = [];
      let totalItems = 0;
      
      // Se for um array diretamente
      if (Array.isArray(responseData)) {
        companiesArray = responseData;
        totalItems = responseData.length;
      } 
      // Se tiver a propriedade data
      else if (responseData && typeof responseData === 'object') {
        const data = (responseData as any).data || responseData;
        
        if (Array.isArray(data)) {
          companiesArray = data;
          totalItems = data.length;
        } else if (data && typeof data === 'object') {
          // Verificar se tem items
          if (data.items && Array.isArray(data.items)) {
            companiesArray = data.items;
            totalItems = data.pagination?.total || data.items.length;
          } 
          // Verificar se tem data dentro de data
          else if (data.data && Array.isArray(data.data)) {
            companiesArray = data.data;
            totalItems = data.pagination?.total || data.data.length;
          }
        }
      }
      
      // Se ainda estiver vazio, tentar extrair qualquer array do objeto
      if (companiesArray.length === 0 && responseData && typeof responseData === 'object') {
        for (const key of Object.keys(responseData)) {
          const value = (responseData as any)[key];
          if (Array.isArray(value) && value.length > 0) {
            companiesArray = value;
            totalItems = value.length;
            break;
          }
        }
      }
      
   
      
      const normalizedCompanies = companiesArray.map((company: any) => ({
        ...company,
        isActive: isActiveBoolean(company.isActive !== undefined ? company.isActive : company.is_active),
      }));
      
      setCompanies(normalizedCompanies);
      setTotal(totalItems || normalizedCompanies.length);
    } catch (error: any) {
      console.error('Erro ao carregar empresas:', error);
      showError('Erro', error.response?.data?.message || 'Não foi possível carregar as empresas');
      setCompanies([]);
      setTotal(0);
    } finally {
      stopLoading();
    }
  };

  useEffect(() => {
    loadCompanies();
  }, [filters.page, filters.limit, filters.isActive]);

  const handleSearch = () => {
    setFilters({ ...filters, page: 1 });
    loadCompanies();
  };

  const handleCreate = () => {
    setSelectedCompany(null);
    setIsModalOpen(true);
  };

  const handleEdit = (company: Company) => {
    setSelectedCompany(company);
    setIsModalOpen(true);
  };

  const handleDelete = (company: Company) => {
    setConfirmDialog({
      isOpen: true,
      type: 'delete',
      companyUuid: company.uuid,
      companyName: company.name,
    });
  };

  const handleToggleActive = (company: Company) => {
    setConfirmDialog({
      isOpen: true,
      type: 'toggle',
      companyUuid: company.uuid,
      companyName: company.name,
      isActive: company.isActive,
    });
  };

  const handleConfirmAction = async () => {
    const { type, companyUuid, companyName, isActive } = confirmDialog;
    
    try {
      startLoading();

      if (type === 'delete') {
        await companyService.remove(companyUuid!);
        showSuccess('Empresa excluída', `${companyName} foi removida com sucesso`);
      } else if (type === 'toggle') {
        await companyService.toggleStatus(companyUuid!, !isActive);
        const newStatus = isActive ? 'desativada' : 'ativada';
        showSuccess(`Empresa ${newStatus}`, `${companyName} foi ${newStatus} com sucesso`);
      }
      
      setConfirmDialog({ isOpen: false, type: 'delete' });
      await loadCompanies();
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

  const getDocumentDisplay = (company: Company) => {
    return company.tax_number || 'N/A';
  };

  // Empty State Component
  const EmptyState = () => (
    <div className={styles.emptyState}>
      <div className={styles.emptyIconWrapper}>
        <Building size={48} className={styles.emptyIcon} />
      </div>
      <h3 className={styles.emptyTitle}>Nenhuma empresa encontrada</h3>
      <p className={styles.emptySubtext}>
        {searchTerm || filters.isActive !== undefined
          ? 'Tente ajustar seus filtros para encontrar o que procura'
          : 'Comece criando sua primeira empresa no sistema'}
      </p>
      <Button icon={<Plus size={18} />} onClick={handleCreate}>
        Criar empresa
      </Button>
    </div>
  );

  // Render Cards View
  const renderCardsView = () => {
    const companiesArray = Array.isArray(companies) ? companies : [];
    
    if (companiesArray.length === 0) {
      return <EmptyState />;
    }

    return (
      <div className={styles.cardsGrid}>
        {companiesArray.map((company) => (
          <div key={company.uuid || company.id} className={styles.companyCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <div className={styles.companyAvatar}>
                  {company.name.charAt(0)}
                </div>
                <div>
                  <h3 className={styles.companyName}>{company.name}</h3>
                  <div className={styles.companyDocument}>
                    NUIT: {getDocumentDisplay(company)}
                  </div>
                </div>
              </div>
              <div className={styles.cardActions}>
                <button
                  className={styles.iconButton}
                  onClick={() => handleToggleActive(company)}
                  title={company.isActive ? 'Desativar' : 'Ativar'}
                >
                  {company.isActive ? (
                    <PowerOff size={16} className={styles.actionInactive} />
                  ) : (
                    <Power size={16} className={styles.actionActive} />
                  )}
                </button>
                <button
                  className={styles.iconButton}
                  onClick={() => handleEdit(company)}
                  title="Editar"
                >
                  <Edit size={16} />
                </button>
                <button
                  className={styles.iconButton}
                  onClick={() => handleDelete(company)}
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
                  <span>{company.email || 'N/A'}</span>
                </div>
                <div className={styles.infoItem}>
                  <Users size={14} />
                  <span>{company.usersCount || 0} usuários</span>
                </div>
              </div>
            </div>

            <div className={styles.cardFooter}>
              <div className={styles.cardTags}>
                {getStatusBadge(company.isActive)}
              </div>
              <span className={styles.cardDate}>
                <Clock size={12} />
                {formatDate(company.created_at)}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render Table View
  const renderTableView = () => {
    const companiesArray = Array.isArray(companies) ? companies : [];
    
    if (companiesArray.length === 0) {
      return <EmptyState />;
    }

    return (
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Empresa</th>
              <th className={styles.th}>Email</th>
              <th className={styles.th}>Usuários</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th} style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {companiesArray.map((company) => (
              <tr key={company.uuid || company.id} className={styles.tr}>
                <td className={styles.td}>
                  <div className={styles.companyCell}>
                    <div className={styles.companyAvatar}>{company.name.charAt(0)}</div>
                    <div>
                      <div className={styles.companyName}>{company.name}</div>
                      <div className={styles.companyDocument}>NUIT: {getDocumentDisplay(company)}</div>
                    </div>
                  </div>
                </td>
                <td className={styles.td}>
                  <div className={styles.emailCell}>
                    <Mail size={14} />
                    <span>{company.email || 'N/A'}</span>
                  </div>
                </td>
                <td className={styles.td}>
                  <div className={styles.usersCell}>
                    <Users size={14} />
                    <span>{company.usersCount || 0}</span>
                  </div>
                </td>
                <td className={styles.td}>{getStatusBadge(company.isActive)}</td>
                <td className={styles.td} style={{ textAlign: 'right' }}>
                  <div className={styles.actions}>
                    <button
                      className={styles.actionButton}
                      onClick={() => handleToggleActive(company)}
                      title={company.isActive ? 'Desativar' : 'Ativar'}
                    >
                      {company.isActive ? (
                        <PowerOff size={16} className={styles.actionInactive} />
                      ) : (
                        <Power size={16} className={styles.actionActive} />
                      )}
                    </button>
                    <button
                      className={styles.actionButton}
                      onClick={() => handleEdit(company)}
                      title="Editar"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className={styles.actionButton}
                      onClick={() => handleDelete(company)}
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

  if (isLoading && companies.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Empresas</h1>
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
            <Building2 size={20} />
          </div>
          <div>
            <h1 className={styles.title}>Empresas</h1>
            <p className={styles.subtitle}>
              Gerencie todas as empresas do sistema
            </p>
          </div>
          <span className={styles.totalCount}>
            {total} empresas
          </span>
        </div>
        <div className={styles.headerActions}>
          <Button
            icon={<Plus size={18} />}
            onClick={handleCreate}
            className={styles.createButton}
          >
            Nova Empresa
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
              placeholder="Pesquisar empresas..."
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
            {total} empresas encontradas
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
            ? 'Excluir Empresa'
            : confirmDialog.isActive
            ? 'Desativar Empresa'
            : 'Ativar Empresa'
        }
        message={
          confirmDialog.type === 'delete'
            ? `Tem certeza que deseja excluir a empresa "${confirmDialog.companyName}"? Esta ação não pode ser desfeita.`
            : confirmDialog.isActive
            ? `Tem certeza que deseja desativar a empresa "${confirmDialog.companyName}"?`
            : `Tem certeza que deseja ativar a empresa "${confirmDialog.companyName}"?`
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
        title={selectedCompany ? 'Editar Empresa' : 'Nova Empresa'}
        size="lg"
      >
        <CompanyForm
          company={selectedCompany}
          onSuccess={() => {
            setIsModalOpen(false);
            setSelectedCompany(null);
            showSuccess(
              selectedCompany ? 'Empresa atualizada' : 'Empresa criada',
              selectedCompany 
                ? `${selectedCompany.name} foi atualizada com sucesso`
                : 'Nova empresa criada com sucesso'
            );
            loadCompanies();
          }}
          onCancel={() => {
            setIsModalOpen(false);
            setSelectedCompany(null);
          }}
        />
      </Modal>
    </div>
  );
}