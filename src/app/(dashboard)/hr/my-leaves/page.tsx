// src/app/(dashboard)/hr/my-leaves/page.tsx

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { CalendarOff, Plus } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button/Button';
import { ActionButton } from '@/features/finance/components/FinancePageKit';
import { useToast } from '@/shared/contexts/ToastContext';
import { getApiErrorMessage } from '@/shared/utils/api.utils';
import { formatDisplayDate } from '@/shared/utils/date.utils';
import { FinanceHeader } from '@/features/finance/components/FinanceUI';
import { LeaveStatusPill } from '@/features/hr/HrUI';
import { LeaveRequestDialog } from '@/features/hr/LeaveRequestDialog';
import { hrService, type MyHrOverview } from '@/features/hr/hr.service';
import evaluation from '@/features/academic/assessments/styles/evaluation.module.css';
import { dashboardStyles as dash } from '@/features/dashboard-kit/DashboardKit';
import finance from '@/features/finance/components/finance.module.css';

// Férias e ausências do próprio funcionário (ex.: professor)
export default function MyLeavesPage() {
    const { showSuccess, showError } = useToast();
    const [data, setData] = useState<MyHrOverview | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [requesting, setRequesting] = useState(false);

    const load = useCallback(async () => {
        try {
            setError(null);
            setData(await hrService.me());
        } catch (err) {
            setError(getApiErrorMessage(err, 'Não foi possível carregar as suas férias.'));
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const cancel = async (uuid: string) => {
        try {
            await hrService.cancelMyLeave(uuid);
            showSuccess('Pedido cancelado', '');
            load();
        } catch (err) {
            showError('Não foi possível cancelar', getApiErrorMessage(err, 'Tente novamente.'));
        }
    };

    return (
        <div className={dash.root}>
            <FinanceHeader
                title="As minhas férias"
                subtitle="Pedidos de férias e ausências"
                icon={<CalendarOff size={24} />}
                actions={
                    data && (
                        <Button icon={<Plus size={16} />} onClick={() => setRequesting(true)}>
                            Novo pedido
                        </Button>
                    )
                }
            />

            {error && <div className={`${evaluation.banner} ${evaluation.bannerWarning}`}>{error}</div>}

            {data && (
                <>
                    <div className={finance.kpis}>
                        <div className={finance.kpi}>
                            <span className={finance.kpiLabel}>Férias disponíveis {data.vacation.year}</span>
                            <span className={finance.kpiValue}>{data.vacation.available} dias</span>
                            <span className={finance.kpiHint}>
                                de {data.vacation.entitlement} · já pedidos/gozados {data.vacation.used}
                            </span>
                        </div>
                        <div className={finance.kpi}>
                            <span className={finance.kpiLabel}>Funcionário</span>
                            <span className={finance.kpiValue} style={{ fontSize: 17 }}>
                                {data.employee.name}
                            </span>
                            <span className={finance.kpiHint}>
                                {data.employee.number} · {data.employee.position}
                            </span>
                        </div>
                    </div>

                    <div className={finance.card}>
                        <span className={finance.cardTitle}>Os meus pedidos</span>
                        {data.leaves.length === 0 ? (
                            <p className={finance.muted}>Ainda não fez pedidos.</p>
                        ) : (
                            data.leaves.map(leave => (
                                <div key={leave.uuid} className={finance.listRow}>
                                    <span>
                                        <strong>{leave.leaveTypeLabel}</strong> · {formatDisplayDate(leave.startDate)} – {formatDisplayDate(leave.endDate)} ({leave.days} dia(s) úteis)
                                        {leave.decisionNotes && <div className={finance.muted}>{leave.decisionNotes}</div>}
                                    </span>
                                    <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <LeaveStatusPill status={leave.status} />
                                        {leave.status === 'PENDING' && (
                                            <ActionButton tone="red" onClick={() => cancel(leave.uuid)}>
                                                Cancelar
                                            </ActionButton>
                                        )}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}

            {requesting && data && (
                <LeaveRequestDialog self availableVacation={data.vacation.available} onClose={() => setRequesting(false)} onSaved={() => { setRequesting(false); load(); }} />
            )}
        </div>
    );
}
