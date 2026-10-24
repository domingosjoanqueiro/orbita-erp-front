// src/app/(dashboard)/reports/page.tsx

'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    AlertTriangle,
    Award,
    BarChart3,
    Briefcase,
    CalendarCheck,
    CalendarOff,
    Download,
    FileBarChart,
    Printer,
    Receipt,
    TrendingUp,
    UserCheck,
    Users,
    Wallet,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button/Button';
import { usePermission } from '@/shared/hooks/usePermission';
import { getApiErrorMessage } from '@/shared/utils/api.utils';
import { formatDisplayDate, toDateInputValue } from '@/shared/utils/date.utils';
import { EmptyBox, FilterBar, LoadingRows, Person, TableCard } from '@/features/finance/components/FinancePageKit';
import { FinanceHeader } from '@/features/finance/components/FinanceUI';
import { useFinanceLookups } from '@/features/finance/hooks/useFinanceLookups';
import { dashboardStyles as dash, KpiTile, toneClass, type Tone } from '@/features/dashboard-kit/DashboardKit';
import { ACADEMIC_PERIOD_LABELS, type AcademicPeriod } from '@/features/academic/assessments/types/assessment.types';
import {
    decimal,
    downloadCsv,
    reportsService,
    type AttendanceReport,
    type PerformanceReport,
    type StudentsReport,
} from '@/features/reports/reports.service';
import schedules from '@/features/academic/schedules/components/Schedules.module.css';
import finance from '@/features/finance/components/finance.module.css';
import styles from '@/features/reports/reports.module.css';

type TabKey = 'students' | 'attendance' | 'performance';

const TABS: { key: TabKey; label: string; icon: React.ReactNode; tone: Tone; permission: string }[] = [
    { key: 'students', label: 'Alunos por turma', icon: <Users size={15} />, tone: 'blue', permission: 'students.read' },
    { key: 'attendance', label: 'Assiduidade', icon: <CalendarCheck size={15} />, tone: 'green', permission: 'attendance.read' },
    { key: 'performance', label: 'Aproveitamento', icon: <BarChart3 size={15} />, tone: 'purple', permission: 'gradebooks.read' },
];

// Relatórios que já existem noutros módulos
const OTHER_REPORTS: { label: string; text: string; href: string; icon: React.ReactNode; tone: Tone; permissions: string[] }[] = [
    { label: 'Pautas e boletins', text: 'Pautas por turma, rankings e boletins individuais', href: '/academic-reports', icon: <Award size={18} />, tone: 'purple', permissions: ['gradebooks.read', 'classRankings.read', 'reportCards.read'] },
    { label: 'Painel financeiro', text: 'Recebimentos, despesas e saldo por período', href: '/finance', icon: <Wallet size={18} />, tone: 'teal', permissions: ['finance.read'] },
    { label: 'Devedores', text: 'Alunos em atraso, com exportação para Excel', href: '/finance/debtors', icon: <AlertTriangle size={18} />, tone: 'red', permissions: ['finance.read'] },
    { label: 'Recebimentos', text: 'Pagamentos e recibos emitidos', href: '/finance/payments', icon: <Receipt size={18} />, tone: 'green', permissions: ['finance.read'] },
    { label: 'Pessoal', text: 'Funcionários, contratos e massa salarial', href: '/hr', icon: <Briefcase size={18} />, tone: 'orange', permissions: ['hr.read'] },
    { label: 'Férias e ausências', text: 'Pedidos, aprovações e ausências do pessoal', href: '/hr/leaves', icon: <CalendarOff size={18} />, tone: 'pink', permissions: ['hr.read'] },
];

const GENDER: Record<string, string> = { MALE: 'Masculino', FEMALE: 'Feminino' };
const PERIODS = Object.keys(ACADEMIC_PERIOD_LABELS) as AcademicPeriod[];
const pct = (value: number | null) => (value === null ? '—' : `${value.toLocaleString('pt-PT', { maximumFractionDigits: 1 })}%`);
const one = (value: number | null) => (value === null ? '—' : value.toLocaleString('pt-PT', { minimumFractionDigits: 1, maximumFractionDigits: 1 }));
const firstOfMonth = () => {
    const now = new Date();
    return toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1));
};

