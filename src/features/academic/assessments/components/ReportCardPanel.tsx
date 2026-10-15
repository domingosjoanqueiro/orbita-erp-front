// src/features/academic/assessments/components/ReportCardPanel.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Award, BookOpen, CheckCircle, FileText, Send, ThumbsDown, ThumbsUp } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button/Button';
import { Select } from '@/shared/components/ui/Select/Select';
import { Badge } from '@/shared/components/ui/Badge/Badge';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog/ConfirmDialog';
import { useToast } from '@/shared/contexts/ToastContext';
import { useLoading } from '@/shared/contexts/LoadingContext';
import { usePermission } from '@/shared/hooks/usePermission';
import { useAuth } from '@/shared/contexts/AuthContext';
import { getApiErrorMessage } from '@/shared/utils/api.utils';
import { assessmentService } from '../services/assessment.service';
import {
    ACADEMIC_PERIOD_LABELS,
    type AcademicPeriod,
    type ClassOption,
    type EnrolledStudentOption,
    type ReportCard,
} from '../types/assessment.types';
import { PERIOD_OPTIONS, classLabel, loadReportClasses } from './ClassRankingPanel';
import { FinalBadge, ResultLabel, ScorePill, SummaryTile, resultStats } from './EvaluationUI';
import styles from '../styles/evaluation.module.css';

