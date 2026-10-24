// src/features/academic/assessments/components/ScoreEntryPanel.tsx

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Award, BookOpen, CalendarDays, CheckCircle, ClipboardEdit, GitBranch, Info, Lock, Save, Scale, Send, ThumbsDown, ThumbsUp } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button/Button';
import { Badge } from '@/shared/components/ui/Badge/Badge';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog/ConfirmDialog';
import { useToast } from '@/shared/contexts/ToastContext';
import { useLoading } from '@/shared/contexts/LoadingContext';
import { usePermission } from '@/shared/hooks/usePermission';
import { useAuth } from '@/shared/contexts/AuthContext';
import { getApiErrorMessage } from '@/shared/utils/api.utils';
import { assessmentService } from '../services/assessment.service';
import {
    SUBMISSION_STATUS_LABELS,
    WORKFLOW_LABELS,
    type AcademicPeriod,
    type AssessmentContext,
    type AssessmentGrid,
    type SubmissionStatus,
    type TeacherAssignmentOption,
} from '../types/assessment.types';
import { AssignmentPicker, StudentCell, SummaryTile } from './EvaluationUI';
import styles from '../styles/evaluation.module.css';

type Draft = Record<string, { score: string; remarks: string }>;

type PendingSwitch =
    | { kind: 'assignment'; value: string }
    | { kind: 'period'; value: AcademicPeriod }
    | { kind: 'rule'; value: string }
    | null;

export const statusBadge = (status: SubmissionStatus | null) => {
    if (!status) return <Badge variant="neutral" size="sm">Por lançar</Badge>;
    const variant =
        status === 'PUBLISHED' ? 'success'
            : status === 'VALIDATED' ? 'info'
                : status === 'SUBMITTED' ? 'primary'
                    : status === 'RETURNED' ? 'warning'
                        : 'neutral';
    return <Badge variant={variant} size="sm">{SUBMISSION_STATUS_LABELS[status]}</Badge>;
};

// Aceita vírgula decimal ("12,5")
const parseScore = (value: string): number => Number(value.replace(',', '.').trim());

export const assignmentLabel = (a: TeacherAssignmentOption) =>
    `${a.gradeName} ${a.className} — ${a.subjectName} · ${a.teacherName} (${a.academicYearName})`;

// Atribuição pré-selecionada por ?assignment=<uuid> (links do painel do professor)
export const preselectedAssignment = (): string | null =>
    typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('assignment');

