// src/app/(dashboard)/academic/schedules/page.tsx

'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, CalendarRange, DoorOpen, Eraser, Printer, School, UserCheck } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button/Button';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog/ConfirmDialog';
import { useToast } from '@/shared/contexts/ToastContext';
import { usePermission } from '@/shared/hooks/usePermission';
import { getApiErrorMessage } from '@/shared/utils/api.utils';
import { classService } from '@/features/academic/classes/services/class.service';
import { teacherService } from '@/features/academic/teachers/services/teacher.service';
import { academicYearService } from '@/features/academic/academic-years/services/academic-year.service';
import { scheduleService } from '@/features/academic/schedules/services/schedule.service';
import { WeeklyTimetable } from '@/features/academic/schedules/components/WeeklyTimetable';
import { LessonDialog } from '@/features/academic/schedules/components/LessonDialog';
import type { ClassSchedule, Room, ScheduleEntry, TimeSlot, WeekSchedule } from '@/features/academic/schedules/types/schedule.types';
import { SHIFT_LABELS, type Shift } from '@/features/academic/schedules/types/schedule.types';
import evaluation from '@/features/academic/assessments/styles/evaluation.module.css';
import styles from '@/features/academic/schedules/components/Schedules.module.css';

type Tab = 'class' | 'teacher' | 'room';

interface ClassOption {
    uuid: string;
    name: string;
    gradeName: string;
    shift: Shift;
    academicYearName: string;
}

interface Named {
    uuid: string;
    name: string;
}

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'class', label: 'Por turma', icon: <School size={16} /> },
    { key: 'teacher', label: 'Por professor', icon: <UserCheck size={16} /> },
    { key: 'room', label: 'Por sala', icon: <DoorOpen size={16} /> },
];

