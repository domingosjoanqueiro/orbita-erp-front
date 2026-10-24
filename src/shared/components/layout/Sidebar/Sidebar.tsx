'use client';

import React, { useState } from 'react';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog/ConfirmDialog';
import { useNotifications } from '@/features/notifications/context/NotificationsContext';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarClock,
  Settings2,
  Users,
  GraduationCap,
  School,
  BookOpen,
  UserCircle,
  Building2,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
  HelpCircle,
  Sparkles,
  Calendar,
  Bell,
  ClipboardList,
  BarChart3,
  FileText,
  CalendarCheck,
  Layers,
  Briefcase,
  UserCheck,
  BookMarked,
  FolderOpen,
  Archive,
  Key,
  Database,
  Server,
  ChevronDown,
  Crown,
  UserPlus,
  Wallet,
  DollarSign,
  CreditCard,
  Landmark,
  Coins,
  TrendingUp,
  Clock,
  CalendarDays,
  Award,
  PieChart,
  Target,
  Star,
  Activity,
  Rocket,
  Zap,
  Gem,
  Brain,
  Cpu,
  Package,
  Box,
  Grid,
  List,
  Table,
  Columns,
  PanelLeft,
  PanelRight,
  PanelTop,
  PanelBottom,
  Maximize,
  Minimize,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Move,
  Copy,
  Scissors,
  PenTool,
  Pencil,
  Eraser,
  Trash2,
  PlusCircle,
  MinusCircle,
  XCircle,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  LifeBuoy,
  House,
  FileBarChart,
} from 'lucide-react';
import { useAuth } from '@/shared/contexts/AuthContext';
import { usePlatformAuth } from '@/shared/contexts/PlatformAuthContext';
import { useToast } from '@/shared/contexts/ToastContext';
import styles from './Sidebar.module.css';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: string;
  permissions?: string[];
  roles?: string[];
  platformOnly?: boolean;
  companyOnly?: boolean;
  // Só para utilizadores associados a um professor (portal do professor)
  teacherOnly?: boolean;
  // Escondido no portal do professor (módulos sem backend ou de gestão da escola)
  hideForTeacher?: boolean;
}

interface MenuGroup {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: MenuItem[];
}

// Menu Principal
const mainMenuItems: MenuItem[] = [
  { icon: <LayoutDashboard size={18} />, label: 'Dashboard', href: '/dashboard', companyOnly: true },
  { icon: <School size={18} />, label: 'Minhas Turmas', href: '/academic/my-classes', companyOnly: true, teacherOnly: true },
  { icon: <CalendarClock size={18} />, label: 'O meu horário', href: '/academic/my-schedule', companyOnly: true, teacherOnly: true },
  { icon: <CalendarDays size={18} />, label: 'As minhas férias', href: '/hr/my-leaves', companyOnly: true, teacherOnly: true },
  { icon: <House size={18} />, label: 'Dashboard', href: '/super-admin', badge: 'Admin', platformOnly: true },
  { icon: <Calendar size={18} />, label: 'Calendário', href: '/calendar', companyOnly: true },
  { icon: <FileBarChart size={18} />, label: 'Relatórios', href: '/reports', companyOnly: true, hideForTeacher: true, permissions: ['students.read', 'attendance.read', 'gradebooks.read', 'finance.read', 'hr.read'] },
  { icon: <Bell size={18} />, label: 'Notificações', href: '/notifications', companyOnly: true },
];

