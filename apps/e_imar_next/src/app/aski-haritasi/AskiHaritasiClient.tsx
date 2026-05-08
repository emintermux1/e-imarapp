'use client';

import { useEffect, useMemo } from 'react';
import { HydrationBoundary, type DehydratedState } from '@tanstack/react-query';
import { AppShell } from '@/components/shell/AppShell';
import { ReadinessGate } from '@/components/data/ReadinessGate';
import { EmptyState } from '@/components/data/EmptyState';
import { AskiMap } from '@/components/aski/AskiMap';
import { AskiFilters } from '@/components/aski/AskiFilters';
import { AskiPlanList } from '@/components/aski/AskiPlanList';
import { AskiPlanCard } from '@/components/aski/AskiPlanCard';
import { AskiLegend } from '@/components/aski/AskiLegend';
import { useAskiStore } from '@/lib/store/aski-store';
import { useSuspensionNotices } from '@/lib/query/hooks';
import { useUIStore } from '@/lib/store/ui-store';
import { ListChecks, Star } from 'lucide-react';
import type { SuspensionNotice } from '@/lib/api/types';
import type { SuspensionNoticeQuery } from '@/lib/api/client';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface AskiHaritasiClientProps {
  dehydratedState: DehydratedState;
}

export function AskiHaritasiClient({ dehydratedState }: AskiHaritasiClientProps) {
  return (
    <HydrationBoundary state={dehydratedState}>
      <AppShell showRightPanel={true}>
        <AskiHaritasiContent />
      </AppShell>
    </HydrationBoundary>
  );
}

function AskiHaritasiContent() {
  const filters = useAskiStore((s) => s.filters);
  const selectedPlanId = useAskiStore((s) => s.selectedPlanId);
  const setLeftSidebarTab = useUIStore((s) => s.setLeftSidebarTab);

  // Default the left sidebar to filters tab while we're on this route.
  useEffect(() => {
    setLeftSidebarTab('filters');
  }, [setLeftSidebarTab]);

  const query = useMemo<SuspensionNoticeQuery>(
    () => ({
      from: filters.dateFrom ?? undefined,
      to: filters.dateTo ?? undefined,
      municipalityIds:
        filters.municipalityIds.length > 0 ? filters.municipalityIds : undefined,
      planTypes: filters.planTypes.length > 0 ? filters.planTypes : undefined,
    }),
    [filters],
  );
  const noticesQuery = useSuspensionNotices(query);

  const status = noticesQuery.isError
    ? 'network_error'
    : noticesQuery.data?.status;
  const notices: SuspensionNotice[] = noticesQuery.data?.notices ?? [];
  const selectedNotice = notices.find((notice) => notice.id === selectedPlanId) ?? null;
  const ready = !noticesQuery.isLoading && !noticesQuery.isError && status === 'ok';

  return (
    <div className="grid h-full grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="relative h-full min-h-0">
        <AskiMap notices={notices} className="h-full w-full" />

        {/* Top filter bar (desktop only) */}
        <div className="pointer-events-none absolute inset-x-4 top-4 z-20 hidden lg:flex justify-center">
          <div className="pointer-events-auto w-full max-w-4xl">
            <AskiFilters />
          </div>
        </div>

        {/* Bottom-center plan list (desktop only) */}
        <div className="pointer-events-none absolute inset-x-4 bottom-4 z-20 hidden lg:flex justify-center">
          <div className="pointer-events-auto w-full max-w-5xl rounded-md border border-border-subtle bg-bg-surface/90 p-2 shadow-panel backdrop-blur">
            {ready ? (
              notices.length === 0 ? (
                <p className="px-3 py-2 text-center text-[12px] text-text-muted">
                  Bu filtrelerle eşleşen aktif askı kaydı yok.
                </p>
              ) : (
                <AskiPlanList notices={notices} />
              )
            ) : (
              <ReadinessGate
                status={status}
                loading={noticesQuery.isLoading}
                endpoint="/eplan/suspension-notices"
                emptyTitle="Aktif askı kaydı yok"
                emptyDescription="Backend bu filtrelerle eşleşen kayıt döndürmedi."
                notReadyTitle="Askı kataloğu hazır değil"
                notReadyDescription={
                  noticesQuery.isError
                    ? noticesQuery.error?.message
                    : (noticesQuery.data?.message as string | undefined) ??
                      'Backend askı kataloğu servisinden henüz veri akışı yok.'
                }
                nextActions={
                  noticesQuery.data?.nextActions ?? [
                    'Backend `/eplan/suspension-notices` rotasını yayınlayın',
                    'Belediye askı RSS/feed ingestion modülünü tamamlayın',
                  ]
                }
                onRetry={() => noticesQuery.refetch()}
              >
                <div />
              </ReadinessGate>
            )}
          </div>
        </div>

        {/* Bottom-left legend */}
        <div className="pointer-events-none absolute bottom-4 left-4 z-20 hidden lg:block">
          <AskiLegend noticeCount={notices.length} />
        </div>
      </div>

      {/* Right panel with selected plan card or empty state */}
      <aside
        className="hidden h-[calc(100dvh-64px)] flex-col border-l border-border-subtle bg-bg-surface lg:flex"
        aria-label="Askı plan detayı"
      >
        <header className="border-b border-border-subtle px-4 py-3">
          <h2 className="m-0 text-h3 text-text-primary">Askı detayı</h2>
          <p className="m-0 mt-0.5 text-[12px] text-text-muted">
            Listeden veya haritadan bir plan seçin
          </p>
        </header>
        <div className="flex-1 overflow-y-auto scroll-thin">
          {selectedNotice ? (
            <AskiPlanCard notice={selectedNotice} />
          ) : ready && notices.length > 0 ? (
            <EmptyState
              title="Bir plan seçin"
              description="Sol haritadaki kırmızı poligonlardan ya da alt listeden askı kaydını seçin."
              icon={<ListChecks className="h-6 w-6" aria-hidden />}
            />
          ) : ready ? (
            <EmptyState
              title="Aktif askı kaydı yok"
              description="Filtreleri genişleterek tekrar deneyin."
            />
          ) : (
            <div className="p-4">
              <ReadinessGate
                status={status}
                loading={noticesQuery.isLoading}
                endpoint="/eplan/suspension-notices"
                notReadyTitle="Askı kataloğu hazır değil"
                notReadyDescription={
                  noticesQuery.isError
                    ? noticesQuery.error?.message
                    : (noticesQuery.data?.message as string | undefined) ??
                      'Backend askı kataloğu servisinden henüz veri akışı yok.'
                }
                nextActions={noticesQuery.data?.nextActions}
                onRetry={() => noticesQuery.refetch()}
              >
                <div />
              </ReadinessGate>
            </div>
          )}
        </div>
        {selectedNotice ? (
          <footer className="border-t border-border-subtle p-3 text-[12px] text-text-secondary">
            <Link href="/watchlist" className="inline-flex">
              <Button
                size="sm"
                variant="secondary"
                leftIcon={<Star className="h-3.5 w-3.5" aria-hidden />}
              >
                Bu belediyeyi watchlist&apos;e ekle
              </Button>
            </Link>
          </footer>
        ) : null}
      </aside>

      {/* Mobile filter strip */}
      <div className="block px-3 py-2 lg:hidden">
        <AskiFilters compact />
      </div>
    </div>
  );
}
