// src/features/notifications/services/notification.service.ts

import { ApiService } from '@/shared/services/api/api.service';
import { extractApiData } from '@/shared/utils/api.utils';
import type { AppNotification, NotificationList } from '../types/notification.types';

interface ListResponse {
    data: AppNotification[];
    meta: { page: number; limit: number; total: number; totalPages: number; unread: number };
}

class NotificationService extends ApiService {
    private basePath = '/notifications';

    constructor() {
        super('company');
    }

    async list(params: { page?: number; limit?: number; unreadOnly?: boolean } = {}): Promise<NotificationList> {
        const response = await this.get<ListResponse>(this.basePath, {
            params: {
                page: params.page ?? 1,
                limit: params.limit ?? 10,
                unread: params.unreadOnly ? true : undefined,
            },
        });
        return {
            data: response.data ?? [],
            total: response.meta?.total ?? 0,
            page: response.meta?.page ?? 1,
            limit: response.meta?.limit ?? 10,
            totalPages: response.meta?.totalPages ?? 1,
            unread: response.meta?.unread ?? 0,
        };
    }

    async unreadCount(): Promise<number> {
        const response = await this.get<unknown>(`${this.basePath}/unread-count`);
        return extractApiData<{ unread: number }>(response).unread ?? 0;
    }

    async markRead(uuid: string): Promise<AppNotification> {
        const response = await this.patch<unknown>(`${this.basePath}/${uuid}/read`);
        return extractApiData<AppNotification>(response);
    }

    async markAllRead(): Promise<void> {
        await this.patch<unknown>(`${this.basePath}/read-all`);
    }

    async remove(uuid: string): Promise<void> {
        await this.delete<void>(`${this.basePath}/${uuid}`);
    }
}

export const notificationService = new NotificationService();
