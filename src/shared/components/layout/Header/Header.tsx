'use client';

import React, { useState, useEffect } from 'react';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog/ConfirmDialog';
import { timeAgo, useNotifications } from '@/features/notifications/context/NotificationsContext';
import { NotificationIcon } from '@/features/notifications/components/NotificationIcon';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  Sun,
  Moon,
  LogOut,
  Settings,
  User,
  ChevronDown,
  Menu,
  X,
  HelpCircle,
  Sparkles,
  Crown,
  Shield,
  Building2,
  Users,
  UserCog,
  LayoutDashboard,
} from 'lucide-react';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useAuth } from '@/shared/contexts/AuthContext';
import { usePlatformAuth } from '@/shared/contexts/PlatformAuthContext';
import { useToast } from '@/shared/contexts/ToastContext';
import styles from './Header.module.css';

interface HeaderProps {
  user?: any;
  onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user: propUser, onMenuClick }) => {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { logout: companyLogout, isAuthenticated: isCompanyAuth } = useAuth();
  const { logout: platformLogout, isAuthenticated: isPlatformAuth, user: platformUser } = usePlatformAuth();
  const { showSuccess } = useToast();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // Confirmação antes de terminar a sessão
  const [confirmLogout, setConfirmLogout] = useState(false);

  // Detectar scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard shortcut para search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Determinar qual usuário está logado
  const isPlatform = isPlatformAuth;
  const isCompany = isCompanyAuth;
  const currentUser = isPlatform ? platformUser : propUser;

  // Se não estiver autenticado em nenhum dos dois, não renderizar nada
  if (!isPlatform && !isCompany) {
    return null;
  }

  // Nome do usuário
  const userDisplayName = isPlatform
    ? `${platformUser?.firstName || 'Admin'} ${platformUser?.lastName || ''}`
    : `${propUser?.firstName || 'Usuário'} ${propUser?.lastName || ''}`;

  const userInitials = isPlatform
    ? `${platformUser?.firstName?.charAt(0) || 'A'}${platformUser?.lastName?.charAt(0) || ''}`
    : `${propUser?.firstName?.charAt(0) || 'U'}${propUser?.lastName?.charAt(0) || ''}`;

  const userRole = isPlatform
    ? platformUser?.isRoot ? 'Root' : 'Super Admin'
    : propUser?.roles?.[0]?.name || 'Usuário';

  const isRoot = isPlatform && platformUser?.isRoot;

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

  // Notificações reais (só no painel da empresa; null no painel da plataforma)
  const notifications = useNotifications();
  const unreadCount = notifications?.unreadCount ?? 0;

  const openNotification = async (uuid: string, link: string | null, isRead: boolean) => {
    setIsNotificationsOpen(false);
    if (!isRead) {
      try {
        await notifications?.markRead(uuid);
      } catch {
        // continua para a ligação mesmo que não consiga marcar como lida
      }
    }
    if (link) router.push(link);
  };

  // Menu items para dropdown
  const getMenuItems = () => {
    if (isPlatform) {
      return [
        { icon: <LayoutDashboard size={16} />, label: 'Dashboard', href: '/super-admin' },
        { icon: <Building2 size={16} />, label: 'Empresas', href: '/companies' },
        { icon: <Users size={16} />, label: 'Usuários da Plataforma', href: '/system/users' },
        { icon: <UserCog size={16} />, label: 'Perfil', href: '/profile' },
        { icon: <Settings size={16} />, label: 'Configurações', href: '/settings' },
      ];
    }
    return [
      { icon: <LayoutDashboard size={16} />, label: 'Dashboard', href: '/dashboard' },
      { icon: <User size={16} />, label: 'Perfil', href: '/profile' },
      { icon: <Settings size={16} />, label: 'Configurações', href: '/settings' },
    ];
  };

  const menuItems = getMenuItems();

  return (
    <>
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      {/* Left Section */}
      <div className={styles.left}>
        {/* Menu button for mobile */}
        <button className={styles.menuButton} onClick={onMenuClick}>
          <Menu size={20} />
        </button>

        {/* Search Button */}
        <button
          className={styles.searchButton}
          onClick={() => setIsSearchOpen(true)}
        >
          <Search size={18} />
          <span className={styles.searchText}>Pesquisar...</span>
          <kbd className={styles.searchShortcut}>⌘K</kbd>
        </button>

        {/* Platform Badge */}
        {isPlatform && (
          <div className={styles.platformBadge}>
            <Crown size={14} />
            <span>{isRoot ? 'Root' : 'Super Admin'}</span>
          </div>
        )}
      </div>

      {/* Center Section - Breadcrumb */}
      <div className={styles.center}>
        <div className={styles.breadcrumb}>
          <span className={styles.breadcrumbItem}>
            {isPlatform ? 'Plataforma' : 'Dashboard'}
          </span>
        </div>
      </div>

      {/* Right Section */}
      <div className={styles.right}>
        {/* Theme Toggle */}
        <button
          className={styles.iconButton}
          onClick={toggleTheme}
          aria-label="Alternar tema"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Help */}
        <button className={styles.iconButton} aria-label="Ajuda">
          <HelpCircle size={18} />
        </button>

        {/* Notifications */}
        {notifications && (
        <div className={styles.notificationWrapper}>
          <button
            className={styles.iconButton}
            aria-label="Notificações"
            onClick={() => {
              if (!isNotificationsOpen) notifications.refresh();
              setIsNotificationsOpen(!isNotificationsOpen);
            }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className={styles.notificationBadge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className={styles.notificationDropdown}>
              <div className={styles.notificationHeader}>
                <span className={styles.notificationTitle}>Notificações</span>
                {unreadCount > 0 && (
                  <button className={styles.notificationMarkAll} onClick={() => notifications.markAllRead()}>
                    Marcar todas como lidas
                  </button>
                )}
              </div>
              <div className={styles.notificationList}>
                {notifications.latest.length === 0 && (
                  <div className={styles.notificationItem}>
                    <div className={styles.notificationContent}>
                      <span className={styles.notificationText}>Não tem notificações.</span>
                    </div>
                  </div>
                )}
                {notifications.latest.map((notif) => (
                  <button
                    key={notif.uuid}
                    type="button"
                    className={`${styles.notificationItem} ${!notif.isRead ? styles.unread : ''}`}
                    style={{ width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'flex-start' }}
                    onClick={() => openNotification(notif.uuid, notif.link, notif.isRead)}
                  >
                    <NotificationIcon type={notif.type} size={32} />
                    <div className={styles.notificationContent}>
                      <span className={styles.notificationText}><strong>{notif.title}</strong></span>
                      <span className={styles.notificationText} style={{ fontSize: '0.78rem', opacity: 0.85 }}>{notif.message}</span>
                      <span className={styles.notificationTime}>{timeAgo(notif.createdAt)}</span>
                    </div>
                  </button>
                ))}
              </div>
              <div className={styles.notificationFooter}>
                <button
                  className={styles.notificationViewAll}
                  onClick={() => {
                    setIsNotificationsOpen(false);
                    router.push('/notifications');
                  }}
                >
                  Ver todas as notificações
                </button>
              </div>
            </div>
          )}
        </div>
        )}

        {/* User Menu */}
        <div className={styles.userMenu}>
          <button
            className={styles.userButton}
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          >
            <div className={styles.avatarWrapper}>
              <div className={styles.avatar}>
                {userInitials || 'U'}
              </div>
              <span className={styles.statusDot} />
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>
                {userDisplayName || 'Usuário'}
              </span>
              <span className={styles.userRole}>
                {userRole}
                {isRoot && ' 👑'}
              </span>
            </div>
            <ChevronDown
              size={16}
              className={`${styles.chevron} ${isUserMenuOpen ? styles.rotated : ''}`}
            />
          </button>

          {isUserMenuOpen && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>
                <div className={styles.dropdownAvatar}>
                  {userInitials || 'U'}
                </div>
                <div className={styles.dropdownUserInfo}>
                  <span className={styles.dropdownUserName}>
                    {userDisplayName || 'Usuário'}
                  </span>
                  <span className={styles.dropdownUserEmail}>
                    {currentUser?.email || ''}
                  </span>
                </div>
              </div>
              <hr className={styles.dropdownDivider} />

              {menuItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className={styles.dropdownItem}
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}

              <hr className={styles.dropdownDivider} />
              <button
                className={`${styles.dropdownItem} ${styles.danger}`}
                onClick={() => {
                  setIsUserMenuOpen(false);
                  setConfirmLogout(true);
                }}
              >
                <LogOut size={16} />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search Modal */}
      {isSearchOpen && (
        <div className={styles.searchOverlay} onClick={() => setIsSearchOpen(false)}>
          <div className={styles.searchModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.searchInputWrapper}>
              <Search size={20} className={styles.searchIcon} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Pesquisar em todo o sistema..."
                autoFocus
              />
              <button
                className={styles.searchClose}
                onClick={() => setIsSearchOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className={styles.searchResults}>
              <div className={styles.searchSection}>
                <span className={styles.searchSectionTitle}>Ações Rápidas</span>
                <div className={styles.searchResultItem}>
                  <Sparkles size={16} />
                  <span>Ir para Dashboard</span>
                </div>
                {isPlatform && (
                  <div className={styles.searchResultItem}>
                    <Building2 size={16} />
                    <span>Nova Empresa</span>
                  </div>
                )}
                <div className={styles.searchResultItem}>
                  <User size={16} />
                  <span>Novo Usuário</span>
                </div>
              </div>
              <div className={styles.searchSection}>
                <span className={styles.searchSectionTitle}>Módulos</span>
                {isPlatform ? (
                  <>
                    <div className={styles.searchResultItem}>
                      <Building2 size={16} />
                      <span>Empresas</span>
                    </div>
                    <div className={styles.searchResultItem}>
                      <Users size={16} />
                      <span>Usuários da Plataforma</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={styles.searchResultItem}>
                      <Users size={16} />
                      <span>Alunos</span>
                    </div>
                    <div className={styles.searchResultItem}>
                      <User size={16} />
                      <span>Professores</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
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