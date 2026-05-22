'use client';

import { Building2, Car, Layers3, Lightbulb, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { DataCard } from '@/components/data/DataCard';
import { ReadinessGate } from '@/components/data/ReadinessGate';
import { RiskIndicator } from './RiskIndicator';
import { formatInteger, or } from '@/lib/utils/format';
import type { ParcelPotentialFacts } from '@/lib/utils/parcel';
import type { ReadinessState } from '@/types/readiness';

interface PotentialSummaryCardProps {
  potential: ParcelPotentialFacts | null;
  status?: ReadinessState | null;
  nextActions?: string[];
}

interface MetricProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}

function Metric({ icon, label, value }: MetricProps) {
  return (
    <div className="flex items-start gap-2.5 rounded-md border border-border-subtle bg-bg-base/50 p-3">
      <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-md bg-brand-navy/5 text-brand-muted-blue">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] uppercase tracking-wide text-text-muted">{label}</div>
        <div className="font-data text-[14px] font-medium tabular-nums text-text-primary">{value}</div>
      </div>
    </div>
  );
}

export function PotentialSummaryCard({
  potential,
  status,
  nextActions,
}: PotentialSummaryCardProps) {
  return (
    <DataCard
      title="Yapılaşma potansiyeli"
      description="Backend potansiyel özetinden türetilmiş özet"
      status={status ?? undefined}
      trailing={potential ? <RiskIndicator score={potential.riskScore} /> : null}
      compact
    >
      <ReadinessGate
        status={status}
        nextActions={nextActions}
        emptyTitle="Potansiyel özeti yok"
        emptyDescription="Backend tarafından potansiyel hesaplaması döndürülmedi."
      >
        {potential ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Metric
                icon={<Building2 className="h-4 w-4" />}
                label="Önerilen yapı tipi"
                value={or(potential.maxBuildingType)}
              />
              <Metric
                icon={<Layers3 className="h-4 w-4" />}
                label="Tahmini kat"
                value={formatInteger(potential.estimatedFloors)}
              />
              <Metric
                icon={<Users className="h-4 w-4" />}
                label="Bağımsız bölüm"
                value={formatInteger(potential.estimatedIndependentUnits)}
              />
              <Metric
                icon={<Car className="h-4 w-4" />}
                label="Otopark ihtiyacı"
                value={formatInteger(potential.estimatedParkingNeed)}
              />
            </div>
            {potential.recommendedUse ? (
              <div className="flex items-start gap-2 rounded-md bg-bg-subtle/60 px-3 py-2 text-[13px] text-text-secondary">
                <Lightbulb className="mt-0.5 h-4 w-4 text-state-warn" aria-hidden />
                <p className="m-0">{potential.recommendedUse}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </ReadinessGate>
    </DataCard>
  );
}
