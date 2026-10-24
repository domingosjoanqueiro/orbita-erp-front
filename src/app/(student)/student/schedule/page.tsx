'use client';

import React from 'react';
import { CalendarClock } from 'lucide-react';
import { useStudentSchedule } from '@/features/student-portal/hooks/useStudentPortal';
import { EmptyState, ErrorState, ListSkeleton } from '@/features/student-portal/components/PortalUI/PortalUI';
import { WeeklyTimetable } from '@/features/academic/schedules/components/WeeklyTimetable';
import styles from '@/features/student-portal/styles/portal.module.css';

export default function StudentSchedulePage() {
    const { data, isLoading, isError, error, refetch } = useStudentSchedule();

    return (
        <div className={styles.page}>
            {isLoading ? (
                <ListSkeleton rows={6} />
            ) : isError ? (
                <ErrorState error={error} onRetry={() => refetch()} />
            ) : !data ? (
                <div className={styles.card}>
                    <EmptyState icon={<CalendarClock size={26} />} title="Sem horário" text="Ainda não tem matrícula ativa numa turma." />
                </div>
            ) : data.entries.length === 0 ? (
                <div className={styles.card}>
                    <EmptyState
                        icon={<CalendarClock size={26} />}
                        title="Horário ainda não publicado"
                        text={`A escola ainda não marcou as aulas de ${data.class.gradeName} · Turma ${data.class.name}.`}
                    />
                </div>
            ) : (
                <>
                    <p className={styles.muted} style={{ padding: '0 4px' }}>
                        {data.class.gradeName} · Turma {data.class.name} · {data.class.shiftName} · {data.totals.lessons} aulas por semana
                    </p>
                    <WeeklyTimetable weekdays={data.weekdays} timeSlots={data.timeSlots} entries={data.entries} view="student" />
                </>
            )}
        </div>
    );
}
