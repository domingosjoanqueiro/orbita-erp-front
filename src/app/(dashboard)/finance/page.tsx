// src/app/(dashboard)/finance/page.tsx

'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowDownCircle, ArrowUpCircle, Banknote, BarChart3, CreditCard, Gauge, Receipt, Scale, Sparkles, TrendingDown, Wallet } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button/Button';
import { usePermission } from '@/shared/hooks/usePermission';
import { getApiErrorMessage } from '@/shared/utils/api.utils';
import { formatDisplayDate } from '@/shared/utils/date.utils';
import { financeService } from '@/features/finance/services/finance.service';
import { FinanceNav } from '@/features/finance/components/FinanceUI';
import type { Debtor, FinanceSummary, Payment } from '@/features/finance/types/finance.types';
import { formatMoney, todayIso } from '@/features/finance/utils/format';
import { Card, DashboardHero, dashboardStyles as styles, Delta, HBars, initials, KpiTile, ListItem, MonthColumns, Skeleton } from '@/features/dashboard-kit/DashboardKit';

type Preset = 'month' | 'lastMonth' | 'year' | 'custom';

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function rangeOf(preset: Preset): { from: string; to: string } {
    const now = new Date();
    if (preset === 'lastMonth') {
        return { from: iso(new Date(now.getFullYear(), now.getMonth() - 1, 1)), to: iso(new Date(now.getFullYear(), now.getMonth(), 0)) };
    }
    if (preset === 'year') return { from: `${now.getFullYear()}-01-01`, to: todayIso() };
    return { from: iso(new Date(now.getFullYear(), now.getMonth(), 1)), to: todayIso() };
}

