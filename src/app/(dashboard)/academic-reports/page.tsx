// src/app/(dashboard)/academic-reports/page.tsx

'use client';

import React, { useState } from 'react';
import { FileSpreadsheet, FileText, Trophy } from 'lucide-react';
import { usePermission } from '@/shared/hooks/usePermission';
import { GradebookPanel } from '@/features/academic/assessments/components/GradebookPanel';
import { ClassRankingPanel } from '@/features/academic/assessments/components/ClassRankingPanel';
import { ReportCardPanel } from '@/features/academic/assessments/components/ReportCardPanel';
import styles from '@/features/academic/assessments/styles/evaluation.module.css';

type Tab = 'gradebook' | 'ranking' | 'reportCard';

export default function AcademicReportsPage() {
    const { hasPermission } = usePermission();

    const tabs: { key: Tab; label: string; icon: React.ReactNode; allowed: boolean }[] = [
        { key: 'gradebook', label: 'Pauta por disciplina', icon: <FileSpreadsheet size={16} />, allowed: hasPermission('gradebooks.read') },
        { key: 'ranking', label: 'Ranking da turma', icon: <Trophy size={16} />, allowed: hasPermission('classRankings.read') },
        { key: 'reportCard', label: 'Boletim do aluno', icon: <FileText size={16} />, allowed: hasPermission('reportCards.read') },
    ];
    const allowedTabs = tabs.filter(t => t.allowed);

    const [tab, setTab] = useState<Tab>('gradebook');
    const activeTab = allowedTabs.some(t => t.key === tab) ? tab : allowedTabs[0]?.key;

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <div className={styles.headerIcon}>
                        <FileText size={24} />
                    </div>
                    <div>
                        <h1 className={styles.title}>Pautas e Boletins</h1>
                        <p className={styles.subtitle}>Médias por disciplina, ranking das turmas e boletins dos alunos</p>
                    </div>
                </div>
            </div>

            {allowedTabs.length === 0 ? (
                <div className={styles.panel}>
                    <div className={styles.emptyState}>
                        <FileText size={44} className={styles.emptyIcon} />
                        <p className={styles.emptyTitle}>Sem acesso</p>
                        <p>Não tem permissão para consultar pautas, rankings ou boletins.</p>
                    </div>
                </div>
            ) : (
                <>
                    <div className={styles.tabs} role="tablist">
                        {allowedTabs.map(t => (
                            <button
                                key={t.key}
                                type="button"
                                role="tab"
                                aria-selected={activeTab === t.key}
                                className={`${styles.tab} ${activeTab === t.key ? styles.active : ''}`}
                                onClick={() => setTab(t.key)}
                            >
                                {t.icon}
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'gradebook' && <GradebookPanel />}
                    {activeTab === 'ranking' && <ClassRankingPanel />}
                    {activeTab === 'reportCard' && <ReportCardPanel />}
                </>
            )}
        </div>
    );
}
