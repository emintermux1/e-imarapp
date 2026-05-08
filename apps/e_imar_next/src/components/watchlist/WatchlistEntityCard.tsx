'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DataCard } from '@/components/data/DataCard';
import { SeverityTag } from './SeverityTag';
import { UnreadCounterBadge } from './UnreadCounterBadge';
import {
  ENTITY_TYPE_LABEL,
  EVENT_LABEL,
} from './watchlist-utils';
import { formatDateTime, formatRelativeTime } from '@/lib/utils/format';
import { useWatchlistStore } from '@/lib/store/watchlist-store';
import { useDeleteSubscription } from '@/lib/query/hooks';
import { trackEvent } from '@/lib/analytics/events';
import type {
  WatchlistChannel,
  WatchlistSubscription,
} from '@/lib/api/types';

interface WatchlistEntityCardProps {
  subscription: WatchlistSubscription;
  userReference: string;
  onDeleted?: () => void;
}

const CHANNEL_LABEL: Record<WatchlistChannel, string> = {
  push: 'Uygulama içi bildirim',
  email: 'E-posta',
};

export function WatchlistEntityCard({
  subscription,
  userReference,
  onDeleted,
}: WatchlistEntityCardProps) {
  const openBuilder = useWatchlistStore((s) => s.openBuilder);
  const deleteMutation = useDeleteSubscription(userReference);

  const rule = subscription.rule ?? {
    entityType: 'parcel',
    entityRef: '',
    events: [],
  };

  return (
    <div className="space-y-3 p-4">
      <DataCard
        title={rule.label?.trim() || rule.entityRef || subscription.id}
        description={`${ENTITY_TYPE_LABEL[rule.entityType]} · ${rule.entityRef}`}
        status={subscription.status}
        trailing={
          <div className="flex items-center gap-2">
            <SeverityTag severity={subscription.lastEventSeverity ?? rule.severityFloor ?? null} />
            <UnreadCounterBadge count={subscription.unreadCount ?? 0} />
          </div>
        }
        compact
      >
        <dl className="grid grid-cols-1 gap-y-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-[12px] text-text-muted">Tip</dt>
            <dd className="text-[13px] text-text-primary">
              {ENTITY_TYPE_LABEL[rule.entityType]}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-[12px] text-text-muted">Referans</dt>
            <dd className="font-data text-[13px] tabular-nums text-text-primary">
              {rule.entityRef || '—'}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-[12px] text-text-muted">Önem alt sınırı</dt>
            <dd>
              <SeverityTag severity={rule.severityFloor ?? null} size="xs" />
            </dd>
          </div>
          {subscription.lastEventAt ? (
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-[12px] text-text-muted">Son olay</dt>
              <dd
                className="font-data text-[13px] tabular-nums text-text-primary"
                title={formatDateTime(subscription.lastEventAt)}
              >
                {formatRelativeTime(subscription.lastEventAt)}
              </dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-3">
          <h5 className="m-0 mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
            İzlenen olaylar
          </h5>
          {rule.events && rule.events.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">
              {rule.events.map((event) => (
                <li
                  key={event}
                  className="inline-flex items-center rounded-sm border border-border-subtle bg-bg-subtle px-2 py-0.5 text-[12px] text-text-secondary"
                >
                  {EVENT_LABEL[event]}
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 text-[12px] text-text-muted">Olay tipi seçilmemiş</p>
          )}
        </div>

        <div className="mt-3">
          <h5 className="m-0 mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
            Kanallar
          </h5>
          {rule.channels && rule.channels.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">
              {rule.channels.map((channel) => (
                <li
                  key={channel}
                  className="inline-flex items-center rounded-sm border border-border-subtle bg-bg-subtle px-2 py-0.5 text-[12px] text-text-secondary"
                >
                  {CHANNEL_LABEL[channel]}
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 text-[12px] text-text-muted">Kanal seçilmemiş</p>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Pencil className="h-3.5 w-3.5" aria-hidden />}
            onClick={() => openBuilder(rule)}
          >
            Kuralı düzenle
          </Button>
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<Trash2 className="h-3.5 w-3.5 text-state-gov-red" aria-hidden />}
            loading={deleteMutation.isPending}
            onClick={() => {
              if (typeof window !== 'undefined') {
                const ok = window.confirm('Bu watchlist kaydını silmek istediğinize emin misiniz?');
                if (!ok) return;
              }
              deleteMutation.mutate(subscription.id, {
                onSuccess: () => {
                  trackEvent('watchlist_subscription_deleted', {
                    subscriptionId: subscription.id,
                  });
                  onDeleted?.();
                },
              });
            }}
          >
            Sil
          </Button>
        </div>
        {deleteMutation.isError ? (
          <p className="mt-2 text-[12px] text-state-gov-red" role="alert">
            Silme isteği başarısız: {deleteMutation.error?.message}
          </p>
        ) : null}
      </DataCard>
    </div>
  );
}
