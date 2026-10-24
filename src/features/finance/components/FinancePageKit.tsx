'use client';

import React from 'react';
import Link from 'next/link';
import { dashboardStyles } from '@/features/dashboard-kit/DashboardKit';
import { initials, toneClass, toneFor, type Tone } from '@/features/dashboard-kit/DashboardKit';
import { FinanceHeader, FinanceNav } from './FinanceUI';
import styles from './finance.module.css';

// Estrutura comum das páginas do financeiro: cabeçalho, navegação e conteúdo
export const FinancePage: React.FC<{
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    actions?: React.ReactNode;
    children: React.ReactNode;
}> = ({ title, subtitle, icon, actions, children }) => (
    <div className={dashboardStyles.root}>
        <FinanceHeader title={title} subtitle={subtitle} icon={icon} actions={actions} />
        <FinanceNav />
        {children}
    </div>
);

export const FilterBar: React.FC<{ children: React.ReactNode; onClear?: () => void; active?: boolean }> = ({ children, onClear, active }) => (
    <div className={styles.filterBar}>
        {children}
        {onClear && active && (
            <button type="button" className={styles.clearFilters} onClick={onClear}>
                Limpar filtros
            </button>
        )}
    </div>
);

export const TableCard: React.FC<{ title: string; hint?: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode }> = ({
    title,
    hint,
    actions,
    children,
    footer,
}) => (
    <section className={styles.tableCard}>
        <div className={styles.tableHead}>
            <div>
                <h2 className={styles.tableTitle}>{title}</h2>
                {hint && <span className={styles.tableHint}>{hint}</span>}
            </div>
            {actions}
        </div>
        <div className={styles.tableScroll}>{children}</div>
        {footer && <div className={styles.tableFoot}>{footer}</div>}
    </section>
);

export const Person: React.FC<{ name: string; sub?: React.ReactNode; href?: string }> = ({ name, sub, href }) => {
    const content = (
        <>
            <span className={`${styles.personAvatar} ${toneClass(toneFor(name))} ${styles.personAvatarToned}`}>{initials(name)}</span>
            <span style={{ minWidth: 0 }}>
                <span className={styles.personName}>{name}</span>
                {sub && <span className={styles.cellSub}>{sub}</span>}
            </span>
        </>
    );
    return href ? (
        <Link href={href} className={styles.person}>
            {content}
        </Link>
    ) : (
        <span className={styles.person}>{content}</span>
    );
};

export const EmptyBox: React.FC<{ icon: React.ReactNode; title: string; text?: string; action?: React.ReactNode }> = ({ icon, title, text, action }) => (
    <div className={styles.emptyBox}>
        <span className={styles.emptyIcon}>{icon}</span>
        <p className={styles.emptyTitle}>{title}</p>
        {text && <p className={styles.emptyText}>{text}</p>}
        {action}
    </div>
);

export const LoadingRows: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Array.from({ length: rows }, (_, i) => (
            <div key={i} className={dashboardStyles.skeleton} style={{ height: 38, borderRadius: 10 }} />
        ))}
    </div>
);

// Dias em atraso com cor por gravidade (texto sempre com a tinta normal)
export const DaysOverdue: React.FC<{ days: number }> = ({ days }) => {
    const color = days > 60 ? '#DC2626' : days > 30 ? '#EA580C' : '#D97706';
    return (
        <span className={styles.severity}>
            <span className={styles.severityDot} style={{ background: color }} />
            {days} dia(s)
        </span>
    );
};


// Botão de ação com cor por significado (editar = azul, anular = vermelho…)
export const ActionButton: React.FC<{
    tone: Tone;
    icon?: React.ReactNode;
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    children?: React.ReactNode;
    disabled?: boolean;
    title?: string;
    'aria-label'?: string;
}> = ({ tone, icon, onClick, children, disabled, title, ...rest }) => (
    <button
        type="button"
        className={`${styles.act} ${children || !icon ? '' : styles.actIconOnly} ${toneClass(tone)}`}
        onClick={onClick}
        disabled={disabled}
        title={title ?? rest['aria-label']}
        aria-label={rest['aria-label']}
    >
        {icon}
        {children}
    </button>
);

export { toneFor };