function ReportsContent() {
    const router = useRouter();
    const params = useSearchParams();
    const { hasPermission, hasAnyPermission } = usePermission();
    const { classes } = useFinanceLookups();

    const tabs = TABS.filter(tab => hasPermission(tab.permission));
    const requested = params.get('tab') as TabKey | null;
    const tab = tabs.find(item => item.key === requested)?.key ?? tabs[0]?.key;
    const others = OTHER_REPORTS.filter(item => hasAnyPermission(item.permissions));

    const [classUuid, setClassUuid] = useState('');
    const [gender, setGender] = useState('');
    const [from, setFrom] = useState(firstOfMonth);
    const [to, setTo] = useState(() => toDateInputValue(new Date()));
    const [period, setPeriod] = useState<AcademicPeriod>('FIRST');

    const [students, setStudents] = useState<StudentsReport | null>(null);
    const [attendance, setAttendance] = useState<AttendanceReport | null>(null);
    const [performance, setPerformance] = useState<PerformanceReport | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Assiduidade e aproveitamento são por turma: escolhe a primeira por defeito
    useEffect(() => {
        if (!classUuid && classes.length && tab !== 'students') setClassUuid(classes[0].uuid);
    }, [classes, classUuid, tab]);

    const load = useCallback(async () => {
        if (!tab) return;
        if (tab !== 'students' && !classUuid) return;
        try {
            setLoading(true);
            setError(null);
            if (tab === 'students') setStudents(await reportsService.students({ classUuid: classUuid || undefined, gender: gender || undefined }));
            if (tab === 'attendance') setAttendance(await reportsService.attendance({ classUuid, from, to }));
            if (tab === 'performance') setPerformance(await reportsService.performance({ classUuid, academicPeriod: period }));
        } catch (err) {
            setError(getApiErrorMessage(err, 'Não foi possível gerar o relatório.'));
        } finally {
            setLoading(false);
        }
    }, [tab, classUuid, gender, from, to, period]);

    useEffect(() => {
        load();
    }, [load]);

    const className = useMemo(() => classes.find(item => item.uuid === classUuid), [classes, classUuid]);
    const scope = className ? `${className.name} (${className.year})` : 'Todas as turmas';

    const exportCsv = () => {
        const stamp = toDateInputValue(new Date());
        if (tab === 'students' && students) {
            downloadCsv(
                `alunos-${stamp}.csv`,
                ['Nº', 'Nº aluno', 'Nome', 'Género', 'Data de nascimento', 'Turma', 'Nº matrícula', 'Data de matrícula', 'Encarregado', 'Contacto'],
                students.rows.map(row => [row.index, row.studentNumber, row.name, row.gender ? GENDER[row.gender] : '', formatDisplayDate(row.birthDate), row.className, row.enrollmentNumber, formatDisplayDate(row.enrollmentDate), row.guardian, row.phone])
            );
        }
        if (tab === 'attendance' && attendance) {
            downloadCsv(
                `assiduidade-${stamp}.csv`,
                ['Nº aluno', 'Nome', 'Presenças', 'Atrasos', 'Faltas', 'Justificadas', 'Registos', 'Taxa de presença (%)'],
                attendance.rows.map(row => [row.studentNumber, row.name, row.present, row.late, row.absent, row.excused, row.total, decimal(row.rate)])
            );
        }
        if (tab === 'performance' && performance) {
            downloadCsv(
                `aproveitamento-${stamp}.csv`,
                ['Nº aluno', 'Nome', ...performance.subjects.map(subject => subject.name), 'Média', 'Negativas'],
                performance.rows.map(row => [row.studentNumber, row.name, ...row.scores.map(decimal), decimal(row.average), row.negatives])
            );
        }
    };

    const hasRows =
        (tab === 'students' && !!students?.rows.length) || (tab === 'attendance' && !!attendance?.rows.length) || (tab === 'performance' && !!performance?.rows.length);

    return (
        <div className={dash.root}>
            <FinanceHeader
                title="Relatórios"
                subtitle="Listagens e indicadores da escola, prontos a imprimir ou exportar para Excel"
                icon={<FileBarChart size={24} />}
                actions={
                    tab ? (
                        <>
                            <Button variant="secondary" icon={<Printer size={16} />} onClick={() => window.print()} disabled={!hasRows}>
                                Imprimir
                            </Button>
                            <Button variant="primary" icon={<Download size={16} />} onClick={exportCsv} disabled={!hasRows}>
                                Exportar (Excel)
                            </Button>
                        </>
                    ) : undefined
                }
            />

            {tabs.length > 0 && (
                <div className={styles.tabs} role="tablist">
                    {tabs.map(item => (
                        <button
                            key={item.key}
                            type="button"
                            role="tab"
                            aria-selected={tab === item.key}
                            className={`${styles.tab} ${toneClass(item.tone)} ${tab === item.key ? styles.tabActive : ''}`}
                            onClick={() => router.replace(`/reports?tab=${item.key}`)}
                        >
                            <span className={styles.tabIcon}>{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </div>
            )}

            {tab && (
                <div className={schedules.noPrint}>
                    <FilterBar>
                        <label className={schedules.field}>
                            <span className={schedules.fieldLabel}>Turma</span>
                            <select className={schedules.nativeSelect} value={classUuid} onChange={e => setClassUuid(e.target.value)}>
                                {tab === 'students' ? <option value="">Todas (ano letivo atual)</option> : !classes.length && <option value="">Sem turmas</option>}
                                {classes.map(item => (
                                    <option key={item.uuid} value={item.uuid}>
                                        {item.name} ({item.year})
                                    </option>
                                ))}
                            </select>
                        </label>
                        {tab === 'students' && (
                            <label className={schedules.field}>
                                <span className={schedules.fieldLabel}>Género</span>
                                <select className={schedules.nativeSelect} value={gender} onChange={e => setGender(e.target.value)}>
                                    <option value="">Todos</option>
                                    <option value="FEMALE">Feminino</option>
                                    <option value="MALE">Masculino</option>
                                </select>
                            </label>
                        )}
                        {tab === 'attendance' && (
                            <>
                                <label className={schedules.field}>
                                    <span className={schedules.fieldLabel}>De</span>
                                    <input type="date" className={schedules.input} value={from} max={to} onChange={e => e.target.value && setFrom(e.target.value)} />
                                </label>
                                <label className={schedules.field}>
                                    <span className={schedules.fieldLabel}>Até</span>
                                    <input type="date" className={schedules.input} value={to} min={from} onChange={e => e.target.value && setTo(e.target.value)} />
                                </label>
                            </>
                        )}
                        {tab === 'performance' && (
                            <label className={schedules.field}>
                                <span className={schedules.fieldLabel}>Período</span>
                                <select className={schedules.nativeSelect} value={period} onChange={e => setPeriod(e.target.value as AcademicPeriod)}>
                                    {PERIODS.map(item => (
                                        <option key={item} value={item}>
                                            {ACADEMIC_PERIOD_LABELS[item]}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        )}
                    </FilterBar>
                </div>
            )}

            {error && (
                <div className={finance.card} role="alert">
                    {error}
                </div>
            )}

            {tab === 'students' && (
                <>
                    <div className={dash.kpis}>
                        <KpiTile tone="blue" label="Alunos" icon={<Users size={18} />} value={students ? String(students.totals.total) : '…'} foot={<span>{students?.class ? scope : students?.academicYear ? `Ano letivo ${students.academicYear.name}` : scope}</span>} />
                        <KpiTile tone="pink" label="Feminino" icon={<UserCheck size={18} />} value={students ? String(students.totals.female) : '…'} foot={<span>{students?.totals.total ? pct(Math.round((students.totals.female / students.totals.total) * 1000) / 10) : '—'} do total</span>} />
                        <KpiTile tone="teal" label="Masculino" icon={<UserCheck size={18} />} value={students ? String(students.totals.male) : '…'} foot={<span>{students?.totals.total ? pct(Math.round((students.totals.male / students.totals.total) * 1000) / 10) : '—'} do total</span>} />
                    </div>
                    <TableCard title="Alunos matriculados" hint={scope}>
                        <h2 className={styles.printTitle}>Alunos matriculados — {scope}</h2>
                        {loading || !students ? (
                            <LoadingRows />
                        ) : students.rows.length === 0 ? (
                            <EmptyBox icon={<Users size={24} />} title="Sem alunos" text="Não há matrículas ativas com estes filtros." />
                        ) : (
                            <div className={finance.tableScroll}>
                                <table className={finance.dataTable}>
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Aluno</th>
                                            <th>Género</th>
                                            <th>Nascimento</th>
                                            <th>Turma</th>
                                            <th>Matrícula</th>
                                            <th>Encarregado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.rows.map(row => (
                                            <tr key={`${row.uuid}-${row.enrollmentNumber}`}>
                                                <td>{row.index}</td>
                                                <td>
                                                    <Person name={row.name} sub={`Nº ${row.studentNumber}`} />
                                                </td>
                                                <td>{row.gender ? GENDER[row.gender] : '—'}</td>
                                                <td>{formatDisplayDate(row.birthDate) || '—'}</td>
                                                <td>{row.className}</td>
                                                <td>
                                                    {row.enrollmentNumber}
                                                    <span className={finance.cellSub}>{formatDisplayDate(row.enrollmentDate)}</span>
                                                </td>
                                                <td>
                                                    {row.guardian || '—'}
                                                    {row.phone && <span className={finance.cellSub}>{row.phone}</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </TableCard>
                </>
            )}

            {tab === 'attendance' && (
                <>
                    <div className={dash.kpis}>
                        <KpiTile tone="green" label="Taxa de presença" icon={<CalendarCheck size={18} />} value={attendance ? pct(attendance.totals.rate) : '…'} foot={<span>Presenças e atrasos, sem as justificadas</span>} />
                        <KpiTile tone="orange" label="Faltas" icon={<CalendarOff size={18} />} value={attendance ? String(attendance.totals.absent) : '…'} foot={<span>{attendance ? `${attendance.totals.excused} justificada(s) · ${attendance.totals.late} atraso(s)` : ' '}</span>} />
                        <KpiTile tone="red" label="Alunos em risco" icon={<AlertTriangle size={18} />} value={attendance ? String(attendance.totals.atRisk) : '…'} alert={!!attendance?.totals.atRisk} foot={<span>Presença abaixo de 75%</span>} />
                    </div>
                    <TableCard title="Assiduidade por aluno" hint={attendance ? `${scope} · ${formatDisplayDate(attendance.period.from)} a ${formatDisplayDate(attendance.period.to)}` : scope}>
                        <h2 className={styles.printTitle}>
                            Assiduidade — {scope}
                            {attendance ? ` · ${formatDisplayDate(attendance.period.from)} a ${formatDisplayDate(attendance.period.to)}` : ''}
                        </h2>
                        {!classUuid ? (
                            <EmptyBox icon={<CalendarCheck size={24} />} title="Escolha a turma" />
                        ) : loading || !attendance ? (
                            <LoadingRows />
                        ) : attendance.rows.length === 0 ? (
                            <EmptyBox icon={<Users size={24} />} title="Sem alunos" text="A turma não tem matrículas ativas." />
                        ) : (
                            <div className={finance.tableScroll}>
                                <table className={finance.dataTable}>
                                    <thead>
                                        <tr>
                                            <th>Aluno</th>
                                            <th className={finance.right}>Presenças</th>
                                            <th className={finance.right}>Atrasos</th>
                                            <th className={finance.right}>Faltas</th>
                                            <th className={finance.right}>Justificadas</th>
                                            <th className={finance.right}>Presença</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attendance.rows.map(row => (
                                            <tr key={row.uuid}>
                                                <td>
                                                    <Person name={row.name} sub={`Nº ${row.studentNumber} · ${row.total} registo(s)`} />
                                                </td>
                                                <td className={finance.right}>{row.present}</td>
                                                <td className={finance.right}>{row.late}</td>
                                                <td className={`${finance.right} ${row.absent ? styles.scoreBad : ''}`}>{row.absent}</td>
                                                <td className={finance.right}>{row.excused}</td>
                                                <td className={`${finance.right} ${row.rate !== null && row.rate < 75 ? styles.scoreBad : ''}`}>{pct(row.rate)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </TableCard>
                </>
            )}

            {tab === 'performance' && (
                <>
                    <div className={dash.kpis}>
                        <KpiTile tone="purple" label="Média da turma" icon={<TrendingUp size={18} />} value={performance ? one(performance.totals.average) : '…'} foot={<span>{performance ? `${performance.totals.withScores} de ${performance.totals.students} aluno(s) com notas` : ' '}</span>} />
                        <KpiTile tone="green" label="Com média positiva" icon={<Award size={18} />} value={performance ? String(performance.totals.approved) : '…'} foot={<span>Média ≥ 10 no período</span>} />
                        <KpiTile tone="red" label="Com negativas" icon={<AlertTriangle size={18} />} value={performance ? String(performance.totals.withNegatives) : '…'} alert={!!performance?.totals.withNegatives} foot={<span>Pelo menos uma disciplina abaixo de 10</span>} />
                    </div>
                    <TableCard title="Aproveitamento por disciplina" hint={`${scope} · ${ACADEMIC_PERIOD_LABELS[period]}`}>
                        <h2 className={styles.printTitle}>
                            Aproveitamento — {scope} · {ACADEMIC_PERIOD_LABELS[period]}
                        </h2>
                        {!classUuid ? (
                            <EmptyBox icon={<BarChart3 size={24} />} title="Escolha a turma" />
                        ) : loading || !performance ? (
                            <LoadingRows />
                        ) : performance.rows.length === 0 ? (
                            <EmptyBox icon={<Users size={24} />} title="Sem alunos" text="A turma não tem matrículas ativas." />
                        ) : (
                            <div className={finance.tableScroll}>
                                <table className={finance.dataTable}>
                                    <thead>
                                        <tr>
                                            <th>Aluno</th>
                                            {performance.subjects.map(subject => (
                                                <th key={subject.name} className={finance.right} title={subject.name}>
                                                    {subject.code || subject.name}
                                                </th>
                                            ))}
                                            <th className={finance.right}>Média</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {performance.rows.map(row => (
                                            <tr key={row.uuid}>
                                                <td>
                                                    <Person name={row.name} sub={`Nº ${row.studentNumber}${row.negatives ? ` · ${row.negatives} negativa(s)` : ''}`} />
                                                </td>
                                                {row.scores.map((score, index) => (
                                                    <td key={index} className={`${finance.right} ${score !== null && score < 10 ? styles.scoreBad : ''}`}>
                                                        {one(score)}
                                                    </td>
                                                ))}
                                                <td className={`${finance.right} ${finance.amountStrong} ${row.average !== null && row.average < 10 ? styles.scoreBad : ''}`}>{one(row.average)}</td>
                                            </tr>
                                        ))}
                                        <tr>
                                            <td>
                                                <strong>Média da disciplina</strong>
                                            </td>
                                            {performance.subjects.map(subject => (
                                                <td key={subject.name} className={`${finance.right} ${finance.amountStrong}`}>
                                                    {one(subject.average)}
                                                    <span className={finance.cellSub}>
                                                        {subject.approved}✓ · {subject.failed}✗
                                                    </span>
                                                </td>
                                            ))}
                                            <td className={`${finance.right} ${finance.amountStrong}`}>{one(performance.totals.average)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </TableCard>
                </>
            )}

            {others.length > 0 && (
                <TableCard title="Outros relatórios" hint="Disponíveis nos respetivos módulos">
                    <div className={styles.links} style={{ padding: 16 }}>
                        {others.map(item => (
                            <Link key={item.href} href={item.href} className={`${styles.linkCard} ${toneClass(item.tone)}`}>
                                <span className={styles.tabIcon} style={{ width: 36, height: 36, borderRadius: 10 }}>
                                    {item.icon}
                                </span>
                                <span>
                                    <span className={styles.linkTitle}>{item.label}</span>
                                    <span className={styles.linkText}>{item.text}</span>
                                </span>
                            </Link>
                        ))}
                    </div>
                </TableCard>
            )}

            {!tab && !others.length && <EmptyBox icon={<FileBarChart size={24} />} title="Sem relatórios disponíveis" text="O seu perfil não tem acesso a nenhum relatório." />}
        </div>
    );
}

export default function ReportsPage() {
    return (
        <Suspense fallback={null}>
            <ReportsContent />
        </Suspense>
    );
}
