// src/features/academic/assessments/components/SubmissionReviewPanel.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, ClipboardCheck, Send, Undo2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button/Button';
import { Select } from '@/shared/components/ui/Select/Select';
import { Input } from '@/shared/components/ui/Input/Input';
import { Textarea } from '@/shared/components/ui/Textarea/Textarea';
import { Modal } from '@/shared/components/ui/Modal/Modal';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog/ConfirmDialog';
import { Pagination } from '@/shared/components/ui/Pagination/Pagination';
import { useToast } from '@/shared/contexts/ToastContext';
import { useLoading } from '@/shared/contexts/LoadingContext';
import { usePermission } from '@/shared/hooks/usePermission';
import { getApiErrorMessage } from '@/shared/utils/api.utils';
import { assessmentService } from '../services/assessment.service';
import {
    ACADEMIC_PERIOD_LABELS,
    SUBMISSION_STATUS_LABELS,
    type AcademicPeriod,
    type AssessmentSubmission,
    type AssessmentSubmissionFilters,
    type SubmissionStatus,
} from '../types/assessment.types';
import { statusBadge } from './ScoreEntryPanel';
import styles from '../styles/evaluation.module.css';

type ReviewAction = 'validate' | 'publish';

const formatDateTime = (value: string | null) =>
    value
        ? new Date(value).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '—';

