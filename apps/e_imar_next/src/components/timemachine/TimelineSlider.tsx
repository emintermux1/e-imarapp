'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import { useReducedMotion } from 'framer-motion';
import { Pause, Play } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';
import { useTimemachineStore } from '@/lib/store/timemachine-store';
import { trackEvent } from '@/lib/analytics/events';
import { cn } from '@/lib/utils/cn';
import type { ZoningSnapshot } from '@/lib/api/types';

interface TimelineSliderProps {
  snapshots: ZoningSnapshot[];
  className?: string;
  parcelId?: string | null;
}

interface TimelinePoint {
  id: string;
  date: Date;
  iso: string;
}

function buildPoints(snapshots: ZoningSnapshot[]): TimelinePoint[] {
  const points: TimelinePoint[] = [];
  for (const snap of snapshots) {
    if (!snap.effectiveAt) continue;
    const date = new Date(snap.effectiveAt);
    if (Number.isNaN(date.getTime())) continue;
    points.push({ id: snap.id, date, iso: snap.effectiveAt });
  }
  points.sort((a, b) => a.date.getTime() - b.date.getTime());
  return points;
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function nearestIndex(points: TimelinePoint[], iso: string | null): number {
  if (!iso || points.length === 0) return 0;
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) return 0;
  let best = 0;
  let bestDiff = Math.abs(points[0].date.getTime() - target);
  for (let i = 1; i < points.length; i += 1) {
    const diff = Math.abs(points[i].date.getTime() - target);
    if (diff < bestDiff) {
      best = i;
      bestDiff = diff;
    }
  }
  return best;
}

function dateLabel(point: TimelinePoint | undefined): string {
  if (!point) return '—';
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(point.date);
}

/**
 * Custom horizontal range slider with two thumbs locked to snapshot ticks.
 * The slider is keyboard-accessible (Arrow / Home / End on each thumb) and
 * only drives the shared `useTimemachineStore`. Snapshot fetching happens at
 * the page level.
 */
