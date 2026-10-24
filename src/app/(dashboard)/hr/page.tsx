// src/app/(dashboard)/hr/page.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Cake, CalendarOff, FileWarning, Inbox, PieChart, Plus, UserCheck, UserPlus, Users, Wallet } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button/Button';
import { usePermission } from '@/shared/hooks/usePermission';
import { getApiErrorMessage } from '@/shared/utils/api.utils';
import { formatDisplayDate } from '@/shared/utils/date.utils';
import { formatMoney } from '@/features/finance/utils/format';
import { HrNav } from '@/features/hr/HrUI';
import { CONTRACT_TYPE_LABELS, getHrSummary, type HrSummary } from '@/features/hr/hr.service';
import { Card, DashboardHero, dashboardStyles as styles, HBars, initials, KpiTile, ListItem, MonthColumns, ShareBar, Skeleton } from '@/features/dashboard-kit/DashboardKit';

const MONTH_NAMES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

const shortDate = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });

export default function HrDashboardPage() {
    const router = useRouter();
    const { hasPermission } = usePermission();
    const canManage = hasPermission('hr.manage');
    const [data, setData] = useState<HrSummary | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getHrSummary()
            .then(setData)
            .catch(err => setError(getApiErrorMessage(err, 'Não foi possível carregar o painel de RH.')));
    }, []);

    const month = MONTH_NAMES[new Date().getMonth()];

    return (
        <div className={styles.root}>
            <DashboardHero
                eyebrow="Recursos Humanos"
                icon={<Users size={24} />}
                title="Equipa da escola"
                subtitle={data ? `${data.headcount.total} pessoas ativas · ${data.headcount.teachers} professores e ${data.headcount.staff} de outro pessoal` : 'Pessoal, contratos e ausências'}
                actions={
                    canManage && (
                        <>
                            <Button variant="secondary" icon={<CalendarOff size={16} />} onClick={() => router.push('/hr/leaves')}>
                                Pedidos{data?.pendingLeaves.total ? ` (${data.pendingLeaves.total})` : ''}
                            </Button>
                            <Button icon={<Plus size={16} />} onClick={() => router.push('/hr/employees')}>
                                Funcionários
                            </Button>
                        </>
                    )
                }
            />
            <HrNav />

            {error && <div className={styles.card} role="alert">{error}</div>}

            {!data ? (
                !error && (
                    <>
                        <div className={styles.kpis}>
                            {[0, 1, 2, 3].map(i => (
                                <Skeleton key={i} height={128} />
                            ))}
                        </div>
                        <Skeleton height={300} />
                    </>
                )
            ) : (
                <>
                    <div className={styles.kpis}>
                        <KpiTile
                            tone="blue" label="Efetivo ativo"
                            icon={<Users size={18} />}
                            value={String(data.headcount.total)}
                            foot={
                                <span>
                                    +{data.headcount.hiredThisYear} admitido(s) · {data.headcount.leftThisYear} saída(s) este ano
                                </span>
                            }
                            href="/hr/employees"
                        />
                        <KpiTile
                            tone="orange" label="Ausentes hoje"
                            icon={<UserCheck size={18} />}
                            value={String(data.absentToday.length)}
                            foot={<span>{data.upcomingLeaves.length} ausência(s) nos próximos 14 dias</span>}
                            href="/hr/leaves"
                        />
                        <KpiTile
                            tone="purple" label="Pedidos por decidir"
                            icon={<Inbox size={18} />}
                            value={String(data.pendingLeaves.total)}
                            alert={data.pendingLeaves.total > 0}
                            foot={<span>{data.pendingLeaves.total ? 'Aguardam aprovação' : 'Nada pendente'}</span>}
                            href="/hr/leaves"
                        />
                        <KpiTile
                            tone="teal" label="Folha salarial base"
                            icon={<Wallet size={18} />}
                            value={formatMoney(data.payroll.monthlyBase)}
                            foot={
                                <span>
                                    {data.payroll.contracts} contrato(s) ativo(s)
                                    {data.payroll.withoutContract ? ` · ${data.payroll.withoutContract} sem contrato` : ''}
                                </span>
                            }
                            alert={data.payroll.withoutContract > 0}
                            href="/hr/contracts"
                        />
                    </div>

                    <div className={styles.row2}>
                        <Card icon={<UserPlus size={16} />} tone="blue" title="Admissões" subtitle="Entradas por mês nos últimos 12 meses">
                            <MonthColumns
                                data={data.hiresByMonth.map(point => ({ month: point.month, values: [point.total] }))}
                                series={['Admissões']}
                                format={value => `${value} pessoa(s)`}
                            />
                        </Card>
                        <Card icon={<PieChart size={16} />} tone="purple" title="Composição da equipa">
                            <ShareBar title="Função" a={{ label: 'Professores', value: data.headcount.teachers }} b={{ label: 'Outro pessoal', value: data.headcount.staff }} />
                            <ShareBar title="Género" a={{ label: 'Mulheres', value: data.headcount.women }} b={{ label: 'Homens', value: data.headcount.men }} />
                            <div className={styles.statGrid}>
                                <div className={styles.stat}>
                                    <span className={styles.statLabel}>Admitidos este ano</span>
                                    <span className={styles.statValue}>{data.headcount.hiredThisYear}</span>
                                </div>
                                <div className={styles.stat}>
                                    <span className={styles.statLabel}>Saídas este ano</span>
                                    <span className={styles.statValue}>{data.headcount.leftThisYear}</span>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div className={styles.row3}>
                        <Card icon={<Building2 size={16} />} tone="teal" title="Por departamento" subtitle="Pessoas ativas" link={{ href: '/hr/employees', label: 'Ver todos' }}>
                            <HBars items={data.byDepartment.map(row => ({ label: row.name, value: row.total, display: String(row.total) }))} showShare empty="Sem funcionários." />
                        </Card>
                        <Card icon={<CalendarOff size={16} />} tone="orange" title="Ausências" subtitle="Hoje e próximos 14 dias" link={{ href: '/hr/leaves', label: 'Ver todas' }}>
                            {data.absentToday.length === 0 && data.upcomingLeaves.length === 0 ? (
                                <p className={styles.empty}>Ninguém ausente hoje nem nos próximos dias.</p>
                            ) : (
                                <div className={styles.list}>
                                    {[...data.absentToday.map(l => ({ ...l, now: true })), ...data.upcomingLeaves.map(l => ({ ...l, now: false }))].slice(0, 7).map(leave => (
                                        <ListItem
                                            key={leave.uuid}
                                            avatar={initials(leave.employee.name)}
                                            title={leave.employee.name}
                                            meta={`${leave.leaveTypeLabel} · ${shortDate(leave.startDate)} – ${shortDate(leave.endDate)}`}
                                            value={<span className={`${styles.tag} ${leave.now ? styles.tagWarn : ''}`}>{leave.now ? 'Ausente hoje' : `Desde ${shortDate(leave.startDate)}`}</span>}
                                        />
                                    ))}
                                </div>
                            )}
                        </Card>
                        <Card icon={<Inbox size={16} />} tone="purple" title="Pedidos por decidir" subtitle={data.pendingLeaves.total ? `${data.pendingLeaves.total} pendente(s)` : undefined} link={{ href: '/hr/leaves', label: 'Decidir' }}>
                            {data.pendingLeaves.items.length === 0 ? (
                                <p className={styles.empty}>Sem pedidos pendentes.</p>
                            ) : (
                                <div className={styles.list}>
                                    {data.pendingLeaves.items.map(leave => (
                                        <ListItem
                                            key={leave.uuid}
                                            avatar={initials(leave.employee.name)}
                                            title={leave.employee.name}
                                            meta={`${leave.leaveTypeLabel} · ${shortDate(leave.startDate)} – ${shortDate(leave.endDate)}`}
                                            value={`${leave.days} dia(s)`}
                                            href="/hr/leaves"
                                        />
                                    ))}
                                </div>
                            )}
                        </Card>
                    </div>

                    <div className={styles.rowHalf}>
                        <Card icon={<FileWarning size={16} />} tone="red" title="Contratos a terminar" subtitle="Próximos 30 dias" link={{ href: '/hr/contracts', label: 'Contratos' }}>
                            {data.expiringContracts.length === 0 ? (
                                <p className={styles.empty}>Nenhum contrato termina nos próximos 30 dias.</p>
                            ) : (
                                <div className={styles.list}>
                                    {data.expiringContracts.map(contract => (
                                        <ListItem
                                            key={contract.uuid}
                                            avatar={<FileWarning size={16} />}
                                            title={contract.employee.name}
                                            meta={`${CONTRACT_TYPE_LABELS[contract.contractType]} · ${contract.position} · até ${formatDisplayDate(contract.endDate)}`}
                                            value={contract.daysLeft < 0 ? 'Já terminou' : contract.daysLeft === 0 ? 'Hoje' : `${contract.daysLeft} dia(s)`}
                                            valueBad={contract.daysLeft <= 7}
                                            href="/hr/contracts?expiring=true"
                                        />
                                    ))}
                                </div>
                            )}
                        </Card>
                        <Card icon={<Cake size={16} />} tone="pink" title={`Aniversários de ${month}`}>
                            {data.birthdays.length === 0 ? (
                                <p className={styles.empty}>Sem aniversários este mês (ou datas de nascimento por preencher).</p>
                            ) : (
                                <div className={styles.list}>
                                    {data.birthdays.map(person => (
                                        <ListItem
                                            key={person.uuid}
                                            avatar={<Cake size={16} />}
                                            title={person.name}
                                            meta={person.position}
                                            value={<span className={`${styles.tag} ${person.day === new Date().getDate() ? styles.tagWarn : ''}`}>{person.day === new Date().getDate() ? 'Hoje!' : `Dia ${person.day}`}</span>}
                                        />
                                    ))}
                                </div>
                            )}
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}
