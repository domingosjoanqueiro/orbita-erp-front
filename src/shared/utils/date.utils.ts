/**
 * Valor para <input type="date"> a partir do que vem da API.
 * A API devolve "YYYY-MM-DD"; registos antigos podem vir em ISO (UTC), e
 * toISOString() mudaria o dia em fusos horários positivos — usa as partes locais.
 */
export function toDateInputValue(value?: string | Date | null): string {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Data para mostrar (dd/mm/aaaa). Datas "YYYY-MM-DD" são lidas como locais.
 */
export function formatDisplayDate(value?: string | Date | null, withTime = false): string {
  if (!value) return 'N/A';
  const date =
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T00:00:00`)
      : new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}