export const ReportCardPanel: React.FC = () => {
    const { showSuccess, showError } = useToast();
    const { startLoading, stopLoading } = useLoading();
    const { hasPermission } = usePermission();
    const canPublish = hasPermission('reportCards.publish');
    const { user } = useAuth();
    const isTeacher = !!user?.teacher;

    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [classUuid, setClassUuid] = useState('');
    const [students, setStudents] = useState<EnrolledStudentOption[]>([]);
    const [studentUuid, setStudentUuid] = useState('');
    const [period, setPeriod] = useState<AcademicPeriod>('FIRST');
    const [reportCard, setReportCard] = useState<ReportCard | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [confirmPublish, setConfirmPublish] = useState(false);

    useEffect(() => {
        loadReportClasses(isTeacher)
            .then(setClasses)
            .catch(err => showError('Erro', getApiErrorMessage(err, 'Não foi possível carregar as turmas')));
    }, [isTeacher]);

    useEffect(() => {
        setStudents([]);
        setStudentUuid('');
        setReportCard(null);
        if (!classUuid) return;
        (isTeacher ? assessmentService.getMyClassStudents(classUuid) : assessmentService.getClassStudents(classUuid))
            .then(setStudents)
            .catch(err => showError('Erro', getApiErrorMessage(err, 'Não foi possível carregar os alunos da turma')));
    }, [classUuid]);

    const load = async () => {
        if (!classUuid || !studentUuid) {
            setReportCard(null);
            return;
        }
        try {
            setIsLoading(true);
            setError(null);
            setReportCard(await assessmentService.getReportCard(studentUuid, classUuid, period));
        } catch (err) {
            setReportCard(null);
            setError(getApiErrorMessage(err, 'Não foi possível carregar o boletim'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [studentUuid, period]);

    const handlePublish = async () => {
        try {
            startLoading();
            const result = await assessmentService.publishReportCard(studentUuid, classUuid, period);
            showSuccess('Publicado', result.message);
            setConfirmPublish(false);
            await load();
        } catch (err) {
            showError('Erro', getApiErrorMessage(err, 'Não foi possível publicar o boletim'));
        } finally {
            stopLoading();
        }
    };

    return (
        <>
            <div className={styles.panel}>
                <h2 className={styles.panelTitle}>
                    <FileText size={18} />
                    Boletim do aluno
                </h2>
                <div className={styles.filters}>
                    <Select
                        label="Turma"
                        value={classUuid}
                        onChange={e => setClassUuid(e.target.value)}
                        options={[
                            { value: '', label: classes.length ? 'Selecione uma turma...' : isTeacher ? 'Não é diretor de nenhuma turma' : 'Sem turmas' },
                            ...classes.map(c => ({ value: c.uuid, label: classLabel(c) })),
                        ]}
                        fullWidth
                    />
                    <Select
                        label="Aluno"
                        value={studentUuid}
                        onChange={e => setStudentUuid(e.target.value)}
                        options={[
                            { value: '', label: classUuid ? (students.length ? 'Selecione um aluno...' : 'Sem alunos matriculados') : '—' },
                            ...students.map(s => ({ value: s.studentUuid, label: `${s.studentName} (${s.studentNumber})` })),
                        ]}
                        disabled={!classUuid}
                        fullWidth
                    />
                    <Select
                        label="Período"
                        value={period}
                        onChange={e => setPeriod(e.target.value as AcademicPeriod)}
                        options={PERIOD_OPTIONS}
                        fullWidth
                    />
                </div>
            </div>

            {error && (
                <div className={`${styles.banner} ${styles.bannerWarning}`}>
                    <AlertTriangle size={18} />
                    <span>{error}</span>
                </div>
            )}

            {isLoading && <p className={styles.loadingText}>A carregar boletim...</p>}

            {!isLoading && reportCard && (
                <div className={styles.panel}>
                    <div className={styles.actionsBar} style={{ marginTop: 0, marginBottom: 'var(--spacing-md)' }}>
                        <div className={styles.contextGrid} style={{ flex: 1 }}>
                            <div className={styles.contextItem}>
                                <span className={styles.contextLabel}>Aluno</span>
                                <span className={styles.contextValue}>{reportCard.student.fullName}</span>
                            </div>
                            <div className={styles.contextItem}>
                                <span className={styles.contextLabel}>Nº</span>
                                <span className={styles.contextValue}>{reportCard.student.studentNumber}</span>
                            </div>
                            <div className={styles.contextItem}>
                                <span className={styles.contextLabel}>Turma / Período</span>
                                <span className={styles.contextValue}>
                                    {reportCard.student.className} · {ACADEMIC_PERIOD_LABELS[reportCard.student.academicPeriod]}
                                </span>
                            </div>
                            <div className={styles.contextItem}>
                                <span className={styles.contextLabel}>Estado</span>
                                <span className={styles.contextValue}>
                                    {reportCard.published
                                        ? <Badge variant="success" size="sm"><CheckCircle size={10} /> Publicado</Badge>
                                        : <Badge variant="neutral" size="sm">Não publicado</Badge>}
                                </span>
                            </div>
                        </div>
                        {canPublish && (
                            <Button icon={<Send size={16} />} onClick={() => setConfirmPublish(true)}>
                                {reportCard.published ? 'Republicar' : 'Publicar boletim'}
                            </Button>
                        )}
                    </div>

                    {reportCard.subjects.length > 0 && (() => {
                        const stats = resultStats(reportCard.subjects.map(s => ({ score: s.finalScore, approved: s.finalScore === null ? null : s.isApproved })));
                        return (
                            <div className={styles.summaryGrid}>
                                <SummaryTile tone="purple" icon={<BookOpen size={18} />} value={`${stats.evaluated}/${reportCard.subjects.length}`} label="Disciplinas com pauta" />
                                <SummaryTile tone="blue" icon={<Award size={18} />} value={stats.average === null ? '—' : stats.average.toFixed(2)} label="Média geral" />
                                <SummaryTile tone="green" icon={<ThumbsUp size={18} />} value={stats.approved} label="Disciplinas aprovadas" />
                                <SummaryTile tone="red" icon={<ThumbsDown size={18} />} value={stats.failed} label="Disciplinas reprovadas" />
                            </div>
                        );
                    })()}

                    {reportCard.subjects.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p className={styles.emptyTitle}>Sem disciplinas no plano curricular desta classe</p>
                        </div>
                    ) : (
                        <div className={styles.reportGrid}>
                            {reportCard.subjects.map(subject => {
                                const evaluated = subject.finalScore !== null && subject.isApproved !== null;
                                const tone = !evaluated ? styles.cardEmpty : subject.isApproved ? styles.cardGood : styles.cardBad;
                                return (
                                    <div key={subject.subjectUuid} className={`${styles.subjectCard} ${tone}`}>
                                        <div className={styles.subjectCardHeader}>
                                            <div>
                                                <h3 className={styles.subjectCardTitle}>{subject.subjectName}</h3>
                                                <ResultLabel approved={evaluated ? subject.isApproved : null} emptyLabel="Sem pauta" />
                                            </div>
                                            <FinalBadge score={subject.finalScore} approved={evaluated ? subject.isApproved : null} />
                                        </div>
                                        <div className={styles.assessmentChips}>
                                            {subject.assessments.length === 0 ? (
                                                <span className={styles.hint}>Sem avaliações lançadas</span>
                                            ) : (
                                                subject.assessments.map(a => (
                                                    <span key={a.assessmentRuleUuid} className={styles.hint} title={`${a.name} (${a.weight}%)`}>
                                                        {a.code} <ScorePill score={a.score} max={a.maximumScore} />
                                                    </span>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            <ConfirmDialog
                isOpen={confirmPublish}
                onClose={() => setConfirmPublish(false)}
                onConfirm={handlePublish}
                title="Publicar boletim"
                message={`O boletim de ${reportCard?.student.fullName ?? ''} (${ACADEMIC_PERIOD_LABELS[period]}) ficará publicado. Continuar?`}
                type="warning"
                confirmText="Publicar"
            />
        </>
    );
};
