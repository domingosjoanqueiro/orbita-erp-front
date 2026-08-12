'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  BookOpen,
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
  Sparkles,
  Hash,
  FileText,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button/Button';
import { Input } from '@/shared/components/ui/Input/Input';
import { Badge } from '@/shared/components/ui/Badge/Badge';
import { Modal } from '@/shared/components/ui/Modal/Modal';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog/ConfirmDialog';
import { SkeletonCard } from '@/shared/components/ui/Skeleton/SkeletonCard';
import { useLoading } from '@/shared/contexts/LoadingContext';
import { useToast } from '@/shared/contexts/ToastContext';
import { schoolLevelService } from '@/features/academic/school-levels/services/school-level.service';
import { programService } from '@/features/academic/programs/services/program.service';
import { SchoolLevelForm } from '@/features/academic/school-levels/components/SchoolLevelForm';
import { ProgramForm } from '@/features/academic/programs/components/ProgramForm';
import type { SchoolLevel, SchoolLevelFilters } from '@/features/academic/school-levels/types/school-level.types';
import type { Program, ProgramFilters } from '@/features/academic/programs/types/program.types';
import styles from './page.module.css';

type ViewMode = 'cards' | 'table';
type TabType = 'levels' | 'programs';

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

export default function AcademicStructurePage() {
  const { startLoading, stopLoading, isLoading } = useLoading();
  const { showSuccess, showError } = useToast();

  // Active tab
  const [activeTab, setActiveTab] = useState<TabType>('levels');

  // ============ NÍVEIS DE ENSINO ============
  const [levels, setLevels] = useState<SchoolLevel[]>([]);
  const [levelsTotal, setLevelsTotal] = useState(0);
  const [levelsFilters, setLevelsFilters] = useState<SchoolLevelFilters>({ page: 1, limit: 10 });
  const [levelsSearch, setLevelsSearch] = useState('');
  const [showLevelsFilters, setShowLevelsFilters] = useState(false);

  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<SchoolLevel | null>(null);

  // ============ PROGRAMAS ============
  const [programs, setPrograms] = useState<Program[]>([]);
  const [programsTotal, setProgramsTotal] = useState(0);
  const [programsFilters, setProgramsFilters] = useState<ProgramFilters>({ page: 1, limit: 10 });
  const [programsSearch, setProgramsSearch] = useState('');
  const [showProgramsFilters, setShowProgramsFilters] = useState(false);

  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  // Confirm Dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'delete' | 'toggle';
    entityType: 'level' | 'program';
    uuid?: string;
    name?: string;
    isActive?: boolean;
  }>({ isOpen: false, type: 'delete', entityType: 'level' });

  // ============ LOAD FUNCTIONS ============
  const loadLevels = async () => {
    try {
      const response = await schoolLevelService.getAll({
        ...levelsFilters,
        search: levelsSearch || undefined,
      });
      const levelsArray = response?.data || [];
      setLevels(levelsArray.map((l: any) => ({ ...l, isActive: isActiveBoolean(l.isActive) })));
      setLevelsTotal(response?.total || 0);
    } catch (error: any) {
      console.error('Erro ao carregar níveis:', error);
      showError('Erro', 'Não foi possível carregar os níveis de ensino');
    }
  };

  const loadPrograms = async () => {
    try {
      const response = await programService.getAll({
        ...programsFilters,
        search: programsSearch || undefined,
      });
      const programsArray = response?.data || [];
      setPrograms(programsArray.map((p: any) => ({ ...p, isActive: isActiveBoolean(p.isActive) })));
      setProgramsTotal(response?.total || 0);
    } catch (error: any) {
      console.error('Erro ao carregar programas:', error);
      showError('Erro', 'Não foi possível carregar os programas');
    }
  };

  const loadAll = async () => {
    try {
      startLoading();
      await Promise.all([loadLevels(), loadPrograms()]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      stopLoading();
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (activeTab === 'levels') {
      loadLevels();
    } else {
      loadPrograms();
    }
  }, [activeTab]);

  // ============ LEVEL HANDLERS ============
  const handleLevelCreate = () => {
    setSelectedLevel(null);
    setIsLevelModalOpen(true);
  };

  const handleLevelEdit = (level: SchoolLevel) => {
    setSelectedLevel(level);
    setIsLevelModalOpen(true);
  };

  const handleLevelDelete = (level: SchoolLevel) => {
    setConfirmDialog({
      isOpen: true,
      type: 'delete',
      entityType: 'level',
      uuid: level.uuid,
      name: level.name,
    });
  };

  const handleLevelToggle = (level: SchoolLevel) => {
    setConfirmDialog({
      isOpen: true,
      type: 'toggle',
      entityType: 'level',
      uuid: level.uuid,
      name: level.name,
      isActive: level.isActive,
    });
  };

  // ============ PROGRAM HANDLERS ============
  const handleProgramCreate = () => {
    setSelectedProgram(null);
    setIsProgramModalOpen(true);
  };

  const handleProgramEdit = (program: Program) => {
    setSelectedProgram(program);
    setIsProgramModalOpen(true);
  };

  const handleProgramDelete = (program: Program) => {
    setConfirmDialog({
      isOpen: true,
      type: 'delete',
      entityType: 'program',
      uuid: program.uuid,
      name: program.name,
    });
  };

  const handleProgramToggle = (program: Program) => {
    setConfirmDialog({
      isOpen: true,
      type: 'toggle',
      entityType: 'program',
      uuid: program.uuid,
      name: program.name,
      isActive: program.isActive,
    });
  };

  // ============ CONFIRM ACTION ============
  const handleConfirmAction = async () => {
    const { type, entityType, uuid, name, isActive } = confirmDialog;

    try {
      startLoading();

      if (entityType === 'level') {
        if (type === 'delete') {
          await schoolLevelService.remove(uuid!);
          showSuccess('Nível excluído', `${name} foi removido com sucesso`);
        } else if (type === 'toggle') {
          await schoolLevelService.toggleStatus(uuid!, !isActive);
          const newStatus = isActive ? 'desativado' : 'ativado';
          showSuccess(`Nível ${newStatus}`, `${name} foi ${newStatus} com sucesso`);
        }
        await loadLevels();
      } else {
        if (type === 'delete') {
          await programService.remove(uuid!);
          showSuccess('Programa excluído', `${name} foi removido com sucesso`);
        } else if (type === 'toggle') {
          await programService.toggleStatus(uuid!, !isActive);
          const newStatus = isActive ? 'desativado' : 'ativado';
          showSuccess(`Programa ${newStatus}`, `${name} foi ${newStatus} com sucesso`);
        }
        await loadPrograms();
      }

      setConfirmDialog({ isOpen: false, type: 'delete', entityType: 'level' });
    } catch (error: any) {
      console.error('Erro:', error);
      showError('Erro', error.response?.data?.message || 'Ocorreu um erro');
    } finally {
      stopLoading();
    }
  };

  // ============ FORMAT DATE ============
  const formatDate = (date: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // ============ EMPTY STATE ============
  const EmptyState = ({ type }: { type: 'levels' | 'programs' }) => {
    const isLevels = type === 'levels';
    const Icon = isLevels ? Layers : BookOpen;
    const title = isLevels ? 'Nenhum nível de ensino' : 'Nenhum programa';
    const description = isLevels
      ? 'Comece criando o primeiro nível de ensino'
      : 'Comece criando o primeiro programa';
    const actionText = isLevels ? 'Criar nível' : 'Criar programa';
    const action = isLevels ? handleLevelCreate : handleProgramCreate;

    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIconWrapper}>
          <Icon size={48} className={styles.emptyIcon} />
        </div>
        <h3 className={styles.emptyTitle}>{title}</h3>
        <p className={styles.emptySubtext}>{description}</p>
        <Button icon={<Plus size={18} />} onClick={action}>
          {actionText}
        </Button>
      </div>
    );
  };

  // ============ RENDER LEVELS ============
  const renderLevels = () => {
    if (isLoading && levels.length === 0) {
      return (
        <div className={styles.cardsGrid}>
          {[...Array(3)].map((_, i) => (
            <SkeletonCard key={i} variant="default" />
          ))}
        </div>
      );
    }

    if (levels.length === 0) {
      return <EmptyState type="levels" />;
    }

    return (
      <div className={viewMode === 'cards' ? styles.cardsGrid : styles.tableWrapper}>
        {viewMode === 'cards' ? (
          levels.map((level) => (
            <div key={level.uuid} className={styles.levelCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderLeft}>
                  <div className={styles.levelIcon}>
                    <Layers size={20} />
                  </div>
                  <div>
                    <h3 className={styles.itemName}>{level.name}</h3>
                    <p className={styles.itemCode}>
                      <Hash size={12} />
                      {level.code}
                    </p>
                  </div>
                </div>
                <div className={styles.cardActions}>
                  <button
                    className={styles.iconButton}
                    onClick={() => handleLevelToggle(level)}
                    title={level.isActive ? 'Desativar' : 'Ativar'}
                  >
                    {level.isActive ? (
                      <PowerOff size={16} className={styles.actionInactive} />
                    ) : (
                      <Power size={16} className={styles.actionActive} />
                    )}
                  </button>
                  <button
                    className={styles.iconButton}
                    onClick={() => handleLevelEdit(level)}
                    title="Editar"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    className={styles.iconButton}
                    onClick={() => handleLevelDelete(level)}
                    title="Excluir"
                  >
                    <Trash2 size={16} className={styles.actionDanger} />
                  </button>
                </div>
              </div>
              <div className={styles.cardBody}>
                {level.description && (
                  <div className={styles.description}>
                    <FileText size={14} />
                    <span>{level.description}</span>
                  </div>
                )}
              </div>
              <div className={styles.cardFooter}>
                <div className={styles.cardTags}>
                  {getStatusBadge(level.isActive)}
                </div>
                <span className={styles.cardDate}>
                  <Clock size={12} />
                  Criado em {formatDate(level.createdAt)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Nível</th>
                <th className={styles.th}>Código</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th} style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {levels.map((level) => (
                <tr key={level.uuid} className={styles.tr}>
                  <td className={styles.td}>
                    <div className={styles.itemCell}>
                      <div className={styles.itemIconSmall}>
                        <Layers size={16} />
                      </div>
                      <div>
                        <div className={styles.itemName}>{level.name}</div>
                        {level.description && (
                          <div className={styles.itemDescription}>{level.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className={styles.td}>
                    <span className={styles.codeBadge}>{level.code}</span>
                  </td>
                  <td className={styles.td}>{getStatusBadge(level.isActive)}</td>
                  <td className={styles.td} style={{ textAlign: 'right' }}>
                    <div className={styles.actions}>
                      <button
                        className={styles.actionButton}
                        onClick={() => handleLevelToggle(level)}
                      >
                        {level.isActive ? (
                          <PowerOff size={16} className={styles.actionInactive} />
                        ) : (
                          <Power size={16} className={styles.actionActive} />
                        )}
                      </button>
                      <button
                        className={styles.actionButton}
                        onClick={() => handleLevelEdit(level)}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className={styles.actionButton}
                        onClick={() => handleLevelDelete(level)}
                      >
                        <Trash2 size={16} className={styles.actionDanger} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  };

  // ============ RENDER PROGRAMS ============
  const renderPrograms = () => {
    if (isLoading && programs.length === 0) {
      return (
        <div className={styles.cardsGrid}>
          {[...Array(3)].map((_, i) => (
            <SkeletonCard key={i} variant="default" />
          ))}
        </div>
      );
    }

    if (programs.length === 0) {
      return <EmptyState type="programs" />;
    }

    return (
      <div className={viewMode === 'cards' ? styles.cardsGrid : styles.tableWrapper}>
        {viewMode === 'cards' ? (
          programs.map((program) => (
            <div key={program.uuid} className={styles.programCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderLeft}>
                  <div className={styles.programIcon}>
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h3 className={styles.itemName}>{program.name}</h3>
                    <p className={styles.itemCode}>
                      <Hash size={12} />
                      {program.code}
                    </p>
                  </div>
                </div>
                <div className={styles.cardActions}>
                  <button
                    className={styles.iconButton}
                    onClick={() => handleProgramToggle(program)}
                    title={program.isActive ? 'Desativar' : 'Ativar'}
                  >
                    {program.isActive ? (
                      <PowerOff size={16} className={styles.actionInactive} />
                    ) : (
                      <Power size={16} className={styles.actionActive} />
                    )}
                  </button>
                  <button
                    className={styles.iconButton}
                    onClick={() => handleProgramEdit(program)}
                    title="Editar"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    className={styles.iconButton}
                    onClick={() => handleProgramDelete(program)}
                    title="Excluir"
                  >
                    <Trash2 size={16} className={styles.actionDanger} />
                  </button>
                </div>
              </div>
              <div className={styles.cardBody}>
                {program.schoolLevel && (
                  <div className={styles.schoolLevelInfo}>
                    <Layers size={14} />
                    <span>{program.schoolLevel.name}</span>
                  </div>
                )}
                {program.description && (
                  <div className={styles.description}>
                    <FileText size={14} />
                    <span>{program.description}</span>
                  </div>
                )}
              </div>
              <div className={styles.cardFooter}>
                <div className={styles.cardTags}>
                  {getStatusBadge(program.isActive)}
                </div>
                <span className={styles.cardDate}>
                  <Clock size={12} />
                  Criado em {formatDate(program.createdAt)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Programa</th>
                <th className={styles.th}>Código</th>
                <th className={styles.th}>Nível</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th} style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {programs.map((program) => (
                <tr key={program.uuid} className={styles.tr}>
                  <td className={styles.td}>
                    <div className={styles.itemCell}>
                      <div className={styles.itemIconSmall}>
                        <BookOpen size={16} />
                      </div>
                      <div>
                        <div className={styles.itemName}>{program.name}</div>
                        {program.description && (
                          <div className={styles.itemDescription}>{program.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className={styles.td}>
                    <span className={styles.codeBadge}>{program.code}</span>
                  </td>
                  <td className={styles.td}>
                    <span className={styles.levelBadge}>
                      {program.schoolLevel?.name || '-'}
                    </span>
                  </td>
                  <td className={styles.td}>{getStatusBadge(program.isActive)}</td>
                  <td className={styles.td} style={{ textAlign: 'right' }}>
                    <div className={styles.actions}>
                      <button
                        className={styles.actionButton}
                        onClick={() => handleProgramToggle(program)}
                      >
                        {program.isActive ? (
                          <PowerOff size={16} className={styles.actionInactive} />
                        ) : (
                          <Power size={16} className={styles.actionActive} />
                        )}
                      </button>
                      <button
                        className={styles.actionButton}
                        onClick={() => handleProgramEdit(program)}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className={styles.actionButton}
                        onClick={() => handleProgramDelete(program)}
                      >
                        <Trash2 size={16} className={styles.actionDanger} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  };

  // ============ TOOLBAR ============
  const renderToolbar = () => {
    const isLevels = activeTab === 'levels';
    const search = isLevels ? levelsSearch : programsSearch;
    const setSearch = isLevels ? setLevelsSearch : setProgramsSearch;
    const showFilters = isLevels ? showLevelsFilters : showProgramsFilters;
    const setShowFilters = isLevels ? setShowLevelsFilters : setShowProgramsFilters;
    const handleSearch = () => {
      if (isLevels) {
        setLevelsFilters({ ...levelsFilters, page: 1 });
        loadLevels();
      } else {
        setProgramsFilters({ ...programsFilters, page: 1 });
        loadPrograms();
      }
    };
    const createAction = isLevels ? handleLevelCreate : handleProgramCreate;

    return (
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder={`Pesquisar ${isLevels ? 'níveis' : 'programas'}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
          <Button
            icon={<Plus size={18} />}
            onClick={createAction}
            className={styles.createButton}
          >
            {isLevels ? 'Novo Nível' : 'Novo Programa'}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <GraduationCap size={24} />
          </div>
          <div>
            <h1 className={styles.title}>Estrutura Académica</h1>
            <p className={styles.subtitle}>
              Gerencie os níveis de ensino e programas da instituição
            </p>
          </div>
        </div>
        <div className={styles.headerStats}>
          <div className={styles.statBadge}>
            <Layers size={14} />
            <span>{levelsTotal} níveis</span>
          </div>
          <div className={styles.statBadge}>
            <BookOpen size={14} />
            <span>{programsTotal} Classes/Cursos</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'levels' ? styles.active : ''}`}
          onClick={() => setActiveTab('levels')}
        >
          <Layers size={18} />
          <span>Níveis de Ensino</span>
          <span className={styles.tabCount}>{levelsTotal}</span>
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'programs' ? styles.active : ''}`}
          onClick={() => setActiveTab('programs')}
        >
          <BookOpen size={18} />
          <span>Classes/Cursos</span>
          <span className={styles.tabCount}>{programsTotal}</span>
        </button>
      </div>

      {/* Toolbar */}
      {renderToolbar()}

      {/* Content */}
      <div className={styles.content}>
        {activeTab === 'levels' ? renderLevels() : renderPrograms()}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, type: 'delete', entityType: 'level' })}
        onConfirm={handleConfirmAction}
        title={
          confirmDialog.type === 'delete'
            ? `Excluir ${confirmDialog.entityType === 'level' ? 'Nível de Ensino' : 'Programa'}`
            : confirmDialog.isActive
            ? `Desativar ${confirmDialog.entityType === 'level' ? 'Nível de Ensino' : 'Programa'}`
            : `Ativar ${confirmDialog.entityType === 'level' ? 'Nível de Ensino' : 'Programa'}`
        }
        message={
          confirmDialog.type === 'delete'
            ? `Tem certeza que deseja excluir "${confirmDialog.name}"? Esta ação não pode ser desfeita.`
            : confirmDialog.isActive
            ? `Tem certeza que deseja desativar "${confirmDialog.name}"?`
            : `Tem certeza que deseja ativar "${confirmDialog.name}"?`
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

      {/* Modals */}
      <Modal
        isOpen={isLevelModalOpen}
        onClose={() => setIsLevelModalOpen(false)}
        title={selectedLevel ? 'Editar Nível de Ensino' : 'Novo Nível de Ensino'}
        size="md"
      >
        <SchoolLevelForm
          level={selectedLevel}
          onSuccess={() => {
            setIsLevelModalOpen(false);
            setSelectedLevel(null);
            showSuccess(
              selectedLevel ? 'Nível atualizado' : 'Nível criado',
              selectedLevel
                ? `${selectedLevel.name} foi atualizado com sucesso`
                : 'Novo nível de ensino criado com sucesso'
            );
            loadLevels();
          }}
          onCancel={() => {
            setIsLevelModalOpen(false);
            setSelectedLevel(null);
          }}
        />
      </Modal>

      <Modal
        isOpen={isProgramModalOpen}
        onClose={() => setIsProgramModalOpen(false)}
        title={selectedProgram ? 'Editar Programa' : 'Novo Programa'}
        size="lg"
      >
        <ProgramForm
          program={selectedProgram}
          onSuccess={() => {
            setIsProgramModalOpen(false);
            setSelectedProgram(null);
            showSuccess(
              selectedProgram ? 'Programa atualizado' : 'Programa criado',
              selectedProgram
                ? `${selectedProgram.name} foi atualizado com sucesso`
                : 'Novo programa criado com sucesso'
            );
            loadPrograms();
          }}
          onCancel={() => {
            setIsProgramModalOpen(false);
            setSelectedProgram(null);
          }}
        />
      </Modal>
    </div>
  );
}