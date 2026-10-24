'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowDownRight, ArrowUpRight, ChevronRight, Minus } from 'lucide-react';
import styles from './dashboard.module.css';

export { styles as dashboardStyles };

export const DashboardHero: React.FC<{
    eyebrow: string;
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    actions?: React.ReactNode;
}> = ({ icon, title, subtitle, actions }) => (
    <header className={styles.hero}>
        <div className={styles.heroLeft}>
            <div className={styles.heroIcon}>{icon}</div>
            <div>
                <h1 className={styles.heroTitle}>{title}</h1>
                <p className={styles.heroSubtitle}>{subtitle}</p>
            </div>
        </div>
        {actions && <div className={styles.heroActions}>{actions}</div>}
    </header>
);

// Variação face ao período anterior; "higherIsBetter" define a cor
export const Delta: React.FC<{ current: number; previous: number; higherIsBetter?: boolean }> = ({ current, previous, higherIsBetter = true }) => {
    if (previous === 0 && current === 0) return <span className={`${styles.delta} ${styles.deltaFlat}`}>sem movimento</span>;
    if (previous === 0) return <span className={`${styles.delta} ${higherIsBetter ? styles.deltaGood : styles.deltaBad}`}>novo</span>;
    const change = ((current - previous) / previous) * 100;
    const flat = Math.abs(change) < 0.5;
    const good = flat ? null : (change > 0) === higherIsBetter;
    const Icon = flat ? Minus : change > 0 ? ArrowUpRight : ArrowDownRight;
    return (
        <span className={`${styles.delta} ${flat ? styles.deltaFlat : good ? styles.deltaGood : styles.deltaBad}`}>
            <Icon size={12} />
            {Math.abs(change).toLocaleString('pt-PT', { maximumFractionDigits: Math.abs(change) < 10 ? 1 : 0 })}%
        </span>
    );
};

export type Tone = 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'teal' | 'pink';

export const toneClass = (tone: Tone) => styles[`tone-${tone}`];

// Cor estável por nome (avatares)
const TONES: Tone[] = ['blue', 'green', 'purple', 'orange', 'teal', 'pink'];
export function toneFor(text: string): Tone {
    let hash = 0;
    for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
    return TONES[hash % TONES.length];
}

export const KpiTile: React.FC<{
    label: string;
    value: string;
    icon: React.ReactNode;
    foot?: React.ReactNode;
    href?: string;
    alert?: boolean;
    tone?: Tone;
}> = ({ label, value, icon, foot, href, alert, tone = 'blue' }) => {
    const content = (
        <>
            <div className={styles.kpiTop}>
                <span className={styles.kpiLabel}>{label}</span>
                <span className={styles.kpiIcon}>{icon}</span>
            </div>
            <span className={styles.kpiValue} title={value}>
                {value}
            </span>
            {foot && <div className={styles.kpiFoot}>{foot}</div>}
        </>
    );
    // em alerta a cor passa a vermelho
    const className = `${styles.kpi} ${styles.toned} ${toneClass(alert ? 'red' : tone)}`;
    return href ? (
        <Link href={href} className={className}>
            {content}
        </Link>
    ) : (
        <div className={className}>{content}</div>
    );
};

export const Card: React.FC<{
    title: string;
    subtitle?: string;
    link?: { href: string; label: string };
    action?: React.ReactNode;
    children: React.ReactNode;
    style?: React.CSSProperties;
    icon?: React.ReactNode;
    tone?: Tone;
}> = ({ title, subtitle, link, action, children, style, icon, tone = 'blue' }) => (
    <section className={styles.card} style={style}>
        <div className={styles.cardHead}>
            <div className={styles.cardHeadLeft}>
                {icon && <span className={`${styles.cardIcon} ${toneClass(tone)}`}>{icon}</span>}
                <div>
                    <h2 className={styles.cardTitle}>{title}</h2>
                    {subtitle && <p className={styles.cardSubtitle}>{subtitle}</p>}
                </div>
            </div>
            {action}
            {link && (
                <Link href={link.href} className={styles.cardLink}>
                    {link.label}
                    <ChevronRight size={14} />
                </Link>
            )}
        </div>
        {children}
    </section>
);

