// src/features/student-portal/components/StudentShell/StudentShell.tsx
// Estrutura do portal do aluno, pensada primeiro para o telemóvel:
// barra superior + barra de separadores em baixo (como uma app).
// Em ecrãs largos a navegação passa para uma barra lateral própria do aluno.

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    Bell,
    BookOpen,
    CalendarCheck,
    ChevronLeft,
    GraduationCap,
    House,
    LogOut,
    Moon,
    Sun,
    UserRound, CalendarClock, CalendarDays, Wallet } from 'lucide-react';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog/ConfirmDialog';
import { NotificationsProvider, useNotifications } from '@/features/notifications/context/NotificationsContext';
import { useStudentProfile } from '../../hooks/useStudentPortal';
import { initials } from '../../utils/format';
import styles from './StudentShell.module.css';

interface NavItem {
    href: string;
    label: string;
    shortLabel: string;
    icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
    // fora da barra de baixo do telemóvel (continua na barra lateral)
    railOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
    { href: '/student', label: 'Início', shortLabel: 'Início', icon: House },
    { href: '/student/grades', label: 'Notas', shortLabel: 'Notas', icon: GraduationCap },
    { href: '/student/attendance', label: 'Presenças', shortLabel: 'Presenças', icon: CalendarCheck },
    { href: '/student/schedule', label: 'Horário', shortLabel: 'Horário', icon: CalendarClock },
    { href: '/student/finance', label: 'Pagamentos', shortLabel: 'Pagamentos', icon: Wallet },
    { href: '/student/subjects', label: 'Disciplinas', shortLabel: 'Disciplinas', icon: BookOpen, railOnly: true },
    { href: '/student/calendar', label: 'Agenda', shortLabel: 'Agenda', icon: CalendarDays, railOnly: true },
    { href: '/student/profile', label: 'Perfil', shortLabel: 'Perfil', icon: UserRound },
];

const PAGE_TITLES: Record<string, string> = {
    '/student/grades': 'As minhas notas',
    '/student/attendance': 'Presenças',
    '/student/schedule': 'O meu horário',
    '/student/finance': 'Pagamentos',
    '/student/calendar': 'Agenda',
    '/student/subjects': 'Disciplinas',
    '/student/profile': 'Perfil',
    '/student/notifications': 'Notificações',
};

function isActive(pathname: string, href: string): boolean {
    if (href === '/student') return pathname === '/student';
    return pathname === href || pathname.startsWith(`${href}/`);
}

