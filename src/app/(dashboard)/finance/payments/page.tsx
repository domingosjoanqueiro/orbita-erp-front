// src/app/(dashboard)/finance/payments/page.tsx

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Ban, Receipt as ReceiptIcon, Wallet } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button/Button';
import { Pagination } from '@/shared/components/ui/Pagination/Pagination';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { usePermission } from '@/shared/hooks/usePermission';
import { getApiErrorMessage } from '@/shared/utils/api.utils';
import { formatDisplayDate } from '@/shared/utils/date.utils';
import { financeService } from '@/features/finance/services/finance.service';
import { EmptyBox, FilterBar, FinancePage, LoadingRows, Person, TableCard } from '@/features/finance/components/FinancePageKit';
import { PAYMENT_METHOD_LABELS, type ListResult, type Payment } from '@/features/finance/types/finance.types';
import { firstOfMonthIso, formatMoney, todayIso } from '@/features/finance/utils/format';
import { dashboardStyles as dash, KpiTile } from '@/features/dashboard-kit/DashboardKit';
import schedules from '@/features/academic/schedules/components/Schedules.module.css';
import styles from '@/features/finance/components/finance.module.css';

const DEFAULTS = { search: '', from: firstOfMonthIso(), to: todayIso(), method: '', status: '' };