export const SubmissionReviewPanel: React.FC = () => {
    const { showSuccess, showError } = useToast();
    const { startLoading, stopLoading } = useLoading();
    const { hasPermission } = usePermission();
    const canValidate = hasPermission('assessmentSubmissions.validate');
    const canPublish = hasPermission('assessmentSubmissions.publish');

    const [filters, setFilters] = useState<AssessmentSubmissionFilters>({ page: 1, limit: 10, status: 'SUBMITTED' });
    const [search, setSearch] = useState('');
    const [items, setItems] = useState<AssessmentSubmission[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [confirm, setConfirm] = useState<{ action: ReviewAction; item: AssessmentSubmission } | null>(null);
    const [returning, setReturning] = useState<AssessmentSubmission | null>(null);
    const [reason, setReason] = useState('');
    const [reasonError, setReasonError] = useState<string | undefined>();
    const [isBusy, setIsBusy] = useState(false);

    const load = async () => {
        try {
            setIsLoading(true);
            const response = await assessmentService.getSubmissions(filters);
            setItems(response.data);
            setTotal(response.total);
            setTotalPages(response.totalPages);
        } catch (error) {
            setItems([]);
            setTotal(0);
            showError('Erro', getApiErrorMessage(error, 'Não foi possível carregar as submissões'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [filters]);

    const updateFilters = (changes: Partial<AssessmentSubmissionFilters>) =>
        setFilters(prev => ({ ...prev, ...changes, page: 1 }));

    const runAction = async (
        action: 'validate' | 'return' | 'publish',
        item: AssessmentSubmission,
        returnReason?: string
    ) => {
        try {
            setIsBusy(true);
            startLoading();
            const result = await assessmentService.reviewSubmission(action, {
                teacherAssignmentUuid: item.teacherAssignmentUuid,
                academicPeriod: item.academicPeriod,
                reason: returnReason,
            });
            showSuccess('Concluído', result.message);
            setConfirm(null);
            setReturning(null);
            setReason('');
            await load();
        } catch (error) {
            showError('Erro', getApiErrorMessage(error));
        } finally {
            setIsBusy(false);
            stopLoading();
        }
    };

    const handleReturn = () => {
        if (!returning) return;
        if (!reason.trim()) {
            setReasonError('Indique o motivo da devolução');
            return;
        }
        runAction('return', returning, reason.trim());
    };

    const statusOptions: { value: string; label: string }[] = [
        { value: '', label: 'Todos os estados' },
        ...(['SUBMITTED', 'VALIDATED', 'PUBLISHED', 'RETURNED'] as SubmissionStatus[]).map(s => ({
            value: s,
            label: SUBMISSION_STATUS_LABELS[s],
        })),
    ];

    return (
        <>
            <div className={styles.panel}>
                <h2 className={styles.panelTitle}>
                    <ClipboardCheck size={18} />
                    Notas submetidas pelos professores
                </h2>
                <div className={styles.filters}>
                    <Select
                        label="Estado"
                        value={filters.status ?? ''}
                        onChange={e => updateFilters({ status: (e.target.value || undefined) as SubmissionStatus | undefined })}
                        options={statusOptions}
                        fullWidth
                    />
                    <Select
                        label="Período"
                        value={filters.academicPeriod ?? ''}
                        onChange={e => updateFilters({ academicPeriod: (e.target.value || undefined) as AcademicPeriod | undefined })}
                        options={[
                            { value: '', label: 'Todos os períodos' },
                            ...(Object.keys(ACADEMIC_PERIOD_LABELS) as AcademicPeriod[]).map(p => ({ value: p, label: ACADEMIC_PERIOD_LABELS[p] })),
                        ]}
                        fullWidth
                    />
                    <Input
                        label="Pesquisar"
                        placeholder="Turma, disciplina ou professor"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && updateFilters({ search: search.trim() || undefined })}
                        fullWidth
                    />
                </div>
            </div>

            <div className={styles.panel}>
                {isLoading && <p className={styles.loadingText}>A carregar submissões...</p>}

                {!isLoading && items.length === 0 && (
                    <div className={styles.emptyState}>
                        <ClipboardCheck size={44} className={styles.emptyIcon} />
                        <p className={styles.emptyTitle}>Sem submissões</p>
                        <p>Não há notas submetidas com os filtros selecionados.</p>
                    </div>
                )}

                {!isLoading && items.length > 0 && (
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Turma</th>
                                    <th>Disciplina</th>
                                    <th>Professor</th>
                                    <th>Período</th>
                                    <th>Estado</th>
                                    <th>Submetido em</th>
                                    <th style={{ textAlign: 'right' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map(item => (
                                    <tr key={item.uuid}>
                                        <td>
                                            {item.gradeName} {item.className}
                                            <div className={styles.hint}>{item.academicYearName}</div>
                                        </td>
                                        <td>{item.subjectName}</td>
                                        <td>{item.teacherName}</td>
                                        <td>{ACADEMIC_PERIOD_LABELS[item.academicPeriod] ?? item.academicPeriod}</td>
                                        <td>
                                            {statusBadge(item.status)}
                                            {item.status === 'RETURNED' && item.returnedReason && (
                                                <div className={styles.hint}>{item.returnedReason}</div>
                                            )}
                                        </td>
                                        <td className={styles.muted}>{formatDateTime(item.submittedAt)}</td>
                                        <td>
                                            <div className={styles.rowActions}>
                                                {canValidate && item.status === 'SUBMITTED' && (
                                                    <Button size="sm" variant="success" icon={<CheckCircle size={14} />}
                                                        onClick={() => setConfirm({ action: 'validate', item })}>
                                                        Validar
                                                    </Button>
                                                )}
                                                {canPublish && (item.status === 'VALIDATED' || item.status === 'SUBMITTED') && (
                                                    <Button size="sm" icon={<Send size={14} />}
                                                        onClick={() => setConfirm({ action: 'publish', item })}>
                                                        Publicar
                                                    </Button>
                                                )}
                                                {canValidate && item.status !== 'RETURNED' && item.status !== 'DRAFT' && (
                                                    <Button size="sm" variant="warning" icon={<Undo2 size={14} />}
                                                        onClick={() => { setReturning(item); setReason(''); setReasonError(undefined); }}>
                                                        Devolver
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <Pagination
                    page={filters.page || 1}
                    totalPages={totalPages}
                    total={total}
                    limit={filters.limit || 10}
                    onPageChange={page => setFilters(prev => ({ ...prev, page }))}
                    onLimitChange={limit => updateFilters({ limit })}
                    itemLabel="submissões"
                    disabled={isLoading}
                />
            </div>

            <ConfirmDialog
                isOpen={confirm !== null}
                onClose={() => setConfirm(null)}
                onConfirm={() => confirm && runAction(confirm.action, confirm.item)}
                title={confirm?.action === 'publish' ? 'Publicar notas' : 'Validar notas'}
                message={
                    confirm?.action === 'publish'
                        ? `As médias de ${confirm.item.subjectName} (${confirm.item.gradeName} ${confirm.item.className}) serão calculadas e a pauta será fechada. Continuar?`
                        : `Confirma a validação das notas de ${confirm?.item.subjectName ?? ''} (${confirm?.item.gradeName ?? ''} ${confirm?.item.className ?? ''})?`
                }
                type={confirm?.action === 'publish' ? 'warning' : 'info'}
                confirmText={confirm?.action === 'publish' ? 'Publicar' : 'Validar'}
                isLoading={isBusy}
            />

            <Modal
                isOpen={returning !== null}
                onClose={() => setReturning(null)}
                title="Devolver notas ao professor"
                size="md"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    <p className={styles.hint}>
                        {returning?.subjectName} — {returning?.gradeName} {returning?.className} ({returning ? ACADEMIC_PERIOD_LABELS[returning.academicPeriod] : ''}).
                        {returning?.status === 'PUBLISHED' && ' A pauta publicada será reaberta.'}
                    </p>
                    <Textarea
                        label="Motivo *"
                        value={reason}
                        onChange={e => { setReason(e.target.value); setReasonError(undefined); }}
                        error={reasonError}
                        maxLength={1000}
                        rows={4}
                        fullWidth
                    />
                    <div className={styles.actionsGroup} style={{ justifyContent: 'flex-end' }}>
                        <Button variant="secondary" onClick={() => setReturning(null)} disabled={isBusy}>
                            Cancelar
                        </Button>
                        <Button variant="warning" icon={<Undo2 size={16} />} onClick={handleReturn} isLoading={isBusy} disabled={isBusy}>
                            Devolver
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};
