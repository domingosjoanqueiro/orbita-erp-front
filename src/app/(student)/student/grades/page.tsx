'use client';

import React, { Suspense, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, Clock, GraduationCap, Info } from 'lucide-react';
import { useStudentGrades } from '@/features/student-portal/hooks/useStudentPortal';
import {
  Badge,
  EmptyState,
  ErrorState,
  ListSkeleton,
  ProgressBar,
  ScoreRing,
  Skeleton,
} from '@/features/student-portal/components/PortalUI/PortalUI';
import { formatDate, formatScore, scoreTone } from '@/features/student-portal/utils/format';
import type { AcademicPeriod, StudentGradeSubject } from '@/features/student-portal/types/student-portal.types';
import styles from '@/features/student-portal/styles/portal.module.css';
import local from './page.module.css';

const PERIODS: AcademicPeriod[] = ['FIRST', 'SECOND', 'THIRD', 'FOURTH', 'FINAL'];

function SubjectCard({ subject }: { subject: StudentGradeSubject }) {
  const [open, setOpen] = useState(false);
  const pending = subject.visibility === 'PENDING';
  const tone = scoreTone(subject.finalScore);

  return (
    <article className={`${styles.card} ${local.subject} ${open ? local.subjectOpen : ''}`}>
      <button
        type="button"
        className={local.subjectHeader}
        onClick={() => !pending && setOpen(value => !value)}
        aria-expanded={pending ? undefined : open}
        disabled={pending}
      >
        <ScoreRing
          value={subject.finalScore}
          max={20}
          size={52}
          stroke={5}
          tone={pending ? 'neutral' : tone}
          label={pending ? '—' : formatScore(subject.finalScore)}
        />
        <span className={styles.listBody}>
          <span className={styles.listTitle}>{subject.subjectName}</span>
          <span className={styles.listSubtitle}>{subject.teacherName ?? 'Professor por atribuir'}</span>
          <span className={local.badges}>
            {pending ? (
              <Badge tone="neutral"><Clock size={11} /> Aguarda publicação</Badge>
            ) : (
              <>
                {subject.visibility === 'PROVISIONAL' && <Badge tone="warning">Provisória</Badge>}
                {subject.isApproved === true && <Badge tone="excellent">Positiva</Badge>}
                {subject.isApproved === false && <Badge tone="danger">Negativa</Badge>}
              </>
            )}
          </span>
        </span>
        {!pending && <ChevronDown size={20} className={local.chevron} aria-hidden />}
      </button>

      {open && !pending && (
        <div className={local.subjectBody}>
          {subject.assessments.map(assessment => {
            const percent = assessment.score === null || !assessment.maximumScore
              ? null
              : (assessment.score / assessment.maximumScore) * 100;
            const normalized = percent === null ? null : percent / 5;
            return (
              <div key={assessment.ruleUuid} className={local.assessment}>
                <div className={local.assessmentRow}>
                  <span className={local.assessmentName}>
                    {assessment.name}
                    <span className={local.weight}>{formatScore(assessment.weight)}%</span>
                  </span>
                  <span className={local.assessmentScore}>
                    {assessment.score === null ? (
                      <span className={styles.muted}>Sem nota</span>
                    ) : (
                      <>
                        <strong>{formatScore(assessment.score)}</strong>
                        <span className={styles.muted}> / {formatScore(assessment.maximumScore)}</span>
                      </>
                    )}
                  </span>
                </div>
                <ProgressBar value={percent} tone={scoreTone(normalized)} label={assessment.name} />
              </div>
            );
          })}
          {subject.publishedAt && (
            <p className={local.footnote}>Publicada a {formatDate(subject.publishedAt)}</p>
          )}
        </div>
      )}
    </article>
  );
}

function GradesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const param = searchParams.get('period')?.toUpperCase() as AcademicPeriod | undefined;
  const requested = param && PERIODS.includes(param) ? param : undefined;

  const { data, isLoading, isError, error, refetch, isFetching } = useStudentGrades(requested);

  const selectPeriod = (period: AcademicPeriod) => {
    router.replace(`${pathname}?period=${period}`, { scroll: false });
  };

  if (isError) {
    return <ErrorState error={error} onRetry={() => refetch()} />;
  }

  if (isLoading || !data) {
    return (
      <>
        <div className={styles.chips}>
          {[0, 1, 2].map(index => <Skeleton key={index} height={38} width={110} radius={999} />)}
        </div>
        <Skeleton height={120} radius={20} />
        <ListSkeleton rows={4} />
      </>
    );
  }

  if (!data.periods.length) {
    return (
      <div className={styles.card}>
        <EmptyState
          icon={<GraduationCap size={26} />}
          title="Sem períodos de avaliação"
          text="O seu curso ainda não tem períodos de avaliação configurados, ou não tem matrícula ativa."
        />
      </div>
    );
  }

  const { summary } = data;
  const hasProvisional = data.subjects.some(subject => subject.visibility === 'PROVISIONAL');

  return (
    <>
      {/* Períodos */}
      <div className={styles.chips} role="tablist" aria-label="Período">
        {data.periods.map(period => {
          const active = period.academicPeriod === data.period?.academicPeriod;
          return (
            <button
              key={period.academicPeriod}
              type="button"
              role="tab"
              aria-selected={active}
              className={`${styles.chip} ${active ? styles.chipActive : ''}`}
              onClick={() => selectPeriod(period.academicPeriod)}
            >
              {period.hasPublished && <span className={styles.chipDot} aria-label="com notas publicadas" />}
              {period.displayName}
            </button>
          );
        })}
      </div>

      {/* Resumo do período */}
      <section className={`${styles.card} ${local.summary}`} style={{ opacity: isFetching ? 0.6 : 1 }}>
        <ScoreRing
          value={summary.average}
          max={20}
          size={96}
          stroke={8}
          tone={scoreTone(summary.average)}
          label={formatScore(summary.average)}
          caption="MÉDIA"
        />
        <div className={local.summaryStats}>
          <div>
            <strong className={local.summaryValue} style={{ color: 'var(--tone-excellent)' }}>{summary.approvedCount}</strong>
            <span className={styles.statLabel}>Positivas</span>
          </div>
          <div>
            <strong className={local.summaryValue} style={{ color: 'var(--tone-danger)' }}>{summary.failedCount}</strong>
            <span className={styles.statLabel}>Negativas</span>
          </div>
          <div>
            <strong className={local.summaryValue}>
              {summary.visibleCount}<small>/{summary.totalSubjects}</small>
            </strong>
            <span className={styles.statLabel}>Com notas</span>
          </div>
        </div>
      </section>

      {hasProvisional && (
        <div className={local.notice} role="note">
          <Info size={18} />
          <span>As notas marcadas como <strong>provisórias</strong> ainda não foram publicadas e podem mudar.</span>
        </div>
      )}

      {/* Disciplinas */}
      <section className={styles.section} aria-label="Disciplinas" style={{ opacity: isFetching ? 0.6 : 1 }}>
        {data.subjects.length === 0 ? (
          <div className={styles.card}>
            <EmptyState icon={<GraduationCap size={26} />} title="Sem disciplinas" text="A sua turma ainda não tem disciplinas no plano curricular." />
          </div>
        ) : (
          data.subjects.map(subject => <SubjectCard key={subject.subjectUuid} subject={subject} />)
        )}
      </section>

      <p className={local.legend}>Escala de 0 a 20 · positiva a partir de 10 valores.</p>
    </>
  );
}

export default function StudentGradesPage() {
  return (
    <div className={styles.page}>
      <Suspense fallback={<ListSkeleton rows={4} />}>
        <GradesContent />
      </Suspense>
    </div>
  );
}
