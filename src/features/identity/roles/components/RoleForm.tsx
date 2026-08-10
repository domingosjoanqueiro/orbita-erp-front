'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  X, 
  Shield, 
  Lock, 
  Unlock, 
  ChevronDown,
  ChevronRight,
  Search,
} from 'lucide-react';
import { Input } from '@/shared/components/ui/Input/Input';
import { Button } from '@/shared/components/ui/Button/Button';
import { createRoleSchema, updateRoleSchema } from '../validators/role.validators';
import { modules, actions, roleColors } from '../types/role.types';
import type { Role } from '../types/role.types';
import styles from './RoleForm.module.css';

interface RoleFormProps {
  role?: Role | null;
  onSuccess: () => void;
  onCancel: () => void;
}

// Mock de permissões disponíveis
const availablePermissions = [
  { id: 'dashboard.read', name: 'dashboard.read', resource: 'dashboard', action: 'read', module: 'dashboard' },
  { id: 'dashboard.manage', name: 'dashboard.manage', resource: 'dashboard', action: 'manage', module: 'dashboard' },
  { id: 'users.read', name: 'users.read', resource: 'users', action: 'read', module: 'users' },
  { id: 'users.create', name: 'users.create', resource: 'users', action: 'create', module: 'users' },
  { id: 'users.update', name: 'users.update', resource: 'users', action: 'update', module: 'users' },
  { id: 'users.delete', name: 'users.delete', resource: 'users', action: 'delete', module: 'users' },
  { id: 'users.manage', name: 'users.manage', resource: 'users', action: 'manage', module: 'users' },
  { id: 'students.read', name: 'students.read', resource: 'students', action: 'read', module: 'students' },
  { id: 'students.create', name: 'students.create', resource: 'students', action: 'create', module: 'students' },
  { id: 'students.update', name: 'students.update', resource: 'students', action: 'update', module: 'students' },
  { id: 'students.delete', name: 'students.delete', resource: 'students', action: 'delete', module: 'students' },
  { id: 'students.manage', name: 'students.manage', resource: 'students', action: 'manage', module: 'students' },
  { id: 'teachers.read', name: 'teachers.read', resource: 'teachers', action: 'read', module: 'teachers' },
  { id: 'teachers.create', name: 'teachers.create', resource: 'teachers', action: 'create', module: 'teachers' },
  { id: 'teachers.update', name: 'teachers.update', resource: 'teachers', action: 'update', module: 'teachers' },
  { id: 'teachers.delete', name: 'teachers.delete', resource: 'teachers', action: 'delete', module: 'teachers' },
  { id: 'teachers.manage', name: 'teachers.manage', resource: 'teachers', action: 'manage', module: 'teachers' },
  { id: 'enrollments.read', name: 'enrollments.read', resource: 'enrollments', action: 'read', module: 'enrollments' },
  { id: 'enrollments.create', name: 'enrollments.create', resource: 'enrollments', action: 'create', module: 'enrollments' },
  { id: 'enrollments.manage', name: 'enrollments.manage', resource: 'enrollments', action: 'manage', module: 'enrollments' },
  { id: 'reports.read', name: 'reports.read', resource: 'reports', action: 'read', module: 'reports' },
  { id: 'reports.manage', name: 'reports.manage', resource: 'reports', action: 'manage', module: 'reports' },
  { id: 'grades.read', name: 'grades.read', resource: 'grades', action: 'read', module: 'grades' },
  { id: 'grades.create', name: 'grades.create', resource: 'grades', action: 'create', module: 'grades' },
  { id: 'grades.update', name: 'grades.update', resource: 'grades', action: 'update', module: 'grades' },
  { id: 'grades.manage', name: 'grades.manage', resource: 'grades', action: 'manage', module: 'grades' },
  { id: 'attendance.read', name: 'attendance.read', resource: 'attendance', action: 'read', module: 'attendance' },
  { id: 'attendance.create', name: 'attendance.create', resource: 'attendance', action: 'create', module: 'attendance' },
  { id: 'attendance.manage', name: 'attendance.manage', resource: 'attendance', action: 'manage', module: 'attendance' },
  { id: 'settings.read', name: 'settings.read', resource: 'settings', action: 'read', module: 'settings' },
  { id: 'settings.update', name: 'settings.update', resource: 'settings', action: 'update', module: 'settings' },
  { id: 'settings.manage', name: 'settings.manage', resource: 'settings', action: 'manage', module: 'settings' },
];