export function TimelineSlider({ snapshots, className, parcelId }: TimelineSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const fromAt = useTimemachineStore((s) => s.fromAt);
  const toAt = useTimemachineStore((s) => s.toAt);
  const playing = useTimemachineStore((s) => s.playing);
  const setRange = useTimemachineStore((s) => s.setRange);
  const setFromAt = useTimemachineStore((s) => s.setFromAt);
  const setToAt = useTimemachineStore((s) => s.setToAt);
  const togglePlay = useTimemachineStore((s) => s.togglePlay);
  const reduce = useReducedMotion();

  const points = useMemo(() => buildPoints(snapshots), [snapshots]);
  const hasPoints = points.length >= 2;
  const minTime = points[0]?.date.getTime() ?? 0;
  const maxTime = points[points.length - 1]?.date.getTime() ?? 1;

  // When the snapshots first arrive (or change identity), pin the range to
  // the first and last point if the store is unset.
  useEffect(() => {
    if (!hasPoints) return;
    if (!fromAt && !toAt) {
      setRange(points[0].iso, points[points.length - 1].iso);
    }
  }, [hasPoints, points, fromAt, toAt, setRange]);

  const fromIdx = nearestIndex(points, fromAt);
  const toIdx = Math.max(fromIdx, nearestIndex(points, toAt));
  const fromPercent = hasPoints
    ? ((points[fromIdx].date.getTime() - minTime) / Math.max(1, maxTime - minTime)) * 100
    : 0;
  const toPercent = hasPoints
    ? ((points[toIdx].date.getTime() - minTime) / Math.max(1, maxTime - minTime)) * 100
    : 100;

  const [active, setActive] = useState<'from' | 'to' | null>(null);

  const updateThumbFromClient = useCallback(
    (clientX: number, which: 'from' | 'to') => {
      const track = trackRef.current;
      if (!track || !hasPoints) return;
      const rect = track.getBoundingClientRect();
      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
      const targetTime = minTime + ratio * (maxTime - minTime);
      // Snap to nearest snapshot.
      let bestIdx = 0;
      let bestDiff = Math.abs(points[0].date.getTime() - targetTime);
      for (let i = 1; i < points.length; i += 1) {
        const diff = Math.abs(points[i].date.getTime() - targetTime);
        if (diff < bestDiff) {
          bestIdx = i;
          bestDiff = diff;
        }
      }
      const point = points[bestIdx];
      let nextFromIso = points[fromIdx].iso;
      let nextToIso = points[toIdx].iso;
      if (which === 'from') {
        const limited = Math.min(bestIdx, toIdx);
        setFromAt(points[limited].iso);
        nextFromIso = points[limited].iso;
      } else {
        const limited = Math.max(bestIdx, fromIdx);
        setToAt(points[limited].iso);
        nextToIso = points[limited].iso;
      }
      // Avoid TS unused-var lint noise.
      void point;
      trackEvent('timemachine_range_set', {
        fromAt: nextFromIso,
        toAt: nextToIso,
        parcelId: parcelId ?? undefined,
      });
    },
    [hasPoints, points, minTime, maxTime, fromIdx, toIdx, setFromAt, setToAt, parcelId],
  );

  function startDrag(event: PointerEvent<HTMLButtonElement>, which: 'from' | 'to') {
    if (!hasPoints) return;
    setActive(which);
    (event.currentTarget as HTMLButtonElement).setPointerCapture(event.pointerId);
  }

  function moveDrag(event: PointerEvent<HTMLButtonElement>, which: 'from' | 'to') {
    if (active !== which || !hasPoints) return;
    updateThumbFromClient(event.clientX, which);
  }

  function endDrag(event: PointerEvent<HTMLButtonElement>) {
    setActive(null);
    try {
      (event.currentTarget as HTMLButtonElement).releasePointerCapture(event.pointerId);
    } catch {
      // ignore
    }
  }

  function handleTrackPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!hasPoints) return;
    // When the user clicks the bare track, jump the closer thumb.
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const ratio = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const targetTime = minTime + ratio * (maxTime - minTime);
    const fromDist = Math.abs(points[fromIdx].date.getTime() - targetTime);
    const toDist = Math.abs(points[toIdx].date.getTime() - targetTime);
    const which = fromDist < toDist ? 'from' : 'to';
    updateThumbFromClient(event.clientX, which);
  }

  function handleKey(event: KeyboardEvent<HTMLButtonElement>, which: 'from' | 'to') {
    if (!hasPoints) return;
    const idx = which === 'from' ? fromIdx : toIdx;
    if (
      ['ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)
    ) {
      event.preventDefault();
    }
    let next = idx;
    if (event.key === 'ArrowLeft' || event.key === 'PageDown') next = idx - 1;
    if (event.key === 'ArrowRight' || event.key === 'PageUp') next = idx + 1;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = points.length - 1;
    next = clamp(next, 0, points.length - 1);
    if (which === 'from') {
      next = Math.min(next, toIdx);
      setFromAt(points[next].iso);
    } else {
      next = Math.max(next, fromIdx);
      setToAt(points[next].iso);
    }
    trackEvent('timemachine_range_set', {
      fromAt: which === 'from' ? points[next].iso : points[fromIdx].iso,
      toAt: which === 'to' ? points[next].iso : points[toIdx].iso,
      parcelId: parcelId ?? undefined,
    });
  }

  if (!hasPoints) {
    return (
      <div
        className={cn(
          'rounded-md border border-dashed border-border-subtle bg-bg-surface px-4 py-6 text-center text-[13px] text-text-muted',
          className,
        )}
      >
        Snapshot tarihçesi henüz hazır değil. Backend `/parcels/:id/zoning-snapshots` rotasından en az iki kayıt gelince zaman çubuğu aktive olur.
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-1 text-[12px] text-text-muted">
          <span>
            <strong className="text-text-primary">Önce:</strong> {dateLabel(points[fromIdx])}
          </span>
          <span>
            <strong className="text-text-primary">Sonra:</strong> {dateLabel(points[toIdx])}
          </span>
        </div>
        <IconButton
          aria-label={playing ? 'Otomatik oynatmayı durdur' : 'Otomatik oynat'}
          variant="subtle"
          onClick={togglePlay}
        >
          {playing ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
        </IconButton>
      </div>

      <div
        ref={trackRef}
        onPointerDown={handleTrackPointerDown}
        className={cn(
          'relative h-9 cursor-pointer select-none rounded-full border border-border-subtle bg-bg-subtle px-3',
          reduce ? '' : 'transition-colors',
        )}
      >
        {/* Snapshot ticks */}
        <div className="absolute inset-x-3 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-border-strong/60" />
        {points.map((point) => {
          const percent = ((point.date.getTime() - minTime) / Math.max(1, maxTime - minTime)) * 100;
          return (
            <span
              key={point.id}
              aria-hidden
              className="pointer-events-none absolute top-1/2 h-2 w-px -translate-y-1/2 rounded-full bg-border-strong"
              style={{ left: `calc(${percent}% + 12px - ${percent / 100} * 24px)` }}
            />
          );
        })}

        {/* Range fill */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-brand-navy/40"
          style={{
            left: `calc(${fromPercent}% + 12px - ${fromPercent / 100} * 24px)`,
            width: `calc(${toPercent - fromPercent}% - ${(toPercent - fromPercent) / 100} * 24px)`,
          }}
        />

        {/* From thumb */}
        <button
          type="button"
          role="slider"
          aria-label="Karşılaştırma — başlangıç tarihi"
          aria-valuemin={0}
          aria-valuemax={points.length - 1}
          aria-valuenow={fromIdx}
          aria-valuetext={dateLabel(points[fromIdx])}
          onPointerDown={(event) => startDrag(event, 'from')}
          onPointerMove={(event) => moveDrag(event, 'from')}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={(event) => handleKey(event, 'from')}
          className={cn(
            'absolute top-1/2 grid h-6 w-6 -translate-y-1/2 -translate-x-1/2 place-items-center rounded-full border-2 border-brand-navy bg-bg-surface shadow-panel',
            'focus-visible:shadow-focus focus-visible:outline-none',
            active === 'from' && 'ring-2 ring-brand-navy/40',
          )}
          style={{ left: `calc(${fromPercent}% + 12px - ${fromPercent / 100} * 24px)` }}
        >
          <span className="sr-only">Başlangıç tarihi</span>
        </button>

        {/* To thumb */}
        <button
          type="button"
          role="slider"
          aria-label="Karşılaştırma — bitiş tarihi"
          aria-valuemin={0}
          aria-valuemax={points.length - 1}
          aria-valuenow={toIdx}
          aria-valuetext={dateLabel(points[toIdx])}
          onPointerDown={(event) => startDrag(event, 'to')}
          onPointerMove={(event) => moveDrag(event, 'to')}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={(event) => handleKey(event, 'to')}
          className={cn(
            'absolute top-1/2 grid h-6 w-6 -translate-y-1/2 -translate-x-1/2 place-items-center rounded-full border-2 border-state-gov-red bg-bg-surface shadow-panel',
            'focus-visible:shadow-focus focus-visible:outline-none',
            active === 'to' && 'ring-2 ring-state-gov-red/40',
          )}
          style={{ left: `calc(${toPercent}% + 12px - ${toPercent / 100} * 24px)` }}
        >
          <span className="sr-only">Bitiş tarihi</span>
        </button>
      </div>

      <p className="m-0 text-[11px] text-text-muted">
        {points.length} snapshot · klavye ile ←/→ ile gezin, Home/End ile uçlara atla
      </p>
    </div>
  );
}
