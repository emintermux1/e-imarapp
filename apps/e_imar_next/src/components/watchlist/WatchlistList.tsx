'use client';

import { Building, MapPinned, Square } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useWatchlistStore } from '@/lib/store/watchlist-store';
import { SeverityTag } from './SeverityTag';
import { UnreadCounterBadge } from './UnreadCounterBadge';
import { ENTITY_TYPE_LABEL } from './watchlist-utils';
import { formatRelativeTime } from '@/lib/utils/format';
import type {
  WatchlistEntityType,
  WatchlistSubscription,
} from '@/lib/api/types';

interface WatchlistListProps {
  subscriptions: WatchlistSubscription[];
  className?: string;
}

const ICON: Record<WatchlistEntityType, React.ReactNode> = {
  parcel: <Square className="h-3.5 w-3.5" aria-hidden />,
  region: <MapPinned className="h-3.5 w-3.5" aria-hidden />,
  municipality_feed: <Building className="h-3.5 w-3.5" aria-hidden />,
};

interface Group {
  type: WatchlistEntityType;
  label: string;
  rows: WatchlistSubscription[];
}

function groupByEntityType(subs: WatchlistSubscription[]): Group[] {
  const buckets: Record<WatchlistEntityType, WatchlistSubscription[]> = {
    parcel: [],
    region: [],
    municipality_feed: [],
  };
  for (const sub of subs) {
    const type = (sub.rule?.entityType ?? 'parcel') as WatchlistEntityType;
    if (buckets[type]) buckets[type].push(sub);
  }
  return [
    { type: 'parcel', label: 'Parseller', rows: buckets.parcel },
    { type: 'region', label: 'Bölgeler', rows: buckets.region },
    { type: 'municipality_feed', label: 'Belediye karar akışları', rows: buckets.municipality_feed },
  ];
}

export function WatchlistList({ subscriptions, className }: WatchlistListProps) {
  const selectedEntityId = useWatchlistStore((s) => s.selectedEntityId);
  const selectEntity = useWatchlistStore((s) => s.selectEntity);
  const closeBuilder = useWatchlistStore((s) => s.closeBuilder);

  const groups = groupByEntityType(subscriptions);

  if (subscriptions.length === 0) {
    return (
      <div className={cn('p-4 text-[13px] text-text-muted', className)}>
        Henüz watchlist kaydınız yok.
      </div>
    );
  }

  return (
    <ul className={cn('flex flex-col gap-4 p-3', className)} aria-label="Watchlist kayıtları">
      {groups
        .filter((group) => group.rows.length > 0)
        .map((group) => (
          <li key={group.type}>
            <div className="mb-1.5 flex items-center justify-between px-1">
              <h4 className="m-0 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                {group.label}
              </h4>
              <span className="font-data text-[11px] text-text-muted">{group.rows.length}</span>
            </div>
            <ul className="space-y-1.5" aria-label={group.label}>
              {group.rows.map((sub) => {
                const active = sub.id === selectedEntityId;
                const labelText =
                  sub.rule?.label?.trim() || sub.rule?.entityRef?.trim() || sub.id;
                return (
                  <li key={sub.id}>
                    <button
                      type="button"
                      onClick={() => {
                        selectEntity(sub.id);
                        closeBuilder();
                      }}
                      aria-pressed={active}
                      className={cn(
                        'group flex w-full items-start gap-2 rounded-md border px-3 py-2 text-left transition-colors',
                        'focus-visible:shadow-focus focus-visible:outline-none',
                        active
                          ? 'border-brand-navy bg-brand-navy/5'
                          : 'border-border-subtle bg-bg-surface hover:border-border-strong',
                      )}
                    >
                      <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-md bg-bg-subtle text-text-muted">
                        {ICON[group.type]}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-text-primary">
                          {labelText}
                        </span>
                        <span className="mt-0.5 inline-flex flex-wrap items-center gap-1.5 text-[11px] text-text-muted">
                          <span className="inline-flex items-center gap-1 rounded-sm bg-bg-subtle px-1.5 py-0.5 text-text-secondary">
                            {ENTITY_TYPE_LABEL[group.type]}
                          </span>
                          <SeverityTag
                            severity={sub.lastEventSeverity ?? sub.rule?.severityFloor ?? null}
                            size="xs"
                          />
                          {sub.lastEventAt ? (
                            <span className="font-data tabular-nums">
                              {formatRelativeTime(sub.lastEventAt)}
                            </span>
                          ) : null}
                        </span>
                      </span>
                      <span className="shrink-0">
                        <UnreadCounterBadge count={sub.unreadCount ?? 0} />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
    </ul>
  );
}