// "1,2 M" / "350 mil" para os eixos
const compactMoney = (value: number) => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toLocaleString('pt-PT', { maximumFractionDigits: 1 })} M`;
    if (value >= 1_000) return `${(value / 1_000).toLocaleString('pt-PT', { maximumFractionDigits: 1 })} mil`;
    return value.toLocaleString('pt-PT');
};

const PRESETS: { key: Preset; label: string }[] = [
    { key: 'month', label: 'Este mês' },
    { key: 'lastMonth', label: 'Mês passado' },
    { key: 'year', label: 'Este ano' },
    { key: 'custom', label: 'Datas' },
];

export default function FinanceDashboardPage() {
    const { hasPermission } = usePermission();
    const router = useRouter();
    const [preset, setPreset] = useState<Preset>('month');
    const [custom, setCustom] = useState(rangeOf('month'));
    const range = useMemo(() => (preset === 'custom' ? custom : rangeOf(preset)), [preset, custom]);
    const [summary, setSummary] = useState<FinanceSummary | null>(null);
    const [debtors, setDebtors] = useState<Debtor[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (range.from > range.to) return;
        try {
            setError(null);
            const [result, top, recent] = await Promise.all([
                financeService.summary(range.from, range.to),
                financeService.debtors({ page: 1, limit: 5 }),
                financeService.payments({ page: 1, limit: 6, paymentStatus: 'VALID' }),
            ]);
            setSummary(result);
            setDebtors(top.data);
            setPayments(recent.data);
        } catch (err) {
            setError(getApiErrorMessage(err, 'Não foi possível carregar o resumo financeiro.'));
        }
    }, [range]);

    useEffect(() => {
        load();
    }, [load]);

    const periodText = `${formatDisplayDate(range.from)} – ${formatDisplayDate(range.to)}`;
    const rate = summary?.billed.rate ?? null;

    return (
        <div className={styles.root}>
            <DashboardHero
                eyebrow="Financeiro"
                icon={<Wallet size={24} />}
                title="Visão financeira"
                subtitle={`Propinas, pagamentos e despesas · ${periodText}`}
                actions={
                    <>
                        <div className={styles.segmented} role="tablist" aria-label="Período">
                            {PRESETS.map(item => (
                                <button
                                    key={item.key}
                                    type="button"
                                    role="tab"
                                    aria-selected={preset === item.key}
                                    className={`${styles.segment} ${preset === item.key ? styles.segmentActive : ''}`}
                                    onClick={() => setPreset(item.key)}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                        {preset === 'custom' && (
                            <>
                                <input type="date" className={styles.dateInput} value={custom.from} max={custom.to} onChange={e => setCustom({ ...custom, from: e.target.value })} aria-label="De" />
                                <input type="date" className={styles.dateInput} value={custom.to} min={custom.from} max={todayIso()} onChange={e => setCustom({ ...custom, to: e.target.value })} aria-label="Até" />
                            </>
                        )}
                        {hasPermission('finance.payments') && (
                            <Button icon={<Wallet size={16} />} onClick={() => router.push('/finance/cashier')}>
                                Receber pagamento
                            </Button>
                        )}
                    </>
                }
            />
            <FinanceNav />

            {error && <div className={styles.card} role="alert">{error}</div>}

            {!summary ? (
                <>
                    <div className={styles.kpis}>
                        {[0, 1, 2, 3].map(i => (
                            <Skeleton key={i} height={128} />
                        ))}
                    </div>
                    <Skeleton height={320} />
                </>
            ) : (
                <>
                    <div className={styles.kpis}>
                        <KpiTile
                            tone="green" label="Recebido"
                            icon={<ArrowDownCircle size={18} />}
                            value={formatMoney(summary.collected.total)}
                            foot={
                                <>
                                    <Delta current={summary.collected.total} previous={summary.previous.collected} />
                                    <span>vs. período anterior · {summary.collected.count} recibo(s)</span>
                                </>
                            }
                            href="/finance/payments"
                        />
                        <KpiTile
                            tone="orange" label="Despesas"
                            icon={<ArrowUpCircle size={18} />}
                            value={formatMoney(summary.expenses.total)}
                            foot={
                                <>
                                    <Delta current={summary.expenses.total} previous={summary.previous.expenses} higherIsBetter={false} />
                                    <span>vs. período anterior</span>
                                </>
                            }
                            href="/finance/expenses"
                        />
                        <KpiTile
                            tone="blue" label="Saldo do período"
                            icon={<Scale size={18} />}
                            value={formatMoney(summary.balance)}
                            alert={summary.balance < 0}
                            foot={<span>Recebido menos despesas</span>}
                        />
                        <KpiTile
                            tone="red" label="Em atraso hoje"
                            icon={<AlertTriangle size={18} />}
                            value={formatMoney(summary.overdue.total)}
                            alert={summary.overdue.total > 0}
                            foot={<span>{summary.overdue.students} aluno(s) · em aberto {formatMoney(summary.outstanding.total)}</span>}
                            href="/finance/debtors"
                        />
                    </div>

                    <div className={styles.row2}>
                        <Card icon={<BarChart3 size={16} />} tone="blue" title="Entradas e saídas" subtitle="Recebido e despesas nos últimos 12 meses">
                            <MonthColumns
                                data={summary.monthly.map(point => ({ month: point.month, values: [point.collected, point.expenses] }))}
                                series={['Recebido', 'Despesas']}
                                format={value => formatMoney(value)}
                                compact={compactMoney}
                                footer={values => (
                                    <div className={styles.tooltipRow} style={{ borderTop: '1px solid var(--border-color)', marginTop: 4, paddingTop: 4 }}>
                                        <span>Saldo</span>
                                        <strong>{formatMoney(values[0] - values[1])}</strong>
                                    </div>
                                )}
                            />
                        </Card>

                        <Card icon={<Gauge size={16} />} tone="green" title="Cobrança do período" subtitle="Valores com vencimento no período">
                            <div className={styles.meter}>
                                <span className={styles.meterValue}>{rate === null ? '—' : `${rate.toLocaleString('pt-PT')}%`}</span>
                                <div className={styles.meterTrack} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={rate ?? 0} aria-label="Taxa de cobrança">
                                    <div className={styles.meterFill} style={{ width: `${Math.min(100, rate ?? 0)}%` }} />
                                </div>
                                <span className={styles.cardSubtitle}>{rate === null ? 'Sem vencimentos no período.' : 'do valor faturado já foi pago'}</span>
                            </div>
                            <div className={styles.statGrid}>
                                <div className={styles.stat}>
                                    <span className={styles.statLabel}>Faturado</span>
                                    <span className={styles.statValue}>{formatMoney(summary.billed.total)}</span>
                                </div>
                                <div className={styles.stat}>
                                    <span className={styles.statLabel}>Já pago</span>
                                    <span className={styles.statValue}>{formatMoney(summary.billed.paid)}</span>
                                </div>
                                <div className={styles.stat}>
                                    <span className={styles.statLabel}>Multas recebidas</span>
                                    <span className={styles.statValue}>{formatMoney(summary.collected.fines)}</span>
                                </div>
                                <div className={styles.stat}>
                                    <span className={styles.statLabel}>Alunos com dívida</span>
                                    <span className={styles.statValue}>{summary.outstanding.students}</span>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div className={styles.row3}>
                        <Card icon={<CreditCard size={16} />} tone="teal" title="Formas de pagamento" subtitle="Recebido no período">
                            <HBars
                                items={summary.byMethod.map(row => ({ label: row.label, value: row.total, display: formatMoney(row.total) }))}
                                showShare
                                empty="Sem pagamentos no período."
                            />
                        </Card>
                        <Card icon={<AlertTriangle size={16} />} tone="red" title="Dívida por classe" subtitle="Em atraso hoje" link={{ href: '/finance/debtors', label: 'Devedores' }}>
                            <HBars
                                items={summary.outstandingByGrade
                                    .filter(row => row.overdue > 0)
                                    .sort((a, b) => b.overdue - a.overdue)
                                    .map(row => ({ label: row.name, value: row.overdue, display: formatMoney(row.overdue) }))}
                                empty="Nenhuma classe com valores em atraso."
                            />
                        </Card>
                        <Card icon={<Banknote size={16} />} tone="orange" title="Despesas por categoria" subtitle="No período" link={{ href: '/finance/expenses', label: 'Despesas' }}>
                            <HBars
                                items={summary.expenses.byCategory.map(row => ({ label: row.name, value: row.total, display: formatMoney(row.total) }))}
                                showShare
                                empty="Sem despesas no período."
                            />
                        </Card>
                    </div>

                    <div className={styles.rowHalf}>
                        <Card icon={<TrendingDown size={16} />} tone="red" title="Maiores dívidas em atraso" link={{ href: '/finance/debtors', label: 'Ver todos' }}>
                            {debtors.length === 0 ? (
                                <p className={styles.empty}>Nenhum aluno com pagamentos em atraso.</p>
                            ) : (
                                <div className={styles.list}>
                                    {debtors.map(debtor => (
                                        <ListItem
                                            key={debtor.student.uuid}
                                            avatar={initials(debtor.student.name)}
                                            title={debtor.student.name}
                                            meta={`${debtor.class ? `${debtor.class.gradeName} · ${debtor.class.name} · ` : ''}${debtor.maxDaysOverdue} dia(s) de atraso`}
                                            value={formatMoney(debtor.total)}
                                            valueBad
                                            href={`/finance/cashier?student=${debtor.student.uuid}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </Card>
                        <Card icon={<Receipt size={16} />} tone="green" title="Últimos pagamentos" link={{ href: '/finance/payments', label: 'Recibos' }}>
                            {payments.length === 0 ? (
                                <p className={styles.empty}>Ainda não há pagamentos.</p>
                            ) : (
                                <div className={styles.list}>
                                    {payments.map(payment => (
                                        <ListItem
                                            key={payment.uuid}
                                            avatar={initials(payment.student.name)}
                                            title={payment.student.name}
                                            meta={`${payment.receiptNumber} · ${formatDisplayDate(payment.paymentDate)} · ${payment.methodLabel}`}
                                            value={formatMoney(payment.amount)}
                                            href={`/finance/receipts/${payment.uuid}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </Card>
                    </div>

                    {summary.collected.total === 0 && summary.outstanding.total === 0 && hasPermission('finance.manage') && (
                        <Card icon={<Sparkles size={16} />} tone="purple" title="Primeiros passos" subtitle="Ainda não há movimentos financeiros">
                            <div className={styles.list}>
                                <ListItem avatar="1" title="Criar tipos de cobrança e preços" meta="Propina mensal, matrícula, exames… por ano e classe" href="/finance/fees" />
                                <ListItem avatar="2" title="Gerar as cobranças dos alunos" meta="A partir da tabela de propinas, para as matrículas ativas" href="/finance/charges" />
                                <ListItem avatar="3" title="Receber pagamentos no Caixa" meta="Recibo emitido na hora" href="/finance/cashier" />
                                <ListItem avatar={<Banknote size={16} />} title="Registar despesas" meta="Energia, água, material, salários…" href="/finance/expenses" />
                            </div>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}