// Barras horizontais de uma só série (ordenadas pelo chamador)
export const HBars: React.FC<{
    items: { label: string; value: number; display?: string }[];
    empty?: string;
    showShare?: boolean;
}> = ({ items, empty = 'Sem dados.', showShare }) => {
    if (!items.length) return <p className={styles.empty}>{empty}</p>;
    const max = Math.max(...items.map(item => item.value), 0) || 1;
    const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
    return (
        <div className={styles.hbars}>
            {items.map(item => (
                <div key={item.label} className={styles.hbar} title={`${item.label}: ${item.display ?? item.value}`}>
                    <div className={styles.hbarHead}>
                        <span className={styles.hbarLabel}>{item.label}</span>
                        <span className={styles.hbarValue}>
                            {item.display ?? item.value}
                            {showShare ? ` · ${Math.round((item.value / total) * 100)}%` : ''}
                        </span>
                    </div>
                    <div className={styles.hbarTrack}>
                        <div className={styles.hbarFill} style={{ width: `${Math.max(2, (item.value / max) * 100)}%` }} />
                    </div>
                </div>
            ))}
        </div>
    );
};

// Proporção entre duas categorias (cores validadas: série 1 e 2)
export const ShareBar: React.FC<{ title: string; a: { label: string; value: number }; b: { label: string; value: number } }> = ({ title, a, b }) => {
    const total = a.value + b.value;
    const pa = total ? (a.value / total) * 100 : 0;
    return (
        <div className={styles.share}>
            <span className={styles.hbarHead}>
                <span className={styles.hbarLabel}>{title}</span>
                <span className={styles.hbarValue}>{total}</span>
            </span>
            <div className={styles.shareBar} role="img" aria-label={`${title}: ${a.label} ${a.value}, ${b.label} ${b.value}`}>
                {total > 0 && (
                    <>
                        {a.value > 0 && <span className={styles.shareSeg} style={{ width: `${pa}%`, background: 'var(--series-1)' }} title={`${a.label}: ${a.value}`} />}
                        {b.value > 0 && <span className={styles.shareSeg} style={{ width: `${100 - pa}%`, background: 'var(--series-2)' }} title={`${b.label}: ${b.value}`} />}
                    </>
                )}
            </div>
            <div className={styles.shareLegend}>
                <span>
                    <span className={styles.swatch} style={{ background: 'var(--series-1)' }} />
                    {a.label} {a.value}
                </span>
                <span>
                    <span className={styles.swatch} style={{ background: 'var(--series-2)' }} />
                    {b.label} {b.value}
                </span>
            </div>
        </div>
    );
};

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const monthLabel = (value: string) => {
    const [year, month] = value.split('-').map(Number);
    return { short: MONTHS[month - 1], full: `${MONTHS[month - 1]} ${year}` };
};

/*
 * Colunas mensais de uma ou duas séries (mesma unidade, um só eixo),
 * com tooltip ao passar e alternativa em tabela.
 */
