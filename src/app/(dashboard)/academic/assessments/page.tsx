// src/app/(dashboard)/academic/assessments/page.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { BarChart3, ClipboardCheck, ClipboardEdit } from 'lucide-react';
import { usePermission } from '@/shared/hooks/usePermission';
import { ScoreEntryPanel } from '@/features/academic/assessments/components/ScoreEntryPanel';
import { SubmissionReviewPanel } from '@/features/academic/assessments/components/SubmissionReviewPanel';
import styles from '@/features/academic/assessments/styles/evaluation.module.css';

type Tab = 'entry' | 'review';

export default function AssessmentsPage() {
    const { hasPermission, hasAnyPermission } = usePermission();
    const canEnter = hasPermission('assessmentScores.read');
    const canReview = hasAnyPermission(['assessmentSubmissions.validate', 'assessmentSubmissions.publish']);
    const [tab, setTab] = useState<Tab>('entry');

    // Ligações das notificações: /academic/assessments?tab=review
    useEffect(() => {
        if (new URLSearchParams(window.location.search).get('tab') === 'review') setTab('review');
    }, []);

    const activeTab: Tab = !canEnter && canReview ? 'review' : tab;

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <div className={styles.headerIcon}>
                        <BarChart3 size={24} />
                    </div>
                    <div>
                        <h1 className={styles.title}>Notas de Alunos</h1>
                        <p className={styles.subtitle}>Lançamento, submissão e validação das notas por período</p>
                    </div>
                </div>
            </div>

            {!canEnter && !canReview ? (
                <div className={styles.panel}>
                    <div className={styles.emptyState}>
                        <ClipboardEdit size={44} className={styles.emptyIcon} />
                        <p className={styles.emptyTitle}>Sem acesso</p>
                        <p>Não tem permissão para consultar ou validar notas.</p>
                    </div>
                </div>
            ) : (
                <>
                    {canEnter && canReview && (
                        <div className={styles.tabs} role="tablist">
                            <button
                                type="button"
                                role="tab"
                                aria-selected={activeTab === 'entry'}
                                className={`${styles.tab} ${activeTab === 'entry' ? styles.active : ''}`}
                                onClick={() => setTab('entry')}
                            >
                                <ClipboardEdit size={16} />
                                Lançamento
                            </button>
                            <button
                                type="button"
                                role="tab"
                                aria-selected={activeTab === 'review'}
                                className={`${styles.tab} ${activeTab === 'review' ? styles.active : ''}`}
                                onClick={() => setTab('review')}
                            >
                                <ClipboardCheck size={16} />
                                Validação e publicação
                            </button>
                        </div>
                    )}

                    {activeTab === 'entry' ? <ScoreEntryPanel /> : <SubmissionReviewPanel />}
                </>
            )}
        </div>
    );
}
