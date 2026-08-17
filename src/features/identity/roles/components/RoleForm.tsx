'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Shield,
  X,
  CheckCircle,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
} from 'lucide-react';
import { Input } from '@/shared/components/ui/Input/Input';
import { Textarea } from '@/shared/components/ui/Textarea/Textarea';
import { Button } from '@/shared/components/ui/Button/Button';
import { Badge } from '@/shared/components/ui/Badge/Badge';
import { useToast } from '@/shared/contexts/ToastContext';
import { useLoading } from '@/shared/contexts/LoadingContext';
import { roleService } from '../services/role.service';
import { roleColors } from '../types/role.types';
import type { Role, Permission } from '../types/role.types';
import styles from './RoleForm.module.css';

interface RoleFormProps {
  role?: Role | null;
  permissions?: Permission[];
  onSuccess: () => void;
  onCancel: () => void;
}

const roleSchema = z.object({
  name: z.string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(50, 'Nome deve ter no máximo 50 caracteres'),
  description: z.string()
    .max(255, 'Descrição deve ter no máximo 255 caracteres')
    .optional(),
  color: z.string().optional(),
  isDefault: z.boolean().default(false),
  permissionIds: z.array(z.string()).default([]),
});

type RoleFormData = z.infer<typeof roleSchema>;

