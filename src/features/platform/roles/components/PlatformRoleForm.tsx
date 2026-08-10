'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield, Key, X, Crown, Lock, Unlock, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { Input } from '@/shared/components/ui/Input/Input';
import { Select } from '@/shared/components/ui/Select/Select';
import { Button } from '@/shared/components/ui/Button/Button';
import { useToast } from '@/shared/contexts/ToastContext';
import { useLoading } from '@/shared/contexts/LoadingContext';
import { platformRoleService } from '../services/platform-role.service';
import type { PlatformRole } from '../types/platform-role.types';
import styles from './PlatformRoleForm.module.css';

interface PlatformRoleFormProps {
  role?: PlatformRole | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface Permission {
  id: number;
  code: string;
  name: string;
  module: string;
  description?: string;
}

const createSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(50, 'Nome deve ter no máximo 50 caracteres'),
  description: z.string().max(200, 'Descrição deve ter no máximo 200 caracteres').optional(),
  permissionIds: z.array(z.string()).min(1, 'Selecione pelo menos uma permissão'),
  isAdmin: z.boolean().default(false),
});

const updateSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(50, 'Nome deve ter no máximo 50 caracteres').optional(),
  description: z.string().max(200, 'Descrição deve ter no máximo 200 caracteres').optional(),
  permissionIds: z.array(z.string()).min(1, 'Selecione pelo menos uma permissão').optional(),
});

type CreateFormData = z.infer<typeof createSchema>;
type UpdateFormData = z.infer<typeof updateSchema>;

