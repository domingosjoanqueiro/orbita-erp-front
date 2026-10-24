// src/app/(dashboard)/finance/debtors/page.tsx

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CalendarClock, Download, Users, Wallet } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button/Button';
import { Pagination } from '@/shared/components/ui/Pagination/Pagination';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { getApiErrorMessage } from '@/shared/utils/api.utils';
import { formatDisplayDate } from '@/shared/utils/date.utils';
import { financeService } from '@/features/finance/services/finance.service';
import { DaysOverdue, EmptyBox, FilterBar, FinancePage, LoadingRows, Person, TableCard } from '@/features/finance/components/FinancePageKit';
import { useFinanceLookups } from '@/features/finance/hooks/useFinanceLookups';
import type { Debtor, ListResult } from '@/features/finance/types/finance.types';
import { formatMoney, todayIso } from '@/features/finance/utils/format';
import { dashboardStyles as dash, KpiTile } from '@/features/dashboard-kit/DashboardKit';
import schedules from '@/features/academic/schedules/components/Schedules.module.css';
import styles from '@/features/finance/components/finance.module.css';

// Exporta a lista de devedores (CSV para Excel, separador ;)
function exportCsv(rows: Debtor[]) {
    const header = ['Aluno', 'Nº', 'Turma', 'Cobranças', 'Em dívida', 'Multas', 'Total', 'Vencida desde', 'Dias em atraso'];
    const lines = rows.map(row => [
        row.student.name,
        row.student.number,
        row.class ? `${row.class.gradeName} ${row.class.name}` : '',
        row.charges,
        row.balance.toFixed(2).replace('.', ','),
        row.fines.toFixed(2).replace('.', ','),
        row.total.toFixed(2).replace('.', ','),
        row.oldestDueDate,
        row.maxDaysOverdue,
    ]);
    const csv = [header, ...lines].map(line => line.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `devedores-${todayIso()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}

const DEFAULTS = { search: '', classUuid: '' };

export default function DebtorsPage() {
    const { classes } = useFinanceLookups();
    const [filters, setFilters] = useState(DEFAULTS);
    const debounced = useDebounce(filters.search.trim(), 400);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [result, setResult] = useState<ListResult<Debtor> | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [exporting, setExporting] = useState(false);
    const dirty = JSON.stringify(filters) !== JSON.stringify(DEFAULTS);

    const load = useCallback(async () => {
        try {
            setError(null);
            setResult(await financeService.debtors({ page, limit, search: debounced, classUuid: filters.classUuid }));
        } catch (err) {
            setError(getApiErrorMessage(err, 'Não foi possível carregar os devedores.'));
        }
    }, [page, limit, debounced, filters.classUuid]);

    useEffect(() => {
        load();
    }, [load]);
    useEffect(() => {
        setPage(1);
    }, [debounced, filters.classUuid]);

    const download = async () => {
        try {
            setExporting(true);
            const all = await financeService.debtors({ page: 1, limit: 100, search: debounced, classUuid: filters.classUuid });
            const rows = [...all.data];
            for (let next = 2; next <= all.meta.totalPages; next++) {
                rows.push(...(await financeService.debtors({ page: next, limit: 100, search: debounced, classUuid: filters.classUuid })).data);
            }
            exportCsv(rows);
        } finally {
            setExporting(false);
        }
    };

    const rows = result?.data ?? [];
    const avgDays = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.maxDaysOverdue, 0) / rows.length) : 0;
    const fines = rows.reduce((sum, row) => sum + row.fines, 0);

    return (
        <FinancePage
            title="Devedores"
            subtitle="Alunos com pagamentos em atraso, com a multa estimada a hoje"
            icon={<AlertTriangle size={24} />}
            actions={
                <Button variant="secondary" icon={<Download size={16} />} onClick={download} isLoading={exporting} disabled={!result?.meta.total}>
                    Exportar (Excel)
                </Button>
            }
        >
            <div className={dash.kpis}>
                <KpiTile tone="red" label="Total em atraso" icon={<Wallet size={18} />} value={result ? formatMoney(result.meta.totalAmount ?? 0) : '…'} alert={!!result?.meta.totalAmount} foot={<span>Inclui multas estimadas</span>} />
                <KpiTile tone="orange" label="Alunos em atraso" icon={<Users size={18} />} value={result ? String(result.meta.total) : '…'} foot={<span>Com pelo menos uma cobrança vencida</span>} />
                <KpiTile tone="purple" label="Atraso médio" icon={<CalendarClock size={18} />} value={result ? `${avgDays} dia(s)` : '…'} foot={<span>Nesta página · multas {formatMoney(fines)}</span>} />
            </div>

            <FilterBar onClear={() => setFilters(DEFAULTS)} active={dirty}>
                <label className={`${schedules.field} ${styles.filterSearch}`}>
                    <span className={schedules.fieldLabel}>Pesquisar</span>
                    <input className={schedules.input} value={filters.search} onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))} placeholder="Nome ou nº do aluno" />
                </label>
                <label className={schedules.field}>
                    <span className={schedules.fieldLabel}>Turma</span>
                    <select className={schedules.nativeSelect} value={filters.classUuid} onChange={e => setFilters(prev => ({ ...prev, classUuid: e.target.value }))}>
                        <option value="">Todas</option>
                        {classes.map(item => (
                            <option key={item.uuid} value={item.uuid}>
                                {item.name} ({item.year})
                            </option>
                        ))}
                    </select>
                </label>
            </FilterBar>

            {error && <div className={styles.card} role="alert">{error}</div>}

            <TableCard
                title="Devedores"
                hint="Ordenados pelo valor em dívida"
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
                            itemLabel="alunos"
                        />
                    ) : undefined
                }
            >
                {!result ? (
                    <LoadingRows />
                ) : rows.length === 0 ? (
                    <EmptyBox icon={<AlertTriangle size={24} />} title="Nenhum aluno em atraso" text={dirty ? 'Nenhum resultado com estes filtros.' : 'Todos os pagamentos vencidos estão em dia.'} />
                ) : (
                    <table className={styles.dataTable}>
                        <thead>
                            <tr>
                                <th>Aluno</th>
                                <th>Vencida desde</th>
                                <th>Atraso</th>
                                <th className={styles.right}>Em dívida</th>
                                <th className={styles.right}>Multas</th>
                                <th className={styles.right}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map(row => (
                                <tr key={row.student.uuid}>
                                    <td>
                                        <Person
                                            name={row.student.name}
                                            sub={`Nº ${row.student.number}${row.class ? ` · ${row.class.gradeName} ${row.class.name}` : ''} · ${row.charges} cobrança(s)`}
                                            href={`/finance/cashier?student=${row.student.uuid}`}
                                        />
                                    </td>
                                    <td>{formatDisplayDate(row.oldestDueDate)}</td>
                                    <td>
                                        <DaysOverdue days={row.maxDaysOverdue} />
                                    </td>
                                    <td className={styles.right}>{formatMoney(row.balance)}</td>
                                    <td className={styles.right}>{row.fines ? formatMoney(row.fines) : '—'}</td>
                                    <td className={`${styles.right} ${styles.amountStrong} ${styles.danger}`}>{formatMoney(row.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </TableCard>
        </FinancePage>
    );
}
