// src/features/academic/academic-years/components/AcademicYearRolloverWizard.tsx
// Assistente "Preparar o ano letivo": copia de um ano anterior o plano
// curricular, as turmas escolhidas e (opcionalmente) as atribuições.

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    BookOpen,
    Briefcase,
    CalendarDays,
    CheckCircle2,
    Info,
    School,
    Sparkles,
    XCircle,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button/Button';
import { Select } from '@/shared/components/ui/Select/Select';
import { useToast } from '@/shared/contexts/ToastContext';
import { useLoading } from '@/shared/contexts/LoadingContext';
import { getApiErrorMessage } from '@/shared/utils/api.utils';
import { academicYearRolloverService, academicYearService } from '../services/academic-year.service';
import type { AcademicYear, RolloverPreview, RolloverResult } from '../types/academic-year.types';
import styles from './AcademicYearRolloverWizard.module.css';

interface Props {
    targetYear: AcademicYear;
    onClose: () => void;
    onDone?: () => void;
}

const STEPS = ['Origem', 'Plano curricular', 'Turmas', 'Atribuições', 'Resumo'];

const SHIFT_LABELS: Record<string, string> = {
    MORNING: 'Manhã',
    AFTERNOON: 'Tarde',
    EVENING: 'Noite',
    NIGHT: 'Noite',
};

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('pt-PT');

