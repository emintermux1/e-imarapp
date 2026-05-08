'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bell, KeyRound } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ReadinessGate } from '@/components/data/ReadinessGate';
import { EmptyState } from '@/components/data/EmptyState';
import { StatusBanner } from '@/components/data/StatusBanner';
import { WatchlistList } from './WatchlistList';
import { WatchlistEntityCard } from './WatchlistEntityCard';
import { NotificationRuleBuilder } from './NotificationRuleBuilder';
import { AddEntityDialog } from './AddEntityDialog';
import { useWatchlistStore } from '@/lib/store/watchlist-store';
import { useUIStore } from '@/lib/store/ui-store';
import { useWatchlistSubscriptions } from '@/lib/query/hooks';
import type { WatchlistSubscription } from '@/lib/api/types';

export function WatchlistShell() {
  const userReference = useUIStore((s) => s.userReference);
  const setUserReference = useUIStore((s) => s.setUserReference);
  const [draftRef, setDraftRef] = useState(userReference ?? '');

  useEffect(() => {
    setDraftRef(userReference ?? '');
  }, [userReference]);

  const watchlistQuery = useWatchlistSubscriptions(userReference);
  const builderOpen = useWatchlistStore((s) => s.builderOpen);
  const selectedEntityId = useWatchlistStore((s) => s.selectedEntityId);
  const openBuilder = useWatchlistStore((s) => s.openBuilder);
  const selectEntity = useWatchlistStore((s) => s.selectEntity);

  const subscriptions = useMemo<WatchlistSubscription[]>(
    () => watchlistQuery.data?.subscriptions ?? [],
    [watchlistQuery.data?.subscriptions],
  );
  const selectedSubscription = useMemo(
    () => subscriptions.find((sub) => sub.id === selectedEntityId) ?? null,
    [subscriptions, selectedEntityId],
  );

  // Auto-select the first subscription when none is selected and we have data.
  useEffect(() => {
    if (!selectedEntityId && subscriptions.length > 0 && !builderOpen) {
      selectEntity(subscriptions[0].id);
    }
  }, [selectedEntityId, subscriptions, builderOpen, selectEntity]);

  if (!userReference?.trim()) {
    return (
      <div className="grid h-full place-items-center bg-bg-base px-4 py-10">
        <div className="w-full max-w-xl space-y-4">
          <StatusBanner
            status="requires_credentials"
            title="Watchlist için kullanıcı referansı gerekli"
            message="Watchlist kayıtları kullanıcı referansına bağlıdır. Lütfen kalıcı bir referans girin (örn. demo-user)."
          />
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (draftRef.trim()) {
                setUserReference(draftRef.trim());
              }
            }}
            className="flex items-end gap-2"
          >
            <div className="flex-1">
              <Input
                label="userReference"
                placeholder="örn. demo-user"
                value={draftRef}
                onChange={(event) => setDraftRef(event.target.value)}
                leftAdornment={<KeyRound className="h-4 w-4" aria-hidden />}
              />
            </div>
            <Button type="submit" variant="primary">
              Kaydet
            </Button>
          </form>
        </div>
      </div>
    );
  }

  const status = watchlistQuery.isError ? 'network_error' : watchlistQuery.data?.status;
  const ready = !watchlistQuery.isLoading && !watchlistQuery.isError && status === 'ok';

  return (
    <div className="grid h-full grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)]">
      {/* Left list column */}
      <section
        className="flex h-full min-h-0 flex-col border-b border-border-subtle bg-bg-surface lg:border-b-0 lg:border-r"
        aria-label="Watchlist listesi"
      >
        <header className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
          <div>
            <h2 className="m-0 text-h3 text-text-primary">Watchlist</h2>
            <p className="m-0 mt-0.5 text-[12px] text-text-muted">
              Kullanıcı: <span className="font-data tabular-nums">{userReference}</span>
            </p>
          </div>
          <AddEntityDialog />
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto scroll-thin">
          {ready ? (
            <WatchlistList subscriptions={subscriptions} />
          ) : (
            <div className="p-4">
              <ReadinessGate
                status={status}
                loading={watchlistQuery.isLoading}
                endpoint="/eplan/subscriptions"
                emptyTitle="Henüz watchlist kaydı yok"
                emptyDescription="Yeni bir kural ekleyerek izlemeye başlayabilirsiniz."
                notReadyTitle="Watchlist servisi hazır değil"
                notReadyDescription={
                  watchlistQuery.isError
                    ? watchlistQuery.error?.message
                    : (watchlistQuery.data?.message as string | undefined) ??
                      'Backend `/eplan/subscriptions` rotası henüz cevap vermedi.'
                }
                nextActions={
                  watchlistQuery.data?.nextActions ?? [
                    'Backend `/eplan/subscriptions/:userReference` rotasını yayınlayın',
                    'Push/e-posta gateway entegrasyonunu tamamlayın',
                  ]
                }
                onRetry={() => watchlistQuery.refetch()}
              >
                <WatchlistList subscriptions={subscriptions} />
              </ReadinessGate>
            </div>
          )}
        </div>
        <footer className="border-t border-border-subtle px-3 py-2 text-[11px] text-text-muted">
          {subscriptions.length} kayıt · userReference değiştirmek için Ayarlar
        </footer>
      </section>

      {/* Right detail / builder column */}
      <section
        className="relative flex h-full min-h-0 flex-col bg-bg-base"
        aria-label="Watchlist detayı"
      >
        {builderOpen ? (
          <NotificationRuleBuilder
            userReference={userReference}
            onSaved={() => {
              // After save, the mutation invalidates the query — selecting
              // first subscription is handled by the effect above.
            }}
          />
        ) : selectedSubscription ? (
          <WatchlistEntityCard
            subscription={selectedSubscription}
            userReference={userReference}
            onDeleted={() => selectEntity(null)}
          />
        ) : ready ? (
          <div className="grid h-full place-items-center px-4">
            <EmptyState
              title="Henüz seçim yok"
              description="Sol listeden bir kural seçin veya yeni bir kural ekleyin."
              icon={<Bell className="h-6 w-6" aria-hidden />}
              action={
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    selectEntity(null);
                    openBuilder({});
                  }}
                >
                  Watchlist&apos;e ekle
                </Button>
              }
            />
          </div>
        ) : (
          <div className="grid h-full place-items-center px-4">
            <EmptyState
              title="Watchlist hazır olduğunda detaylar burada görünür"
              description="Backend `/eplan/subscriptions` rotası kayıt döndürdüğünde seçilen kuralın detayı bu alanda gösterilecek."
              icon={<Bell className="h-6 w-6" aria-hidden />}
            />
          </div>
        )}
      </section>
    </div>
  );
}