export default function PaymentsPage() {
    const router = useRouter();
    const { hasPermission } = usePermission();
    const [filters, setFilters] = useState(DEFAULTS);
    const debounced = useDebounce(filters.search.trim(), 400);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [result, setResult] = useState<ListResult<Payment> | null>(null);
    const [error, setError] = useState<string | null>(null);

    const set = (changes: Partial<typeof DEFAULTS>) => setFilters(prev => ({ ...prev, ...changes }));
    const dirty = JSON.stringify(filters) !== JSON.stringify(DEFAULTS);

    const load = useCallback(async () => {
        try {
            setError(null);
            setResult(await financeService.payments({ page, limit, from: filters.from, to: filters.to, method: filters.method, paymentStatus: filters.status, search: debounced }));
        } catch (err) {
            setError(getApiErrorMessage(err, 'Não foi possível carregar os recibos.'));
        }
    }, [page, limit, filters.from, filters.to, filters.method, filters.status, debounced]);

    useEffect(() => {
        load();
    }, [load]);
    useEffect(() => {
        setPage(1);
    }, [filters.from, filters.to, filters.method, filters.status, debounced]);

    const meta = result?.meta;
    const validCount = meta ? meta.total - (meta.voidedCount ?? 0) : 0;

    return (
        <FinancePage
            title="Recibos"
            subtitle="Pagamentos recebidos e recibos emitidos"
            icon={<ReceiptIcon size={24} />}
            actions={
                hasPermission('finance.payments') && (
                    <Button icon={<Wallet size={16} />} onClick={() => router.push('/finance/cashier')}>
                        Receber pagamento
                    </Button>
                )
            }
        >
            <div className={dash.kpis}>
                <KpiTile tone="green" label="Total recebido" icon={<Wallet size={18} />} value={meta ? formatMoney(meta.totalAmount ?? 0) : '…'} foot={<span>{formatDisplayDate(filters.from)} – {formatDisplayDate(filters.to)}</span>} />
                <KpiTile tone="blue" label="Recibos válidos" icon={<ReceiptIcon size={18} />} value={meta ? String(validCount) : '…'} foot={<span>Média {formatMoney(validCount ? (meta?.totalAmount ?? 0) / validCount : 0)} por recibo</span>} />
                <KpiTile tone="orange" label="Multas recebidas" icon={<ReceiptIcon size={18} />} value={meta ? formatMoney(meta.finesAmount ?? 0) : '…'} foot={<span>Incluídas no total</span>} />
                <KpiTile tone="pink" label="Anulados" icon={<Ban size={18} />} value={meta ? String(meta.voidedCount ?? 0) : '…'} alert={!!meta?.voidedCount} foot={<span>Não contam nos totais</span>} />
            </div>

            <FilterBar onClear={() => setFilters(DEFAULTS)} active={dirty}>
                <label className={`${schedules.field} ${styles.filterSearch}`}>
                    <span className={schedules.fieldLabel}>Pesquisar</span>
                    <input className={schedules.input} value={filters.search} onChange={e => set({ search: e.target.value })} placeholder="Nº do recibo, referência ou aluno" />
                </label>
                <label className={schedules.field}>
                    <span className={schedules.fieldLabel}>De</span>
                    <input type="date" className={schedules.input} value={filters.from} max={filters.to} onChange={e => set({ from: e.target.value })} />
                </label>
                <label className={schedules.field}>
                    <span className={schedules.fieldLabel}>Até</span>
                    <input type="date" className={schedules.input} value={filters.to} min={filters.from} onChange={e => set({ to: e.target.value })} />
                </label>
                <label className={schedules.field}>
                    <span className={schedules.fieldLabel}>Forma</span>
                    <select className={schedules.nativeSelect} value={filters.method} onChange={e => set({ method: e.target.value })}>
                        <option value="">Todas</option>
                        {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                </label>
                <label className={schedules.field}>
                    <span className={schedules.fieldLabel}>Estado</span>
                    <select className={schedules.nativeSelect} value={filters.status} onChange={e => set({ status: e.target.value })}>
                        <option value="">Todos</option>
                        <option value="VALID">Válidos</option>
                        <option value="VOIDED">Anulados</option>
                    </select>
                </label>
            </FilterBar>

            {error && <div className={styles.card} role="alert">{error}</div>}

            <TableCard
                title="Recibos"
                hint={meta ? `${meta.total} resultado(s)` : undefined}
                footer={
                    result && result.meta.total > 0 ? (
                        <Pagination
                            page={page}
                            totalPages={result.meta.totalPages}
                            total={result.meta.total}
                            limit={limit}
                            onPageChange={setPage}
                            onLimitChange={value => {
                                setLimit(value);
                                setPage(1);
                            }}
                            itemLabel="recibos"
                        />
                    ) : undefined
                }
            >
                {!result ? (
                    <LoadingRows />
                ) : result.data.length === 0 ? (
                    <EmptyBox
                        icon={<ReceiptIcon size={24} />}
                        title="Nenhum recibo no período"
                        text="Os pagamentos registados no Caixa aparecem aqui com o recibo pronto a imprimir."
                        action={
                            dirty && (
                                <Button variant="secondary" onClick={() => setFilters(DEFAULTS)}>
                                    Limpar filtros
                                </Button>
                            )
                        }
                    />
                ) : (
                    <table className={styles.dataTable}>
                        <thead>
                            <tr>
                                <th>Recibo</th>
                                <th>Aluno</th>
                                <th>Forma</th>
                                <th className={styles.right}>Valor</th>
                                <th>Recebido por</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {result.data.map(payment => (
                                <tr key={payment.uuid} className={`${styles.rowClickable} ${payment.status === 'VOIDED' ? styles.rowMuted : ''}`} onClick={() => router.push(`/finance/receipts/${payment.uuid}`)}>
                                    <td>
                                        <Link href={`/finance/receipts/${payment.uuid}`} className={styles.linkStrong} onClick={e => e.stopPropagation()}>
                                            {payment.receiptNumber}
                                        </Link>
                                        <span className={styles.cellSub}>{formatDisplayDate(payment.paymentDate)}</span>
                                    </td>
                                    <td onClick={e => e.stopPropagation()}>
                                        <Person name={payment.student.name} sub={`Nº ${payment.student.number}`} href={`/finance/cashier?student=${payment.student.uuid}`} />
                                    </td>
                                    <td>
                                        {payment.methodLabel}
                                        {payment.reference && <span className={styles.cellSub}>{payment.reference}</span>}
                                    </td>
                                    <td className={`${styles.right} ${styles.amountStrong}`}>
                                        {formatMoney(payment.amount)}
                                        {payment.finesAmount > 0 && <span className={styles.cellSub}>multa {formatMoney(payment.finesAmount)}</span>}
                                    </td>
                                    <td>{payment.receivedBy ?? '—'}</td>
                                    <td>
                                        {payment.status === 'VOIDED' ? (
                                            <span className={`${styles.pill} ${styles.pillCancelled}`} title={payment.voidedReason ?? ''}>
                                                Anulado
                                            </span>
                                        ) : (
                                            <span className={`${styles.pill} ${styles.pillPaid}`}>Válido</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </TableCard>
        </FinancePage>
    );
}
