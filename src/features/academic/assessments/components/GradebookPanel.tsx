// src/features/academic/assessments/components/GradebookPanel.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Award, Calculator, FileSpreadsheet, Lock, Percent, ThumbsDown, ThumbsUp, Users } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button/Button';
import { useToast } from '@/shared/contexts/ToastContext';
import { useLoading } from '@/shared/contexts/LoadingContext';
import { usePermission } from '@/shared/hooks/usePermission';
import { useAuth } from '@/shared/contexts/AuthContext';
import { getApiErrorMessage } from '@/shared/utils/api.utils';
import { assessmentService } from '../services/assessment.service';
import type { AcademicPeriod, AssessmentContext, Gradebook, TeacherAssignmentOption } from '../types/assessment.types';
import { preselectedAssignment, statusBadge } from './ScoreEntryPanel';
import { AssignmentPicker, FinalBadge, PeriodChips, ResultLabel, ScorePill, StudentCell, SummaryTile, resultStats } from './EvaluationUI';
import styles from '../styles/evaluation.module.css';

export const GradebookPanel: React.FC = () => {
    const { showSuccess, showError } = useToast();
    const { startLoading, stopLoading } = useLoading();
    const { hasPermission } = usePermission();
    const canCalculate = hasPermission('gradebooks.calculate');
    const { user } = useAuth();
    const isTeacher = !!user?.teacher;

    const [assignments, setAssignments] = useState<TeacherAssignmentOption[]>([]);
    const [assignmentUuid, setAssignmentUuid] = useState('');
    const [context, setContext] = useState<AssessmentContext | null>(null);
    const [period, setPeriod] = useState<AcademicPeriod | ''>('');
    const [gradebook, setGradebook] = useState<Gradebook | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        assessmentService
            .getTeacherAssignments(isTeacher)
            .then(list => {
                setAssignments(list);
                const preselected = preselectedAssignment();
                if (preselected && list.some(a => a.uuid === preselected)) setAssignmentUuid(preselected);
            })
            .catch(err => showError('Erro', getApiErrorMessage(err, 'Não foi possível carregar as atribuições')));
    }, [isTeacher]);

    // Os períodos vêm da configuração académica do programa da turma
    useEffect(() => {
        setGradebook(null);
        setContext(null);
        setError(null);
        if (!assignmentUuid) return;
        assessmentService
            .getContext(assignmentUuid)
            .then(data => {
                setContext(data);
                setPeriod(data.periods[0]?.academicPeriod ?? '');
            })
            .catch(err => setError(getApiErrorMessage(err, 'Não foi possível carregar a configuração da atribuição')));
    }, [assignmentUuid]);

    const loadGradebook = async () => {
        if (!assignmentUuid || !period) return;
        try {
            setIsLoading(true);
            setError(null);
            setGradebook(await assessmentService.getGradebook(assignmentUuid, period));
        } catch (err) {
            setGradebook(null);
            setError(getApiErrorMessage(err, 'Não foi possível carregar a pauta'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadGradebook();
    }, [assignmentUuid, period]);

    const handleCalculate = async () => {
        if (!period) return;
        try {
            startLoading();
            const result = await assessmentService.calculateGradebook(assignmentUuid, period);
            showSuccess('Médias calculadas', result.message);
            await loadGradebook();
        } catch (err) {
            showError('Erro', getApiErrorMessage(err, 'Não foi possível calcular as médias'));
        } finally {
            stopLoading();
        }
    };

    const rules = gradebook?.students[0]?.assessments ?? [];
    const stats = resultStats(
        (gradebook?.students ?? []).map(s => ({ score: s.isApproved === null ? null : s.finalScore, approved: s.isApproved }))
    );
    const hasResults = gradebook?.students.some(s => s.isApproved !== null) ?? false;

    return (
        <>
            <div className={styles.panel}>
                <h2 className={styles.panelTitle}>
                    <FileSpreadsheet size={18} />
                    Pauta por disciplina
                </h2>
                <AssignmentPicker
                    assignments={assignments}
                    value={assignmentUuid}
                    onChange={setAssignmentUuid}
                    showTeacher={!isTeacher}
                    emptyLabel={isTeacher ? 'Não tem turmas atribuídas.' : 'Sem atribuições ativas.'}
                />
                {context && context.periods.length > 0 && (
                    <div style={{ marginTop: 'var(--spacing-md)' }}>
                        <PeriodChips
                            periods={context.periods.map(p => ({ value: p.academicPeriod, label: p.displayName, extra: statusBadge(p.status) }))}
                            value={period}
                            onChange={value => setPeriod(value as AcademicPeriod)}
                        />
                    </div>
                )}
            </div>

            {error && (
                <div className={`${styles.banner} ${styles.bannerWarning}`}>
                    <AlertTriangle size={18} />
                    <span>{error}</span>
                </div>
            )}

            {isLoading && <p className={styles.loadingText}>A carregar pauta...</p>}

            {!isLoading && gradebook && (
                <div className={styles.panel}>
                    <div className={styles.actionsBar} style={{ marginTop: 0, marginBottom: 'var(--spacing-md)' }}>
                        <div className={styles.actionsGroup} style={{ alignItems: 'center' }}>
                            <strong>{gradebook.teacherAssignment.subjectName} — {gradebook.teacherAssignment.className}</strong>
                            {statusBadge(gradebook.submissionStatus)}
                        </div>
                        {canCalculate && (
                            <Button
                                icon={<Calculator size={16} />}
                                onClick={handleCalculate}
                                disabled={gradebook.isClosed || gradebook.submissionStatus === 'PUBLISHED' || gradebook.totalWeight !== 100}
                                title={gradebook.totalWeight !== 100 ? 'As regras ativas têm de somar 100%' : undefined}
                            >
                                Calcular médias
                            </Button>
                        )}
                    </div>

                    {gradebook.isClosed && (
                        <div className={`${styles.banner} ${styles.bannerInfo}`}>
                            <Lock size={18} />
                            <span>Pauta fechada: as notas deste período foram publicadas.</span>
                        </div>
                    )}

                    {gradebook.totalWeight !== 100 && (
                        <div className={`${styles.banner} ${styles.bannerWarning}`}>
                            <AlertTriangle size={18} />
                            <span>As regras ativas somam {gradebook.totalWeight}%; o cálculo exige 100%.</span>
                        </div>
                    )}

                    {hasResults && (
                        <div className={styles.summaryGrid}>
                            <SummaryTile tone="purple" icon={<Users size={18} />} value={`${stats.evaluated}/${gradebook.students.length}`} label="Alunos avaliados" />
                            <SummaryTile tone="blue" icon={<Award size={18} />} value={stats.average === null ? '—' : stats.average.toFixed(2)} label="Média da turma" />
                            <SummaryTile tone="green" icon={<ThumbsUp size={18} />} value={stats.approved} label="Aprovados" />
                            <SummaryTile tone="red" icon={<ThumbsDown size={18} />} value={stats.failed} label="Reprovados" />
                            <SummaryTile tone="amber" icon={<Percent size={18} />} value={stats.rate === null ? '—' : `${stats.rate}%`} label="Taxa de aprovação" />
                        </div>
                    )}

                    {!hasResults && !gradebook.isClosed && (
                        <p className={styles.hint} style={{ marginBottom: 'var(--spacing-sm)' }}>
                            As médias ainda não foram calculadas para este período.
                        </p>
                    )}

                    {gradebook.students.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p className={styles.emptyTitle}>Sem alunos matriculados</p>
                        </div>
                    ) : (
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Aluno</th>
                                        {rules.map(rule => (
                                            <th key={rule.assessmentRuleUuid} className={styles.numeric} title={rule.name}>
                                                {rule.code} <span className={styles.chipMeta}>({rule.weight}%)</span>
                                            </th>
                                        ))}
                                        <th className={styles.numeric}>Média</th>
                                        <th>Resultado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {gradebook.students.map(student => (
                                        <tr key={student.studentUuid}>
                                            <td>
                                                <StudentCell uuid={student.studentUuid} name={student.studentName} number={student.studentNumber} />
                                            </td>
                                            {student.assessments.map(a => (
                                                <td key={a.assessmentRuleUuid} className={styles.numeric}>
                                                    <ScorePill score={a.score} max={a.maximumScore} />
                                                </td>
                                            ))}
                                            <td className={styles.numeric}>
                                                <FinalBadge score={student.isApproved === null ? null : student.finalScore} approved={student.isApproved} />
                                            </td>
                                            <td>
                                                <ResultLabel approved={student.isApproved} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <p className={styles.hint} style={{ marginTop: 'var(--spacing-sm)' }}>
                        Média = Σ(nota convertida para 0–20 × peso) / 100; avaliações sem nota contam como 0; aprovação com média ≥ 10.
                    </p>
                </div>
            )}
        </>
    );
};
