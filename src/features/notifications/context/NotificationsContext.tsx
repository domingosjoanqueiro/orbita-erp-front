// src/features/notifications/context/NotificationsContext.tsx
// Estado partilhado das notificações (sino do Header, badge do Sidebar e página).

'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/shared/contexts/AuthContext';
import { notificationService } from '../services/notification.service';
import type { AppNotification } from '../types/notification.types';

// Intervalo de atualização automática (ms)
const POLL_INTERVAL = 60_000;
const LATEST_LIMIT = 6;

interface NotificationsContextValue {
    unreadCount: number;
    latest: AppNotification[];
    isLoading: boolean;
    refresh: () => Promise<void>;
    markRead: (uuid: string) => Promise<void>;
    markAllRead: () => Promise<void>;
    remove: (uuid: string) => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const [latest, setLatest] = useState<AppNotification[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const inFlight = useRef(false);

    const refresh = useCallback(async () => {
        if (inFlight.current) return;
        inFlight.current = true;
        try {
            setIsLoading(true);
            const result = await notificationService.list({ limit: LATEST_LIMIT });
            setLatest(result.data);
            setUnreadCount(result.unread);
        } catch {
            // Falha silenciosa: o sino mantém o último estado conhecido
        } finally {
            setIsLoading(false);
            inFlight.current = false;
        }
    }, []);

    useEffect(() => {
        if (!user) return;
        refresh();
        const timer = window.setInterval(refresh, POLL_INTERVAL);
        // Atualiza ao voltar ao separador do browser
        const onFocus = () => refresh();
        window.addEventListener('focus', onFocus);
        return () => {
            window.clearInterval(timer);
            window.removeEventListener('focus', onFocus);
        };
    }, [user?.id, refresh]);

    const markRead = useCallback(async (uuid: string) => {
        await notificationService.markRead(uuid);
        setLatest(prev => prev.map(n => (n.uuid === uuid ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)));
        setUnreadCount(prev => Math.max(0, prev - 1));
    }, []);

    const markAllRead = useCallback(async () => {
        await notificationService.markAllRead();
        setLatest(prev => prev.map(n => ({ ...n, isRead: true, readAt: n.readAt ?? new Date().toISOString() })));
        setUnreadCount(0);
    }, []);

    const remove = useCallback(async (uuid: string) => {
        await notificationService.remove(uuid);
        await refresh();
    }, [refresh]);

    return (
        <NotificationsContext.Provider value={{ unreadCount, latest, isLoading, refresh, markRead, markAllRead, remove }}>
            {children}
        </NotificationsContext.Provider>
    );
};

// Devolve null fora do painel da empresa (ex.: painel da plataforma)
export const useNotifications = () => useContext(NotificationsContext);

// "há 5 min", "há 2 h", "ontem"...
export const timeAgo = (iso: string) => {
    const diff = Math.max(0, Date.now() - new Date(iso).getTime());
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1) return 'agora mesmo';
    if (minutes < 60) return `há ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `há ${hours} h`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'ontem';
    if (days < 7) return `há ${days} dias`;
    return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
};
