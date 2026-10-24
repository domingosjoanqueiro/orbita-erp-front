// src/app/(dashboard)/academic/my-schedule/page.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { CalendarClock, Printer } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button/Button';
import { getApiErrorMessage } from '@/shared/utils/api.utils';
import { scheduleService } from '@/features/academic/schedules/services/schedule.service';
import { WeeklyTimetable } from '@/features/academic/schedules/components/WeeklyTimetable';
import type { TeacherSchedule } from '@/features/academic/schedules/types/schedule.types';
import evaluation from '@/features/academic/assessments/styles/evaluation.module.css';
import styles from '@/features/academic/schedules/components/Schedules.module.css';

// Horário semanal do professor autenticado (ano letivo corrente)
export default function MySchedulePage() {
    const [schedule, setSchedule] = useState<TeacherSchedule | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        scheduleService
            .mySchedule()
            .then(setSchedule)
            .catch(err => setError(getApiErrorMessage(err, 'Não foi possível carregar o seu horário.')));
    }, []);

    return (
        <div className={evaluation.page}>
            <div className={`${evaluation.header} ${styles.noPrint}`}>
                <div className={evaluation.headerLeft}>
                    <div className={evaluation.headerIcon}>
                        <CalendarClock size={24} />
                    </div>
                    <div>
                        <h1 className={evaluation.title}>O meu horário</h1>
                        <p className={evaluation.subtitle}>
                            {schedule ? `Ano letivo ${schedule.academicYear.name} · ${schedule.totals.lessons} aula(s) por semana` : 'Aulas da semana'}
                        </p>
                    </div>
                </div>
            </div>

            <div className={evaluation.panel}>
                {error ? (
                    <div className={`${evaluation.banner} ${evaluation.bannerWarning}`}>{error}</div>
                ) : !schedule ? (
                    <p className={styles.muted}>A carregar…</p>
                ) : (
                    <>
                        <div className={`${styles.toolbar} ${styles.noPrint}`} style={{ marginBottom: 14 }}>
                            <div style={{ marginLeft: 'auto' }}>
                                <Button variant="secondary" icon={<Printer size={16} />} onClick={() => window.print()}>
                                    Imprimir
                                </Button>
                            </div>
                        </div>
                        <div className={styles.printOnly}>
                            <h2>
                                Horário · {schedule.teacher.name} · {schedule.academicYear.name}
                            </h2>
                        </div>
                        <WeeklyTimetable
                            weekdays={schedule.weekdays}
                            timeSlots={schedule.timeSlots}
                            entries={schedule.entries}
                            view="teacher"
                            emptyText="A escola ainda não marcou as suas aulas no horário."
                        />
                    </>
                )}
            </div>
        </div>
    );
}
