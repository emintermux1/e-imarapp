'use client';

import { Calculator, Handshake } from 'lucide-react';
import { DataCard } from '@/components/data/DataCard';
import { ReadinessGate } from '@/components/data/ReadinessGate';
import { formatArea, formatInteger, formatPercent } from '@/lib/utils/format';
import type { EmsalShareFacts } from '@/lib/utils/parcel';
import type { ReadinessState } from '@/types/readiness';

interface EmsalShareCardProps {
  share: EmsalShareFacts | null;
  status?: ReadinessState | null;
  nextActions?: string[];
}

export function EmsalShareCard({ share, status, nextActions }: EmsalShareCardProps) {
  if (!share && !status) {
    // No emsal payload requested. Render placeholder hint.
    return (
      <DataCard
        title="Emsal / pay hesabı"
        description="Sorguda emsalInput sağlandığında görüntülenir"
        compact
      >
        <p className="text-[13px] text-text-muted">
          Bu sorgu için emsal hesaplama girdisi sağlanmadı. Pay hesabı görüntüleyebilmek için
          parsel alanı, emsal ve isteğe bağlı pay oranlarıyla yeniden sorgulayın.
        </p>
      </DataCard>
    );
  }
  return (
    <DataCard
      title="Emsal / pay hesabı"
      description="Backend emsal-share çıktısı"
      status={status ?? undefined}
      trailing={<Calculator className="h-4 w-4 text-text-muted" aria-hidden />}
      compact
    >
      <ReadinessGate
        status={status}
        nextActions={nextActions}
        emptyTitle="Emsal hesaplaması yok"
        emptyDescription="Backend bu parsel için emsal hesabı döndürmedi."
      >
        {share ? (
          <dl className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
            <Row
              label="Toplam inşaat alanı"
              value={formatArea(share.totalConstructionAreaM2)}
            />
            <Row label="Net satılabilir alan" value={formatArea(share.netSellableAreaM2)} />
            <Row label="Bağımsız bölüm" value={formatInteger(share.estimatedIndependentUnits)} />
            <Row label="Arsa sahibi payı" value={formatPercent(share.ownerShareRatio)} />
            <Row label="Müteahhit payı" value={formatPercent(share.contractorShareRatio)} />
            <Row label="Sahip ünite" value={formatInteger(share.ownerShareUnits)} />
            <Row label="Müteahhit ünite" value={formatInteger(share.contractorShareUnits)} />
            <div className="col-span-full mt-2 flex items-center gap-2 rounded-md bg-bg-subtle/60 px-3 py-2 text-[12px] text-text-secondary">
              <Handshake className="h-4 w-4 text-text-muted" aria-hidden />
              <span>
                Pay oranları backend tarafından girilen emsalInput verilerine göre
                hesaplanır; istemci tarafında türetilmiş hiçbir değer yoktur.
              </span>
            </div>
          </dl>
        ) : null}
      </ReadinessGate>
    </DataCard>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <dt className="text-[12px] text-text-muted">{label}</dt>
      <dd className="font-data text-[13px] tabular-nums text-text-primary">{value}</dd>
    </div>
  );
}