// Acadêmico - Configuração
// Acadêmico - Configuração
const academicConfigItems: MenuItem[] = [
  { icon: <CalendarDays size={18} />, label: 'Anos Letivos', href: '/academic/academic-years', companyOnly: true, permissions: ['academic-years.read'], hideForTeacher: true },
  { icon: <Layers size={18} />, label: 'Níveis e Programas', href: '/academic/academic-structure', companyOnly: true, permissions: ['school-levels.read', 'programs.read'], hideForTeacher: true },
  { icon: <Settings size={18} />, label: 'Config. Académica', href: '/academic/program-settings', companyOnly: true, permissions: ['programAcademicSettings.read'], hideForTeacher: true },
  { icon: <GraduationCap size={18} />, label: 'Classes', href: '/academic/grades', companyOnly: true, permissions: ['grades.read'], hideForTeacher: true },
  { icon: <School size={18} />, label: 'Turmas', href: '/academic/classes', companyOnly: true, permissions: ['classes.read'], hideForTeacher: true },
  { icon: <BookMarked size={18} />, label: 'Disciplinas', href: '/academic/subjects', companyOnly: true, permissions: ['subjects.read'], hideForTeacher: true },
  { icon: <BookOpen size={18} />, label: 'Plano Currícular', href: '/academic/grade-subjects', companyOnly: true, permissions: ['gradeSubjects.read'], hideForTeacher: true },
  { icon: <BarChart3 size={18} />, label: 'Regras de Avaliação', href: '/academic/assessment-rules', companyOnly: true, permissions: ['assessmentRules.read'], hideForTeacher: true },
  { icon: <Settings2 size={18} />, label: 'Tempos e Salas', href: '/academic/schedule-settings', companyOnly: true, permissions: ['schedules.read'], hideForTeacher: true },

];

// Acadêmico - Gestão
const academicManagementItems: MenuItem[] = [
  { icon: <Users size={18} />, label: 'Alunos', href: '/academic/students', companyOnly: true, permissions: ['students.read'] },
  { icon: <UserCheck size={18} />, label: 'Professores', href: '/academic/teachers', companyOnly: true, permissions: ['teachers.read'], hideForTeacher: true },
  { icon: <ClipboardList size={18} />, label: 'Matrículas', href: '/academic/enrollments', companyOnly: true, permissions: ['enrollments.read'] },
  { icon: <Briefcase size={18} />, label: 'Atribuições', href: '/academic/teacher-assignments', companyOnly: true, permissions: ['teacherAssignments.read'] },
  { icon: <CalendarClock size={18} />, label: 'Horários', href: '/academic/schedules', companyOnly: true, permissions: ['schedules.read'], hideForTeacher: true },
];

// Acadêmico - Avaliação
const academicAssessmentItems: MenuItem[] = [
    { icon: <BarChart3 size={18} />, label: 'Notas de Alunos', href: '/academic/assessments', companyOnly: true, permissions: ['assessmentScores.read', 'assessmentSubmissions.validate', 'assessmentSubmissions.publish'] },
  { icon: <CalendarCheck size={18} />, label: 'Presenças', href: '/attendance', companyOnly: true, permissions: ['attendance.read'] },
  { icon: <FileText size={18} />, label: 'Pautas e Boletins', href: '/academic-reports', companyOnly: true, permissions: ['gradebooks.read', 'classRankings.read', 'reportCards.read'] },
  { icon: <Archive size={18} />, label: 'Histórico Escolar', href: '/transcripts', companyOnly: true, permissions: ['academicTranscripts.read'] },
];

// Financeiro
const financialItems: MenuItem[] = [
  { icon: <Wallet size={18} />, label: 'Painel financeiro', href: '/finance', companyOnly: true, hideForTeacher: true, permissions: ['finance.read'] },
  { icon: <Coins size={18} />, label: 'Caixa', href: '/finance/cashier', companyOnly: true, hideForTeacher: true, permissions: ['finance.read'] },
  { icon: <DollarSign size={18} />, label: 'Cobranças', href: '/finance/charges', companyOnly: true, hideForTeacher: true, permissions: ['finance.read'] },
  { icon: <FileText size={18} />, label: 'Recibos', href: '/finance/payments', companyOnly: true, hideForTeacher: true, permissions: ['finance.read'] },
  { icon: <TrendingUp size={18} />, label: 'Devedores', href: '/finance/debtors', companyOnly: true, hideForTeacher: true, permissions: ['finance.read'] },
  { icon: <Landmark size={18} />, label: 'Propinas', href: '/finance/fees', companyOnly: true, hideForTeacher: true, permissions: ['finance.read'] },
  { icon: <CreditCard size={18} />, label: 'Despesas', href: '/finance/expenses', companyOnly: true, hideForTeacher: true, permissions: ['finance.read'] },
];

