// src/features/academic/assessments/components/ClassRankingPanel.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Award, CheckCircle, Percent, Send, ThumbsDown, ThumbsUp, Trophy } from 'lucide-react';
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
    type ClassRanking,
} from '../types/assessment.types';
import { FinalBadge, ResultLabel, ScorePill, StudentCell, SummaryTile, resultStats } from './EvaluationUI';
import styles from '../styles/evaluation.module.css';

export const PERIOD_OPTIONS = (Object.keys(ACADEMIC_PERIOD_LABELS) as AcademicPeriod[]).map(p => ({
    value: p,
    label: ACADEMIC_PERIOD_LABELS[p],
}));

export const classLabel = (c: ClassOption) => `${c.gradeName} ${c.name} (${c.academicYearName})`;

/*
 * Turmas disponíveis para ranking/boletins.
 * Professor: só as turmas de que é diretor; restantes: todas as turmas ativas.
 */
export const loadReportClasses = async (isTeacher: boolean): Promise<ClassOption[]> => {
    if (!isTeacher) return assessmentService.getClasses();
    const assignments = await assessmentService.getTeacherAssignments(true);
    const directed = new Map<string, ClassOption>();
    assignments
        .filter(a => a.isClassDirector)
        .forEach(a => directed.set(a.classUuid, {
            uuid: a.classUuid,
            name: a.className,
            gradeName: a.gradeName,
            academicYearName: a.academicYearName,
        }));
    return Array.from(directed.values());
};

export const ClassRankingPanel: React.FC = () => {
    const { showSuccess, showError } = useToast();
    const { startLoading, stopLoading } = useLoading();
    const { hasPermission } = usePermission();
    const canPublish = hasPermission('classRankings.publish');
    const { user } = useAuth();
    const isTeacher = !!user?.teacher;

    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [classUuid, setClassUuid] = useState('');
    const [period, setPeriod] = useState<AcademicPeriod>('FIRST');
    const [ranking, setRanking] = useState<ClassRanking | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [confirmPublish, setConfirmPublish] = useState(false);

    useEffect(() => {
        loadReportClasses(isTeacher)
            .then(setClasses)
            .catch(err => showError('Erro', getApiErrorMessage(err, 'Não foi possível carregar as turmas')));
    }, [isTeacher]);

    const load = async () => {
        if (!classUuid) {
            setRanking(null);
            return;
        }
        try {
            setIsLoading(true);
            setError(null);
            setRanking(await assessmentService.getClassRanking(classUuid, period));
        } catch (err) {
            setRanking(null);
            setError(getApiErrorMessage(err, 'Não foi possível carregar o ranking'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [classUuid, period]);

    const handlePublish = async () => {
        try {
            startLoading();
            const result = await assessmentService.publishClassRanking(classUuid, period);
            showSuccess('Publicado', result.message);
            setConfirmPublish(false);
            await load();
        } catch (err) {
            showError('Erro', getApiErrorMessage(err, 'Não foi possível publicar o ranking'));
        } finally {
            stopLoading();
        }
    };

    const subjects = ranking?.students[0]?.subjects ?? [];
    const stats = resultStats((ranking?.students ?? []).map(s => ({ score: s.average, approved: s.isApproved })));
    const best = ranking?.students[0];

    // Medalhas para as três primeiras posições
    const medalClass = (rank: number) =>
        rank === 1 ? styles.gold : rank === 2 ? styles.silver : rank === 3 ? styles.bronze : styles.plain;

    return (
        <>
            <div className={styles.panel}>
                <h2 className={styles.panelTitle}>
                    <Trophy size={18} />
                    Ranking da turma
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

            {isLoading && <p className={styles.loadingText}>A carregar ranking...</p>}

            {!isLoading && ranking && (
                <div className={styles.panel}>
                    <div className={styles.actionsBar} style={{ marginTop: 0, marginBottom: 'var(--spacing-md)' }}>
                        <div className={styles.actionsGroup} style={{ alignItems: 'center' }}>
                            <strong>{ranking.className} — {ACADEMIC_PERIOD_LABELS[ranking.academicPeriod]}</strong>
                            {ranking.published
                                ? <Badge variant="success" size="sm"><CheckCircle size={10} /> Publicado</Badge>
                                : <Badge variant="neutral" size="sm">Não publicado</Badge>}
                        </div>
                        {canPublish && ranking.students.length > 0 && (
                            <Button icon={<Send size={16} />} onClick={() => setConfirmPublish(true)}>
                                {ranking.published ? 'Republicar' : 'Publicar ranking'}
                            </Button>
                        )}
                    </div>

                    {ranking.students.length > 0 && (
                        <div className={styles.summaryGrid}>
                            <SummaryTile tone="amber" icon={<Trophy size={18} />} value={best ? best.average.toFixed(2) : '—'} label={best ? `Melhor: ${best.studentName}` : 'Melhor média'} />
                            <SummaryTile tone="blue" icon={<Award size={18} />} value={stats.average === null ? '—' : stats.average.toFixed(2)} label="Média da turma" />
                            <SummaryTile tone="green" icon={<ThumbsUp size={18} />} value={stats.approved} label="Aprovados" />
                            <SummaryTile tone="red" icon={<ThumbsDown size={18} />} value={stats.failed} label="Reprovados" />
                            <SummaryTile tone="purple" icon={<Percent size={18} />} value={stats.rate === null ? '—' : `${stats.rate}%`} label="Taxa de aprovação" />
                        </div>
                    )}

                    {ranking.students.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p className={styles.emptyTitle}>Sem alunos matriculados</p>
                        </div>
                    ) : (
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th className={styles.numeric}>Pos.</th>
                                        <th>Aluno</th>
                                        {subjects.map(s => (
                                            <th key={s.subjectUuid} className={styles.numeric}>{s.subjectName}</th>
                                        ))}
                                        <th className={styles.numeric}>Média</th>
                                        <th>Resultado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ranking.students.map(student => (
                                        <tr key={student.studentUuid} className={student.rank <= 3 ? styles.podiumRow : ''}>
                                            <td className={styles.numeric}>
                                                <span className={`${styles.medal} ${medalClass(student.rank)}`}>{student.rank}º</span>
                                            </td>
                                            <td>
                                                <StudentCell uuid={student.studentUuid} name={student.studentName} number={student.enrollmentNumber} />
                                            </td>
                                            {student.subjects.map(s => (
                                                <td key={s.subjectUuid} className={styles.numeric}>
                                                    <ScorePill score={s.finalScore} max={20} />
                                                </td>
                                            ))}
                                            <td className={styles.numeric}>
                                                <FinalBadge score={student.average} approved={student.isApproved} />
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
                        Média = média simples das disciplinas com pauta calculada neste período.
                    </p>
                </div>
            )}

            <ConfirmDialog
                isOpen={confirmPublish}
                onClose={() => setConfirmPublish(false)}
                onConfirm={handlePublish}
                title="Publicar ranking"
                message={`O ranking de ${ranking?.className ?? ''} (${ACADEMIC_PERIOD_LABELS[period]}) ficará publicado. Continuar?`}
                type="warning"
                confirmText="Publicar"
            />
        </>
    );
};
