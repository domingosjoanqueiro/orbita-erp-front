'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AlertTriangle, Banknote, FileText, LayoutDashboard, ListChecks, Receipt, Search, Table2, Wallet } from 'lucide-react';
import { usePermission } from '@/shared/hooks/usePermission';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { studentService } from '@/features/academic/students/services/student.service';
import { CHARGE_STATUS_LABELS, type Charge } from '../types/finance.types';
import styles from './finance.module.css';
import { toneClass, type Tone } from '@/features/dashboard-kit/DashboardKit';
import schedules from '@/features/academic/schedules/components/Schedules.module.css';

const LINKS = [
    { href: '/finance', label: 'Painel', icon: <LayoutDashboard size={15} />, permission: 'finance.read', tone: 'blue' as Tone },
    { href: '/finance/cashier', label: 'Caixa', icon: <Wallet size={15} />, permission: 'finance.read', tone: 'green' as Tone },
    { href: '/finance/charges', label: 'Cobranças', icon: <ListChecks size={15} />, permission: 'finance.read', tone: 'purple' as Tone },
    { href: '/finance/payments', label: 'Recibos', icon: <Receipt size={15} />, permission: 'finance.read', tone: 'teal' as Tone },
    { href: '/finance/debtors', label: 'Devedores', icon: <AlertTriangle size={15} />, permission: 'finance.read', tone: 'red' as Tone },
    { href: '/finance/fees', label: 'Propinas', icon: <Table2 size={15} />, permission: 'finance.read', tone: 'orange' as Tone },
    { href: '/finance/expenses', label: 'Despesas', icon: <Banknote size={15} />, permission: 'finance.read', tone: 'pink' as Tone },
];

// Navegação entre as áreas do financeiro
export const FinanceNav: React.FC = () => {
    const pathname = usePathname() ?? '';
    const { hasPermission } = usePermission();
    return (
        <nav className={`${styles.nav} ${schedules.noPrint}`} aria-label="Financeiro">
            {LINKS.filter(link => hasPermission(link.permission)).map(link => {
                const active = link.href === '/finance' ? pathname === '/finance' : pathname.startsWith(link.href);
                return (
                    <Link key={link.href} href={link.href} className={`${styles.navLink} ${active ? styles.navActive : ''}`} aria-current={active ? 'page' : undefined}>
                        <span className={`${styles.navIcon} ${toneClass(link.tone)}`}>{link.icon}</span>
                        {link.label}
                    </Link>
                );
            })}
        </nav>
    );
};

export const ChargeStatusPill: React.FC<{ charge: Pick<Charge, 'status' | 'isOverdue' | 'daysOverdue'> }> = ({ charge }) => {
    if (charge.isOverdue) {
        return (
            <span className={`${styles.pill} ${styles.pillOverdue}`} title={`${charge.daysOverdue} dia(s) em atraso`}>
                <AlertTriangle size={12} /> Em atraso
            </span>
        );
    }
    const className = {
        PENDING: styles.pillPending,
        PARTIAL: styles.pillPartial,
        PAID: styles.pillPaid,
        CANCELLED: styles.pillCancelled,
    }[charge.status];
    return <span className={`${styles.pill} ${className}`}>{CHARGE_STATUS_LABELS[charge.status]}</span>;
};

export const Kpi: React.FC<{ label: string; value: string; hint?: string; icon?: React.ReactNode; danger?: boolean }> = ({ label, value, hint, icon, danger }) => (
    <div className={`${styles.kpi} ${danger ? styles.kpiDanger : ''}`}>
        <span className={styles.kpiLabel}>
            {icon}
            {label}
        </span>
        <span className={styles.kpiValue}>{value}</span>
        {hint && <span className={styles.kpiHint}>{hint}</span>}
    </div>
);

export interface PickedStudent {
    uuid: string;
    name: string;
    number: string;
    className?: string;
}

// Pesquisa de aluno por nome ou número
export const StudentPicker: React.FC<{ onSelect: (student: PickedStudent) => void; placeholder?: string; autoFocus?: boolean }> = ({
    onSelect,
    placeholder = 'Pesquisar aluno por nome ou nº…',
    autoFocus,
}) => {
    const [term, setTerm] = useState('');
    const debounced = useDebounce(term.trim(), 300);
    const [results, setResults] = useState<PickedStudent[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const box = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (debounced.length < 2) {
            setResults([]);
            return;
        }
        let cancelled = false;
        setLoading(true);
        studentService
            .getAll({ search: debounced, limit: 8 })
            .then(result => {
                if (cancelled) return;
                setResults(
                    result.data.map(student => ({
                        uuid: student.uuid,
                        name: student.fullName,
                        number: student.studentNumber,
                        className: student.currentEnrollment ? `${student.currentEnrollment.grade?.name} · Turma ${student.currentEnrollment.class?.name}` : undefined,
                    }))
                );
                setOpen(true);
            })
            .catch(() => setResults([]))
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
    }, [debounced]);

    useEffect(() => {
        const close = (event: MouseEvent) => {
            if (box.current && !box.current.contains(event.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    return (
        <div className={styles.picker} ref={box}>
            <span style={{ position: 'relative', display: 'block' }}>
                <Search size={15} style={{ position: 'absolute', left: 10, top: 12, color: 'var(--text-tertiary)' }} />
                <input
                    className={schedules.input}
                    style={{ paddingLeft: 32, width: '100%' }}
                    value={term}
                    autoFocus={autoFocus}
                    placeholder={placeholder}
                    aria-label="Pesquisar aluno"
                    onFocus={() => results.length && setOpen(true)}
                    onChange={event => setTerm(event.target.value)}
                />
            </span>
            {open && debounced.length >= 2 && (
                <div className={styles.pickerResults} role="listbox">
                    {loading && results.length === 0 ? (
                        <div className={styles.pickerItem}>A pesquisar…</div>
                    ) : results.length === 0 ? (
                        <div className={styles.pickerItem}>Nenhum aluno encontrado.</div>
                    ) : (
                        results.map(student => (
                            <button
                                key={student.uuid}
                                type="button"
                                role="option"
                                aria-selected={false}
                                className={styles.pickerItem}
                                onClick={() => {
                                    onSelect(student);
                                    setTerm('');
                                    setOpen(false);
                                }}
                            >
                                <strong>{student.name}</strong>
                                <span className={styles.muted}>
                                    Nº {student.number}
                                    {student.className ? ` · ${student.className}` : ''}
                                </span>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export const FinanceHeader: React.FC<{ title: string; subtitle: string; icon?: React.ReactNode; actions?: React.ReactNode }> = ({ title, subtitle, icon, actions }) => (
    <div className={`${styles.pageHeader} ${schedules.noPrint}`}>
        <div className={styles.pageHeaderLeft}>
            <div className={styles.pageHeaderIcon}>{icon ?? <FileText size={24} />}</div>
            <div>
                <h1 className={styles.pageHeaderTitle}>{title}</h1>
                <p className={styles.pageHeaderSubtitle}>{subtitle}</p>
            </div>
        </div>
        {actions && <div className={styles.pageHeaderActions}>{actions}</div>}
    </div>
);