export default function SchedulesPage() {
    const { showSuccess, showError } = useToast();
    const { hasPermission } = usePermission();
    const canManage = hasPermission('schedules.manage');

    const [tab, setTab] = useState<Tab>('class');
    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [teachers, setTeachers] = useState<Named[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [years, setYears] = useState<Named[]>([]);

    const [classUuid, setClassUuid] = useState('');
    const [teacherUuid, setTeacherUuid] = useState('');
    const [roomUuid, setRoomUuid] = useState('');
    const [yearUuid, setYearUuid] = useState('');

    const [classSchedule, setClassSchedule] = useState<ClassSchedule | null>(null);
    const [otherSchedule, setOtherSchedule] = useState<(WeekSchedule & { academicYear?: Named; title: string }) | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dialog, setDialog] = useState<{ weekday: number; slot: TimeSlot; entry?: ScheduleEntry } | null>(null);
    const [confirmClear, setConfirmClear] = useState(false);
    const [clearing, setClearing] = useState(false);

    // Listas para os seletores
    useEffect(() => {
        classService
            .getAll({ limit: 100 })
            .then(result => {
                const list = (result.data as unknown as ClassOption[]).sort(
                    (a, b) =>
                        b.academicYearName.localeCompare(a.academicYearName) ||
                        a.gradeName.localeCompare(b.gradeName, 'pt', { numeric: true }) ||
                        a.name.localeCompare(b.name)
                );
                setClasses(list);
                setClassUuid(prev => prev || list[0]?.uuid || '');
            })
            .catch(err => showError('Erro', getApiErrorMessage(err, 'Não foi possível carregar as turmas.')));
        teacherService
            .getAll({ limit: 100, isActive: true })
            .then(result => setTeachers(result.data.map(t => ({ uuid: t.uuid, name: t.fullName }))))
            .catch(() => setTeachers([]));
        scheduleService
            .listRooms({ limit: 100 })
            .then(result => setRooms(result.data))
            .catch(() => setRooms([]));
        academicYearService
            .getAll({ limit: 50 })
            .then(result => setYears(result.data.map(y => ({ uuid: y.uuid, name: y.name }))))
            .catch(() => setYears([]));
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const loadClass = useCallback(async () => {
        if (!classUuid) return;
        try {
            setLoading(true);
            setError(null);
            setClassSchedule(await scheduleService.classSchedule(classUuid));
        } catch (err) {
            setClassSchedule(null);
            setError(getApiErrorMessage(err, 'Não foi possível carregar o horário.'));
        } finally {
            setLoading(false);
        }
    }, [classUuid]);

    const loadOther = useCallback(async () => {
        const uuid = tab === 'teacher' ? teacherUuid : roomUuid;
        if (!uuid) {
            setOtherSchedule(null);
            return;
        }
        try {
            setLoading(true);
            setError(null);
            if (tab === 'teacher') {
                const result = await scheduleService.teacherSchedule(uuid, yearUuid || undefined);
                setOtherSchedule({ ...result, title: result.teacher.name });
            } else {
                const result = await scheduleService.roomSchedule(uuid, yearUuid || undefined);
                setOtherSchedule({ ...result, title: `${result.room.code} · ${result.room.name}` });
            }
        } catch (err) {
            setOtherSchedule(null);
            setError(getApiErrorMessage(err, 'Não foi possível carregar o horário.'));
        } finally {
            setLoading(false);
        }
    }, [tab, teacherUuid, roomUuid, yearUuid]);

    useEffect(() => {
        if (tab === 'class') loadClass();
        else loadOther();
    }, [tab, loadClass, loadOther]);

    const classesByYear = useMemo(() => {
        const groups = new Map<string, ClassOption[]>();
        for (const item of classes) groups.set(item.academicYearName, [...(groups.get(item.academicYearName) ?? []), item]);
        return [...groups.entries()];
    }, [classes]);

    const clearClass = async () => {
        if (!classUuid) return;
        try {
            setClearing(true);
            const result = await scheduleService.clearClass(classUuid);
            showSuccess('Horário limpo', `${result.removed} aula(s) removida(s).`);
            setConfirmClear(false);
            await loadClass();
        } catch (err) {
            showError('Erro', getApiErrorMessage(err, 'Não foi possível limpar o horário.'));
        } finally {
            setClearing(false);
        }
    };

    const assignments = classSchedule?.assignments ?? [];
    const expected = classSchedule?.totals.expected ?? 0;
    const selectedClass = classes.find(item => item.uuid === classUuid);

    return (
        <div className={evaluation.page}>
            <div className={`${evaluation.header} ${styles.noPrint}`}>
                <div className={evaluation.headerLeft}>
                    <div className={evaluation.headerIcon}>
                        <CalendarRange size={24} />
                    </div>
                    <div>
                        <h1 className={evaluation.title}>Horários</h1>
                        <p className={evaluation.subtitle}>Grelha semanal das turmas, professores e salas, sem conflitos</p>
                    </div>
                </div>
                {tab === 'class' && classSchedule && (
                    <div className={evaluation.headerStats}>
                        <div className={evaluation.headerStat}>
                            <span className={evaluation.headerStatValue}>{classSchedule.totals.lessons}</span>
                            <span className={evaluation.headerStatLabel}>aulas marcadas</span>
                        </div>
                        {expected > 0 && (
                            <div className={evaluation.headerStat}>
                                <span className={evaluation.headerStatValue}>{expected}</span>
                                <span className={evaluation.headerStatLabel}>tempos do plano</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className={`${evaluation.tabs} ${styles.noPrint}`} role="tablist">
                {TABS.map(item => (
                    <button
                        key={item.key}
                        type="button"
                        role="tab"
                        aria-selected={tab === item.key}
                        className={`${evaluation.tab} ${tab === item.key ? evaluation.active : ''}`}
                        onClick={() => {
                            setError(null);
                            setTab(item.key);
                        }}
                    >
                        {item.icon}
                        {item.label}
                    </button>
                ))}
            </div>

            <div className={evaluation.panel}>
                <div className={`${styles.toolbar} ${styles.noPrint}`}>
                    {tab === 'class' && (
                        <label className={styles.field}>
                            <span className={styles.fieldLabel}>Turma</span>
                            <select className={styles.nativeSelect} value={classUuid} onChange={event => setClassUuid(event.target.value)}>
                                {classes.length === 0 && <option value="">Sem turmas</option>}
                                {classesByYear.map(([year, items]) => (
                                    <optgroup key={year} label={`Ano letivo ${year}`}>
                                        {items.map(item => (
                                            <option key={item.uuid} value={item.uuid}>
                                                {item.gradeName} · Turma {item.name} ({SHIFT_LABELS[item.shift] ?? item.shift})
                                            </option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </label>
                    )}
                    {tab === 'teacher' && (
                        <label className={styles.field}>
                            <span className={styles.fieldLabel}>Professor</span>
                            <select className={styles.nativeSelect} value={teacherUuid} onChange={event => setTeacherUuid(event.target.value)}>
                                <option value="">Escolha o professor…</option>
                                {teachers.map(item => (
                                    <option key={item.uuid} value={item.uuid}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}
                    {tab === 'room' && (
                        <label className={styles.field}>
                            <span className={styles.fieldLabel}>Sala</span>
                            <select className={styles.nativeSelect} value={roomUuid} onChange={event => setRoomUuid(event.target.value)}>
                                <option value="">Escolha a sala…</option>
                                {rooms.map(item => (
                                    <option key={item.uuid} value={item.uuid}>
                                        {item.code} · {item.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}
                    {tab !== 'class' && (
                        <label className={styles.field}>
                            <span className={styles.fieldLabel}>Ano letivo</span>
                            <select className={styles.nativeSelect} value={yearUuid} onChange={event => setYearUuid(event.target.value)}>
                                <option value="">Ano corrente</option>
                                {years.map(item => (
                                    <option key={item.uuid} value={item.uuid}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}
                    <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                        {tab === 'class' && canManage && classSchedule && classSchedule.entries.length > 0 && (
                            <Button variant="outline" icon={<Eraser size={16} />} onClick={() => setConfirmClear(true)}>
                                Limpar horário
                            </Button>
                        )}
                        <Button variant="secondary" icon={<Printer size={16} />} onClick={() => window.print()}>
                            Imprimir
                        </Button>
                    </div>
                </div>

                {error && (
                    <div className={`${evaluation.banner} ${evaluation.bannerWarning}`} style={{ marginTop: 14 }}>
                        {error}
                    </div>
                )}

                {tab === 'class' && classSchedule && (
                    <>
                        <div className={styles.printOnly}>
                            <h2>
                                Horário · {classSchedule.class.gradeName} · Turma {classSchedule.class.name} ({classSchedule.class.shiftName}) ·{' '}
                                {classSchedule.class.academicYearName}
                            </h2>
                        </div>
                        <div className={styles.layout} style={{ marginTop: 16 }}>
                            <WeeklyTimetable
                                weekdays={canManage ? withSaturday(classSchedule.weekdays) : classSchedule.weekdays}
                                timeSlots={classSchedule.timeSlots}
                                entries={classSchedule.entries}
                                view="class"
                                onAdd={canManage ? (weekday, slot) => setDialog({ weekday, slot }) : undefined}
                                onSelect={canManage ? entry => setDialog({ weekday: entry.weekday, slot: slotOf(classSchedule.timeSlots, entry), entry }) : undefined}
                                emptyText={`Ainda não há tempos letivos para o turno da ${classSchedule.class.shiftName.toLowerCase()}. Configure-os em Académico › Tempos letivos.`}
                            />
                            <aside className={`${styles.side} ${styles.noPrint}`}>
                                <div className={styles.sideCard}>
                                    <span className={styles.sideTitle}>
                                        <BookOpen size={16} /> Carga semanal
                                    </span>
                                    {assignments.length === 0 ? (
                                        <p className={styles.muted}>Sem disciplinas atribuídas a esta turma.</p>
                                    ) : (
                                        assignments.map(item => {
                                            const target = item.weeklyWorkload ?? 0;
                                            const ratio = target ? Math.min(1, item.scheduledCount / target) : item.scheduledCount ? 1 : 0;
                                            const state = target && item.scheduledCount > target ? styles.barOver : target && item.scheduledCount === target ? styles.barDone : '';
                                            return (
                                                <div key={item.uuid} className={styles.workloadRow}>
                                                    <div className={styles.workloadHead}>
                                                        <span className={styles.workloadName}>{item.subjectName}</span>
                                                        <span className={styles.workloadCount}>
                                                            {item.scheduledCount}
                                                            {target ? ` / ${target}` : ''}
                                                        </span>
                                                    </div>
                                                    <div className={styles.bar}>
                                                        <div className={`${styles.barFill} ${state}`} style={{ width: `${ratio * 100}%` }} />
                                                    </div>
                                                    <span className={styles.workloadTeacher}>{item.teacherName}</span>
                                                </div>
                                            );
                                        })
                                    )}
                                    {canManage && (
                                        <p className={styles.muted}>
                                            Clique num espaço vazio para marcar uma aula, ou numa aula para a mudar ou remover.
                                        </p>
                                    )}
                                </div>
                            </aside>
                        </div>
                    </>
                )}

                {tab !== 'class' && otherSchedule && (
                    <div style={{ marginTop: 16 }}>
                        <div className={styles.printOnly}>
                            <h2>
                                Horário · {otherSchedule.title} · {otherSchedule.academicYear?.name}
                            </h2>
                        </div>
                        <p className={`${styles.muted} ${styles.noPrint}`} style={{ marginBottom: 10 }}>
                            {otherSchedule.title} · ano letivo {otherSchedule.academicYear?.name} · {otherSchedule.totals.lessons} aula(s) por semana
                        </p>
                        <WeeklyTimetable
                            weekdays={otherSchedule.weekdays}
                            timeSlots={otherSchedule.timeSlots}
                            entries={otherSchedule.entries}
                            view={tab}
                            emptyText="Sem aulas marcadas neste ano letivo."
                        />
                    </div>
                )}

                {tab !== 'class' && !otherSchedule && !loading && !error && (
                    <p className={styles.muted} style={{ marginTop: 16 }}>
                        Escolha {tab === 'teacher' ? 'um professor' : 'uma sala'} para ver o horário.
                    </p>
                )}
                {loading && <p className={styles.muted} style={{ marginTop: 16 }}>A carregar…</p>}
            </div>

            {dialog && classSchedule && (
                <LessonDialog
                    classUuid={classUuid}
                    target={dialog}
                    weekdays={withSaturday(classSchedule.weekdays)}
                    defaultRoomName={classSchedule.class.defaultRoom}
                    onClose={() => setDialog(null)}
                    onSaved={() => {
                        setDialog(null);
                        loadClass();
                    }}
                />
            )}

            <ConfirmDialog
                isOpen={confirmClear}
                onClose={() => setConfirmClear(false)}
                onConfirm={clearClass}
                title="Limpar horário da turma"
                message={`Todas as aulas de ${selectedClass ? `${selectedClass.gradeName} · Turma ${selectedClass.name}` : 'esta turma'} serão removidas. Esta ação não pode ser anulada.`}
                type="danger"
                confirmText="Limpar"
                isLoading={clearing}
            />
        </div>
    );
}

// Quem gere o horário pode marcar aulas ao sábado
function withSaturday(weekdays: WeekSchedule['weekdays']) {
    return weekdays.some(day => day.value === 6) ? weekdays : [...weekdays, { value: 6, name: 'Sábado', short: 'Sáb' }];
}

function slotOf(slots: TimeSlot[], entry: ScheduleEntry): TimeSlot {
    return (
        slots.find(slot => slot.uuid === entry.timeSlot.uuid) ?? {
            uuid: entry.timeSlot.uuid,
            name: entry.timeSlot.name,
            sequence: entry.timeSlot.sequence,
            startTime: entry.timeSlot.startTime,
            endTime: entry.timeSlot.endTime,
            shift: entry.class.shift,
            isBreak: false,
            isActive: true,
        }
    );
}