// RH
const hrItems: MenuItem[] = [
  { icon: <BarChart3 size={18} />, label: 'Painel de RH', href: '/hr', companyOnly: true, hideForTeacher: true, permissions: ['hr.read'] },
  { icon: <UserPlus size={18} />, label: 'Funcionários', href: '/hr/employees', companyOnly: true, hideForTeacher: true, permissions: ['hr.read'] },
  { icon: <FileText size={18} />, label: 'Contratos', href: '/hr/contracts', companyOnly: true, hideForTeacher: true, permissions: ['hr.read'] },
  { icon: <CalendarDays size={18} />, label: 'Férias e ausências', href: '/hr/leaves', companyOnly: true, hideForTeacher: true, permissions: ['hr.read'] },
];

// Plataforma
const platformItems: MenuItem[] = [
  { icon: <Building2 size={18} />, label: 'Empresas', href: '/companies', platformOnly: true },
  { icon: <UserCircle size={18} />, label: 'Usuários', href: '/users-platform', platformOnly: true },
  // { icon: <Shield size={18} />, label: 'Roles', href: '/roles-platform', platformOnly: true },
  // { icon: <Key size={18} />, label: 'Permissões', href: '/system/permissions', platformOnly: true },
  // { icon: <Database size={18} />, label: 'Backup', href: '/backup', platformOnly: true },
  // { icon: <Server size={18} />, label: 'Sistema', href: '/system', platformOnly: true },
];

// Administração
const adminItems: MenuItem[] = [
  { icon: <UserCircle size={18} />, label: 'Usuários', href: '/users', companyOnly: true },
  { icon: <Shield size={18} />, label: 'Roles', href: '/roles', companyOnly: true },
  { icon: <Key size={18} />, label: 'Permissões', href: '/permissions', companyOnly: true },
  { icon: <Settings size={18} />, label: 'Configurações', href: '/settings' },
];

const settingsItems: MenuItem[] = [
  { icon: <Building2 size={18} />, label: 'Informações da Empresa', href: '/company/info', companyOnly: true, hideForTeacher: true },
  { icon: <UserCircle size={18} />, label: 'Usuários', href: '/users', companyOnly: true, permissions: ['users.read'] },
  { icon: <Shield size={18} />, label: 'Roles', href: '/roles', companyOnly: true, permissions: ['roles.read'] },
  // { icon: <Key size={18} />, label: 'Permissões', href: '/permissions', companyOnly: true },
];


