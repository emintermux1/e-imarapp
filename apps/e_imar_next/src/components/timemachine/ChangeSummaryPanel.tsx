'use client';

import { ArrowRight, Check } from 'lucide-react';
import { DataCard } from '@/components/data/DataCard';
import { ReadinessGate } from '@/components/data/ReadinessGate';
import { TimeRangeBadge } from './TimeRangeBadge';
import { cn } from '@/lib/utils/cn';
import type { ApiFailure } from '@/lib/api/types';
import type {
  ZoningDiffField,
  ZoningDiffResponse,
} from '@/lib/api/types';

interface ChangeSummaryPanelProps {
  diff: ZoningDiffResponse | undefined;
  loading: boolean;
  error?: ApiFailure | null;
  fromAt?: string | null;
  toAt?: string | null;
  className?: string;
}

const FIELD_LABELS: Record<string, string> = {
  zoningFunction: 'İmar fonksiyonu',
  zoning_function: 'İmar fonksiyonu',
  emsal: 'Emsal',
  taks: 'TAKS',
  kaks: 'KAKS',
  gabari: 'Gabari',
  planTitle: 'Plan başlığı',
  plan_title: 'Plan başlığı',
  effectiveAt: 'Yürürlük tarihi',
};

const TYPE_FIELDS = new Set(['zoningFunction', 'zoning_function', 'planTitle', 'plan_title', 'gabari']);

function fieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field;
}

function renderValue(value: unknown): React.ReactNode {
  if (value === null || value === undefined || value === '') {
    return <span className="text-text-muted">—</span>;
  }
  if (typeof value === 'number') {
    return <span className="font-data tabular-nums">{value.toLocaleString('tr-TR')}</span>;
  }
  if (typeof value === 'string' || typeof value === 'boolean') {
    return <span className="font-data tabular-nums">{String(value)}</span>;
  }
  return <span className="font-data text-[11px] text-text-muted">{JSON.stringify(value)}</span>;
}

function FieldRow({ field }: { field: ZoningDiffField }) {
  const isTypeChange = TYPE_FIELDS.has(field.field);
  const tone = field.changed
    ? isTypeChange
      ? 'border-state-gov-red/40 bg-state-gov-red/5'
      : 'border-state-warn/40 bg-state-warn/5'
    : 'border-border-subtle bg-bg-surface';
  return (
    <li
      className={cn(
        'flex items-start gap-3 rounded-md border px-3 py-2 text-[13px]',
        tone,
      )}
    >
      <span className="mt-0.5 inline-flex h-5 min-w-[18px] shrink-0 items-center justify-center rounded-sm bg-bg-subtle text-[11px] text-text-muted">
        {field.changed ? (
          <span
            className={cn(
              'inline-block h-2 w-2 rounded-full',
              isTypeChange ? 'bg-state-gov-red' : 'bg-state-warn',
            )}
            aria-hidden
          />
        ) : (
          <Check className="h-3 w-3 text-state-success" aria-hidden />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[12px] font-medium text-text-secondary">{fieldLabel(field.field)}</div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-text-primary">
          {renderValue(field.before)}
          <ArrowRight className="h-3.5 w-3.5 text-text-muted" aria-hidden />
          <span
            className={cn(
              'rounded-sm px-1.5 py-0.5',
              field.changed
                ? isTypeChange
                  ? 'bg-state-gov-red/10 text-state-gov-red'
                  : 'bg-state-warn/15 text-state-warn'
                : 'bg-bg-subtle text-text-secondary',
            )}
          >
            {renderValue(field.after)}
          </span>
        </div>
      </div>
    </li>
  );
}

/**
 * Right-rail summary that lists each `ZoningDiffField` returned by the
 * backend. We never compute a diff client-side — when the diff endpoint is
 * not available we surface its readiness state via `<ReadinessGate>`.
 */
export function ChangeSummaryPanel({
  diff,
  loading,
  error,
  fromAt,
  toAt,
  className,
}: ChangeSummaryPanelProps) {
  const status = error ? 'network_error' : diff?.status;
  const fields = diff?.fields ?? [];
  const changedCount = fields.filter((f) => f.changed).length;

  return (
    <DataCard
      title="Değişim özeti"
      description="Backend `/parcels/:id/zoning-diff` cevabından"
      status={status}
      compact
      className={className}
      bodyClassName="space-y-3"
    >
      <TimeRangeBadge fromAt={fromAt} toAt={toAt} />

      <ReadinessGate
        status={status}
        loading={loading}
        endpoint="/parcels/:id/zoning-diff"
        emptyTitle="Diff servisi cevap vermedi"
        emptyDescription="Bu zaman aralığında değişiklik bulunmadığını belirten bir cevap geldi."
        notReadyTitle="Snapshot karşılaştırma servisi hazır değil"
        notReadyDescription={
          error
            ? error.message
            : (diff?.message as string | undefined) ??
              'Backend `/parcels/:id/zoning-diff` rotası ingestion modülü tamamlanınca aktif olacak.'
        }
        nextActions={diff?.nextActions ?? [
          'Snapshot ingestion pipeline tamamlanmalı',
          'Plan revizyon CDC akışı bağlanmalı',
        ]}
      >
        {fields.length === 0 ? (
          <p className="m-0 text-[13px] text-text-secondary">
            Bu aralıkta backend hiçbir alan değişikliği döndürmedi.
          </p>
        ) : (
          <>
            <p className="m-0 text-[12px] text-text-secondary">
              {changedCount} alan değişti · toplam {fields.length} alan karşılaştırıldı.
            </p>
            <ul className="space-y-2">
              {fields.map((field) => (
                <FieldRow key={field.field} field={field} />
              ))}
            </ul>
          </>
        )}
      </ReadinessGate>
    </DataCard>
  );
}
