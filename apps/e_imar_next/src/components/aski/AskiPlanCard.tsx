'use client';

import { Building, Calendar, ExternalLink, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DataCard } from '@/components/data/DataCard';
import { ProvenanceBlock } from '@/components/parcel/ProvenanceBlock';
import { formatNoticeDate, planTypeLabel } from './aski-utils';
import { extractProvenance } from '@/lib/utils/parcel';
import type { SuspensionNotice } from '@/lib/api/types';

interface AskiPlanCardProps {
  notice: SuspensionNotice;
}

function FactRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <dt className="text-[12px] text-text-muted">{label}</dt>
      <dd className="font-data text-[13px] tabular-nums text-text-primary">{value}</dd>
    </div>
  );
}

/**
 * Right-rail card surfacing the full detail of a single askı (suspension)
 * notice. All values come straight from the backend payload — when a field
 * is absent we render the explicit em-dash placeholder via the `or` helper
 * pattern (here we inline trims for simplicity).
 */
export function AskiPlanCard({ notice }: AskiPlanCardProps) {
  const provenance = extractProvenance(undefined, notice as unknown as Record<string, unknown>);
  return (
    <div className="space-y-3 p-4">
      <DataCard
        title={notice.planTitle?.trim() || `Askı kaydı #${notice.id}`}
        description={planTypeLabel(notice.planType)}
        status={notice.status}
        compact
      >
        <dl className="grid grid-cols-1 gap-x-4">
          <FactRow
            label="Belediye"
            value={
              <span className="inline-flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5 text-text-muted" aria-hidden />
                <span>
                  {notice.municipalityName?.trim() ||
                    notice.municipalityId?.trim() ||
                    '—'}
                </span>
              </span>
            }
          />
          <FactRow
            label="Askı başlangıç"
            value={
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-text-muted" aria-hidden />
                <span>{formatNoticeDate(notice.startDate)}</span>
              </span>
            }
          />
          <FactRow
            label="Askı bitiş"
            value={
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-text-muted" aria-hidden />
                <span>{formatNoticeDate(notice.endDate)}</span>
              </span>
            }
          />
          <FactRow label="Yayın tarihi" value={formatNoticeDate(notice.postedAt)} />
        </dl>

        {notice.geometry || notice.bbox ? (
          <div className="mt-3 inline-flex items-center gap-2 rounded-md bg-bg-subtle/60 px-3 py-2 text-[12px] text-text-secondary">
            <MapPin className="h-4 w-4 text-text-muted" aria-hidden />
            <span>Harita üzerinde işaretli</span>
          </div>
        ) : (
          <div className="mt-3 rounded-md bg-state-warn/5 px-3 py-2 text-[12px] text-text-secondary">
            Bu kayıtta geometri bulunmuyor; konum harita üzerinde gösterilemez.
          </div>
        )}

        {notice.documentUrl ? (
          <div className="mt-3">
            <a
              href={notice.documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Button
                size="sm"
                variant="secondary"
                rightIcon={<ExternalLink className="h-3.5 w-3.5" aria-hidden />}
              >
                Belgeyi aç
              </Button>
            </a>
          </div>
        ) : null}
      </DataCard>

      <ProvenanceBlock provenance={provenance} />
    </div>
  );
}
