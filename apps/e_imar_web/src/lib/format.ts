/**
 * Localized formatters — Turkish locale, tabular friendly.
 *
 * All formatters cache their `Intl` instances at module scope.
 */

const tr = "tr-TR";

const intNF = new Intl.NumberFormat(tr, {
  maximumFractionDigits: 0
});

const decNF = new Intl.NumberFormat(tr, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const tlCurrency = new Intl.NumberFormat(tr, {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 0
});

const tlCurrencyDetailed = new Intl.NumberFormat(tr, {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 2
});

const dateF = new Intl.DateTimeFormat(tr, {
  year: "numeric",
  month: "short",
  day: "2-digit"
});

const dateLongF = new Intl.DateTimeFormat(tr, {
  year: "numeric",
  month: "long",
  day: "2-digit"
});

export function formatInt(n: number) {
  if (!Number.isFinite(n)) return "-";
  return intNF.format(Math.round(n));
}

export function formatDec(n: number) {
  if (!Number.isFinite(n)) return "-";
  return decNF.format(n);
}

export function formatArea(m2: number) {
  if (!Number.isFinite(m2)) return "-";
  if (m2 >= 10_000) {
    return `${decNF.format(m2 / 10_000)} ha`;
  }
  return `${intNF.format(Math.round(m2))} m²`;
}

export function formatM(meters: number) {
  if (!Number.isFinite(meters)) return "-";
  if (meters >= 1000) return `${decNF.format(meters / 1000)} km`;
  return `${intNF.format(Math.round(meters))} m`;
}

export function formatKm(km: number) {
  if (!Number.isFinite(km)) return "-";
  return `${decNF.format(km)} km`;
}

export function formatTL(n: number) {
  if (!Number.isFinite(n)) return "-";
  return tlCurrency.format(n);
}

export function formatTLDetailed(n: number) {
  if (!Number.isFinite(n)) return "-";
  return tlCurrencyDetailed.format(n);
}

export function formatDate(iso: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return dateF.format(d);
}

export function formatDateLong(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return dateLongF.format(d);
}

export function formatPercent(n: number, fractionDigits = 1) {
  if (!Number.isFinite(n)) return "-";
  return `%${n.toLocaleString(tr, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  })}`;
}

export function formatLngLat(lng: number, lat: number) {
  return `${decNF.format(lat)}° K, ${decNF.format(lng)}° D`;
}

export function formatLngLatPrecise(lng: number, lat: number) {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

/** Days remaining (truncated, never negative) */
export function daysUntil(iso: string) {
  const target = new Date(iso).getTime();
  const now = Date.now();
  const diff = target - now;
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function adaParselText(ada: string, parsel: string) {
  return `${ada}/${parsel}`;
}

export function adaParselSlug(ada: string, parsel: string) {
  return `${ada}-${parsel}`;
}
