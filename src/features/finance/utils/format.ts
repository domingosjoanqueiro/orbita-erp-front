// Valores em meticais (ou na moeda da empresa): "1 500,00 MT"
export function formatMoney(value: number | null | undefined, currency = 'MZN'): string {
    const amount = Number(value ?? 0).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${amount} ${currency === 'MZN' ? 'MT' : currency}`;
}

const MONTH_NAMES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

// "2026-03" -> "março 2026"
export function formatMonth(value: string | null | undefined): string {
    if (!value) return '';
    const [year, month] = value.split('-').map(Number);
    return `${MONTH_NAMES[month - 1]} ${year}`;
}

export function todayIso(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function firstOfMonthIso(): string {
    return `${todayIso().slice(0, 7)}-01`;
}

// Converte "1.500,50" / "1500.5" em número
export function parseAmount(value: string): number {
    const normalized = value.replace(/\s/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
    const number = Number(normalized);
    return Number.isFinite(number) ? Math.round(number * 100) / 100 : NaN;
}
