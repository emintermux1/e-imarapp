'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { LayerToggle } from './LayerToggle';
import { useMapStore } from '@/lib/store/map-store';
import { useBootstrap } from '@/lib/query/hooks';
import { StatusBadge } from '@/components/data/StatusBadge';
import { cn } from '@/lib/utils/cn';
import { trackEvent } from '@/lib/analytics/events';
import type { LayerCatalogItem, LayerCategory } from '@/types/map';

interface LayerCatalogProps {
  className?: string;
}

const CATEGORY_ORDER: LayerCategory[] = [
  'parsel',
  'imar',
  'idari',
  'risk',
  'ulasim',
  'aski',
];

const CATEGORY_LABEL: Record<LayerCategory, string> = {
  parsel: 'Parsel',
  imar: 'İmar planı',
  idari: 'İdari sınır',
  risk: 'Doğal risk',
  ulasim: 'Ulaşım',
  aski: 'Askı / plan değişim',
};

export function LayerCatalog({ className }: LayerCatalogProps) {
  const layers = useMapStore((s) => s.layers);
  const [search, setSearch] = useState('');
  const bootstrap = useBootstrap();
  const tileStatus = bootstrap.data?.map?.tileStatus?.status;

  const grouped = useMemo(() => {
    const filter = search.trim().toLowerCase();
    const matches = layers.filter((layer) => {
      if (!filter) return true;
      return (
        layer.label.toLowerCase().includes(filter) ||
        layer.description.toLowerCase().includes(filter) ||
        CATEGORY_LABEL[layer.category].toLowerCase().includes(filter)
      );
    });
    const map = new Map<LayerCategory, LayerCatalogItem[]>();
    for (const cat of CATEGORY_ORDER) map.set(cat, []);
    for (const layer of matches) {
      const list = map.get(layer.category);
      if (list) list.push(layer);
    }
    return CATEGORY_ORDER.map((cat) => ({
      key: cat,
      label: CATEGORY_LABEL[cat],
      items: map.get(cat) ?? [],
    })).filter((group) => group.items.length > 0);
  }, [layers, search]);

  return (
    <div className={cn('flex h-full flex-col', className)}>
      <div className="border-b border-border-subtle p-3">
        <Input
          placeholder="Katman ara"
          leftAdornment={<Search className="h-4 w-4" aria-hidden />}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Katman ara"
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] text-text-muted">Tile servisi</span>
          <StatusBadge status={tileStatus ?? 'idle'} size="xs" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scroll-thin px-3 py-3">
        {grouped.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-text-muted">
            Aramayla eşleşen katman bulunamadı.
          </p>
        ) : null}
        <div className="space-y-4">
          {grouped.map((group) => (
            <div key={group.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                  {group.label}
                </h4>
                <span className="font-data text-[11px] text-text-muted">{group.items.length}</span>
              </div>
              <div className="space-y-2">
                {group.items.map((layer) => (
                  <LayerToggle
                    key={layer.id}
                    layer={layer}
                    onToggle={(id, enabled) => {
                      trackEvent('layer_toggled', {
                        id,
                        category: layer.category,
                        enabled,
                      });
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
