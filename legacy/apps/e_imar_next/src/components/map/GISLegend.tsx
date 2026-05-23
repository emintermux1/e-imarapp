'use client';

import { useMapStore } from '@/lib/store/map-store';
import type { LayerCatalogItem } from '@/types/map';
import { cn } from '@/lib/utils/cn';

const COLOR_BY_CATEGORY: Record<LayerCatalogItem['category'], string> = {
  parsel: 'bg-map-parcel-fill border-map-parcel-stroke',
  imar: 'bg-map-plan-fill border-state-gov-red',
  idari: 'bg-state-info/20 border-state-info',
  risk: 'bg-map-risk-overlay border-state-warn',
  ulasim: 'bg-text-secondary/20 border-text-secondary',
  aski: 'bg-state-warn/20 border-state-warn',
};

export function GISLegend() {
  const layers = useMapStore((s) => s.layers).filter((layer) => layer.enabled);

  if (layers.length === 0) return null;

  return (
    <div className="pointer-events-auto absolute bottom-4 right-4 z-20 max-w-xs rounded-md border border-border-subtle bg-bg-surface/95 p-3 text-[12px] shadow-panel backdrop-blur sm:right-20 lg:right-20">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="m-0 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
          Lejant
        </h4>
        <span className="font-data text-[11px] text-text-muted">{layers.length}</span>
      </div>
      <ul className="space-y-1.5">
        {layers.map((layer) => (
          <li key={layer.id} className="flex items-center gap-2">
            <span
              className={cn(
                'inline-block h-3 w-4 rounded-sm border',
                COLOR_BY_CATEGORY[layer.category],
              )}
              style={{ opacity: layer.opacity }}
              aria-hidden
            />
            <span className="truncate text-text-secondary">{layer.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