export const ScoreEntryPanel: React.FC = () => {
    const { showSuccess, showError, showWarning } = useToast();
    const { startLoading, stopLoading } = useLoading();
    const { hasPermission } = usePermission();
    const canSave = hasPermission('assessmentScores.create');
    const canSubmit = hasPermission('assessmentScores.submit');
    const { user } = useAuth();
    const isTeacher = !!user?.teacher;

    const [assignments, setAssignments] = useState<TeacherAssignmentOption[]>([]);
    const [assignmentUuid, setAssignmentUuid] = useState('');
    const [context, setContext] = useState<AssessmentContext | null>(null);
    const [period, setPeriod] = useState<AcademicPeriod | ''>('');
    const [ruleUuid, setRuleUuid] = useState('');
    const [grid, setGrid] = useState<AssessmentGrid | null>(null);
    const [draft, setDraft] = useState<Draft>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoadingContext, setIsLoadingContext] = useState(false);
    const [isLoadingGrid, setIsLoadingGrid] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [pendingSwitch, setPendingSwitch] = useState<PendingSwitch>(null);
    const [confirmSubmit, setConfirmSubmit] = useState(false);
    const [isBusy, setIsBusy] = useState(false);


    const loadContext = async (uuid: string, keepSelection = false) => {
        if (!uuid) {
            setContext(null);
            setGrid(null);
            return;
        }
        try {
            setIsLoadingContext(true);
            setLoadError(null);
            const data = await assessmentService.getContext(uuid);
            setContext(data);
            if (!keepSelection) {
                const firstEditable = data.periods.find(p => p.isEditable) ?? data.periods[0];
                setPeriod(firstEditable?.academicPeriod ?? '');
                setRuleUuid(data.assessmentRules[0]?.uuid ?? '');
            }
        } catch (error) {
            setContext(null);
            setGrid(null);
            setLoadError(getApiErrorMessage(error, 'Não foi possível carregar a configuração da atribuição'));
        } finally {
            setIsLoadingContext(false);
        }
    };

    // Atribuições ativas (professor: só as suas)
    useEffect(() => {
        assessmentService
            .getTeacherAssignments(isTeacher)
            .then(list => {
                setAssignments(list);
                const preselected = preselectedAssignment();
                if (preselected && list.some(a => a.uuid === preselected)) {
                    setAssignmentUuid(preselected);
                    loadContext(preselected);
                }
            })
            .catch(error => showError('Erro', getApiErrorMessage(error, 'Não foi possível carregar as atribuições')));
    }, [isTeacher]);

    const loadGrid = async () => {
        if (!assignmentUuid || !period || !ruleUuid) {
            setGrid(null);
            return;
        }
        try {
            setIsLoadingGrid(true);
            const data = await assessmentService.getGrid(assignmentUuid, ruleUuid, period);
            setGrid(data);
            setDraft(
                Object.fromEntries(
                    data.students.map(s => [
                        s.studentUuid,
                        { score: s.score === null ? '' : String(s.score), remarks: s.remarks ?? '' },
                    ])
                )
            );
            setErrors({});
        } catch (error) {
            setGrid(null);
            showError('Erro', getApiErrorMessage(error, 'Não foi possível carregar a grelha de notas'));
        } finally {
            setIsLoadingGrid(false);
        }
    };

    useEffect(() => {
        loadGrid();
    }, [assignmentUuid, period, ruleUuid]);

    const isDirty = useMemo(() => {
        if (!grid) return false;
        return grid.students.some(s => {
            const row = draft[s.studentUuid];
            if (!row) return false;
            const original = s.score === null ? '' : String(s.score);
            return row.score.trim() !== original || row.remarks.trim() !== (s.remarks ?? '');
        });
    }, [grid, draft]);

    const applySwitch = (change: Exclude<PendingSwitch, null>) => {
        if (change.kind === 'assignment') {
            setAssignmentUuid(change.value);
            setGrid(null);
            loadContext(change.value);
        } else if (change.kind === 'period') {
            setPeriod(change.value);
        } else {
            setRuleUuid(change.value);
        }
    };

    // Pede confirmação antes de descartar notas não guardadas
    const requestSwitch = (change: Exclude<PendingSwitch, null>) => {
        if (isDirty) {
            setPendingSwitch(change);
        } else {
            applySwitch(change);
        }
    };

    const currentPeriod = context?.periods.find(p => p.academicPeriod === period) ?? null;
    const currentRule = context?.assessmentRules.find(r => r.uuid === ruleUuid) ?? null;
    const editable = Boolean(grid?.isEditable) && canSave;

    const validateDraft = () => {
        if (!grid) return { valid: false, scores: [] as { studentUuid: string; score: number; remarks?: string }[] };
        const max = grid.assessmentRule.maximumScore;
        const nextErrors: Record<string, string> = {};
        const scores: { studentUuid: string; score: number; remarks?: string }[] = [];

        for (const student of grid.students) {
            const row = draft[student.studentUuid];
            if (!row) continue;
            const raw = row.score.trim();
            if (raw === '') {
                if (student.score !== null) {
                    nextErrors[student.studentUuid] = 'Uma nota lançada não pode ficar vazia';
                }
                continue;
            }
            const value = parseScore(raw);
            if (!Number.isFinite(value)) {
                nextErrors[student.studentUuid] = 'Valor inválido';
            } else if (value < 0 || value > max) {
                nextErrors[student.studentUuid] = `Entre 0 e ${max}`;
            } else if (row.remarks.length > 500) {
                nextErrors[student.studentUuid] = 'Observação demasiado longa (máx. 500)';
            } else {
                scores.push({
                    studentUuid: student.studentUuid,
                    score: Number(value.toFixed(2)),
                    remarks: row.remarks.trim() || undefined,
                });
            }
        }

        setErrors(nextErrors);
        return { valid: Object.keys(nextErrors).length === 0, scores };
    };

    const handleSave = async () => {
        if (!grid || !period) return;
        const { valid, scores } = validateDraft();
        if (!valid) {
            showError('Notas inválidas', 'Corrija os campos assinalados antes de guardar.');
            return;
        }
        if (scores.length === 0) {
            showWarning('Sem notas', 'Introduza pelo menos uma nota para guardar.');
            return;
        }
        try {
            setIsBusy(true);
            startLoading();
            const result = await assessmentService.saveScores({
                teacherAssignmentUuid: assignmentUuid,
                assessmentRuleUuid: ruleUuid,
                academicPeriod: period,
                scores,
            });
            showSuccess('Notas guardadas', `${result.saved} nova(s), ${result.updated} atualizada(s).`);
            // o contexto traz as notas em falta por período (condição para submeter)
            await loadContext(assignmentUuid, true);
            await loadGrid();
        } catch (error) {
            showError('Erro', getApiErrorMessage(error, 'Não foi possível guardar as notas'));
        } finally {
            setIsBusy(false);
            stopLoading();
        }
    };

    const handleSubmit = async () => {
        if (!period) return;
        try {
            setIsBusy(true);
            startLoading();
            const result = await assessmentService.submitPeriod(assignmentUuid, period);
            if (result.missingScores > 0) {
                showWarning('Período submetido', result.message);
            } else {
                showSuccess('Período submetido', result.message);
            }
            setConfirmSubmit(false);
            await loadContext(assignmentUuid, true);
            await loadGrid();
        } catch (error) {
            showError('Erro', getApiErrorMessage(error, 'Não foi possível submeter o período'));
        } finally {
            setIsBusy(false);
            stopLoading();
        }
    };

    // Resumo da avaliação em edição (calculado a partir do rascunho)
    const gridStats = useMemo(() => {
        if (!grid) return null;
        const max = grid.assessmentRule.maximumScore;
        const values = grid.students
            .map(s => draft[s.studentUuid]?.score.trim() ?? '')
            .filter(v => v !== '')
            .map(parseScore)
            .filter(v => Number.isFinite(v) && v >= 0 && v <= max);
        const half = max / 2;
        return {
            total: grid.students.length,
            filled: values.length,
            average: values.length ? values.reduce((a, b) => a + b, 0) / values.length : null,
            positive: values.filter(v => v >= half).length,
            negative: values.filter(v => v < half).length,
            half,
        };
    }, [grid, draft]);

    const scoreTone = (raw: string) => {
        if (!grid || raw.trim() === '') return '';
        const value = parseScore(raw);
        if (!Number.isFinite(value) || value < 0 || value > grid.assessmentRule.maximumScore) return '';
        return value >= grid.assessmentRule.maximumScore / 2 ? styles.good : styles.bad;
    };

    const canSubmitPeriod =
        canSubmit
        && !!currentPeriod
        && (!currentPeriod.status || currentPeriod.status === 'DRAFT' || currentPeriod.status === 'RETURNED');
    // Só se submete com todas as avaliações do período lançadas para todos os alunos
    const missingInPeriod = currentPeriod?.missingScores ?? 0;

    return (
        <>
            <div className={styles.panel}>
                <h2 className={styles.panelTitle}>
                    <ClipboardEdit size={18} />
                    Turma e disciplina
                </h2>
                <AssignmentPicker
                    assignments={assignments}
                    value={assignmentUuid}
                    onChange={uuid => requestSwitch({ kind: 'assignment', value: uuid })}
                    showTeacher={!isTeacher}
                    emptyLabel={isTeacher ? 'Não tem turmas atribuídas.' : 'Sem atribuições ativas.'}
                />
            </div>

            {isLoadingContext && <p className={styles.loadingText}>A carregar configuração...</p>}

            {loadError && (
                <div className={`${styles.banner} ${styles.bannerWarning}`}>
                    <AlertTriangle size={18} />
                    <span>{loadError}</span>
                </div>
            )}

            {!assignmentUuid && !isLoadingContext && (
                <div className={styles.panel}>
                    <div className={styles.emptyState}>
                        <ClipboardEdit size={44} className={styles.emptyIcon} />
                        <p className={styles.emptyTitle}>Selecione uma atribuição</p>
                        <p>Escolha a turma e a disciplina para lançar as notas dos alunos.</p>
                    </div>
                </div>
            )}

            {context && !isLoadingContext && (
                <div className={styles.panel}>
                    <div className={styles.summaryGrid}>
                        <SummaryTile tone="purple" icon={<BookOpen size={18} />} value={context.teacherAssignment.subjectName} label={`${context.teacherAssignment.gradeName} ${context.teacherAssignment.className}`} />
                        <SummaryTile tone="blue" icon={<CalendarDays size={18} />} value={context.teacherAssignment.academicYearName} label={context.teacherAssignment.programName} />
                        <SummaryTile tone="amber" icon={<GitBranch size={18} />} value={WORKFLOW_LABELS[context.workflow] ?? context.workflow} label="Fluxo de aprovação" />
                        <SummaryTile tone={context.totalWeight === 100 ? 'green' : 'red'} icon={<Scale size={18} />} value={`${context.totalWeight}%`} label="Peso das avaliações" />
                    </div>

                    {context.totalWeight !== 100 && (
                        <div className={`${styles.banner} ${styles.bannerWarning}`} style={{ marginTop: 'var(--spacing-md)' }}>
                            <AlertTriangle size={18} />
                            <span>
                                As regras de avaliação ativas deste programa somam {context.totalWeight}%. Pode lançar notas,
                                mas o cálculo das médias e a publicação exigem 100%.
                            </span>
                        </div>
                    )}

                    {context.periods.length === 0 ? (
                        <div className={`${styles.banner} ${styles.bannerWarning}`} style={{ marginTop: 'var(--spacing-md)' }}>
                            <AlertTriangle size={18} />
                            <span>O programa não tem períodos configurados em Config. Académica.</span>
                        </div>
                    ) : (
                        <div className={styles.chipGroup} style={{ marginTop: 'var(--spacing-md)' }}>
                            <span className={styles.chipLabel}>Período</span>
                            {context.periods.map(p => (
                                <button
                                    key={p.academicPeriod}
                                    type="button"
                                    className={`${styles.chip} ${period === p.academicPeriod ? styles.active : ''}`}
                                    onClick={() => requestSwitch({ kind: 'period', value: p.academicPeriod })}
                                >
                                    {p.displayName}
                                    {statusBadge(p.status)}
                                </button>
                            ))}
                        </div>
                    )}

                    {context.assessmentRules.length === 0 ? (
                        <div className={`${styles.banner} ${styles.bannerWarning}`}>
                            <AlertTriangle size={18} />
                            <span>O programa não tem regras de avaliação ativas.</span>
                        </div>
                    ) : (
                        <div className={styles.chipGroup}>
                            <span className={styles.chipLabel}>Avaliação</span>
                            {context.assessmentRules.map(rule => (
                                <button
                                    key={rule.uuid}
                                    type="button"
                                    className={`${styles.chip} ${ruleUuid === rule.uuid ? styles.active : ''}`}
                                    onClick={() => requestSwitch({ kind: 'rule', value: rule.uuid })}
                                >
                                    {rule.code}
                                    <span className={styles.chipMeta}>{rule.weight}% · máx. {rule.maximumScore}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {context && currentPeriod && currentRule && (
                <div className={styles.panel}>
                    <h2 className={styles.panelTitle}>
                        {currentRule.name} — {currentPeriod.displayName}
                    </h2>

                    {currentPeriod.status === 'RETURNED' && (
                        <div className={`${styles.banner} ${styles.bannerWarning}`}>
                            <AlertTriangle size={18} />
                            <span>
                                Notas devolvidas pela coordenação
                                {currentPeriod.returnedReason ? `: "${currentPeriod.returnedReason}"` : '.'} Corrija e volte a submeter.
                            </span>
                        </div>
                    )}

                    {grid && !grid.isEditable && (
                        <div className={`${styles.banner} ${styles.bannerInfo}`}>
                            <Lock size={18} />
                            <span>
                                Período {grid.submissionStatus ? SUBMISSION_STATUS_LABELS[grid.submissionStatus].toLowerCase() : 'bloqueado'}:
                                as notas estão disponíveis apenas para consulta.
                            </span>
                        </div>
                    )}

                    {grid && grid.isEditable && !canSave && (
                        <div className={`${styles.banner} ${styles.bannerInfo}`}>
                            <Info size={18} />
                            <span>Não tem permissão para lançar notas; a grelha está em modo de consulta.</span>
                        </div>
                    )}

                    {isLoadingGrid && <p className={styles.loadingText}>A carregar alunos...</p>}

                    {!isLoadingGrid && grid && grid.students.length === 0 && (
                        <div className={styles.emptyState}>
                            <p className={styles.emptyTitle}>Sem alunos matriculados</p>
                            <p>Esta turma não tem matrículas ativas.</p>
                        </div>
                    )}

                    {!isLoadingGrid && grid && grid.students.length > 0 && (
                        <>
                            {gridStats && (
                                <>
                                    <div className={styles.summaryGrid}>
                                        <SummaryTile tone="purple" icon={<ClipboardEdit size={18} />} value={`${gridStats.filled}/${gridStats.total}`} label="Notas lançadas" />
                                        <SummaryTile tone="blue" icon={<Award size={18} />} value={gridStats.average === null ? '—' : gridStats.average.toFixed(1)} label={`Média (máx. ${grid.assessmentRule.maximumScore})`} />
                                        <SummaryTile tone="green" icon={<ThumbsUp size={18} />} value={gridStats.positive} label={`Positivas (≥ ${gridStats.half})`} />
                                        <SummaryTile tone="red" icon={<ThumbsDown size={18} />} value={gridStats.negative} label="Negativas" />
                                    </div>
                                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                        <div className={styles.progressLabel}>
                                            <span>Progresso do lançamento</span>
                                            <span>{Math.round((gridStats.filled / gridStats.total) * 100)}%</span>
                                        </div>
                                        <div className={styles.progress}>
                                            <div className={styles.progressBar} style={{ width: `${(gridStats.filled / gridStats.total) * 100}%` }} />
                                        </div>
                                    </div>
                                </>
                            )}
                            <div className={styles.tableWrapper}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th style={{ width: 48 }}>#</th>
                                            <th>Aluno</th>
                                            <th className={styles.numeric}>Nota (0–{grid.assessmentRule.maximumScore})</th>
                                            <th>Observações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {grid.students.map((student, index) => {
                                            const row = draft[student.studentUuid] ?? { score: '', remarks: '' };
                                            const error = errors[student.studentUuid];
                                            return (
                                                <tr key={student.studentUuid}>
                                                    <td className={styles.muted}>{index + 1}</td>
                                                    <td>
                                                        <StudentCell uuid={student.studentUuid} name={student.studentName} number={student.studentNumber} />
                                                    </td>
                                                    <td className={styles.numeric}>
                                                        <input
                                                            className={`${styles.scoreInput} ${error ? styles.invalid : scoreTone(row.score)}`}
                                                            inputMode="decimal"
                                                            value={row.score}
                                                            disabled={!editable || isBusy}
                                                            aria-label={`Nota de ${student.studentName}`}
                                                            aria-invalid={!!error}
                                                            onChange={e =>
                                                                setDraft(prev => ({
                                                                    ...prev,
                                                                    [student.studentUuid]: { ...row, score: e.target.value },
                                                                }))
                                                            }
                                                        />
                                                        {error && <span className={styles.fieldError}>{error}</span>}
                                                    </td>
                                                    <td>
                                                        <input
                                                            className={styles.remarksInput}
                                                            value={row.remarks}
                                                            maxLength={500}
                                                            disabled={!editable || isBusy}
                                                            aria-label={`Observações de ${student.studentName}`}
                                                            onChange={e =>
                                                                setDraft(prev => ({
                                                                    ...prev,
                                                                    [student.studentUuid]: { ...row, remarks: e.target.value },
                                                                }))
                                                            }
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className={`${styles.stickyBar} ${isDirty ? styles.dirty : ''}`}>
                                <span className={styles.hint}>
                                    {isDirty
                                        ? 'Tem alterações por guardar.'
                                        : canSubmitPeriod && missingInPeriod > 0
                                            ? `Faltam ${missingInPeriod} nota(s) em ${currentPeriod.displayName} (todas as avaliações). Lance-as para poder submeter.`
                                            : 'Todas as avaliações do período têm de ter nota para todos os alunos antes de submeter.'}
                                </span>
                                <div className={styles.actionsGroup}>
                                    {editable && (
                                        <Button
                                            icon={<Save size={16} />}
                                            onClick={handleSave}
                                            disabled={isBusy || !isDirty}
                                            isLoading={isBusy}
                                        >
                                            Guardar notas
                                        </Button>
                                    )}
                                    {canSubmitPeriod && (
                                        <Button
                                            variant="success"
                                            icon={<Send size={16} />}
                                            onClick={() => setConfirmSubmit(true)}
                                            disabled={isBusy || isDirty || missingInPeriod > 0}
                                            title={
                                                isDirty
                                                    ? 'Guarde as alterações antes de submeter'
                                                    : missingInPeriod > 0
                                                        ? `Faltam ${missingInPeriod} nota(s) neste período`
                                                        : undefined
                                            }
                                        >
                                            Submeter período
                                        </Button>
                                    )}
                                    {currentPeriod.status === 'PUBLISHED' && (
                                        <span className={styles.hint}>
                                            <CheckCircle size={14} /> Notas publicadas
                                        </span>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            <ConfirmDialog
                isOpen={pendingSwitch !== null}
                onClose={() => setPendingSwitch(null)}
                onConfirm={() => {
                    if (pendingSwitch) applySwitch(pendingSwitch);
                    setPendingSwitch(null);
                }}
                title="Descartar alterações?"
                message="Tem notas por guardar nesta grelha. Se continuar, as alterações serão perdidas."
                type="warning"
                confirmText="Descartar"
            />

            <ConfirmDialog
                isOpen={confirmSubmit}
                onClose={() => setConfirmSubmit(false)}
                onConfirm={handleSubmit}
                title="Submeter notas do período"
                message={
                    context?.workflow === 'DIRECT'
                        ? `As notas de ${currentPeriod?.displayName ?? 'este período'} (todas as avaliações) serão publicadas e a pauta será fechada. Continuar?`
                        : `As notas de ${currentPeriod?.displayName ?? 'este período'} (todas as avaliações) serão enviadas à coordenação e deixarão de poder ser editadas. Continuar?`
                }
                type="warning"
                confirmText="Submeter"
                isLoading={isBusy}
            />
        </>
    );
};
