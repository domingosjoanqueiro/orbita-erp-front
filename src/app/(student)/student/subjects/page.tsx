'use client';

import React from 'react';
import { BookOpen, Crown, UserRound } from 'lucide-react';
import { useStudentSubjects } from '@/features/student-portal/hooks/useStudentPortal';
import {
  Badge,
  EmptyState,
  ErrorState,
  ListSkeleton,
} from '@/features/student-portal/components/PortalUI/PortalUI';
import styles from '@/features/student-portal/styles/portal.module.css';
import local from './page.module.css';

// Cor estável por disciplina (a partir do código)
const PALETTE = ['#4F46E5', '#0891B2', '#059669', '#D97706', '#DB2777', '#7C3AED', '#2563EB', '#DC2626'];

function colorFor(code: string): string {
  let hash = 0;
  for (const char of code) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export default function StudentSubjectsPage() {
  const { data, isLoading, isError, error, refetch } = useStudentSubjects();

  return (
    <div className={styles.page}>
      {isLoading ? (
        <ListSkeleton rows={6} />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : !data?.length ? (
        <div className={styles.card}>
          <EmptyState
            icon={<BookOpen size={26} />}
            title="Sem disciplinas"
            text="Ainda não tem matrícula ativa ou a sua turma não tem disciplinas no plano curricular."
          />
        </div>
      ) : (
        <>
          <p className={styles.muted} style={{ padding: '0 4px' }}>
            {data.length} {data.length === 1 ? 'disciplina' : 'disciplinas'} no plano curricular da sua turma
          </p>
          <div className={local.grid}>
            {data.map(subject => {
              const color = colorFor(subject.subjectCode || subject.subjectName);
              return (
                <article key={subject.subjectUuid} className={`${styles.card} ${local.subject}`}>
                  <span
                    className={local.code}
                    style={{ background: `${color}1A`, color }}
                  >
                    {(subject.subjectCode || subject.subjectName).slice(0, 4).toUpperCase()}
                  </span>
                  <div className={local.body}>
                    <h3 className={local.name}>{subject.subjectName}</h3>
                    <p className={local.teacher}>
                      <UserRound size={14} />
                      <span>{subject.teacherName ?? 'Professor por atribuir'}</span>
                    </p>
                    <div className={local.tags}>
                      {subject.teacherIsClassDirector && (
                        <Badge tone="accent"><Crown size={11} /> Diretor(a) de turma</Badge>
                      )}
                      {subject.weeklyWorkload !== null && (
                        <Badge tone="neutral">{subject.weeklyWorkload} h/semana</Badge>
                      )}
                      {!subject.isMandatory && <Badge tone="good">Opcional</Badge>}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