function ShellFrame({ children }: { children: React.ReactNode }) {
    const pathname = usePathname() ?? '/student';
    const router = useRouter();
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const notifications = useNotifications();
    const { data: profile } = useStudentProfile();
    const [confirmLogout, setConfirmLogout] = useState(false);

    const unread = notifications?.unreadCount ?? 0;
    const fullName = profile?.student.fullName ?? user?.student?.fullName ?? `${user?.firstName ?? ''} ${user?.lastName ?? ''}`;
    const enrollment = profile?.enrollment;
    const isHome = pathname === '/student';
    const title = PAGE_TITLES[pathname] ?? 'Portal do Aluno';

    // Volta ao topo ao mudar de separador (comportamento de app)
    useEffect(() => {
        window.scrollTo({ top: 0 });
    }, [pathname]);

    return (
        <div className={styles.shell}>
            {/* Barra lateral (apenas em ecrãs largos) */}
            <aside className={styles.rail} aria-label="Navegação do aluno">
                <div className={styles.railBrand}>
                    <span className={styles.brandMark}>O</span>
                    <div>
                        <strong>Orbita</strong>
                        <span>Portal do Aluno</span>
                    </div>
                </div>

                <Link href="/student/profile" className={styles.railProfile}>
                    <span className={styles.avatarLarge}>{initials(fullName)}</span>
                    <span className={styles.railProfileText}>
                        <strong>{fullName.trim() || 'Aluno'}</strong>
                        <span>{user?.student?.studentNumber ?? user?.username}</span>
                    </span>
                    {enrollment && (
                        <span className={styles.railClass}>
                            {enrollment.gradeName} · Turma {enrollment.className}
                        </span>
                    )}
                </Link>

                <nav className={styles.railNav}>
                    {NAV_ITEMS.map(item => {
                        const active = isActive(pathname, item.href);
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`${styles.railLink} ${active ? styles.railLinkActive : ''}`}
                                aria-current={active ? 'page' : undefined}
                            >
                                <Icon size={20} strokeWidth={active ? 2.4 : 2} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                    <Link
                        href="/student/notifications"
                        className={`${styles.railLink} ${isActive(pathname, '/student/notifications') ? styles.railLinkActive : ''}`}
                    >
                        <Bell size={20} />
                        <span>Notificações</span>
                        {unread > 0 && <span className={styles.railBadge}>{unread > 99 ? '99+' : unread}</span>}
                    </Link>
                </nav>

                <div className={styles.railFooter}>
                    <button type="button" className={styles.railAction} onClick={toggleTheme}>
                        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                        <span>{theme === 'light' ? 'Modo escuro' : 'Modo claro'}</span>
                    </button>
                    <button type="button" className={styles.railAction} onClick={() => setConfirmLogout(true)}>
                        <LogOut size={18} />
                        <span>Sair</span>
                    </button>
                </div>
            </aside>

            <div className={styles.main}>
                {/* Barra superior */}
                <header className={`${styles.appBar} ${isHome ? styles.appBarHome : ''}`}>
                    {isHome ? (
                        <div className={styles.appBarBrand}>
                            <span className={styles.brandMark}>O</span>
                            <span>Portal do Aluno</span>
                        </div>
                    ) : (
                        <div className={styles.appBarTitle}>
                            <button
                                type="button"
                                className={styles.iconButton}
                                onClick={() => router.push('/student')}
                                aria-label="Voltar ao início"
                            >
                                <ChevronLeft size={22} />
                            </button>
                            <h1>{title}</h1>
                        </div>
                    )}

                    <div className={styles.appBarActions}>
                        <Link href="/student/notifications" className={styles.iconButton} aria-label={`Notificações${unread ? ` (${unread} por ler)` : ''}`}>
                            <Bell size={21} />
                            {unread > 0 && <span className={styles.dot}>{unread > 9 ? '9+' : unread}</span>}
                        </Link>
                        <Link href="/student/profile" className={styles.avatarSmall} aria-label="Perfil">
                            {initials(fullName)}
                        </Link>
                    </div>
                </header>

                <main className={styles.content}>{children}</main>
            </div>

            {/* Barra de separadores (telemóvel e tablet) */}
            <nav className={styles.tabBar} aria-label="Navegação principal">
                {NAV_ITEMS.filter(item => !item.railOnly).map(item => {
                    const active = isActive(pathname, item.href);
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.tab} ${active ? styles.tabActive : ''}`}
                            aria-current={active ? 'page' : undefined}
                        >
                            <span className={styles.tabIcon}>
                                <Icon size={22} strokeWidth={active ? 2.4 : 1.9} />
                            </span>
                            <span className={styles.tabLabel}>{item.shortLabel}</span>
                        </Link>
                    );
                })}
            </nav>

            <ConfirmDialog
                isOpen={confirmLogout}
                onClose={() => setConfirmLogout(false)}
                onConfirm={() => {
                    setConfirmLogout(false);
                    logout();
                }}
                title="Terminar sessão"
                message="Tem a certeza de que pretende sair do portal?"
                type="warning"
                confirmText="Sair"
            />
        </div>
    );
}

function SplashScreen() {
    return (
        <div className={styles.splash}>
            <span className={styles.splashMark}>O</span>
            <span className={styles.splashText}>Portal do Aluno</span>
        </div>
    );
}

export function StudentShell({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    // Só alunos usam este portal; os restantes vão para o painel da escola
    useEffect(() => {
        if (isLoading) return;
        if (!user) router.replace('/login');
        else if (user.mustChangePassword) router.replace('/change-password');
        else if (!user.student) router.replace('/dashboard');
    }, [user, isLoading, router]);

    if (isLoading || !user?.student || user.mustChangePassword) {
        return <SplashScreen />;
    }

    return (
        <NotificationsProvider>
            <ShellFrame>{children}</ShellFrame>
        </NotificationsProvider>
    );
}
