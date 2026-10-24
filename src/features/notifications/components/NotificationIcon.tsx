// src/features/notifications/components/NotificationIcon.tsx

'use client';

import React from 'react';
import { Bell, CheckCircle2, ClipboardCheck, GraduationCap, School, Send, Undo2, Wallet, CalendarOff, CalendarCheck } from 'lucide-react';

// Ícone e cor por tipo de notificação
const VARIANTS: Record<string, { icon: React.ReactNode; background: string }> = {
    ASSESSMENT_SUBMITTED: { icon: <Send size={16} />, background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' },
    ASSESSMENT_VALIDATED: { icon: <ClipboardCheck size={16} />, background: 'linear-gradient(135deg, #60A5FA, #2563EB)' },
    ASSESSMENT_RETURNED: { icon: <Undo2 size={16} />, background: 'linear-gradient(135deg, #FBBF24, #D97706)' },
    ASSESSMENT_PUBLISHED: { icon: <CheckCircle2 size={16} />, background: 'linear-gradient(135deg, #10B981, #047857)' },
    TEACHER_ASSIGNED: { icon: <School size={16} />, background: 'linear-gradient(135deg, #EC4899, #BE185D)' },
    GRADES_AVAILABLE: { icon: <GraduationCap size={16} />, background: 'linear-gradient(135deg, #6366F1, #4338CA)' },
    LEAVE_REQUESTED: { icon: <CalendarOff size={16} />, background: 'linear-gradient(135deg, #F59E0B, #B45309)' },
    LEAVE_DECIDED: { icon: <CalendarCheck size={16} />, background: 'linear-gradient(135deg, #22C55E, #15803D)' },
    PAYMENT_RECEIVED: { icon: <Wallet size={16} />, background: 'linear-gradient(135deg, #14B8A6, #0F766E)' },
};

export const NotificationIcon: React.FC<{ type: string; size?: number }> = ({ type, size = 36 }) => {
    const variant = VARIANTS[type] ?? { icon: <Bell size={16} />, background: 'linear-gradient(135deg, #9CA3AF, #6B7280)' };
    return (
        <span
            aria-hidden
            style={{
                width: size,
                height: size,
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: '#FFFFFF',
                background: variant.background,
            }}
        >
            {variant.icon}
        </span>
    );
};
