/**
 * Locale-aware Turkish formatters used for backend numeric values.
 * NB: We never compute zoning values here — only render what the backend
 * already produced.
 */
const numberFormat = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 });
const integerFormat = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 });
const compactArea = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 });

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return numberFormat.format(value);
}

export function formatInteger(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return integerFormat.format(value);
}

export function formatArea(valueM2: number | null | undefined): string {
  if (valueM2 === null || valueM2 === undefined || Number.isNaN(valueM2)) return '—';
  if (valueM2 >= 10_000) {
    return `${compactArea.format(valueM2 / 10_000)} ha`;
  }
  return `${numberFormat.format(valueM2)} m²`;
}

export function formatRatio(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return numberFormat.format(value);
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${numberFormat.format(value * 100)}%`;
}

export function formatDateTime(input: string | number | Date | null | undefined): string {
  if (!input) return '—';
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatRelativeTime(input: string | number | Date | null | undefined): string {
  if (!input) return '—';
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return '—';
  const diffMs = date.getTime() - Date.now();
  const rtf = new Intl.RelativeTimeFormat('tr-TR', { numeric: 'auto' });
  const minutes = Math.round(diffMs / 60_000);
  if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute');
  const hours = Math.round(diffMs / 3_600_000);
  if (Math.abs(hours) < 24) return rtf.format(hours, 'hour');
  const days = Math.round(diffMs / 86_400_000);
  return rtf.format(days, 'day');
}

export function or(value: unknown, fallback = '—'): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value.trim() ? value : fallback;
  if (typeof value === 'number') return Number.isFinite(value) ? numberFormat.format(value) : fallback;
  return String(value);
}