export const PlatformRoleForm: React.FC<PlatformRoleFormProps> = ({
  role,
  onSuccess,
  onCancel,
}) => {
  const isEditing = !!role;
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const { showSuccess, showError } = useToast();
  const { startLoading, stopLoading } = useLoading();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateFormData | UpdateFormData>({
    resolver: zodResolver(isEditing ? updateSchema : createSchema),
    defaultValues: isEditing && role ? {
      name: role.name || '',
      description: role.description || '',
      permissionIds: role.permissions?.map(p => String(p.id)) || [],
    } : {
      name: '',
      description: '',
      permissionIds: [],
      isAdmin: false,
    },
  });

  const selectedPermissions = (watch('permissionIds') as string[]) || [];
  const isAdmin = (watch('isAdmin') as boolean) || false;

  // Carregar permissões do backend
  useEffect(() => {
    const loadPermissions = async () => {
      try {
        setLoadingPermissions(true);
        const data = await platformRoleService.getPermissions();
        setPermissions(data);
        console.log('Permissões carregadas:', data);
        
        // Expandir todos os módulos inicialmente
        const modules = [...new Set(data.map(p => p.module))];
        setExpandedModules(modules);
      } catch (error) {
        console.error('Erro ao carregar permissões:', error);
        showError('Erro', 'Não foi possível carregar as permissões');
      } finally {
        setLoadingPermissions(false);
      }
    };

    loadPermissions();
  }, []);

  const toggleModule = (module: string) => {
    setExpandedModules(prev =>
      prev.includes(module)
        ? prev.filter(m => m !== module)
        : [...prev, module]
    );
  };

  const togglePermission = (permissionId: string) => {
    const current = selectedPermissions;
    const newSelection = current.includes(permissionId)
      ? current.filter(id => id !== permissionId)
      : [...current, permissionId];
    setValue('permissionIds', newSelection as any);
  };

  const toggleAllModule = (module: string) => {
    const modulePermissions = permissions.filter(p => p.module === module);
    const allSelected = modulePermissions.every(p => selectedPermissions.includes(String(p.id)));
    
    let newSelection: string[];
    if (allSelected) {
      newSelection = selectedPermissions.filter(
        id => !modulePermissions.some(p => String(p.id) === id)
      );
    } else {
      newSelection = [
        ...selectedPermissions,
        ...modulePermissions.map(p => String(p.id)).filter(id => !selectedPermissions.includes(id))
      ];
    }
    setValue('permissionIds', newSelection as any);
  };

  const getModulePermissions = (module: string) => {
    return permissions.filter(p => p.module === module);
  };

  const onSubmit = async (data: CreateFormData | UpdateFormData) => {
    try {
      setIsSubmitting(true);
      startLoading();

      const payload: any = {
        name: data.name,
        description: data.description,
        permissionIds: (data.permissionIds || []).map(Number),
      };

      // Apenas na criação podemos definir isAdmin
      if (!isEditing) {
        payload.isAdmin = (data as CreateFormData).isAdmin || false;
      }

      let response;
      if (isEditing && role) {
        response = await platformRoleService.update(role.uuid, payload);
        showSuccess('Role atualizada', `${response.name} foi atualizada com sucesso`);
      } else {
        response = await platformRoleService.create(payload);
        showSuccess('Role criada', `${response.name} foi criada com sucesso`);
      }

      onSuccess();
    } catch (error: any) {
      console.error('Erro ao salvar role:', error);
      let errorMessage = 'Erro ao salvar role. Tente novamente.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        const messages = Object.values(error.response.data.errors).flat();
        errorMessage = messages.join(', ');
      }
      showError('Erro', errorMessage);
    } finally {
      setIsSubmitting(false);
      stopLoading();
    }
  };

  // Agrupar permissões por módulo
  const modules = [...new Set(permissions.map(p => p.module))];

  if (loadingPermissions) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 size={32} className={styles.loadingSpinner} />
        <span>Carregando permissões...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Informações da Role</h4>
        <div className={styles.fields}>
          <div className={styles.field}>
            <Input
              label="Nome"
              placeholder="Ex: Administrador da Empresa"
              leftIcon={<Shield size={16} />}
              {...register('name')}
              error={errors.name?.message}
              fullWidth
            />
          </div>
          <div className={styles.field}>
            <Input
              label="Descrição"
              placeholder="Descreva o propósito desta role"
              {...register('description')}
              error={errors.description?.message}
              fullWidth
            />
          </div>
        </div>
      </div>

      {!isEditing && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Tipo de Role</h4>
          <div className={styles.adminToggle}>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={isAdmin}
                onChange={(e) => setValue('isAdmin', e.target.checked as any)}
              />
              <Crown size={16} />
              <span>Role de Administrador da Empresa</span>
            </label>
            <p className={styles.toggleHelp}>
              Roles de administrador podem gerenciar usuários e configurações da empresa.
            </p>
          </div>
        </div>
      )}

      <div className={styles.section}>
        <div className={styles.permissionsHeader}>
          <h4 className={styles.sectionTitle}>
            <Key size={16} />
            Permissões
          </h4>
          <span className={styles.permissionCount}>
            {selectedPermissions.length} selecionadas
          </span>
        </div>

        <div className={styles.permissionsContainer}>
          {modules.map((module) => {
            const modulePermissions = getModulePermissions(module);
            const isExpanded = expandedModules.includes(module);
            const selectedCount = modulePermissions.filter(p =>
              selectedPermissions.includes(String(p.id))
            ).length;
            const isAllSelected = selectedCount === modulePermissions.length;

            return (
              <div key={module} className={styles.moduleGroup}>
                <div
                  className={styles.moduleHeader}
                  onClick={() => toggleModule(module)}
                >
                  <div className={styles.moduleHeaderLeft}>
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <span className={styles.moduleName}>
                      {module.charAt(0).toUpperCase() + module.slice(1)}
                    </span>
                    <span className={styles.moduleCount}>
                      {selectedCount}/{modulePermissions.length}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={styles.selectAllButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAllModule(module);
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

                {isExpanded && (
                  <div className={styles.permissionsGrid}>
                    {modulePermissions.map((permission) => {
                      const isSelected = selectedPermissions.includes(String(permission.id));

                      return (
                        <label
                          key={permission.id}
                          className={`${styles.permissionItem} ${isSelected ? styles.selected : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => togglePermission(String(permission.id))}
                          />
                          <span className={styles.permissionName}>
                            {permission.name}
                          </span>
                          <span className={styles.permissionCode}>
                            {permission.code}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {errors.permissionIds && (
          <span className={styles.errorMessage}>{errors.permissionIds.message}</span>
        )}
      </div>

      {role?.isSystem && (
        <div className={styles.warningBox}>
          <Lock size={16} />
          <span>Esta é uma role do sistema. Algumas permissões não podem ser alteradas.</span>
        </div>
      )}

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
        >
          {isEditing ? 'Atualizar' : 'Criar'} Role
        </Button>
      </div>
    </form>
  );
};