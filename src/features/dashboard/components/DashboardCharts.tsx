'use client';

import React, { useEffect, useState } from 'react';
import { BarChart3, BookOpen, CalendarCheck, PieChart, TrendingUp, Users } from 'lucide-react';
import { Card, dashboardStyles as dash, HBars, MonthColumns, ShareBar, Skeleton } from '@/features/dashboard-kit/DashboardKit';
import { usePermission } from '@/shared/hooks/usePermission';
import { reportsService, type DashboardOverview } from '@/features/reports/reports.service';

const one = (value: number | null | undefined) => (value === null || value === undefined ? '—' : value.toLocaleString('pt-PT', { maximumFractionDigits: 1 }));

/*
 * Gráficos do painel da escola: matrículas, alunos por classe e género,
 * assiduidade mensal, distribuição de notas e médias por disciplina.
 */
export const DashboardCharts: React.FC = () => {
    const { hasPermission } = usePermission();
    const [data, setData] = useState<DashboardOverview | null>(null);
    const [failed, setFailed] = useState(false);
    const allowed = hasPermission('students.read');

    useEffect(() => {
        if (!allowed) return;
        reportsService.overview().then(setData).catch(() => setFailed(true));
    }, [allowed]);

    if (!allowed || failed) return null;

    if (!data) {
        return (
            <div className={dash.root} style={{ marginBottom: 'var(--spacing-xl)' }}>
                <div className={dash.row2}>
                    <Skeleton height={300} />
                    <Skeleton height={300} />
                </div>
                <div className={dash.row2}>
                    <Skeleton height={300} />
                    <Skeleton height={300} />
                </div>
            </div>
        );
    }

    const yearLabel = data.academicYear ? `Ano letivo ${data.academicYear.name}` : 'Sem ano letivo';
    const enrollTotal = data.enrollmentsByMonth.reduce((sum, point) => sum + point.total, 0);
    const attendanceMonths = data.attendanceByMonth.filter(point => point.rate !== null);
    const lastAttendance = attendanceMonths[attendanceMonths.length - 1];
    const studentsTotal = data.gender.female + data.gender.male;

    return (
        <div className={dash.root} style={{ marginBottom: 'var(--spacing-xl)' }}>
            <div className={dash.row2}>
                <Card
                    title="Matrículas por mês"
                    subtitle={`Últimos 12 meses · ${enrollTotal} matrícula(s)`}
                    icon={<BookOpen size={16} />}
                    tone="blue"
                    link={{ href: '/academic/enrollments', label: 'Matrículas' }}
                >
                    <MonthColumns
                        data={data.enrollmentsByMonth.map(point => ({ month: point.month, values: [point.total] }))}
                        series={['Matrículas']}
                        format={value => `${value} matrícula(s)`}
                    />
                </Card>
                <Card title="Alunos ativos" subtitle={yearLabel} icon={<Users size={16} />} tone="purple" link={{ href: '/reports', label: 'Relatório' }}>
                    <ShareBar title="Por género" a={{ label: 'Masculino', value: data.gender.male }} b={{ label: 'Feminino', value: data.gender.female }} />
                    <div style={{ marginTop: 16 }}>
                        <HBars
                            items={data.studentsByGrade.map(row => ({ label: row.name, value: row.total }))}
                            empty="Ainda não há alunos matriculados neste ano."
                            showShare={studentsTotal > 0}
                        />
                    </div>
                </Card>
            </div>

            <div className={dash.row2}>
                <Card
                    title="Assiduidade mensal"
                    subtitle={lastAttendance ? `Último mês com registos: ${one(lastAttendance.rate)}% de presença` : 'Sem presenças registadas nos últimos 6 meses'}
                    icon={<CalendarCheck size={16} />}
                    tone="green"
                    link={{ href: '/attendance', label: 'Presenças' }}
                >
                    <MonthColumns
                        data={data.attendanceByMonth.map(point => ({ month: point.month, values: [point.rate ?? 0] }))}
                        series={['Taxa de presença']}
                        format={value => (value ? `${one(value)}%` : 'Sem registos')}
                        compact={value => `${value}%`}
                    />
                </Card>
                <Card title="Distribuição de notas" subtitle={`${yearLabel} · ${data.grades.total} média(s) final(is)`} icon={<PieChart size={16} />} tone="orange">
                    <div className={dash.statGrid} style={{ marginBottom: 14 }}>
                        <div className={dash.stat}>
                            <span className={dash.statLabel}>Média geral</span>
                            <span className={dash.statValue}>{one(data.grades.average)}</span>
                        </div>
                        <div className={dash.stat}>
                            <span className={dash.statLabel}>Aprovação</span>
                            <span className={dash.statValue}>{data.grades.approvalRate === null ? '—' : `${one(data.grades.approvalRate)}%`}</span>
                        </div>
                    </div>
                    <HBars
                        items={data.grades.total ? data.grades.distribution.map(row => ({ label: row.label, value: row.total })) : []}
                        empty="Ainda não há pautas com média final."
                        showShare
                    />
                </Card>
            </div>

            <Card
                title="Média por disciplina"
                subtitle={`${yearLabel} · escala 0–20, ordenadas da melhor para a pior`}
                icon={<BarChart3 size={16} />}
                tone="teal"
                link={{ href: '/reports?tab=performance', label: 'Aproveitamento' }}
            >
                <HBars
                    items={data.subjects.map(row => ({
                        label: row.name,
                        value: row.average,
                        display: `${one(row.average)} · ${row.approvalRate === null ? '—' : `${one(row.approvalRate)}%`} aprov.`,
                    }))}
                    empty="Ainda não há médias lançadas."
                />
                {data.subjects.length > 0 && (
                    <p style={{ margin: '12px 0 0', fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <TrendingUp size={13} /> Média final das pautas e percentagem de alunos com nota ≥ 10.
                    </p>
                )}
            </Card>
        </div>
    );
};
