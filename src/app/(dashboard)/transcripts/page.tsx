// src/app/(dashboard)/transcripts/page.tsx

'use client';

import React, { useState } from 'react';
import { AlertTriangle, Archive, CheckCircle, Search, Send } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button/Button';
import { Input } from '@/shared/components/ui/Input/Input';
import { Badge } from '@/shared/components/ui/Badge/Badge';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog/ConfirmDialog';
import { useToast } from '@/shared/contexts/ToastContext';
import { useLoading } from '@/shared/contexts/LoadingContext';
import { usePermission } from '@/shared/hooks/usePermission';
import { getApiErrorMessage } from '@/shared/utils/api.utils';
import { assessmentService } from '@/features/academic/assessments/services/assessment.service';
import {
    ACADEMIC_PERIOD_LABELS,
    type AcademicTranscript,
    type StudentOption,
} from '@/features/academic/assessments/types/assessment.types';
import styles from '@/features/academic/assessments/styles/evaluation.module.css';

const formatScore = (value: number | null | undefined) =>
    value === null || value === undefined ? '—' : value.toFixed(2);

const studentName = (s: StudentOption) => s.fullName || `${s.firstName} ${s.lastName}`;

export default function TranscriptsPage() {
    const { showSuccess, showError } = useToast();
    const { startLoading, stopLoading } = useLoading();
    const { hasPermission } = usePermission();
    const canRead = hasPermission('academicTranscripts.read');
    const canPublish = hasPermission('academicTranscripts.publish');

    const [search, setSearch] = useState('');
    const [results, setResults] = useState<StudentOption[] | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [selected, setSelected] = useState<StudentOption | null>(null);
    const [transcript, setTranscript] = useState<AcademicTranscript | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [confirmPublish, setConfirmPublish] = useState(false);

    const handleSearch = async () => {
        const term = search.trim();
        if (term.length < 2) {
            showError('Pesquisa', 'Escreva pelo menos 2 caracteres do nome ou número do aluno.');
            return;
        }
        try {
            setIsSearching(true);
            setResults(await assessmentService.searchStudents(term));
        } catch (err) {
            setResults([]);
            showError('Erro', getApiErrorMessage(err, 'Não foi possível pesquisar alunos'));
        } finally {
            setIsSearching(false);
        }
    };

    const loadTranscript = async (student: StudentOption) => {
        setSelected(student);
        setResults(null);
        try {
            setIsLoading(true);
            setError(null);
            setTranscript(await assessmentService.getTranscript(student.uuid));
        } catch (err) {
            setTranscript(null);
            setError(getApiErrorMessage(err, 'Não foi possível carregar o histórico escolar'));
        } finally {
            setIsLoading(false);
        }
    };

    const handlePublish = async () => {
        if (!selected) return;
        try {
            startLoading();
            const result = await assessmentService.publishTranscript(selected.uuid);
            showSuccess('Publicado', result.message);
            setConfirmPublish(false);
            await loadTranscript(selected);
        } catch (err) {
            showError('Erro', getApiErrorMessage(err, 'Não foi possível publicar o histórico'));
        } finally {
            stopLoading();
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <div className={styles.headerIcon}>
                        <Archive size={24} />
                    </div>
                    <div>
                        <h1 className={styles.title}>Histórico Escolar</h1>
                        <p className={styles.subtitle}>Resultados do aluno por ano letivo, disciplina e período</p>
                    </div>
                </div>
            </div>

            {!canRead ? (
                <div className={styles.panel}>
                    <div className={styles.emptyState}>
                        <Archive size={44} className={styles.emptyIcon} />
                        <p className={styles.emptyTitle}>Sem acesso</p>
                        <p>Não tem permissão para consultar o histórico escolar.</p>
                    </div>
                </div>
            ) : (
                <>
                    <div className={styles.panel}>
                        <h2 className={styles.panelTitle}>
                            <Search size={18} />
                            Pesquisar aluno
                        </h2>
                        <div className={styles.filters}>
                            <Input
                                label="Nome ou número do aluno"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                fullWidth
                            />
                            <div>
                                <Button icon={<Search size={16} />} onClick={handleSearch} isLoading={isSearching} disabled={isSearching}>
                                    Pesquisar
                                </Button>
                            </div>
                        </div>
                        {results && (
                            <div className={styles.searchResults}>
                                {results.length === 0 && <p className={styles.hint}>Nenhum aluno encontrado.</p>}
                                {results.map(student => (
                                    <button key={student.uuid} type="button" className={styles.searchResult} onClick={() => loadTranscript(student)}>
                                        <span>{studentName(student)}</span>
                                        <span className={styles.hint}>{student.studentNumber}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className={`${styles.banner} ${styles.bannerWarning}`}>
                            <AlertTriangle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    {isLoading && <p className={styles.loadingText}>A carregar histórico...</p>}

                    {!isLoading && transcript && (
                        <div className={styles.panel}>
                            <div className={styles.actionsBar} style={{ marginTop: 0, marginBottom: 'var(--spacing-md)' }}>
                                <div className={styles.contextGrid} style={{ flex: 1 }}>
                                    <div className={styles.contextItem}>
                                        <span className={styles.contextLabel}>Aluno</span>
                                        <span className={styles.contextValue}>{transcript.studentName}</span>
                                    </div>
                                    <div className={styles.contextItem}>
                                        <span className={styles.contextLabel}>Matrícula</span>
                                        <span className={styles.contextValue}>{transcript.enrollmentNumber ?? '—'}</span>
                                    </div>
                                    <div className={styles.contextItem}>
                                        <span className={styles.contextLabel}>Estado</span>
                                        <span className={styles.contextValue}>
                                            {transcript.published
                                                ? <Badge variant="success" size="sm"><CheckCircle size={10} /> Publicado</Badge>
                                                : <Badge variant="neutral" size="sm">Não publicado</Badge>}
                                        </span>
                                    </div>
                                </div>
                                {canPublish && transcript.years.length > 0 && (
                                    <Button icon={<Send size={16} />} onClick={() => setConfirmPublish(true)}>
                                        {transcript.published ? 'Republicar' : 'Publicar histórico'}
                                    </Button>
                                )}
                            </div>

                            {transcript.years.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <p className={styles.emptyTitle}>Sem resultados</p>
                                    <p>Este aluno ainda não tem pautas calculadas.</p>
                                </div>
                            ) : (
                                transcript.years.map(year => (
                                    <div key={year.academicYearUuid} className={styles.yearBlock}>
                                        <div className={styles.yearHeader}>
                                            <h3 className={styles.yearTitle}>Ano letivo {year.academicYearName}</h3>
                                            <span>
                                                Média: <strong>{formatScore(year.average)}</strong>{' '}
                                                {year.isApproved
                                                    ? <span className={styles.approved}>Aprovado</span>
                                                    : <span className={styles.failed}>Reprovado</span>}
                                            </span>
                                        </div>
                                        <div className={styles.tableWrapper}>
                                            <table className={styles.table}>
                                                <thead>
                                                    <tr>
                                                        <th>Disciplina</th>
                                                        <th>Turma</th>
                                                        <th>Período</th>
                                                        <th className={styles.numeric}>Média</th>
                                                        <th>Resultado</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {year.subjects.map(subject => (
                                                        <tr key={`${subject.subjectUuid}-${subject.academicPeriod}`}>
                                                            <td>{subject.subjectName}</td>
                                                            <td>{subject.className}</td>
                                                            <td>{ACADEMIC_PERIOD_LABELS[subject.academicPeriod] ?? subject.academicPeriod}</td>
                                                            <td className={styles.numeric}>{formatScore(subject.finalScore)}</td>
                                                            <td>
                                                                {subject.isApproved === null ? (
                                                                    <span className={styles.muted}>—</span>
                                                                ) : subject.isApproved ? (
                                                                    <span className={styles.approved}>Aprovado</span>
                                                                ) : (
                                                                    <span className={styles.failed}>Reprovado</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </>
            )}

            <ConfirmDialog
                isOpen={confirmPublish}
                onClose={() => setConfirmPublish(false)}
                onConfirm={handlePublish}
                title="Publicar histórico escolar"
                message={`O histórico escolar de ${transcript?.studentName ?? ''} ficará publicado. Continuar?`}
                type="warning"
                confirmText="Publicar"
            />
        </div>
    );
}
