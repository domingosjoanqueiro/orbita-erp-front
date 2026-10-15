'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Shield,
  X,
  CheckCircle,
  Lock,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';
import { Input } from '@/shared/components/ui/Input/Input';
import { Textarea } from '@/shared/components/ui/Textarea/Textarea';
import { Button } from '@/shared/components/ui/Button/Button';
import { Badge } from '@/shared/components/ui/Badge/Badge';
import { useToast } from '@/shared/contexts/ToastContext';
import { useLoading } from '@/shared/contexts/LoadingContext';
import { roleService } from '../services/role.service';
import type { Role } from '../types/role.types';
import type { Permission } from '@/features/identity/permissions/types/permission.types';
import styles from './RoleForm.module.css';

interface RoleFormProps {
  role?: Role | null;
  permissions?: Permission[];
  onSuccess: () => void;
  onCancel: () => void;
}

// ✅ Schema com valores padrão
const roleSchema = z.object({
  name: z.string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(50, 'Nome deve ter no máximo 50 caracteres'),
  description: z.string()
    .max(255, 'Descrição deve ter no máximo 255 caracteres')
    .optional()
    .default(''),
  permissionIds: z.array(z.string())
    .optional()
    .default([]),
});

// ✅ Tipo inferido do schema
type RoleFormData = z.infer<typeof roleSchema>;