export const AcademicYearRolloverWizard: React.FC<Props> = ({ targetYear, onClose, onDone }) => {
    const { showSuccess, showError } = useToast();
    const { startLoading, stopLoading } = useLoading();

    const [step, setStep] = useState(0);
    const [years, setYears] = useState<AcademicYear[]>([]);
    const [sourceUuid, setSourceUuid] = useState('');
    const [preview, setPreview] = useState<RolloverPreview | null>(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [copyCurriculum, setCopyCurriculum] = useState(true);
    const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set());
    const [copyAssignments, setCopyAssignments] = useState(true);
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<RolloverResult | null>(null);

    // Anos de origem possíveis: todos menos o novo; sugere o mais recente anterior
    useEffect(() => {
        academicYearService
            .getAll({ limit: 100 })
            .then(response => {
                const others = response.data
                    .filter(y => y.uuid !== targetYear.uuid)
                    .sort((a, b) => b.startDate.localeCompare(a.startDate));
                setYears(others);
                const previous = others.find(y => y.startDate < targetYear.startDate) ?? others[0];
                if (previous) setSourceUuid(previous.uuid);
            })
            .catch(error => showError('Erro', getApiErrorMessage(error, 'Não foi possível carregar os anos letivos')));
    }, [targetYear.uuid]);

    useEffect(() => {
        if (!sourceUuid) {
            setPreview(null);
            return;
        }
        setIsLoadingPreview(true);
        academicYearRolloverService
            .preview(targetYear.uuid, sourceUuid)
            .then(data => {
                setPreview(data);
                // Por defeito: todas as turmas que ainda não existem no novo ano
                setSelectedClasses(new Set(data.classes.filter(c => !c.existsInTarget).map(c => c.uuid)));
                setCopyCurriculum(data.curriculum.source.subjects > 0);
            })
            .catch(error => {
                setPreview(null);
                showError('Erro', getApiErrorMessage(error, 'Não foi possível analisar o ano de origem'));
            })
            .finally(() => setIsLoadingPreview(false));
    }, [sourceUuid, targetYear.uuid]);

    const selectedList = useMemo(
        () => preview?.classes.filter(c => selectedClasses.has(c.uuid)) ?? [],
        [preview, selectedClasses]
    );
    const assignmentsToCopy = selectedList.reduce((sum, c) => sum + c.assignmentsCount, 0);
    const effectiveCopyAssignments = copyAssignments && selectedList.length > 0;

    const toggleClass = (uuid: string) =>
        setSelectedClasses(prev => {
            const next = new Set(prev);
            if (next.has(uuid)) next.delete(uuid);
            else next.add(uuid);
            return next;
        });

    const nothingToDo = !copyCurriculum && selectedList.length === 0;

    const run = async () => {
        if (!preview) return;
        try {
            setIsRunning(true);
            startLoading();
            const response = await academicYearRolloverService.execute(targetYear.uuid, {
                sourceAcademicYearUuid: preview.source.uuid,
                copyCurriculum,
                classUuids: Array.from(selectedClasses),
                copyTeacherAssignments: effectiveCopyAssignments,
            });
            setResult(response);
            showSuccess('Ano letivo preparado', response.message);
            onDone?.();
        } catch (error) {
            showError('Erro', getApiErrorMessage(error, 'Não foi possível preparar o ano letivo'));
        } finally {
            setIsRunning(false);
            stopLoading();
        }
    };

    // ---------------- Resultado ----------------
    if (result) {
        return (
            <div className={styles.wizard}>
                <div className={styles.success}>
                    <div className={styles.successIcon}><CheckCircle2 size={38} /></div>
                    <h3 className={styles.successTitle}>{targetYear.name} está pronto a começar</h3>
                    <p className={styles.introText}>Já pode matricular os alunos nas turmas do novo ano.</p>
                </div>
                <div className={styles.stats}>
                    <div className={styles.stat}>
                        <span className={styles.statValue}>{result.curriculumCopied}</span>
                        <span className={styles.statLabel}>Disciplinas no plano</span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.statValue}>{result.classesCreated}</span>
                        <span className={styles.statLabel}>Turmas criadas</span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.statValue}>{result.assignmentsCreated}</span>
                        <span className={styles.statLabel}>Atribuições criadas</span>
                    </div>
                </div>
                {result.classesReused.length > 0 && (
                    <div className={styles.notice}>
                        <Info size={16} />
                        <span>Turmas que já existiam e foram reaproveitadas: {result.classesReused.join(', ')}.</span>
                    </div>
                )}
                {result.skipped.length > 0 && (
                    <div className={`${styles.notice} ${styles.noticeWarn}`}>
                        <AlertTriangle size={16} />
                        <div>
                            <strong>Não copiado ({result.skipped.length}):</strong>
                            <ul className={styles.skippedList}>
                                {result.skipped.map(item => <li key={item}>{item}</li>)}
                            </ul>
                        </div>
                    </div>
                )}
                <div className={styles.footer}>
                    <div className={styles.footerRight}>
                        <Button onClick={onClose}>Concluir</Button>
                    </div>
                </div>
            </div>
        );
    }

    const canAdvance =
        step === 0 ? !!preview && !isLoadingPreview
            : step === 4 ? !nothingToDo
                : true;

    return (
        <div className={styles.wizard}>
            {/* Passos */}
            <div className={styles.steps} aria-label="Passos">
                {STEPS.map((label, index) => (
                    <React.Fragment key={label}>
                        {index > 0 && <span className={styles.stepLine} />}
                        <span className={`${styles.step} ${index < step ? styles.done : ''} ${index === step ? styles.current : ''}`}>
                            <span className={styles.stepNumber}>{index < step ? '✓' : index + 1}</span>
                            {label}
                        </span>
                    </React.Fragment>
                ))}
            </div>

            {/* 1. Origem */}
            {step === 0 && (
                <>
                    <div className={styles.intro}>
                        <span className={styles.introIcon}><Sparkles size={22} /></span>
                        <div>
                            <p className={styles.introTitle}>Preparar o ano letivo {targetYear.name}</p>
                            <p className={styles.introText}>
                                Copie de um ano anterior o plano curricular, as turmas e as atribuições dos professores.
                                As matrículas dos alunos não são copiadas.
                            </p>
                        </div>
                    </div>
                    {years.length === 0 ? (
                        <div className={styles.notice}>
                            <Info size={16} />
                            <span>Não existe outro ano letivo de onde copiar.</span>
                        </div>
                    ) : (
                        <Select
                            label="Copiar a partir do ano letivo"
                            value={sourceUuid}
                            onChange={e => setSourceUuid(e.target.value)}
                            options={years.map(y => ({ value: y.uuid, label: `${y.name} (${formatDate(y.startDate)} – ${formatDate(y.endDate)})` }))}
                            fullWidth
                        />
                    )}
                    {isLoadingPreview && <p className={styles.loading}>A analisar o ano de origem...</p>}
                    {preview && !isLoadingPreview && (
                        <div className={styles.stats}>
                            <div className={styles.stat}>
                                <span className={styles.statValue}>{preview.curriculum.source.subjects}</span>
                                <span className={styles.statLabel}>Disciplinas no plano ({preview.curriculum.source.grades} classes)</span>
                            </div>
                            <div className={styles.stat}>
                                <span className={styles.statValue}>{preview.classes.length}</span>
                                <span className={styles.statLabel}>Turmas</span>
                            </div>
                            <div className={styles.stat}>
                                <span className={styles.statValue}>{preview.classes.reduce((s, c) => s + c.assignmentsCount, 0)}</span>
                                <span className={styles.statLabel}>Atribuições de professores</span>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* 2. Plano curricular */}
            {step === 1 && preview && (
                <>
                    <label className={`${styles.option} ${copyCurriculum ? styles.checked : ''} ${preview.curriculum.source.subjects === 0 ? styles.disabled : ''}`}>
                        <input
                            type="checkbox"
                            checked={copyCurriculum}
                            disabled={preview.curriculum.source.subjects === 0}
                            onChange={e => setCopyCurriculum(e.target.checked)}
                        />
                        <span>
                            <span className={styles.optionTitle}><BookOpen size={14} /> Copiar o plano curricular de {preview.source.name}</span>
                            <span className={styles.optionText}>
                                {preview.curriculum.source.subjects} disciplina(s) em {preview.curriculum.source.grades} classe(s).
                                Depois pode ajustar o plano de {targetYear.name} em &quot;Plano Curricular&quot; sem alterar {preview.source.name}.
                            </span>
                        </span>
                    </label>
                    {preview.curriculum.target.subjects > 0 && (
                        <div className={styles.notice}>
                            <Info size={16} />
                            <span>
                                {targetYear.name} já tem {preview.curriculum.target.subjects} disciplina(s) no plano.
                                Só são acrescentadas as que faltam; nada é removido.
                            </span>
                        </div>
                    )}
                    {!copyCurriculum && preview.curriculum.target.subjects === 0 && (
                        <div className={`${styles.notice} ${styles.noticeWarn}`}>
                            <AlertTriangle size={16} />
                            <span>Sem plano curricular não é possível atribuir disciplinas aos professores em {targetYear.name}.</span>
                        </div>
                    )}
                </>
            )}

            {/* 3. Turmas */}
            {step === 2 && preview && (
                <>
                    <div className={styles.classHeader}>
                        <span className={styles.optionTitle}><School size={14} /> Turmas a copiar ({selectedClasses.size}/{preview.classes.length})</span>
                        {preview.classes.length > 0 && (
                            <span>
                                <button type="button" className={styles.linkButton} onClick={() => setSelectedClasses(new Set(preview.classes.map(c => c.uuid)))}>
                                    Selecionar todas
                                </button>
                                {' · '}
                                <button type="button" className={styles.linkButton} onClick={() => setSelectedClasses(new Set())}>
                                    Nenhuma
                                </button>
                            </span>
                        )}
                    </div>
                    {preview.classes.length === 0 ? (
                        <div className={styles.notice}><Info size={16} /><span>{preview.source.name} não tem turmas.</span></div>
                    ) : (
                        <div className={styles.classList}>
                            {preview.classes.map(c => (
                                <label key={c.uuid} className={`${styles.classRow} ${selectedClasses.has(c.uuid) ? styles.checked : ''}`}>
                                    <input type="checkbox" checked={selectedClasses.has(c.uuid)} onChange={() => toggleClass(c.uuid)} />
                                    <span className={styles.classBadge}>
                                        <span className={styles.classBadgeSmall}>{c.gradeName.replace(/\s*Classe/i, '')}</span>
                                        {c.name}
                                    </span>
                                    <span className={styles.classInfo}>
                                        <span className={styles.className}>{c.gradeName} · Turma {c.name}</span>
                                        <span className={styles.classMeta}>
                                            {SHIFT_LABELS[c.shift] ?? c.shift} · {c.capacity} lugares{c.room ? ` · Sala ${c.room}` : ''}
                                            {' · '}{c.assignmentsCount} atribuição(ões){c.directorName ? ` · Diretor: ${c.directorName}` : ''}
                                        </span>
                                    </span>
                                    {c.existsInTarget && <span className={`${styles.tag} ${styles.tagInfo}`}>Já existe em {targetYear.name}</span>}
                                </label>
                            ))}
                        </div>
                    )}
                    <p className={styles.optionText}>As turmas são criadas vazias, sem alunos.</p>
                </>
            )}

            {/* 4. Atribuições */}
            {step === 3 && preview && (
                <>
                    <label className={`${styles.option} ${effectiveCopyAssignments ? styles.checked : ''} ${selectedList.length === 0 ? styles.disabled : ''}`}>
                        <input
                            type="checkbox"
                            checked={effectiveCopyAssignments}
                            disabled={selectedList.length === 0}
                            onChange={e => setCopyAssignments(e.target.checked)}
                        />
                        <span>
                            <span className={styles.optionTitle}><Briefcase size={14} /> Copiar também as atribuições de professores</span>
                            <span className={styles.optionText}>
                                {assignmentsToCopy} atribuição(ões) das turmas escolhidas: mesmo professor, mesma turma e disciplina,
                                com as datas de {targetYear.name} ({formatDate(targetYear.startDate)} – {formatDate(targetYear.endDate)}).
                                Inclui o diretor de turma. Os professores com acesso recebem uma notificação.
                            </span>
                        </span>
                    </label>
                    {selectedList.length === 0 && (
                        <div className={styles.notice}><Info size={16} /><span>Escolha pelo menos uma turma no passo anterior.</span></div>
                    )}
                    <div className={styles.notice}>
                        <Info size={16} />
                        <span>Professores inativos e disciplinas fora do plano de {targetYear.name} são ignorados e indicados no fim.</span>
                    </div>
                </>
            )}

            {/* 5. Resumo */}
            {step === 4 && preview && (
                <>
                    <div className={styles.intro}>
                        <span className={styles.introIcon}><CalendarDays size={22} /></span>
                        <div>
                            <p className={styles.introTitle}>{preview.source.name} → {targetYear.name}</p>
                            <p className={styles.introText}>Confirme o que vai ser copiado.</p>
                        </div>
                    </div>
                    <ul className={styles.summaryList}>
                        <li className={copyCurriculum ? styles.summaryOn : styles.summaryOff}>
                            {copyCurriculum ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                            Plano curricular ({preview.curriculum.source.subjects} disciplinas)
                        </li>
                        <li className={selectedList.length ? styles.summaryOn : styles.summaryOff}>
                            {selectedList.length ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                            {selectedList.length} turma(s){selectedList.length ? `: ${selectedList.map(c => `${c.gradeName} ${c.name}`).join(', ')}` : ''}
                        </li>
                        <li className={effectiveCopyAssignments ? styles.summaryOn : styles.summaryOff}>
                            {effectiveCopyAssignments ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                            {effectiveCopyAssignments ? `${assignmentsToCopy} atribuição(ões) de professores` : 'Atribuições de professores não copiadas'}
                        </li>
                    </ul>
                    {nothingToDo && (
                        <div className={`${styles.notice} ${styles.noticeWarn}`}>
                            <AlertTriangle size={16} />
                            <span>Não escolheu nada para copiar.</span>
                        </div>
                    )}
                </>
            )}

            <div className={styles.footer}>
                <Button variant="secondary" onClick={onClose} disabled={isRunning}>
                    {step === 0 ? 'Agora não' : 'Cancelar'}
                </Button>
                <div className={styles.footerRight}>
                    {step > 0 && (
                        <Button variant="secondary" icon={<ArrowLeft size={16} />} onClick={() => setStep(s => s - 1)} disabled={isRunning}>
                            Anterior
                        </Button>
                    )}
                    {step < STEPS.length - 1 ? (
                        <Button icon={<ArrowRight size={16} />} iconPosition="right" onClick={() => setStep(s => s + 1)} disabled={!canAdvance || years.length === 0}>
                            Próximo
                        </Button>
                    ) : (
                        <Button variant="success" icon={<Sparkles size={16} />} onClick={run} isLoading={isRunning} disabled={isRunning || nothingToDo}>
                            Preparar {targetYear.name}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};
