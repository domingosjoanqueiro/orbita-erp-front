'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { PlatformAuthProvider } from '@/shared/contexts/PlatformAuthContext';
import { ThemeProvider } from '@/shared/contexts/ThemeContext';
import { ToastProvider } from '@/shared/contexts/ToastContext';
import { LoadingProvider } from '@/shared/contexts/LoadingContext';
import { GlobalLoading } from '@/shared/components/ui/GlobalLoading/GlobalLoading';
import { Sidebar } from '@/shared/components/layout/Sidebar/Sidebar';
import { Header } from '@/shared/components/layout/Header/Header';
import { usePlatformAuth } from '@/shared/contexts/PlatformAuthContext';
import styles from './layout.module.css';

function PlatformLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated } = usePlatformAuth();

  // Verificar se está na página de login
  const isLoginPage = pathname === '/platform-login';

  // Se estiver na página de login, não mostrar Sidebar e Header
  if (isLoginPage) {
    return <main className={styles.loginContainer}>{children}</main>;
  }

  // Se não estiver autenticado, redirecionar para login
  if (!isAuthenticated && !isLoginPage) {
    return <main className={styles.loginContainer}>{children}</main>;
  }

  const handleMenuClick = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMobileClose = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className={styles.layout}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileMenuOpen}
        onMobileClose={handleMobileClose}
      />
      <div className={`${styles.main} ${sidebarCollapsed ? styles.collapsed : ''}`}>
        <Header user={user} onMenuClick={handleMenuClick} />
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <LoadingProvider>
        <ToastProvider>
          <PlatformAuthProvider>
            <PlatformLayoutContent>{children}</PlatformLayoutContent>
            <GlobalLoading />
          </PlatformAuthProvider>
        </ToastProvider>
      </LoadingProvider>
    </ThemeProvider>
  );
}