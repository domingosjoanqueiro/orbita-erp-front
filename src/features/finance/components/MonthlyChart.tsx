'use client';

import React, { useMemo, useState } from 'react';
import { MONTHS } from '../types/finance.types';
import { formatMoney } from '../utils/format';
import styles from './finance.module.css';

interface MonthPoint {
    month: string;
    collected: number;
    expenses: number;
}

// Cores validadas (claro/escuro) para 2 séries: azul = recebido, laranja = despesas
const SERIES = [
    { key: 'collected' as const, label: 'Recebido', light: '#2a78d6', dark: '#3987e5' },
    { key: 'expenses' as const, label: 'Despesas', light: '#eb6834', dark: '#d95926' },
];

const compact = (value: number) => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toLocaleString('pt-PT', { maximumFractionDigits: 1 })} M`;
    if (value >= 1_000) return `${(value / 1_000).toLocaleString('pt-PT', { maximumFractionDigits: 1 })} mil`;
    return value.toLocaleString('pt-PT');
};

const label = (month: string) => {
    const [year, m] = month.split('-').map(Number);
    return { short: MONTHS[m - 1], full: `${MONTHS[m - 1]} ${year}` };
};

function niceMax(value: number): number {
    if (value <= 0) return 1000;
    const power = 10 ** Math.floor(Math.log10(value));
    const steps = [1, 2, 2.5, 5, 10];
    for (const step of steps) if (value <= step * power) return step * power;
    return 10 * power;
}

export const MonthlyChart: React.FC<{ data: MonthPoint[]; isDark?: boolean }> = ({ data, isDark }) => {
    const [hover, setHover] = useState<number | null>(null);
    const [showTable, setShowTable] = useState(false);

    const width = 720;
    const height = 260;
    const pad = { top: 12, right: 8, bottom: 28, left: 52 };
    const innerW = width - pad.left - pad.right;
    const innerH = height - pad.top - pad.bottom;

    const max = useMemo(() => niceMax(Math.max(0, ...data.flatMap(point => [point.collected, point.expenses]))), [data]);
    const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => f * max);
    const band = innerW / Math.max(1, data.length);
    const barW = Math.max(4, Math.min(18, (band - 10) / 2 - 1));
    const y = (value: number) => pad.top + innerH - (value / max) * innerH;
    const colors = SERIES.map(series => (isDark ? series.dark : series.light));

    // barra com o topo arredondado (4px) e a base reta na linha de base
    const bar = (x: number, value: number) => {
        const top = y(value);
        const h = pad.top + innerH - top;
        if (h <= 0) return '';
        const r = Math.min(4, h, barW / 2);
        return `M${x},${pad.top + innerH} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${pad.top + innerH} Z`;
    };

    const empty = data.every(point => point.collected === 0 && point.expenses === 0);

    return (
        <div className={styles.chartWrap}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div className={styles.legend}>
                    {SERIES.map((series, index) => (
                        <span key={series.key} className={styles.legendItem}>
                            <span className={styles.legendSwatch} style={{ background: colors[index] }} />
                            {series.label}
                        </span>
                    ))}
                </div>
                <button type="button" className={styles.linkButton} onClick={() => setShowTable(value => !value)}>
                    {showTable ? 'Ver gráfico' : 'Ver tabela'}
                </button>
            </div>

            {showTable ? (
                <table className={styles.receiptTable} style={{ marginTop: 10 }}>
                    <thead>
                        <tr>
                            <th>Mês</th>
                            <th className={styles.amount}>Recebido</th>
                            <th className={styles.amount}>Despesas</th>
                            <th className={styles.amount}>Saldo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map(point => (
                            <tr key={point.month}>
                                <td>{label(point.month).full}</td>
                                <td className={styles.amount}>{formatMoney(point.collected)}</td>
                                <td className={styles.amount}>{formatMoney(point.expenses)}</td>
                                <td className={styles.amount}>{formatMoney(point.collected - point.expenses)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : empty ? (
                <p className={styles.muted} style={{ padding: '40px 0', textAlign: 'center' }}>
                    Ainda não há pagamentos nem despesas nos últimos 12 meses.
                </p>
            ) : (
                <>
                    <svg viewBox={`0 0 ${width} ${height}`} className={styles.chartSvg} role="img" aria-label="Recebido e despesas por mês, últimos 12 meses" onMouseLeave={() => setHover(null)}>
                        {ticks.map(tick => (
                            <g key={tick}>
                                <line x1={pad.left} x2={width - pad.right} y1={y(tick)} y2={y(tick)} stroke="var(--border-color)" strokeWidth={1} strokeDasharray={tick === 0 ? undefined : '3 4'} />
                                <text x={pad.left - 8} y={y(tick) + 4} textAnchor="end" fontSize={11} fill="var(--text-tertiary)">
                                    {compact(tick)}
                                </text>
                            </g>
                        ))}
                        {data.map((point, index) => {
                            const x0 = pad.left + index * band + (band - (barW * 2 + 2)) / 2;
                            return (
                                <g key={point.month}>
                                    {hover === index && <rect x={pad.left + index * band} y={pad.top} width={band} height={innerH} fill="var(--bg-hover)" />}
                                    <path d={bar(x0, point.collected)} fill={colors[0]} />
                                    <path d={bar(x0 + barW + 2, point.expenses)} fill={colors[1]} />
                                    <text x={pad.left + index * band + band / 2} y={height - 8} textAnchor="middle" fontSize={11} fill="var(--text-secondary)">
                                        {label(point.month).short}
                                    </text>
                                    {/* área de toque maior que as barras */}
                                    <rect
                                        x={pad.left + index * band}
                                        y={pad.top}
                                        width={band}
                                        height={innerH + pad.bottom}
                                        fill="transparent"
                                        onMouseEnter={() => setHover(index)}
                                        onFocus={() => setHover(index)}
                                        tabIndex={0}
                                        aria-label={`${label(point.month).full}: recebido ${formatMoney(point.collected)}, despesas ${formatMoney(point.expenses)}`}
                                    />
                                </g>
                            );
                        })}
                    </svg>
                    {hover !== null && data[hover] && (
                        <div
                            className={styles.tooltip}
                            style={{
                                left: `${Math.min(78, Math.max(0, ((pad.left + hover * band + band / 2) / width) * 100 - 10))}%`,
                                top: 36,
                            }}
                        >
                            <strong>{label(data[hover].month).full}</strong>
                            {SERIES.map((series, index) => (
                                <div key={series.key} className={styles.tooltipRow}>
                                    <span className={styles.legendItem}>
                                        <span className={styles.legendSwatch} style={{ background: colors[index] }} />
                                        {series.label}
                                    </span>
                                    <span>{formatMoney(data[hover][series.key])}</span>
                                </div>
                            ))}
                            <div className={styles.tooltipRow} style={{ borderTop: '1px solid var(--border-color)', marginTop: 4, paddingTop: 4 }}>
                                <span>Saldo</span>
                                <strong>{formatMoney(data[hover].collected - data[hover].expenses)}</strong>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
