// src/app/(dashboard)/calendar/page.tsx

'use client';

import React from 'react';
import { CalendarDays } from 'lucide-react';
import { useAuth } from '@/shared/contexts/AuthContext';
import { usePermission } from '@/shared/hooks/usePermission';
import { CalendarView } from '@/features/calendar/CalendarView';
import evaluation from '@/features/academic/assessments/styles/evaluation.module.css';

// Calendário da escola (gestão) ou agenda do professor
export default function CalendarPage() {
    const { user } = useAuth();
    const { hasPermission } = usePermission();
    const canRead = hasPermission('calendar.read');
    const canManage = hasPermission('calendar.manage');
    const source = canRead ? 'school' : user?.teacher ? 'teacher' : null;

    return (
        <div className={evaluation.page}>
            <div className={evaluation.header}>
                <div className={evaluation.headerLeft}>
                    <div className={evaluation.headerIcon}>
                        <CalendarDays size={24} />
                    </div>
                    <div>
                        <h1 className={evaluation.title}>{source === 'teacher' ? 'Agenda' : 'Calendário escolar'}</h1>
                        <p className={evaluation.subtitle}>Feriados, provas, reuniões e datas importantes do ano letivo</p>
                    </div>
                </div>
            </div>
            <div className={evaluation.panel}>
                {source ? (
                    <CalendarView source={source} canManage={source === 'school' && canManage} />
                ) : (
                    <p>Não tem permissão para consultar o calendário.</p>
                )}
            </div>
        </div>
    );
}
