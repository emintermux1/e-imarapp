'use client';

import { Layers } from 'lucide-react';

interface AskiLegendProps {
  noticeCount: number;
}

/**
 * Compact legend rendered over the askı map. Mirrors the visual treatment of
 * the suspension polygons drawn in `AskiMap` so the user can identify the
 * red overlay even with low contrast basemaps.
 */
export function AskiLegend({ noticeCount }: AskiLegendProps) {
  return (
    <div className="pointer-events-auto rounded-md border border-border-subtle bg-bg-surface/95 p-3 text-[12px] shadow-panel backdrop-blur">
      <div className="mb-2 flex items-center gap-2">
        <Layers className="h-3.5 w-3.5 text-text-muted" aria-hidden />
        <h4 className="m-0 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
          Askı katmanı
        </h4>
      </div>
      <ul className="m-0 space-y-1.5">
        <li className="flex items-center gap-2">
          <span
            className="inline-block h-3 w-4 rounded-sm border-2 border-state-gov-red bg-map-plan-fill"
            aria-hidden
          />
          <span className="text-text-secondary">Askıdaki plan poligonu</span>
        </li>
        <li className="flex items-center gap-2">
          <span
            className="inline-block h-3 w-4 rounded-sm border-2 border-state-gov-red"
            style={{ backgroundColor: 'rgba(180, 35, 44, 0.45)' }}
            aria-hidden
          />
          <span className="text-text-secondary">Seçili plan</span>
        </li>
      </ul>
      <p className="m-0 mt-2 font-data text-[11px] tabular-nums text-text-muted">
        {noticeCount} aktif kayıt
      </p>
    </div>
  );
}
