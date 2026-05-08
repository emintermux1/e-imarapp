'use client';

import { Clock, Database } from 'lucide-react';
import { SourceConfidenceChip } from './SourceConfidenceChip';
import { formatDateTime, formatRelativeTime, or } from '@/lib/utils/format';
import type { ProvenanceFacts } from '@/lib/utils/parcel';
import { cn } from '@/lib/utils/cn';

interface ProvenanceBlockProps {
  provenance: ProvenanceFacts;
  className?: string;
}

export function ProvenanceBlock({ provenance, className }: ProvenanceBlockProps) {
  const { sourceName, sourceId, fetchedAt, confidence } = provenance;
  return (
    <div
      className={cn(
        'rounded-md border border-border-subtle bg-bg-subtle/40 p-3 text-[12px] text-text-secondary',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="inline-flex items-center gap-1.5">
          <Database className="h-3.5 w-3.5 text-text-muted" aria-hidden />
          <span className="font-medium text-text-primary">{or(sourceName, 'Kaynak bilinmiyor')}</span>
          {sourceId ? <span className="font-data text-[11px] text-text-muted">#{sourceId}</span> : null}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-text-muted" aria-hidden />
          <span title={formatDateTime(fetchedAt)} className="font-data text-[11px] tabular-nums">
            {formatRelativeTime(fetchedAt)}
          </span>
        </span>
        {confidence !== undefined ? <SourceConfidenceChip confidence={confidence} /> : null}
      </div>
      <p className="mt-2 m-0 text-[11px] text-text-muted">
        Bu değerler backend tarafından döndürüldü; istemcide hesaplama yapılmadı.
      </p>
    </div>
  );
}
