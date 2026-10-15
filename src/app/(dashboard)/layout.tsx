'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/shared/contexts/AuthContext';
import { Sidebar } from '@/shared/components/layout/Sidebar/Sidebar';
import { Header } from '@/shared/components/layout/Header/Header';
import { NotificationsProvider } from '@/features/notifications/context/NotificationsContext';
import styles from './layout.module.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  // Fechar menu mobile quando a tela for redimensionada para desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileMenuOpen]);

  const handleMenuClick = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMobileClose = () => {
    setMobileMenuOpen(false);
  };

  // Verificar se está em mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 1024;

  return (
    <NotificationsProvider>
    <div className={styles.layout}>
      <Sidebar
        collapsed={isMobile ? false : sidebarCollapsed}
        onToggle={() => {
          if (!isMobile) {
            setSidebarCollapsed(!sidebarCollapsed);
          }
        }}
        mobileOpen={mobileMenuOpen}
        onMobileClose={handleMobileClose}
      />
      <div className={`${styles.main} ${!isMobile && sidebarCollapsed ? styles.collapsed : ''}`}>
        <Header user={user} onMenuClick={handleMenuClick} />
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
    </NotificationsProvider>
  );
}