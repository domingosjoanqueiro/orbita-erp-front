// src/features/student-portal/components/PortalUI/PortalUI.tsx
// Peças visuais reutilizadas pelas páginas do portal do aluno.

'use client';

import React from 'react';
import { AlertCircle, RotateCw } from 'lucide-react';
import { getApiErrorMessage } from '@/shared/utils/api.utils';
import type { Tone } from '../../utils/format';
import styles from '../../styles/portal.module.css';

export function toneClass(tone: Tone | 'accent'): string {
    return styles[`tone-${tone}`];
}

export const SectionHeader: React.FC<{ title: string; action?: React.ReactNode }> = ({ title, action }) => (
    <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        {action}
    </div>
);

export const Badge: React.FC<{ tone: Tone | 'accent'; children: React.ReactNode }> = ({ tone, children }) => (
    <span className={`${styles.badge} ${styles[`tone-${tone}`]}`}>{children}</span>
);

export const ProgressBar: React.FC<{ value: number | null; tone: Tone; label?: string }> = ({ value, tone, label }) => {
    const width = Math.max(0, Math.min(100, value ?? 0));
    return (
        <div
            className={styles.bar}
            role="progressbar"
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={value ?? undefined}
        >
            <div className={styles.barFill} style={{ width: `${width}%`, color: `var(--tone-${tone})` }} />
        </div>
    );
};

// Anel circular: value entre 0 e max
export const ScoreRing: React.FC<{
    value: number | null;
    max: number;
    tone: Tone;
    size?: number;
    stroke?: number;
    label: string;
    caption?: string;
}> = ({ value, max, tone, size = 64, stroke = 6, label, caption }) => {
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const ratio = value === null ? 0 : Math.max(0, Math.min(1, value / max));
    return (
        <span className={styles.ring} style={{ width: size, height: size, color: `var(--tone-${tone})` }}>
            <svg width={size} height={size} aria-hidden>
                <circle className={styles.ringTrack} cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} />
                <circle
                    className={styles.ringValue}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - ratio)}
                />
            </svg>
            <span className={styles.ringLabel}>
                <strong style={{ fontSize: size * 0.28 }}>{label}</strong>
                {caption && <span>{caption}</span>}
            </span>
        </span>
    );
};

export const EmptyState: React.FC<{
    icon: React.ReactNode;
    title: string;
    text?: string;
    action?: React.ReactNode;
}> = ({ icon, title, text, action }) => (
    <div className={styles.empty}>
        <span className={styles.emptyIcon}>{icon}</span>
        <p className={styles.emptyTitle}>{title}</p>
        {text && <p className={styles.emptyText}>{text}</p>}
        {action}
    </div>
);

export const ErrorState: React.FC<{ error: unknown; onRetry: () => void }> = ({ error, onRetry }) => (
    <div className={`${styles.card} ${styles.cardPadded}`}>
        <EmptyState
            icon={<AlertCircle size={26} />}
            title="Não foi possível carregar"
            text={getApiErrorMessage(error, 'Verifique a sua ligação e tente novamente.')}
            action={
                <button type="button" className={`${styles.button} ${styles.buttonGhost}`} onClick={onRetry}>
                    <RotateCw size={16} /> Tentar novamente
                </button>
            }
        />
    </div>
);

export const Skeleton: React.FC<{ height: number; width?: string | number; radius?: number }> = ({ height, width = '100%', radius }) => (
    <div className={styles.skeleton} style={{ height, width, borderRadius: radius }} aria-hidden />
);

export const ListSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
    <div className={`${styles.card} ${styles.list}`} aria-busy="true" aria-label="A carregar">
        {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className={styles.listItem}>
                <Skeleton height={40} width={40} radius={12} />
                <div className={styles.listBody}>
                    <Skeleton height={12} width="60%" />
                    <Skeleton height={10} width="35%" />
                </div>
            </div>
        ))}
    </div>
);
