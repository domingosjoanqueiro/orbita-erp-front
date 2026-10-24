// src/features/notifications/types/notification.types.ts
// Espelha o módulo notifications do backend.

export type NotificationType =
    | 'ASSESSMENT_SUBMITTED'
    | 'ASSESSMENT_VALIDATED'
    | 'ASSESSMENT_RETURNED'
    | 'ASSESSMENT_PUBLISHED'
    | 'TEACHER_ASSIGNED'
    | 'GRADES_AVAILABLE'
    | 'PAYMENT_RECEIVED'
    | 'LEAVE_REQUESTED'
    | 'LEAVE_DECIDED';

export interface AppNotification {
    uuid: string;
    type: NotificationType | string;
    title: string;
    message: string;
    link: string | null;
    isRead: boolean;
    readAt: string | null;
    createdAt: string;
}

export interface NotificationList {
    data: AppNotification[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    unread: number;
}