export const RoleForm: React.FC<RoleFormProps> = ({
  role,
  permissions = [],
  onSuccess,
  onCancel,
}) => {
  const isEditing = !!role;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>(role?.color || '#8B5CF6');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const { showSuccess, showError } = useToast();
  const { startLoading, stopLoading } = useLoading();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    control,
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: role?.name || '',
      description: role?.description || '',
      color: role?.color || '#8B5CF6',
      isDefault: role?.isDefault || false,
      permissionIds: role?.permissions?.map(p => p.id) || [],
    },
  });

  const watchedPermissionIds = watch('permissionIds') || [];

  // Agrupar permissões por módulo
  const groupedPermissions = permissions.reduce((acc, perm) => {
    const module = perm.module || 'geral';
    if (!acc[module]) {
      acc[module] = [];
    }
    acc[module].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  // Inicializar grupos expandidos
  useEffect(() => {
    const groups = Object.keys(groupedPermissions);
    setExpandedGroups(new Set(groups));
  }, [permissions]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupName)) {
        next.delete(groupName);
      } else {
        next.add(groupName);
      }
      return next;
    });
  };

  const togglePermission = (permissionId: string) => {
    const current = watchedPermissionIds;
    if (current.includes(permissionId)) {
      setValue('permissionIds', current.filter(id => id !== permissionId));
    } else {
      setValue('permissionIds', [...current, permissionId]);
    }
  };

  const toggleAllGroup = (groupName: string) => {
    const groupPerms = groupedPermissions[groupName] || [];
    const groupIds = groupPerms.map(p => p.id);
    const current = watchedPermissionIds;
    const allSelected = groupIds.every(id => current.includes(id));
    
    if (allSelected) {
      setValue('permissionIds', current.filter(id => !groupIds.includes(id)));
    } else {
      const newIds = [...current];
      groupIds.forEach(id => {
        if (!newIds.includes(id)) {
          newIds.push(id);
        }
      });
      setValue('permissionIds', newIds);
    }
  };

  const isGroupAllSelected = (groupName: string) => {
    const groupPerms = groupedPermissions[groupName] || [];
    const groupIds = groupPerms.map(p => p.id);
    return groupIds.every(id => watchedPermissionIds.includes(id));
  };

  const onSubmit = async (data: RoleFormData) => {
    try {
      setIsSubmitting(true);
      startLoading();

      const payload = {
        name: data.name,
        description: data.description || '',
        color: selectedColor,
        isDefault: data.isDefault || false,
        permissionIds: data.permissionIds || [],
      };

      let response;
      if (isEditing && role) {
        response = await roleService.update(role.id, payload);
        showSuccess('Role atualizada', `Role ${response.name} foi atualizada`);
      } else {
        response = await roleService.create(payload);
        showSuccess('Role criada', `Role ${response.name} foi criada`);
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

  const watchedValues = watch();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      {/* Informações Básicas */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>
          <Shield size={16} />
          Informações da Role
        </h4>

        <div className={styles.fields}>
          <div className={styles.field}>
            <Input
              label="Nome da Role"
              placeholder="Ex: Administrador, Gerente..."
              value={watchedValues.name || ''}
              onChange={(e) => setValue('name', e.target.value)}
              error={errors.name?.message}
              fullWidth
            />
          </div>

          <div className={styles.field}>
            <Textarea
              label="Descrição"
              placeholder="Descreva o propósito desta role"
              value={watchedValues.description || ''}
              onChange={(e) => setValue('description', e.target.value)}
              fullWidth
              rows={3}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Cor da Role</label>
            <div className={styles.colorPicker}>
              {roleColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`${styles.colorOption} ${selectedColor === color ? styles.selected : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={watchedValues.isDefault || false}
                onChange={(e) => setValue('isDefault', e.target.checked)}
              />
              <span>Role Padrão</span>
            </label>
            <p className={styles.toggleHelp}>
              Roles padrão são atribuídas automaticamente a novos usuários
            </p>
          </div>
        </div>
      </div>

      {/* Permissões */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>
          <Lock size={16} />
          Permissões
          <Badge variant="info" size="sm">
            {watchedPermissionIds.length} selecionadas
          </Badge>
        </h4>

        {Object.keys(groupedPermissions).length === 0 ? (
          <div className={styles.emptyPermissions}>
            <p>Nenhuma permissão disponível</p>
          </div>
        ) : (
          <div className={styles.permissionsContainer}>
            {Object.entries(groupedPermissions).map(([module, perms]) => {
              const isExpanded = expandedGroups.has(module);
              const allSelected = isGroupAllSelected(module);

              return (
                <div key={module} className={styles.permissionGroup}>
                  <div
                    className={styles.permissionGroupHeader}
                    onClick={() => toggleGroup(module)}
                  >
                    <div className={styles.permissionGroupHeaderLeft}>
                      <span className={styles.permissionGroupName}>
                        {module.charAt(0).toUpperCase() + module.slice(1)}
                      </span>
                      <Badge variant="neutral" size="sm">
                        {perms.length} permissões
                      </Badge>
                    </div>
                    <div className={styles.permissionGroupHeaderRight}>
                      <button
                        type="button"
                        className={styles.selectAllBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAllGroup(module);
                        }}
                      >
                        {allSelected ? 'Desselecionar todas' : 'Selecionar todas'}
                      </button>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className={styles.permissionGroupBody}>
                      {perms.map((perm) => {
                        const isSelected = watchedPermissionIds.includes(perm.id);
                        return (
                          <div
                            key={perm.id}
                            className={`${styles.permissionItem} ${isSelected ? styles.selected : ''}`}
                            onClick={() => togglePermission(perm.id)}
                          >
                            <div className={styles.permissionItemLeft}>
                              <div className={styles.permissionCheck}>
                                {isSelected ? (
                                  <CheckCircle size={16} className={styles.checked} />
                                ) : (
                                  <div className={styles.unchecked} />
                                )}
                              </div>
                              <div className={styles.permissionInfo}>
                                <span className={styles.permissionName}>
                                  {perm.name || `${perm.resource}.${perm.action}`}
                                </span>
                                <span className={styles.permissionResource}>
                                  {perm.resource}.{perm.action}
                                </span>
                              </div>
                            </div>
                            <Badge variant="neutral" size="sm">
                              {perm.module}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
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
          icon={<CheckCircle size={18} />}
        >
          {isEditing ? 'Atualizar' : 'Criar'} Role
        </Button>
      </div>
    </form>
  );
};