export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggle,
  mobileOpen = false,
  onMobileClose
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user: companyUser, logout: companyLogout, isAuthenticated: isCompanyAuth } = useAuth();
  const { user: platformUser, logout: platformLogout, isAuthenticated: isPlatformAuth } = usePlatformAuth();
  const { showSuccess } = useToast();
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['academic-config', 'academic-management', 'academic-assessment', 'platform']);
  // Confirmação antes de terminar a sessão
  const [confirmLogout, setConfirmLogout] = useState(false);
  const notifications = useNotifications();

  const isPlatform = isPlatformAuth || !!platformUser;
  const isCompany = isCompanyAuth || !!companyUser;

  // console.log("SIDEBAR AUTH:", {
  //   isPlatformAuth,
  //   isCompanyAuth,
  //   platformUser,
  //   companyUser,
  //   isPlatform,
  //   isCompany,
  // });

  if (!isPlatform && !isCompany) return null;

  const userRoles = isPlatform ? ['SUPER_ADMIN'] : companyUser?.roles?.map(r => r.name) || [];
  const userPermissions = isPlatform
    ? platformUser?.roles?.flatMap(r => r.permissions?.map(p => p.code) || []) || []
    : companyUser?.roles?.flatMap(r => r.permissions?.map(p => p.code) || []) || [];

  const isTeacher = !isPlatform && !!companyUser?.teacher;

  const isItemVisible = (item: MenuItem): boolean => {
    if (item.platformOnly && !isPlatform) return false;
    if (item.companyOnly && isPlatform) return false;
    if (item.teacherOnly && !isTeacher) return false;
    if (item.hideForTeacher && isTeacher) return false;
    if (!isPlatform && item.roles && item.roles.length > 0) {
      if (!item.roles.some(role => userRoles.includes(role))) return false;
    }
    if (!isPlatform && item.permissions && item.permissions.length > 0) {
      if (!item.permissions.some(code => userPermissions.includes(code))) return false;
    }
    return true;
  };

  const handleLinkClick = () => { if (onMobileClose) onMobileClose(); };
  // os painéis de área só ficam ativos na própria página (não nas subpáginas)
  const isActive = (href: string) => pathname === href || (!['/finance', '/hr'].includes(href) && !!pathname?.startsWith(`${href}/`));
  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };

  const handleLogout = async () => {
    try {
      if (isPlatform) {
        await platformLogout();
        showSuccess('Até logo!', 'Você saiu da plataforma');
        router.push('/platform-login');
      } else {
        await companyLogout();
        showSuccess('Até logo!', 'Você saiu do sistema');
        router.push('/login');
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const renderMenuItem = (item: MenuItem) => {
    if (!isItemVisible(item)) return null;

    const active = isActive(item.href);
    return (
      <Link key={item.href} href={item.href} className={`${styles.navItem} ${active ? styles.active : ''}`} onClick={handleLinkClick}>
        <span className={styles.iconWrapper}>
          {item.icon}
          {active && <span className={styles.activeIndicator} />}
        </span>
        {!collapsed && (
          <>
            <span className={styles.label}>{item.label}</span>
            {item.href === '/notifications'
              ? (notifications?.unreadCount ?? 0) > 0 && (
                <span className={styles.badge}>{notifications!.unreadCount > 99 ? '99+' : notifications!.unreadCount}</span>
              )
              : item.badge && <span className={styles.badge}>{item.badge}</span>}
          </>
        )}
      </Link>
    );
  };

  const renderGroup = (group: MenuGroup) => {
    const visibleItems = group.items.filter(isItemVisible);

    if (visibleItems.length === 0) return null;
    const isExpanded = expandedGroups.includes(group.id);

    return (
      <div className={styles.group}>
        {!collapsed ? (
          <>
            <button className={styles.groupHeader} onClick={() => toggleGroup(group.id)}>
              <div className={styles.groupHeaderLeft}>
                <span className={styles.groupIcon}>{group.icon}</span>
                <span className={styles.groupLabel}>{group.label}</span>
                <span className={styles.groupCount}>{visibleItems.length}</span>
              </div>
              <ChevronDown size={16} className={`${styles.groupChevron} ${isExpanded ? styles.expanded : ''}`} />
            </button>
            <div className={`${styles.groupItems} ${isExpanded ? styles.expanded : ''}`}>
              {visibleItems.map(renderMenuItem)}
            </div>
          </>
        ) : (
          <div className={styles.groupCollapsed}>{visibleItems.map(renderMenuItem)}</div>
        )}
      </div>
    );
  };

  const sidebarClasses = [styles.sidebar, collapsed && styles.collapsed, mobileOpen && styles.mobileOpen].filter(Boolean).join(' ');

  const userDisplayName = isPlatform
    ? `${platformUser?.firstName || 'Admin'} ${platformUser?.lastName || ''}`
    : `${companyUser?.firstName || 'Usuário'} ${companyUser?.lastName || ''}`;

  const userInitials = isPlatform
    ? `${platformUser?.firstName?.charAt(0) || 'A'}${platformUser?.lastName?.charAt(0) || ''}`
    : `${companyUser?.firstName?.charAt(0) || 'U'}${companyUser?.lastName?.charAt(0) || ''}`;

  const userRole = isPlatform ? (platformUser?.isRoot ? 'Root' : 'Super Admin') : (userRoles[0] || 'Usuário');
  const isRoot = isPlatform && platformUser?.isRoot;

  return (
    <>
      {mobileOpen && <div className={styles.overlay} onClick={onMobileClose} />}
      <aside className={sidebarClasses}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>O</div>
            {!collapsed && (
              <div className={styles.logoText}>
                <span className={styles.logoName}>Orbita</span>
                <span className={styles.logoHighlight}>{isPlatform ? 'Platform' : 'ERP'}</span>
              </div>
            )}
          </div>
          <button className={styles.toggleButton} onClick={onToggle}>
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>



        <nav className={styles.nav}>
          {!collapsed && <div className={styles.sectionLabel}>Principal</div>}
          <div className={styles.mainItems}>{mainMenuItems.map(renderMenuItem)}</div>

          {isPlatform && (
            <>
              {!collapsed && <div className={styles.sectionLabel}>Gestão</div>}
              {renderGroup({ id: 'platform', label: 'Gestao', icon: <Crown size={16} />, items: platformItems })}
            </>
          )}

          {!isPlatform && (
            <>
              {!collapsed && <div className={styles.sectionLabel}>Acadêmico</div>}
              {renderGroup({ id: 'academic-config', label: 'Configuração', icon: <Settings size={16} />, items: academicConfigItems })}
              {renderGroup({ id: 'academic-management', label: 'Gestão', icon: <Users size={16} />, items: academicManagementItems })}
              {renderGroup({ id: 'academic-assessment', label: 'Avaliação', icon: <BarChart3 size={16} />, items: academicAssessmentItems })}

              {!isTeacher && (
                <>
                  {financialItems.some(isItemVisible) && (
                    <>
                      {!collapsed && <div className={styles.sectionLabel}>Financeiro</div>}
                      {renderGroup({ id: 'financial', label: 'Financeiro', icon: <Wallet size={16} />, items: financialItems })}
                    </>
                  )}

                  {hrItems.some(isItemVisible) && (
                    <>
                      {!collapsed && <div className={styles.sectionLabel}>Recursos Humanos</div>}
                      {renderGroup({ id: 'hr', label: 'RH', icon: <UserPlus size={16} />, items: hrItems })}
                    </>
                  )}
                </>
              )}
            </>
          )}

          {!isPlatform && settingsItems.some(isItemVisible) && (
            <>
              {!collapsed && <div className={styles.sectionLabel}>Configurações</div>}
              {renderGroup({
                id: 'settings',
                label: 'Configurações',
                icon: <Settings size={16} />,
                items: settingsItems,
              })}
            </>
          )}

          {/* {!collapsed && <div className={styles.sectionLabel}>Administração</div>}
          {!isPlatform && renderGroup({ id: 'admin', label: 'Administração', icon: <Shield size={16} />, items: adminItems })} */}
        </nav>

        <div className={styles.footer}>
          {/* {!collapsed && (
            <div className={styles.footerActions}>
              <button className={styles.footerAction}><HelpCircle size={16} /><span>Ajuda</span></button>
              <button className={styles.footerAction}><Settings size={16} /><span>Config.</span></button>
            </div>
          )} */}
          <div className={styles.userInfo}>
            {/* <div className={styles.avatarWrapper}>
              <div className={styles.avatar}>{userInitials || 'U'}</div>
              {!collapsed && <span className={styles.statusDot} />}
            </div> */}
            {/* {!collapsed && (
              <div className={styles.userDetails}>
                <span className={styles.userName}>{userDisplayName || 'Usuário'}</span>
                <span className={styles.userRole}>{userRole}{isRoot && ' 👑'}</span>
              </div>
            )} */}
            {!collapsed && <button className={styles.logoutBtn} onClick={() => setConfirmLogout(true)}><LogOut size={16} />

              <span className={styles.logoutText}> Sair</span>

            </button>}
          </div>
        </div>
      </aside>
      <ConfirmDialog
        isOpen={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={() => {
          setConfirmLogout(false);
          handleLogout();
        }}
        title="Terminar sessão"
        message="Tem a certeza de que pretende sair do sistema?"
        type="warning"
        confirmText="Sair"
        cancelText="Cancelar"
      />
    </>
  );
};