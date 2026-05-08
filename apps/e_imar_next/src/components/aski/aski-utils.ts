import type { SuspensionNotice, SuspensionPlanType } from '@/lib/api/types';

export const PLAN_TYPE_OPTIONS: Array<{ value: SuspensionPlanType; label: string }> = [
  { value: 'imar_plani', label: 'İmar planı' },
  { value: 'plan_degisikligi', label: 'Plan değişikliği' },
  { value: 'mevzi', label: 'Mevzi imar planı' },
  { value: 'koruma', label: 'Koruma amaçlı plan' },
  { value: 'kentsel_donusum', label: 'Kentsel dönüşüm' },
];

export function planTypeLabel(value?: SuspensionPlanType | null): string {
  if (!value) return 'Plan türü yok';
  const known = PLAN_TYPE_OPTIONS.find((option) => option.value === value);
  return known?.label ?? value;
}

const dateFormat = new Intl.DateTimeFormat('tr-TR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export function formatNoticeDate(input?: string | null): string {
  if (!input) return '—';
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return '—';
  return dateFormat.format(date);
}

export function formatNoticeRange(notice: SuspensionNotice): string {
  const start = formatNoticeDate(notice.startDate);
  const end = formatNoticeDate(notice.endDate);
  if (start === '—' && end === '—') return '—';
  return `${start} → ${end}`;
}

/**
 * Compute a bounding box `[west, south, east, north]` from a GeoJSON
 * geometry. We never synthesise a bbox if the geometry is missing — the
 * caller should fall back to the notice's own `bbox` field or skip
 * fitBounds entirely.
 */
export function bboxFromGeometry(
  geometry: Record<string, unknown> | null | undefined,
): [number, number, number, number] | null {
  if (!geometry || typeof geometry !== 'object') return null;
  const coords = (geometry as { coordinates?: unknown }).coordinates;
  if (!coords) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let any = false;

  const visit = (node: unknown): void => {
    if (Array.isArray(node)) {
      // Position [lng, lat]
      if (
        node.length >= 2 &&
        typeof node[0] === 'number' &&
        typeof node[1] === 'number'
      ) {
        const x = node[0] as number;
        const y = node[1] as number;
        if (Number.isFinite(x) && Number.isFinite(y)) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
          any = true;
        }
      } else {
        for (const child of node) visit(child);
      }
    }
  };
  visit(coords);
  if (!any) return null;
  return [minX, minY, maxX, maxY];
}

export function noticeBbox(
  notice: SuspensionNotice,
): [number, number, number, number] | null {
  if (notice.bbox && notice.bbox.length === 4) return notice.bbox;
  return bboxFromGeometry(notice.geometry ?? null);
}

export function noticeDisplayTitle(notice: SuspensionNotice): string {
  return notice.planTitle?.trim() || `Askı kaydı #${notice.id}`;
}
