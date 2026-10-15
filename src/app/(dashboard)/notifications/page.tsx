// src/app/(dashboard)/notifications/page.tsx

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, BellOff, CheckCheck, ExternalLink, Inbox, MailOpen, Trash2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button/Button';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog/ConfirmDialog';
import { Pagination } from '@/shared/components/ui/Pagination/Pagination';
import { useToast } from '@/shared/contexts/ToastContext';
import { getApiErrorMessage } from '@/shared/utils/api.utils';
import { notificationService } from '@/features/notifications/services/notification.service';
import { timeAgo, useNotifications } from '@/features/notifications/context/NotificationsContext';
import { NotificationIcon } from '@/features/notifications/components/NotificationIcon';
import type { AppNotification } from '@/features/notifications/types/notification.types';
import evaluation from '@/features/academic/assessments/styles/evaluation.module.css';
import styles from './page.module.css';

type Filter = 'all' | 'unread';

// Agrupa por "Hoje", "Ontem" e "Anteriores"
const groupLabel = (iso: string) => {
    const date = new Date(iso);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Hoje';
    if (date.toDateString() === yesterday.toDateString()) return 'Ontem';
    return 'Anteriores';
};

export default function NotificationsPage() {
    const router = useRouter();
    const { showSuccess, showError } = useToast();
    const shared = useNotifications();

    const [filter, setFilter] = useState<Filter>('all');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [items, setItems] = useState<AppNotification[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [unread, setUnread] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [toDelete, setToDelete] = useState<AppNotification | null>(null);

    const load = async () => {
        try {
            setIsLoading(true);
            const result = await notificationService.list({ page, limit, unreadOnly: filter === 'unread' });
            setItems(result.data);
            setTotal(result.total);
            setTotalPages(result.totalPages);
            setUnread(result.unread);
        } catch (error) {
            showError('Erro', getApiErrorMessage(error, 'Não foi possível carregar as notificações'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [filter, page, limit]);

    // Mantém o sino e o menu sincronizados com as ações desta página
    const syncShared = () => shared?.refresh();

    const markRead = async (item: AppNotification) => {
        try {
            await notificationService.markRead(item.uuid);
            await load();
            syncShared();
        } catch (error) {
            showError('Erro', getApiErrorMessage(error));
        }
    };

    const open = async (item: AppNotification) => {
        if (!item.isRead) {
            try {
                await notificationService.markRead(item.uuid);
                syncShared();
            } catch {
                // segue para a ligação
            }
        }
        if (item.link) router.push(item.link);
        else load();
    };

    const markAll = async () => {
        try {
            await notificationService.markAllRead();
            showSuccess('Notificações', 'Todas as notificações foram marcadas como lidas.');
            await load();
            syncShared();
        } catch (error) {
            showError('Erro', getApiErrorMessage(error));
        }
    };

    const confirmDelete = async () => {
        if (!toDelete) return;
        try {
            await notificationService.remove(toDelete.uuid);
            setToDelete(null);
            await load();
            syncShared();
        } catch (error) {
            showError('Erro', getApiErrorMessage(error));
        }
    };

    const groups = useMemo(() => {
        const map = new Map<string, AppNotification[]>();
        items.forEach(item => {
            const label = groupLabel(item.createdAt);
            map.set(label, [...(map.get(label) ?? []), item]);
        });
        return Array.from(map.entries());
    }, [items]);

    return (
        <div className={evaluation.page}>
            <div className={evaluation.header}>
                <div className={evaluation.headerLeft}>
                    <div className={evaluation.headerIcon}>
                        <Bell size={26} />
                    </div>
                    <div>
                        <h1 className={evaluation.title}>Notificações</h1>
                        <p className={evaluation.subtitle}>Avisos sobre notas, validações e turmas</p>
                    </div>
                </div>
                <div className={evaluation.headerStats}>
                    <div className={evaluation.headerStat}>
                        <span className={evaluation.headerStatValue}>{unread}</span>
                        <span className={evaluation.headerStatLabel}>Por ler</span>
                    </div>
                </div>
            </div>

            <div className={styles.toolbar}>
                <div className={evaluation.tabs} role="tablist" style={{ marginBottom: 0 }}>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={filter === 'all'}
                        className={`${evaluation.tab} ${filter === 'all' ? evaluation.active : ''}`}
                        onClick={() => { setFilter('all'); setPage(1); }}
                    >
                        <Inbox size={16} /> Todas
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={filter === 'unread'}
                        className={`${evaluation.tab} ${filter === 'unread' ? evaluation.active : ''}`}
                        onClick={() => { setFilter('unread'); setPage(1); }}
                    >
                        <Bell size={16} /> Por ler {unread > 0 && `(${unread})`}
                    </button>
                </div>
                {unread > 0 && (
                    <Button variant="secondary" icon={<CheckCheck size={16} />} onClick={markAll}>
                        Marcar todas como lidas
                    </Button>
                )}
            </div>

            {isLoading && (
                <div className={styles.list}>
                    {[0, 1, 2].map(i => <div key={i} className={styles.skeleton} />)}
                </div>
            )}

            {!isLoading && items.length === 0 && (
                <div className={styles.empty}>
                    <div className={styles.emptyIcon}><BellOff size={32} /></div>
                    <p className={styles.emptyTitle}>
                        {filter === 'unread' ? 'Está tudo lido!' : 'Ainda não tem notificações'}
                    </p>
                    <p>Aqui aparecem os avisos sobre submissões, validações e publicações de notas e novas turmas.</p>
                </div>
            )}

            {!isLoading && groups.map(([label, groupItems]) => (
                <section key={label} className={styles.group}>
                    <h2 className={styles.groupLabel}>{label}</h2>
                    <div className={styles.list}>
                        {groupItems.map(item => (
                            <article key={item.uuid} className={`${styles.item} ${!item.isRead ? styles.unread : ''}`}>
                                {!item.isRead && <span className={styles.unreadDot} aria-label="Não lida" />}
                                <NotificationIcon type={item.type} size={42} />
                                <div className={styles.body}>
                                    <div className={styles.titleRow}>
                                        <h3 className={styles.title}>{item.title}</h3>
                                        <span className={styles.time} title={new Date(item.createdAt).toLocaleString('pt-PT')}>
                                            {timeAgo(item.createdAt)}
                                        </span>
                                    </div>
                                    <p className={styles.message}>{item.message}</p>
                                    <div className={styles.actions}>
                                        {item.link && (
                                            <button type="button" className={styles.action} onClick={() => open(item)}>
                                                <ExternalLink size={12} /> Abrir
                                            </button>
                                        )}
                                        {!item.isRead && (
                                            <button type="button" className={styles.action} onClick={() => markRead(item)}>
                                                <MailOpen size={12} /> Marcar como lida
                                            </button>
                                        )}
                                        <button type="button" className={`${styles.action} ${styles.danger}`} onClick={() => setToDelete(item)}>
                                            <Trash2 size={12} /> Eliminar
                                        </button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            ))}

            {!isLoading && (
                <Pagination
                    page={page}
                    totalPages={totalPages}
                    total={total}
                    limit={limit}
                    onPageChange={setPage}
                    onLimitChange={value => { setLimit(value); setPage(1); }}
                    itemLabel="notificações"
                />
            )}

            <ConfirmDialog
                isOpen={toDelete !== null}
                onClose={() => setToDelete(null)}
                onConfirm={confirmDelete}
                title="Eliminar notificação"
                message={`Eliminar a notificação "${toDelete?.title ?? ''}"?`}
                type="danger"
                confirmText="Eliminar"
            />
        </div>
    );
}
