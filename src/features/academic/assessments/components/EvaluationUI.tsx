// src/features/academic/assessments/components/EvaluationUI.tsx
// Peças visuais partilhadas pelas páginas de notas, presenças e pautas.

'use client';

import React from 'react';
import { Select } from '@/shared/components/ui/Select/Select';
import type { TeacherAssignmentOption } from '../types/assessment.types';
import styles from '../styles/evaluation.module.css';

const AVATAR_COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#14B8A6', '#6366F1', '#EF4444'];

const hash = (seed: string) => {
    let value = 0;
    for (let i = 0; i < seed.length; i++) value = (value * 31 + seed.charCodeAt(i)) >>> 0;
    return value;
};

export const initials = (name: string) =>
    name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part.charAt(0).toUpperCase()).join('') || '?';

export const StudentCell: React.FC<{ uuid: string; name: string; number?: string }> = ({ uuid, name, number }) => (
    <div className={styles.studentCell}>
        <span className={styles.avatar} style={{ background: AVATAR_COLORS[hash(uuid) % AVATAR_COLORS.length] }}>
            {initials(name)}
        </span>
        <span className={styles.studentText}>
            <span className={styles.studentNameText}>{name}</span>
            {number && <span className={styles.studentNumberText}>{number}</span>}
        </span>
    </div>
);

export type SummaryTone = 'purple' | 'green' | 'red' | 'amber' | 'blue';

const TONE_CLASS: Record<SummaryTone, string> = {
    purple: styles.tPurple,
    green: styles.tGreen,
    red: styles.tRed,
    amber: styles.tAmber,
    blue: styles.tBlue,
};

export const SummaryTile: React.FC<{ icon: React.ReactNode; value: React.ReactNode; label: string; tone: SummaryTone }> = ({
    icon,
    value,
    label,
    tone,
}) => (
    <div className={styles.summaryTile}>
        <span className={`${styles.summaryIcon} ${TONE_CLASS[tone]}`}>{icon}</span>
        <span>
            <span className={styles.summaryValue}>{value}</span>
            <span className={styles.summaryLabel}>{label}</span>
        </span>
    </div>
);

export const ClassBadge: React.FC<{ gradeName: string; className: string; index: number }> = ({ gradeName, className, index }) => (
    <span className={`${styles.classBadge} ${styles[`band${index % 6}`]}`}>
        <span className={styles.classBadgeSmall}>{gradeName.replace(/\s*Classe/i, '')}</span>
        {className}
    </span>
);

// Até este número de atribuições mostram-se cartões; acima, uma lista.
const MAX_CARDS = 12;

interface AssignmentPickerProps {
    assignments: TeacherAssignmentOption[];
    value: string;
    onChange: (uuid: string) => void;
    showTeacher?: boolean;
    emptyLabel?: string;
}

export const AssignmentPicker: React.FC<AssignmentPickerProps> = ({
    assignments,
    value,
    onChange,
    showTeacher = true,
    emptyLabel = 'Sem atribuições ativas',
}) => {
    if (assignments.length === 0) {
        return <p className={styles.hint}>{emptyLabel}</p>;
    }

    if (assignments.length > MAX_CARDS) {
        return (
            <Select
                value={value}
                onChange={e => onChange(e.target.value)}
                options={[
                    { value: '', label: 'Selecione...' },
                    ...assignments.map(a => ({
                        value: a.uuid,
                        label: `${a.gradeName} ${a.className} — ${a.subjectName}${showTeacher ? ` · ${a.teacherName}` : ''} (${a.academicYearName})`,
                    })),
                ]}
                fullWidth
            />
        );
    }

    // Cor estável por turma
    const classOrder = Array.from(new Set(assignments.map(a => a.classUuid)));

    return (
        <div className={styles.assignmentGrid} role="radiogroup">
            {assignments.map(a => (
                <button
                    key={a.uuid}
                    type="button"
                    role="radio"
                    aria-checked={value === a.uuid}
                    className={`${styles.assignmentCard} ${value === a.uuid ? styles.active : ''}`}
                    onClick={() => onChange(a.uuid)}
                >
                    <ClassBadge gradeName={a.gradeName} className={a.className} index={classOrder.indexOf(a.classUuid)} />
                    <span className={styles.assignmentInfo}>
                        <span className={styles.assignmentSubject}>{a.subjectName}</span>
                        <span className={styles.assignmentMeta}>
                            {showTeacher ? `${a.teacherName} · ` : ''}{a.academicYearName}
                            {a.isClassDirector ? ' · ★ Diretor' : ''}
                        </span>
                    </span>
                </button>
            ))}
        </div>
    );
};

/* ---------------- Notas e resultados ---------------- */

const formatValue = (value: number) => value.toFixed(1);

// Nota de uma avaliação: verde a partir de metade da nota máxima
export const ScorePill: React.FC<{ score: number | null; max: number }> = ({ score, max }) => {
    if (score === null) return <span className={`${styles.scorePill} ${styles.pEmpty}`}>—</span>;
    return (
        <span className={`${styles.scorePill} ${score >= max / 2 ? styles.pGood : styles.pBad}`}>
            {formatValue(score)}
        </span>
    );
};

// Média final (0–20) com a cor do resultado
export const FinalBadge: React.FC<{ score: number | null; approved: boolean | null }> = ({ score, approved }) => {
    if (score === null || approved === null) return <span className={`${styles.finalBadge} ${styles.fEmpty}`}>—</span>;
    return <span className={`${styles.finalBadge} ${approved ? styles.fGood : styles.fBad}`}>{score.toFixed(2)}</span>;
};

export const ResultLabel: React.FC<{ approved: boolean | null; emptyLabel?: string }> = ({ approved, emptyLabel = 'Por calcular' }) => {
    if (approved === null) return <span className={styles.muted}>{emptyLabel}</span>;
    return approved
        ? <span className={styles.approved}>Aprovado</span>
        : <span className={styles.failed}>Reprovado</span>;
};

export const PeriodChips: React.FC<{
    periods: { value: string; label: string; extra?: React.ReactNode }[];
    value: string;
    onChange: (value: string) => void;
    label?: string;
}> = ({ periods, value, onChange, label = 'Período' }) => (
    <div className={styles.chipGroup} style={{ marginBottom: 0 }}>
        <span className={styles.chipLabel}>{label}</span>
        {periods.map(p => (
            <button
                key={p.value}
                type="button"
                className={`${styles.chip} ${value === p.value ? styles.active : ''}`}
                onClick={() => onChange(p.value)}
            >
                {p.label}
                {p.extra}
            </button>
        ))}
    </div>
);

// Média, aprovados e reprovados de uma lista de resultados (0–20)
export const resultStats = (items: { score: number | null; approved: boolean | null }[]) => {
    const done = items.filter(i => i.approved !== null && i.score !== null);
    const approved = done.filter(i => i.approved).length;
    return {
        evaluated: done.length,
        average: done.length ? done.reduce((sum, i) => sum + (i.score ?? 0), 0) / done.length : null,
        approved,
        failed: done.length - approved,
        rate: done.length ? Math.round((approved / done.length) * 100) : null,
    };
};