export const RoleForm: React.FC<RoleFormProps> = ({
  role,
  permissions = [],
  onSuccess,
  onCancel,
}) => {
  const isEditing = !!role;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const { showSuccess, showError } = useToast();
  const { startLoading, stopLoading } = useLoading();

  // ✅ useForm com tipo inferido
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting: isFormSubmitting },
    watch,
    setValue,
    getValues,
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema) as any,
    defaultValues: {
      name: role?.name || '',
      description: role?.description || '',
      permissionIds: role?.permissions?.map(p => String(p.id)) || [],
    },
  });

  const watchedPermissionIds = watch('permissionIds') || [];
  const watchedValues = watch();

  // ✅ Log para debug
  console.log('📝 RoleForm - Valores atuais:', watchedValues);
  console.log('📝 RoleForm - Erros:', errors);

  // Agrupar permissões por módulo
  const groupedPermissions = permissions.reduce((acc, perm) => {
    const module = perm.module || 'geral';
    if (!acc[module]) {
      acc[module] = [];
    }
    acc[module].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  // Filtrar grupos pela busca
  const filteredGroups = Object.entries(groupedPermissions).reduce((acc, [module, perms]) => {
    const filtered = perms.filter(perm =>
      perm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      perm.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      perm.action.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[module] = filtered;
    }
    return acc;
  }, {} as Record<string, Permission[]>);

  // Inicializar grupos expandidos
  useEffect(() => {
    const groups = Object.keys(filteredGroups);
    setExpandedGroups(new Set(groups));
  }, [permissions, searchTerm]);

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

  const expandAll = () => {
    const groups = Object.keys(filteredGroups);
    setExpandedGroups(new Set(groups));
  };

  const collapseAll = () => {
    setExpandedGroups(new Set());
  };

  const togglePermission = (permissionId: string) => {
    const current = watchedPermissionIds || [];
    if (current.includes(permissionId)) {
      setValue('permissionIds', current.filter(id => id !== permissionId));
    } else {
      setValue('permissionIds', [...current, permissionId]);
    }
  };

  const toggleAllGroup = (
    groupName: string
  ) => {

    const groupPerms =
      filteredGroups[groupName] || [];

    const groupIds =
      groupPerms.map(
        p => String(p.id)
      );

    const current =
      watchedPermissionIds || [];

    const allSelected =
      groupIds.every(
        id =>
          current.includes(id)
      );

    if (allSelected) {

      setValue(
        'permissionIds',

        current.filter(
          id =>
            !groupIds.includes(id)
        )
      );

    } else {

      const newIds =
        [...current];

      groupIds.forEach(
        id => {

          if (
            !newIds.includes(id)
          ) {

            newIds.push(id);

          }

        }
      );

      setValue(
        'permissionIds',
        newIds
      );

    }

  };

  const isGroupAllSelected = (groupName: string) => {
    const groupPerms = filteredGroups[groupName] || [];
    const groupIds = groupPerms.map(p => String(p.id));
    const current = watchedPermissionIds || [];
    return groupIds.every(id => current.includes(id));
  };

  // ✅ onSubmit com logs
  const onSubmit = async (data: RoleFormData) => {
    console.log('🚀 onSubmit chamado com dados:', data);

    try {
      setIsSubmitting(true);
      startLoading();

      const payload = {

        name:
          data.name || '',

        description:
          data.description || '',

        isAdmin:
          false,

        permissionIds:
          data.permissionIds || [],

      };

      console.log('📤 Payload enviado:', payload);

      let response;
      if (isEditing && role) {
        console.log('✏️ Atualizando role:', role.uuid);
        response = await roleService.update(role.uuid, payload);
        showSuccess('Role atualizada', `Role ${response.name} foi atualizada`);
      } else {
        console.log('➕ Criando nova role');
        response = await roleService.create(payload);
        showSuccess('Role criada', `Role ${response.name} foi criada`);
      }

      console.log('✅ Resposta do servidor:', response);

      onSuccess();
    } catch (error: any) {
      console.error('❌ Erro ao salvar role:', error);
      console.error('❌ Detalhes do erro:', error.response?.data);

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

  // ✅ Handler para o botão com validação
  const handleFormSubmit = (e: React.FormEvent) => {
    console.log('🔄 handleFormSubmit chamado');
    e.preventDefault();

    // ✅ Verificar se há erros antes de submeter
    const hasErrors = Object.keys(errors).length > 0;
    if (hasErrors) {
      console.log('❌ Erros de validação:', errors);
      showError('Erro de validação', 'Por favor, corrija os erros no formulário');
      return;
    }

    // ✅ Pegar os dados e submeter
    const data = getValues();
    console.log('📝 Dados do formulário:', data);
    onSubmit(data);
  };

  const totalSelected = (watchedPermissionIds || []).length;
  const totalPermissions = permissions.length;

  return (
    <form onSubmit={handleFormSubmit} className={styles.form} noValidate>
      <div className={styles.formContent}>
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

          </div>
        </div>

        {/* Permissões */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h4 className={styles.sectionTitle} style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <Lock size={16} />
              Permissões
              <Badge variant="info" size="sm">
                {totalSelected} de {totalPermissions} selecionadas
              </Badge>
            </h4>
            <div className={styles.sectionHeaderRight}>
              <div className={styles.expandButtons}>
                <button
                  type="button"
                  className={styles.expandButton}
                  onClick={expandAll}
                >
                  <ChevronDown size={14} />
                  Expandir
                </button>
                <button
                  type="button"
                  className={styles.expandButton}
                  onClick={collapseAll}
                >
                  <ChevronUp size={14} />
                  Recolher
                </button>
              </div>
            </div>
          </div>

          {/* Busca de Permissões */}
          <div className={styles.searchPermissions}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Buscar permissões..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {Object.keys(filteredGroups).length === 0 ? (
            <div className={styles.noPermissionsSelected}>
              <Lock size={32} />
              <span>
                {searchTerm ? 'Nenhuma permissão encontrada' : 'Nenhuma permissão disponível'}
              </span>
              {searchTerm && (
                <span className={styles.noPermissionsSub}>
                  Tente ajustar sua busca
                </span>
              )}
            </div>
          ) : (
            <div className={styles.permissionsContainer}>
              {Object.entries(filteredGroups).map(([module, perms]) => {
                const isExpanded = expandedGroups.has(module);
                const allSelected = isGroupAllSelected(module);

                return (
                  <div key={module} className={styles.moduleGroup}>
                    <div
                      className={styles.moduleHeader}
                      onClick={() => toggleGroup(module)}
                    >
                      <div className={styles.moduleHeaderLeft}>
                        <span className={styles.moduleName}>
                          {module.charAt(0).toUpperCase() + module.slice(1)}
                        </span>
                        <span className={styles.moduleCount}>
                          {perms.length}
                        </span>
                      </div>
                      <div className={styles.moduleHeaderRight}>
                        <button
                          type="button"
                          className={styles.selectAllButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleAllGroup(module);
                          }}
                        >
                          {allSelected ? 'Desselecionar' : 'Selecionar'}
                        </button>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className={styles.permissionsGridWrapper}>
                        <div className={styles.permissionsGrid}>
                          {perms.map((perm) => {
                            const isSelected = (watchedPermissionIds || []).includes(String(perm.id));
                            return (
                              <div
                                key={perm.id}
                                className={`${styles.permissionItem} ${isSelected ? styles.selected : ''}`}
                                onClick={() => togglePermission(String(perm.id))}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => { }}
                                  className={styles.checkbox}
                                />
                                <span className={styles.permissionName}>
                                  {perm.name || `${perm.resource}.${perm.action}`}
                                </span>
                                <Badge variant="neutral" size="sm">
                                  {perm.action}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
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
          isLoading={isSubmitting || isFormSubmitting}
          icon={<CheckCircle size={18} />}
        >
          {isEditing ? 'Atualizar' : 'Criar'} Role
        </Button>
      </div>
    </form>
  );
};