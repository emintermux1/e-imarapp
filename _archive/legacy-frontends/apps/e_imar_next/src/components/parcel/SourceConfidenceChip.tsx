'use client';

import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface SourceConfidenceChipProps {
  /** 0-1 confidence value from backend provenance. */
  confidence?: number | null;
  className?: string;
}

export function SourceConfidenceChip({ confidence, className }: SourceConfidenceChipProps) {
  if (confidence === null || confidence === undefined || Number.isNaN(confidence)) return null;
  const pct = Math.round(Math.max(0, Math.min(1, confidence)) * 100);
  const tone =
    pct >= 80
      ? 'bg-state-success/10 text-state-success'
      : pct >= 50
      ? 'bg-state-warn/10 text-state-warn'
      : 'bg-state-gov-red/10 text-state-gov-red';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-border-subtle px-2 py-0.5 text-[11px] font-medium',
        tone,
        className,
      )}
      title={`Güven skoru ${pct}%`}
    >
      <ShieldCheck className="h-3 w-3" aria-hidden />
      <span className="font-data tabular-nums">%{pct}</span>
    </span>
  );
}
