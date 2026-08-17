export interface Permission {
  id: string;
  name: string;
  description?: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' ;
  module: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  isDefault: boolean;
  isSystem: boolean;
  usersCount: number;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleDTO {
  name: string;
  description?: string;
  permissionIds: string[];
  isDefault?: boolean;
  color?: string;
}

export interface UpdateRoleDTO {
  name?: string;
  description?: string;
  permissionIds?: string[];
  isDefault?: boolean;
  color?: string;
}

export interface RoleFilters {
  search?: string;
  isDefault?: boolean;
  isSystem?: boolean;
  page?: number;
  limit?: number;
}

// Módulos disponíveis
export const modules = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { id: 'users', label: 'Usuários', icon: 'Users' },
  { id: 'roles', label: 'Roles', icon: 'Shield' },
  { id: 'companies', label: 'Empresas', icon: 'Building2' },
  { id: 'students', label: 'Alunos', icon: 'GraduationCap' },
  { id: 'teachers', label: 'Professores', icon: 'UserCheck' },
  { id: 'enrollments', label: 'Matrículas', icon: 'BookOpen' },
  { id: 'grades', label: 'Notas', icon: 'TrendingUp' },
  { id: 'attendance', label: 'Presenças', icon: 'CalendarCheck' },
  { id: 'reports', label: 'Relatórios', icon: 'FileText' },
  { id: 'settings', label: 'Configurações', icon: 'Settings' },
];

// Ações disponíveis
export const actions = [
  { value: 'create', label: 'Criar', color: '#10B981' },
  { value: 'read', label: 'Ler', color: '#2563EB' },
  { value: 'update', label: 'Atualizar', color: '#F59E0B' },
  { value: 'delete', label: 'Excluir', color: '#EF4444' },
];

// Cores para roles
export const roleColors = [
  '#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
];