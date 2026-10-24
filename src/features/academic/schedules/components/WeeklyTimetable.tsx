'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import type { ScheduleEntry, TimeSlot, Weekday } from '../types/schedule.types';
import styles from './WeeklyTimetable.module.css';

// O que cada aula mostra conforme a vista
export type TimetableView = 'class' | 'teacher' | 'room' | 'student';

interface WeeklyTimetableProps {
    weekdays: Weekday[];
    timeSlots: TimeSlot[];
    entries: ScheduleEntry[];
    view: TimetableView;
    // só na vista da turma: clicar numa célula vazia / numa aula
    onAdd?: (weekday: number, slot: TimeSlot) => void;
    onSelect?: (entry: ScheduleEntry) => void;
    emptyText?: string;
}

const TONES = ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'];

// A mesma disciplina tem sempre a mesma cor
export function toneFor(key: string): string {
    let hash = 0;
    for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    return styles[TONES[hash % TONES.length]];
}

function lessonLines(entry: ScheduleEntry, view: TimetableView): { title: string; lines: string[] } {
    const room = entry.room ? `Sala ${entry.room.code}` : null;
    const klass = `${entry.class.gradeName} · ${entry.class.name}`;
    switch (view) {
        case 'teacher':
            return { title: entry.subject.name, lines: [klass, room].filter(Boolean) as string[] };
        case 'room':
            return { title: klass, lines: [entry.subject.name, entry.teacher.name] };
        case 'student':
            return { title: entry.subject.name, lines: [entry.teacher.name, room].filter(Boolean) as string[] };
        default:
            return { title: entry.subject.name, lines: [entry.teacher.name, room].filter(Boolean) as string[] };
    }
}

// Segunda = 1 ... Sábado = 6 (domingo = 0 não tem aulas)
const todayWeekday = () => new Date().getDay();

export const WeeklyTimetable: React.FC<WeeklyTimetableProps> = ({
    weekdays,
    timeSlots,
    entries,
    view,
    onAdd,
    onSelect,
    emptyText = 'Ainda não há tempos letivos configurados para este turno.',
}) => {
    const slots = [...timeSlots].filter(slot => slot.isActive).sort((a, b) => a.startTime.localeCompare(b.startTime));

    if (slots.length === 0) {
        return <div className={styles.empty}>{emptyText}</div>;
    }

    // Aulas por dia e hora de início (professor/sala podem ter aulas de turnos diferentes)
    const byCell = new Map<string, ScheduleEntry[]>();
    for (const entry of entries) {
        const key = `${entry.weekday}|${entry.timeSlot.startTime}`;
        byCell.set(key, [...(byCell.get(key) ?? []), entry]);
    }

    const today = todayWeekday();

    const renderLesson = (entry: ScheduleEntry) => {
        const { title, lines } = lessonLines(entry, view);
        const content = (
            <>
                <span className={styles.lessonTitle}>{title}</span>
                {lines.map(line => (
                    <span key={line} className={styles.lessonMeta} title={line}>
                        {line}
                    </span>
                ))}
            </>
        );
        const className = `${styles.lesson} ${toneFor(entry.subject.uuid)}`;
        return onSelect ? (
            <button
                key={entry.uuid}
                type="button"
                className={className}
                onClick={() => onSelect(entry)}
                aria-label={`${entry.weekdayName}, ${entry.timeSlot.startTime}: ${title}`}
            >
                {content}
            </button>
        ) : (
            <div key={entry.uuid} className={className}>
                {content}
            </div>
        );
    };

    const renderCell = (weekday: number, slot: TimeSlot) => {
        const items = byCell.get(`${weekday}|${slot.startTime}`) ?? [];
        if (items.length > 0) return items.map(renderLesson);
        if (onAdd) {
            return (
                <button
                    type="button"
                    className={styles.addButton}
                    onClick={() => onAdd(weekday, slot)}
                    aria-label={`Marcar aula: ${weekdays.find(d => d.value === weekday)?.name}, ${slot.name}`}
                >
                    <Plus size={16} />
                </button>
            );
        }
        return null;
    };

    return (
        <>
            {/* Grelha (ecrãs largos e impressão) */}
            <div className={styles.wrapper}>
                <div className={styles.grid} style={{ gridTemplateColumns: `112px repeat(${weekdays.length}, minmax(120px, 1fr))` }}>
                    <div className={styles.headCell}>Tempo</div>
                    {weekdays.map(day => (
                        <div key={day.value} className={`${styles.headCell} ${day.value === today ? styles.today : ''}`}>
                            {day.name}
                        </div>
                    ))}

                    {slots.map(slot =>
                        slot.isBreak ? (
                            <div key={slot.uuid} className={styles.breakRow}>
                                {slot.name} · {slot.startTime}–{slot.endTime}
                            </div>
                        ) : (
                            <React.Fragment key={slot.uuid}>
                                <div className={styles.timeCell}>
                                    <span className={styles.timeName}>{slot.name}</span>
                                    <span className={styles.timeRange}>
                                        {slot.startTime}–{slot.endTime}
                                    </span>
                                </div>
                                {weekdays.map(day => (
                                    <div key={day.value} className={styles.cell}>
                                        {renderCell(day.value, slot)}
                                    </div>
                                ))}
                            </React.Fragment>
                        )
                    )}
                </div>
            </div>

            {/* Lista por dia (telemóvel) */}
            <div className={styles.dayList}>
                {weekdays.map(day => {
                    const lessonSlots = slots.filter(slot => !slot.isBreak);
                    const hasAny = lessonSlots.some(slot => (byCell.get(`${day.value}|${slot.startTime}`) ?? []).length > 0);
                    if (!hasAny && !onAdd) return null;
                    return (
                        <section key={day.value} className={styles.daySection}>
                            <div className={`${styles.dayTitle} ${day.value === today ? styles.today : ''}`}>{day.name}</div>
                            {lessonSlots.map(slot => {
                                const items = byCell.get(`${day.value}|${slot.startTime}`) ?? [];
                                if (items.length === 0 && !onAdd) return null;
                                return (
                                    <div key={slot.uuid} className={styles.dayItem}>
                                        <div className={styles.timeCell} style={{ border: 'none', borderRadius: 8 }}>
                                            <span className={styles.timeName}>{slot.name}</span>
                                            <span className={styles.timeRange}>
                                                {slot.startTime}–{slot.endTime}
                                            </span>
                                        </div>
                                        <div>{renderCell(day.value, slot)}</div>
                                    </div>
                                );
                            })}
                        </section>
                    );
                })}
                {entries.length === 0 && !onAdd && <div className={styles.empty}>Sem aulas marcadas.</div>}
            </div>
        </>
    );
};
