'use client';

import React from 'react';
import { Wallet } from 'lucide-react';
import { useStudentFinance } from '@/features/student-portal/hooks/useStudentPortal';
import { EmptyState, ErrorState, ListSkeleton } from '@/features/student-portal/components/PortalUI/PortalUI';
import { ChargeStatusPill } from '@/features/finance/components/FinanceUI';
import { formatDisplayDate } from '@/shared/utils/date.utils';
import { formatMoney } from '@/features/finance/utils/format';
import styles from '@/features/student-portal/styles/portal.module.css';
import finance from '@/features/finance/components/finance.module.css';

// Situação financeira do aluno: o que deve, o que vence e os recibos
export default function StudentFinancePage() {
    const { data, isLoading, isError, error, refetch } = useStudentFinance();

    if (isLoading) return <ListSkeleton rows={6} />;
    if (isError) return <ErrorState error={error} onRetry={() => refetch()} />;
    if (!data) return null;

    const open = data.charges.filter(charge => charge.status === 'PENDING' || charge.status === 'PARTIAL');
    const paid = data.charges.filter(charge => charge.status === 'PAID').slice(-6).reverse();

    return (
        <div className={styles.page}>
            <div className={finance.kpis}>
                <div className={`${finance.kpi} ${data.totals.overdue > 0 ? finance.kpiDanger : ''}`}>
                    <span className={finance.kpiLabel}>Em dívida</span>
                    <span className={finance.kpiValue}>{formatMoney(data.totals.totalDue)}</span>
                    <span className={finance.kpiHint}>
                        {data.totals.overdue > 0 ? `${formatMoney(data.totals.overdue)} em atraso` : 'Sem pagamentos em atraso'}
                    </span>
                </div>
                <div className={finance.kpi}>
                    <span className={finance.kpiLabel}>Próximo pagamento</span>
                    <span className={finance.kpiValue}>{data.totals.nextDue ? formatMoney(data.totals.nextDue.totalDue) : '—'}</span>
                    <span className={finance.kpiHint}>
                        {data.totals.nextDue ? `${data.totals.nextDue.description} · até ${formatDisplayDate(data.totals.nextDue.dueDate)}` : 'Nada a vencer'}
                    </span>
                </div>
            </div>

            <section className={styles.card}>
                <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>Por pagar</h3>
                {open.length === 0 ? (
                    <EmptyState icon={<Wallet size={26} />} title="Tudo em dia" text="Não tem valores por pagar." />
                ) : (
                    open.map(charge => (
                        <div key={charge.uuid} className={finance.listRow}>
                            <span style={{ minWidth: 0 }}>
                                <strong>{charge.description}</strong>
                                <br />
                                <span className={finance.muted}>
                                    Até {formatDisplayDate(charge.dueDate)}
                                    {charge.fineDue > 0 ? ` · inclui multa de ${formatMoney(charge.fineDue)}` : ''}
                                </span>
                            </span>
                            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                <span className={`${finance.amount} ${finance.amountStrong}`}>{formatMoney(charge.totalDue)}</span>
                                <ChargeStatusPill charge={charge} />
                            </span>
                        </div>
                    ))
                )}
                <p className={finance.muted} style={{ marginTop: 10 }}>
                    Os pagamentos são feitos na secretaria ou por M-Pesa, e-Mola ou banco. Apresente a referência na secretaria para emitir o recibo.
                </p>
            </section>

            <section className={styles.card}>
                <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>Recibos</h3>
                {data.payments.length === 0 ? (
                    <p className={finance.muted}>Ainda não há pagamentos registados.</p>
                ) : (
                    data.payments.map(payment => (
                        <div key={payment.uuid} className={finance.listRow} style={{ opacity: payment.status === 'VOIDED' ? 0.55 : 1 }}>
                            <span>
                                <strong>{payment.receiptNumber}</strong>
                                <br />
                                <span className={finance.muted}>
                                    {formatDisplayDate(payment.paymentDate)} · {payment.methodLabel}
                                    {payment.status === 'VOIDED' ? ' · anulado' : ''}
                                </span>
                            </span>
                            <span className={finance.amount}>{formatMoney(payment.amount)}</span>
                        </div>
                    ))
                )}
            </section>

            {paid.length > 0 && (
                <section className={styles.card}>
                    <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>Pagos recentemente</h3>
                    {paid.map(charge => (
                        <div key={charge.uuid} className={finance.listRow}>
                            <span>{charge.description}</span>
                            <ChargeStatusPill charge={charge} />
                        </div>
                    ))}
                </section>
            )}
        </div>
    );
}
