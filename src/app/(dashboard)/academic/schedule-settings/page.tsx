// src/app/(dashboard)/academic/schedule-settings/page.tsx

'use client';

import React, { useState } from 'react';
import { Clock, DoorOpen, Settings2 } from 'lucide-react';
import { usePermission } from '@/shared/hooks/usePermission';
import { TimeSlotsPanel } from '@/features/academic/schedules/components/TimeSlotsPanel';
import { RoomsPanel } from '@/features/academic/schedules/components/RoomsPanel';
import evaluation from '@/features/academic/assessments/styles/evaluation.module.css';

type Tab = 'slots' | 'rooms';

export default function ScheduleSettingsPage() {
    const { hasPermission } = usePermission();
    const canManage = hasPermission('schedules.manage');
    const [tab, setTab] = useState<Tab>('slots');

    return (
        <div className={evaluation.page}>
            <div className={evaluation.header}>
                <div className={evaluation.headerLeft}>
                    <div className={evaluation.headerIcon}>
                        <Settings2 size={24} />
                    </div>
                    <div>
                        <h1 className={evaluation.title}>Tempos e Salas</h1>
                        <p className={evaluation.subtitle}>Tempos letivos de cada turno e salas usadas nos horários</p>
                    </div>
                </div>
            </div>

            <div className={evaluation.tabs} role="tablist">
                <button
                    type="button"
                    role="tab"
                    aria-selected={tab === 'slots'}
                    className={`${evaluation.tab} ${tab === 'slots' ? evaluation.active : ''}`}
                    onClick={() => setTab('slots')}
                >
                    <Clock size={16} />
                    Tempos letivos
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={tab === 'rooms'}
                    className={`${evaluation.tab} ${tab === 'rooms' ? evaluation.active : ''}`}
                    onClick={() => setTab('rooms')}
                >
                    <DoorOpen size={16} />
                    Salas
                </button>
            </div>

            {tab === 'slots' ? <TimeSlotsPanel canManage={canManage} /> : <RoomsPanel canManage={canManage} />}
        </div>
    );
}
