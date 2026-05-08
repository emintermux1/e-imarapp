'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ReadinessGate } from '@/components/data/ReadinessGate';
import { TimelineSlider } from '@/components/timemachine/TimelineSlider';
import { LayerDiffOverlay } from '@/components/timemachine/LayerDiffOverlay';
import { ChangeSummaryPanel } from '@/components/timemachine/ChangeSummaryPanel';
import { useMapStore } from '@/lib/store/map-store';
import { useTimemachineStore } from '@/lib/store/timemachine-store';
import { useZoningDiff, useZoningSnapshots } from '@/lib/query/hooks';
import { cn } from '@/lib/utils/cn';

export function TimemachineShell() {
  const selectedParcelId = useMapStore((s) => s.selectedParcelId);
  const [parcelInput, setParcelInput] = useState('');
  const [parcelId, setParcelId] = useState<string | null>(selectedParcelId);

  // When the global selected parcel changes (e.g. from a search), prefill.
  useEffect(() => {
    if (selectedParcelId && !parcelId) {
      setParcelId(selectedParcelId);
      setParcelInput(selectedParcelId);
    }
  }, [selectedParcelId, parcelId]);

  // Reset the time machine store whenever the parcel changes.
  const resetRange = useTimemachineStore((s) => s.reset);
  useEffect(() => {
    resetRange();
  }, [parcelId, resetRange]);

  const fromAt = useTimemachineStore((s) => s.fromAt);
  const toAt = useTimemachineStore((s) => s.toAt);

  const snapshotQuery = useZoningSnapshots(parcelId);
  const snapshots = snapshotQuery.data?.snapshots ?? [];
  const snapshotStatus = snapshotQuery.isError
    ? 'network_error'
    : snapshotQuery.data?.status;

  const diffQuery = useZoningDiff(parcelId, fromAt, toAt);
  const diffError = diffQuery.isError ? diffQuery.error ?? null : null;

  return (
    <div className="grid h-full grid-rows-[auto_auto_minmax(0,1fr)]">
      <header className="border-b border-border-subtle bg-bg-surface px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="m-0 text-h3 text-text-primary">Time machine</h2>
            <p className="m-0 mt-0.5 text-[12px] text-text-muted">
              Parsel bazlı plan revizyonlarını karşılaştırın. Tüm değerler backend snapshot
              servisinden gelir; istemcide hesaplama yapılmaz.
            </p>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const next = parcelInput.trim();
              setParcelId(next || null);
            }}
            className="flex items-end gap-2"
          >
            <div className="w-72">
              <Input
                label="Parsel ID"
                placeholder="UUID veya sistem kimliği"
                value={parcelInput}
                onChange={(event) => setParcelInput(event.target.value)}
                leftAdornment={<Search className="h-4 w-4" aria-hidden />}
                aria-label="Parsel ID"
              />
            </div>
            <Button type="submit" variant="primary" size="md">
              Yükle
            </Button>
          </form>
        </div>
      </header>

      <section className="border-b border-border-subtle bg-bg-base px-4 py-3">
        {!parcelId ? (
          <ReadinessGate
            status="not_ready"
            notReadyTitle="Parsel seçin"
            notReadyDescription="Bir parsel ID girin veya harita çalışma alanından bir parsel seçin."
            nextActions={['Üst arama çubuğundan ada/parsel sorgulayın', 'Parsel ID alanına UUID girin']}
          >
            <div />
          </ReadinessGate>
        ) : snapshotStatus === 'ok' ? (
          <TimelineSlider snapshots={snapshots} parcelId={parcelId} />
        ) : (
          <ReadinessGate
            status={snapshotStatus}
            loading={snapshotQuery.isLoading}
            endpoint={`/parcels/${parcelId}/zoning-snapshots`}
            emptyTitle="Snapshot kaydı yok"
            emptyDescription="Bu parsel için backend henüz tarihçe döndürmedi."
            notReadyTitle="Snapshot servisi hazır değil"
            notReadyDescription={
              snapshotQuery.isError
                ? snapshotQuery.error?.message
                : (snapshotQuery.data?.message as string | undefined) ??
                  'Backend `/parcels/:id/zoning-snapshots` rotası henüz cevap vermedi.'
            }
            nextActions={
              snapshotQuery.data?.nextActions ?? [
                'Plan revizyonlarının snapshot ingestion pipeline\'ı tamamlanmalı',
                'Parsel ID&apos;sini doğrulayın',
              ]
            }
            onRetry={() => snapshotQuery.refetch()}
          >
            <div />
          </ReadinessGate>
        )}
      </section>

      <section
        className={cn('grid min-h-0 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px]')}
      >
        <div className="relative h-full min-h-[360px]">
          <LayerDiffOverlay
            beforeLabel={fromAt ? formatRangeLabel(fromAt) : 'Önce'}
            afterLabel={toAt ? formatRangeLabel(toAt) : 'Sonra'}
          />
        </div>
        <aside className="flex h-full min-h-0 flex-col overflow-y-auto scroll-thin border-t border-border-subtle bg-bg-surface p-3 lg:border-l lg:border-t-0">
          <ChangeSummaryPanel
            diff={diffQuery.data}
            loading={diffQuery.isLoading}
            error={diffError}
            fromAt={fromAt}
            toAt={toAt}
          />
        </aside>
      </section>
    </div>
  );
}

function formatRangeLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}