export const RoleForm: React.FC<RoleFormProps> = ({
  role,
  onSuccess,
  onCancel,
}) => {
  const isEditing = !!role;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [searchPermission, setSearchPermission] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    role?.permissions.map(p => p.id) || []
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(isEditing ? updateRoleSchema : createRoleSchema),
    defaultValues: {
      name: role?.name || '',
      description: role?.description || '',
      color: role?.color || '#8B5CF6',
      isDefault: role?.isDefault || false,
      permissionIds: role?.permissions.map(p => p.id) || [],
    },
  });

  // Expandir todos os módulos ao abrir
  useEffect(() => {
    if (availablePermissions.length > 0) {
      const allModules = [...new Set(availablePermissions.map(p => p.module))];
      setExpandedModules(allModules);
    }
  }, []);

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const expandAllModules = () => {
    const allModules = [...new Set(availablePermissions.map(p => p.module))];
    setExpandedModules(allModules);
  };

  const collapseAllModules = () => {
    setExpandedModules([]);
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev => {
      const newSelection = prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId];
      setValue('permissionIds', newSelection);
      return newSelection;
    });
  };

  const toggleAllModule = (moduleId: string) => {
    const modulePermissions = availablePermissions.filter(p => p.module === moduleId);
    const allSelected = modulePermissions.every(p => selectedPermissions.includes(p.id));
    
    let newSelection: string[];
    if (allSelected) {
      newSelection = selectedPermissions.filter(
        id => !modulePermissions.some(p => p.id === id)
      );
    } else {
      newSelection = [
        ...selectedPermissions,
        ...modulePermissions.map(p => p.id).filter(id => !selectedPermissions.includes(id))
      ];
    }
    setSelectedPermissions(newSelection);
    setValue('permissionIds', newSelection);
  };

  const getModulePermissions = (moduleId: string) => {
    let perms = availablePermissions.filter(p => p.module === moduleId);
    if (searchPermission) {
      perms = perms.filter(p => 
        p.name.toLowerCase().includes(searchPermission.toLowerCase())
      );
    }
    return perms;
  };

  const getModuleIcon = (moduleId: string) => {
    const module = modules.find(m => m.id === moduleId);
    return module?.label || moduleId;
  };

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Dados da role:', { ...data, permissionIds: selectedPermissions });
      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar role:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPermissions = availablePermissions.length;
  const selectedCount = selectedPermissions.length;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <div className={styles.formContent}>
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Informações da Role</h4>
          <div className={styles.fields}>
            <div className={styles.field}>
              <Input
                label="Nome"
                placeholder="Ex: Administrador"
                leftIcon={<Shield size={16} />}
                {...register('name')}
                error={errors.name?.message}
                fullWidth
              />
            </div>
            <div className={styles.field}>
              <Input
                label="Descrição"
                placeholder="Descreva o propósito da role"
                {...register('description')}
                error={errors.description?.message}
                fullWidth
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Cor</label>
              <div className={styles.colorPicker}>
                {roleColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`${styles.colorOption} ${watch('color') === color ? styles.selected : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setValue('color', color)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h4 className={styles.sectionTitle}>Permissões</h4>
            <div className={styles.sectionHeaderRight}>
              <span className={styles.permissionCount}>
                {selectedCount} de {totalPermissions}
              </span>
              <div className={styles.expandButtons}>
                <button
                  type="button"
                  className={styles.expandButton}
                  onClick={expandAllModules}
                >
                  <ChevronDown size={14} />
                  Expandir
                </button>
                <button
                  type="button"
                  className={styles.expandButton}
                  onClick={collapseAllModules}
                >
                  <ChevronRight size={14} />
                  Recolher
                </button>
              </div>
            </div>
          </div>

          <div className={styles.searchPermissions}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Filtrar permissões..."
              value={searchPermission}
              onChange={(e) => setSearchPermission(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.permissionsContainer}>
            {modules.map((module) => {
              const modulePermissions = getModulePermissions(module.id);
              if (modulePermissions.length === 0) return null;

              const isExpanded = expandedModules.includes(module.id);
              const selectedCountModule = modulePermissions.filter(p =>
                selectedPermissions.includes(p.id)
              ).length;
              const isAllSelected = selectedCountModule === modulePermissions.length;

              return (
                <div key={module.id} className={styles.moduleGroup}>
                  <div
                    className={styles.moduleHeader}
                    onClick={() => toggleModule(module.id)}
                  >
                    <div className={styles.moduleHeaderLeft}>
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      <span className={styles.moduleName}>{getModuleIcon(module.id)}</span>
                      <span className={styles.moduleCount}>
                        {selectedCountModule}/{modulePermissions.length}
                      </span>
                    </div>
                    <div className={styles.moduleHeaderRight}>
                      <button
                        type="button"
                        className={styles.selectAllButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAllModule(module.id);
                        }}
                      >
                        {isAllSelected ? (
                          <>
                            <Unlock size={12} />
                            Desmarcar
                          </>
                        ) : (
                          <>
                            <Lock size={12} />
                            Marcar
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className={styles.permissionsGridWrapper}>
                      <div className={styles.permissionsGrid}>
                        {modulePermissions.map((permission) => {
                          const actionConfig = actions.find(a => a.value === permission.action);
                          const isSelected = selectedPermissions.includes(permission.id);

                          return (
                            <label
                              key={permission.id}
                              className={`${styles.permissionItem} ${isSelected ? styles.selected : ''}`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => togglePermission(permission.id)}
                                className={styles.checkbox}
                              />
                              <span className={styles.permissionName}>
                                {permission.resource}.{permission.action}
                              </span>
                              {actionConfig && (
                                <span
                                  className={styles.actionBadge}
                                  style={{ 
                                    backgroundColor: actionConfig.color + '20', 
                                    color: actionConfig.color 
                                  }}
                                >
                                  {actionConfig.label}
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {selectedPermissions.length === 0 && (
            <div className={styles.noPermissionsSelected}>
              <Shield size={24} />
              <span>Nenhuma permissão selecionada</span>
              <span className={styles.noPermissionsSub}>
                Selecione pelo menos uma permissão para continuar
              </span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.actions}>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          icon={<X size={18} />}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          isLoading={isSubmitting}
          icon={<Shield size={18} />}
          disabled={selectedPermissions.length === 0}
        >
          {isEditing ? 'Atualizar' : 'Criar'} Role
        </Button>
      </div>
    </form>
  );
};