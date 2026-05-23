'use client';

import { Building2, FileText, MapPin, Ruler } from 'lucide-react';
import { ZoningBadge } from './ZoningBadge';
import { DataCard } from '@/components/data/DataCard';
import { formatArea, formatNumber, or } from '@/lib/utils/format';
import type { ParcelQuickFacts } from '@/lib/utils/parcel';

interface ParcelQuickFactsCardProps {
  parcel: ParcelQuickFacts | null;
}

interface FactRowProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
}

function FactRow({ label, value, hint }: FactRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <dt className="text-[12px] text-text-muted">{label}</dt>
      <dd className="font-data text-[13px] tabular-nums text-text-primary">
        {value}
        {hint ? <span className="ml-1 text-[11px] text-text-muted">{hint}</span> : null}
      </dd>
    </div>
  );
}

export function ParcelQuickFactsCard({ parcel }: ParcelQuickFactsCardProps) {
  if (!parcel) return null;
  const locationParts = [parcel.province, parcel.district, parcel.neighborhood].filter(Boolean);
  return (
    <DataCard
      title="Parsel kimliği"
      description={parcel.planTitle ?? undefined}
      trailing={parcel.zoningFunction ? <ZoningBadge zoning={parcel.zoningFunction} /> : null}
      compact
    >
      <dl className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <FactRow
          label="Ada / Parsel"
          value={
            <span className="font-data tabular-nums">
              {or(parcel.ada)} / {or(parcel.parselNo)}
            </span>
          }
        />
        <FactRow label="Alan" value={formatArea(parcel.areaM2)} />
        <FactRow label="Emsal" value={formatNumber(parcel.emsal)} />
        <FactRow label="TAKS" value={formatNumber(parcel.taks)} />
        <FactRow label="KAKS" value={formatNumber(parcel.kaks)} />
        <FactRow label="Gabari" value={or(parcel.gabari)} />
      </dl>
      {locationParts.length > 0 ? (
        <div className="mt-3 flex items-center gap-2 rounded-md bg-bg-subtle/60 px-3 py-2 text-[12px] text-text-secondary">
          <MapPin className="h-4 w-4 text-text-muted" aria-hidden />
          <span>{locationParts.join(' · ')}</span>
        </div>
      ) : null}
      <ul className="mt-3 flex flex-wrap gap-2 text-[11px] text-text-muted">
        <li className="inline-flex items-center gap-1.5 rounded-sm bg-bg-subtle px-2 py-1">
          <Building2 className="h-3 w-3" aria-hidden /> Plan: {or(parcel.planTitle)}
        </li>
        <li className="inline-flex items-center gap-1.5 rounded-sm bg-bg-subtle px-2 py-1">
          <FileText className="h-3 w-3" aria-hidden /> Kaynak: {or(parcel.sourceName)}
        </li>
        <li className="inline-flex items-center gap-1.5 rounded-sm bg-bg-subtle px-2 py-1">
          <Ruler className="h-3 w-3" aria-hidden /> Belediye: {or(parcel.municipality)}
        </li>
      </ul>
    </DataCard>
  );
}
