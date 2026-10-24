'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { notificationService } from '@/features/notifications/services/notification.service';
import { timeAgo, useNotifications } from '@/features/notifications/context/NotificationsContext';
import { NotificationIcon } from '@/features/notifications/components/NotificationIcon';
import type { AppNotification } from '@/features/notifications/types/notification.types';
import {
  EmptyState,
  ErrorState,
  ListSkeleton,
} from '@/features/student-portal/components/PortalUI/PortalUI';
import styles from '@/features/student-portal/styles/portal.module.css';
import local from './page.module.css';

const PAGE_SIZE = 15;

export default function StudentNotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const notifications = useNotifications();
  const [unreadOnly, setUnreadOnly] = useState(false);

  const queryKey = ['student-portal', 'notifications', unreadOnly];
  const feed = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => notificationService.list({ page: pageParam, limit: PAGE_SIZE, unreadOnly }),
    initialPageParam: 1,
    getNextPageParam: last => (last.page < last.totalPages ? last.page + 1 : undefined),
  });

  const items = useMemo(() => feed.data?.pages.flatMap(page => page.data) ?? [], [feed.data]);
  const unread = notifications?.unreadCount ?? 0;

  const refreshAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['student-portal', 'notifications'] }),
      notifications?.refresh(),
    ]);
  };

  const open = async (item: AppNotification) => {
    if (!item.isRead) {
      try {
        await notifications?.markRead(item.uuid);
      } catch {
        // Abre mesmo que não consiga marcar como lida
      }
      refreshAll();
    }
    // Só segue ligações do próprio portal
    if (item.link?.startsWith('/student')) router.push(item.link);
  };

  const markAll = async () => {
    await notifications?.markAllRead();
    refreshAll();
  };

  return (
    <div className={styles.page}>
      <div className={local.toolbar}>
        <div className={styles.chips} style={{ margin: 0, padding: 0 }}>
          <button
            type="button"
            className={`${styles.chip} ${!unreadOnly ? styles.chipActive : ''}`}
            onClick={() => setUnreadOnly(false)}
          >
            Todas
          </button>
          <button
            type="button"
            className={`${styles.chip} ${unreadOnly ? styles.chipActive : ''}`}
            onClick={() => setUnreadOnly(true)}
          >
            Por ler{unread > 0 ? ` (${unread})` : ''}
          </button>
        </div>
        {unread > 0 && (
          <button type="button" className={local.markAll} onClick={markAll}>
            <CheckCheck size={16} /> Marcar todas
          </button>
        )}
      </div>

      {feed.isLoading ? (
        <ListSkeleton rows={5} />
      ) : feed.isError ? (
        <ErrorState error={feed.error} onRetry={() => feed.refetch()} />
      ) : items.length === 0 ? (
        <div className={styles.card}>
          <EmptyState
            icon={<Bell size={26} />}
            title={unreadOnly ? 'Está tudo lido' : 'Sem notificações'}
            text="Avisamos aqui quando houver novas notas publicadas."
          />
        </div>
      ) : (
        <>
          <div className={`${styles.card} ${styles.list}`}>
            {items.map(item => (
              <button
                key={item.uuid}
                type="button"
                className={`${styles.listItem} ${local.item} ${item.isRead ? '' : local.unread}`}
                onClick={() => open(item)}
              >
                <NotificationIcon type={item.type} size={40} />
                <span className={styles.listBody}>
                  <span className={local.title}>{item.title}</span>
                  <span className={local.message}>{item.message}</span>
                  <span className={local.time}>{timeAgo(item.createdAt)}</span>
                </span>
                {!item.isRead && <span className={local.dot} aria-label="Por ler" />}
              </button>
            ))}
          </div>

          {feed.hasNextPage && (
            <button
              type="button"
              className={`${styles.button} ${styles.buttonGhost} ${styles.buttonBlock}`}
              onClick={() => feed.fetchNextPage()}
              disabled={feed.isFetchingNextPage}
            >
              {feed.isFetchingNextPage && <Loader2 size={16} className={local.spin} />}
              {feed.isFetchingNextPage ? 'A carregar…' : 'Carregar mais'}
            </button>
          )}
        </>
      )}
    </div>
  );
}