export const MonthColumns: React.FC<{
    data: { month: string; values: number[] }[];
    series: string[];
    format: (value: number) => string;
    compact?: (value: number) => string;
    footer?: (values: number[]) => React.ReactNode;
}> = ({ data, series, format, compact = v => v.toLocaleString('pt-PT'), footer }) => {
    const [hover, setHover] = useState<number | null>(null);
    const [table, setTable] = useState(false);
    const width = 720;
    const height = 230;
    const pad = { top: 10, right: 6, bottom: 26, left: 50 };
    const innerW = width - pad.left - pad.right;
    const innerH = height - pad.top - pad.bottom;
    const rawMax = Math.max(0, ...data.flatMap(point => point.values));
    const power = rawMax > 0 ? 10 ** Math.floor(Math.log10(rawMax)) : 1;
    const max = rawMax > 0 ? [1, 2, 2.5, 5, 10].map(step => step * power).find(step => step >= rawMax) ?? 10 * power : series.length > 1 ? 1000 : 4;
    const ticks = [0, 0.5, 1].map(f => f * max);
    const band = innerW / Math.max(1, data.length);
    const n = series.length;
    const barW = Math.max(4, Math.min(n > 1 ? 16 : 24, (band - 12 - (n - 1) * 2) / n));
    const y = (value: number) => pad.top + innerH - (value / max) * innerH;
    const colors = ['var(--series-1)', 'var(--series-2)'];
    const bar = (x: number, value: number) => {
        const top = y(value);
        const h = pad.top + innerH - top;
        if (h <= 0) return '';
        const r = Math.min(4, h, barW / 2);
        return `M${x},${pad.top + innerH} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${pad.top + innerH} Z`;
    };

    return (
        <div className={styles.chartWrap}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                {n > 1 ? (
                    <div className={styles.shareLegend}>
                        {series.map((name, index) => (
                            <span key={name}>
                                <span className={styles.swatch} style={{ background: colors[index] }} />
                                {name}
                            </span>
                        ))}
                    </div>
                ) : (
                    <span />
                )}
                <button type="button" className={styles.toggle} onClick={() => setTable(value => !value)}>
                    {table ? 'Ver gráfico' : 'Ver tabela'}
                </button>
            </div>
            {table ? (
                <table className={styles.miniTable}>
                    <thead>
                        <tr>
                            <th>Mês</th>
                            {series.map(name => (
                                <th key={name} className={styles.num}>
                                    {name}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map(point => (
                            <tr key={point.month}>
                                <td>{monthLabel(point.month).full}</td>
                                {point.values.map((value, index) => (
                                    <td key={index} className={styles.num}>
                                        {format(value)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <>
                    <svg viewBox={`0 0 ${width} ${height}`} className={styles.chartSvg} role="img" aria-label={`${series.join(' e ')} por mês`} onMouseLeave={() => setHover(null)}>
                        {ticks.map(tick => (
                            <g key={tick}>
                                <line x1={pad.left} x2={width - pad.right} y1={y(tick)} y2={y(tick)} stroke="var(--border-color)" strokeDasharray={tick === 0 ? undefined : '3 5'} />
                                <text x={pad.left - 8} y={y(tick) + 4} textAnchor="end" fontSize={11} fill="var(--text-tertiary)">
                                    {compact(tick)}
                                </text>
                            </g>
                        ))}
                        {data.map((point, index) => {
                            const groupW = n * barW + (n - 1) * 2;
                            const x0 = pad.left + index * band + (band - groupW) / 2;
                            return (
                                <g key={point.month}>
                                    {hover === index && <rect x={pad.left + index * band + 2} y={pad.top} width={band - 4} height={innerH} rx={6} fill="var(--bg-hover)" />}
                                    {point.values.map((value, s) => (
                                        <path key={s} d={bar(x0 + s * (barW + 2), value)} fill={colors[s]} />
                                    ))}
                                    <text x={pad.left + index * band + band / 2} y={height - 7} textAnchor="middle" fontSize={11} fill="var(--text-secondary)">
                                        {monthLabel(point.month).short}
                                    </text>
                                    <rect
                                        x={pad.left + index * band}
                                        y={pad.top}
                                        width={band}
                                        height={innerH + pad.bottom}
                                        fill="transparent"
                                        tabIndex={0}
                                        onMouseEnter={() => setHover(index)}
                                        onFocus={() => setHover(index)}
                                        aria-label={`${monthLabel(point.month).full}: ${point.values.map((v, i) => `${series[i]} ${format(v)}`).join(', ')}`}
                                    />
                                </g>
                            );
                        })}
                    </svg>
                    {hover !== null && data[hover] && (
                        <div className={styles.tooltip} style={{ left: `${Math.min(76, Math.max(0, ((pad.left + hover * band + band / 2) / width) * 100 - 10))}%` }}>
                            <strong>{monthLabel(data[hover].month).full}</strong>
                            {data[hover].values.map((value, index) => (
                                <div key={index} className={styles.tooltipRow}>
                                    <span>
                                        <span className={styles.swatch} style={{ background: colors[index] }} />
                                        {series[index]}
                                    </span>
                                    <span>{format(value)}</span>
                                </div>
                            ))}
                            {footer && footer(data[hover].values)}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export const initials = (name: string) =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0]?.toUpperCase())
        .join('');

export const ListItem: React.FC<{
    title: string;
    meta?: React.ReactNode;
    value?: React.ReactNode;
    valueBad?: boolean;
    avatar?: React.ReactNode;
    href?: string;
}> = ({ title, meta, value, valueBad, avatar, href }) => {
    const content = (
        <>
            {avatar !== undefined && <span className={`${styles.avatar} ${toneClass(toneFor(title))}`}>{avatar}</span>}
            <span className={styles.itemBody}>
                <span className={styles.itemTitle}>{title}</span>
                {meta && <span className={styles.itemMeta}>{meta}</span>}
            </span>
            {value !== undefined && <span className={`${styles.itemValue} ${valueBad ? styles.itemValueBad : ''}`}>{value}</span>}
        </>
    );
    return href ? (
        <Link href={href} className={styles.item}>
            {content}
        </Link>
    ) : (
        <div className={styles.item}>{content}</div>
    );
};

export const Skeleton: React.FC<{ height: number }> = ({ height }) => <div className={styles.skeleton} style={{ height }} />;
