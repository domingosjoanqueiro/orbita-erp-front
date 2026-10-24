'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarOff, FileSignature, FileWarning, Inbox, LayoutDashboard, UserCheck, Users } from 'lucide-react';
import finance from '@/features/finance/components/finance.module.css';
import { dashboardStyles as dash, KpiTile, toneClass, type Tone } from '@/features/dashboard-kit/DashboardKit';
import schedules from '@/features/academic/schedules/components/Schedules.module.css';
import { getHrSummary, LEAVE_STATUS_LABELS, type HrSummary, type LeaveStatus } from './hr.service';

const LINKS = [
    { href: '/hr', label: 'Painel', icon: <LayoutDashboard size={15} />, exact: true, tone: 'blue' as Tone },
    { href: '/hr/employees', label: 'Funcionários', icon: <Users size={15} />, tone: 'purple' as Tone },
    { href: '/hr/contracts', label: 'Contratos', icon: <FileSignature size={15} />, tone: 'teal' as Tone },
    { href: '/hr/leaves', label: 'Férias e ausências', icon: <CalendarOff size={15} />, tone: 'orange' as Tone },
];

export const HrNav: React.FC = () => {
    const pathname = usePathname() ?? '';
    return (
        <nav className={`${finance.nav} ${schedules.noPrint}`} aria-label="Recursos humanos">
            {LINKS.map(link => {
                const active = 'exact' in link && link.exact ? pathname === link.href : pathname.startsWith(link.href);
                return (
                    <Link key={link.href} href={link.href} className={`${finance.navLink} ${active ? finance.navActive : ''}`} aria-current={active ? 'page' : undefined}>
                        <span className={`${finance.navIcon} ${toneClass(link.tone)}`}>{link.icon}</span>
                        {link.label}
                    </Link>
                );
            })}
        </nav>
    );
};

export const LeaveStatusPill: React.FC<{ status: LeaveStatus }> = ({ status }) => {
    const className = {
        PENDING: finance.pillPartial,
        APPROVED: finance.pillPaid,
        REJECTED: finance.pillOverdue,
        CANCELLED: finance.pillCancelled,
    }[status];
    return <span className={`${finance.pill} ${className}`}>{LEAVE_STATUS_LABELS[status]}</span>;
};

// Indicadores do RH (topo das páginas de RH)
export const HrKpis: React.FC = () => {
    const [data, setData] = React.useState<HrSummary | null>(null);
    React.useEffect(() => {
        getHrSummary().then(setData).catch(() => setData(null));
    }, []);
    return (
        <div className={dash.kpis}>
            <KpiTile
                tone="blue"
                label="Efetivo ativo"
                icon={<Users size={18} />}
                value={data ? String(data.headcount.total) : '…'}
                foot={<span>{data ? `${data.headcount.teachers} professores · ${data.headcount.staff} outro pessoal` : ' '}</span>}
                href="/hr/employees"
            />
            <KpiTile
                tone="orange"
                label="Ausentes hoje"
                icon={<UserCheck size={18} />}
                value={data ? String(data.absentToday.length) : '…'}
                foot={<span>{data ? `${data.upcomingLeaves.length} nos próximos 14 dias` : ' '}</span>}
                href="/hr/leaves"
            />
            <KpiTile
                tone="purple"
                label="Pedidos por decidir"
                icon={<Inbox size={18} />}
                value={data ? String(data.pendingLeaves.total) : '…'}
                alert={!!data?.pendingLeaves.total}
                foot={<span>{data?.pendingLeaves.total ? 'Aguardam aprovação' : 'Nada pendente'}</span>}
                href="/hr/leaves"
            />
            <KpiTile
                tone="teal"
                label="Contratos a terminar"
                icon={<FileWarning size={18} />}
                value={data ? String(data.expiringContracts.length) : '…'}
                alert={!!data?.expiringContracts.some(c => c.daysLeft <= 7)}
                foot={<span>{data ? `Próximos 30 dias · ${data.payroll.withoutContract} sem contrato` : ' '}</span>}
                href="/hr/contracts"
            />
        </div>
    );
};
