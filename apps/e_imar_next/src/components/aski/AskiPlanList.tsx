'use client';

import { useEffect, useRef } from 'react';
import { Building, Calendar, MapPin } from 'lucide-react';
import { useAskiStore } from '@/lib/store/aski-store';
import { trackEvent } from '@/lib/analytics/events';
import { cn } from '@/lib/utils/cn';
import { formatNoticeRange, planTypeLabel } from './aski-utils';
import type { SuspensionNotice } from '@/lib/api/types';

interface AskiPlanListProps {
  notices: SuspensionNotice[];
  className?: string;
  /** When true, renders as a vertical stacked list (mobile / sidebar). */
  vertical?: boolean;
}

/**
 * Bottom-center carousel of askı notices. Click syncs the shared
 * `useAskiStore.selectedPlanId`, which in turn triggers the map to fitBounds
 * to the plan polygon (if it has geometry). When `vertical` is true the
 * component renders as a column list — used in the BottomSheet on mobile.
 */
export function AskiPlanList({ notices, className, vertical = false }: AskiPlanListProps) {
  const selectedPlanId = useAskiStore((s) => s.selectedPlanId);
  const selectPlan = useAskiStore((s) => s.selectPlan);
  const activeRef = useRef<HTMLButtonElement | null>(null);

  // Scroll selected card into view when external selection changes.
  useEffect(() => {
    if (selectedPlanId && activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [selectedPlanId]);

  if (notices.length === 0) {
    return (
      <div
        className={cn(
          'rounded-md border border-dashed border-border-subtle bg-bg-surface/95 px-3 py-2 text-center text-[12px] text-text-muted shadow-panel backdrop-blur',
          className,
        )}
      >
        Aktif askı kaydı yok.
      </div>
    );
  }

  return (
    <ul
      className={cn(
        'gap-2',
        vertical
          ? 'flex flex-col overflow-y-auto scroll-thin px-3 py-3'
          : 'flex max-w-full overflow-x-auto scroll-thin pb-1',
        className,
      )}
      aria-label="Askıdaki planlar"
    >
      {notices.map((notice) => {
        const active = notice.id === selectedPlanId;
        return (
          <li
            key={notice.id}
            className={vertical ? 'w-full shrink-0' : 'min-w-[260px] max-w-[320px] shrink-0'}
          >
            <button
              ref={active ? activeRef : null}
              type="button"
              onClick={() => {
                selectPlan(notice.id);
                trackEvent('aski_plan_selected', {
                  planId: notice.id,
                  planType: notice.planType,
                });
              }}
              className={cn(
                'group flex w-full flex-col gap-1.5 rounded-md border bg-bg-surface px-3 py-2 text-left text-[12px] shadow-panel transition-colors',
                'focus-visible:shadow-focus focus-visible:outline-none',
                active
                  ? 'border-state-gov-red ring-1 ring-state-gov-red/30 bg-state-gov-red/5'
                  : 'border-border-subtle hover:border-border-strong',
              )}
              aria-pressed={active}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="line-clamp-2 text-[13px] font-semibold text-text-primary">
                  {notice.planTitle?.trim() || `Askı kaydı #${notice.id}`}
                </span>
                <span
                  className={cn(
                    'shrink-0 rounded-sm border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide',
                    active
                      ? 'border-state-gov-red bg-state-gov-red/10 text-state-gov-red'
                      : 'border-border bg-bg-subtle text-text-secondary',
                  )}
                >
                  {planTypeLabel(notice.planType)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-text-secondary">
                <Building className="h-3 w-3" aria-hidden />
                <span className="truncate">
                  {notice.municipalityName?.trim() ||
                    notice.municipalityId?.trim() ||
                    'Belediye bilgisi yok'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-data text-[11px] tabular-nums text-text-muted">
                <Calendar className="h-3 w-3" aria-hidden />
                <span>{formatNoticeRange(notice)}</span>
              </div>
              {notice.geometry || notice.bbox ? (
                <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                  <MapPin className="h-3 w-3" aria-hidden />
                  <span>Harita üzerinde gösterilebilir</span>
                </div>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
