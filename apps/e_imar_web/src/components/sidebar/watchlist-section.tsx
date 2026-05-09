"use client";

import * as React from "react";
import { Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ParcelCard } from "@/components/gis/parcel-card";
import { useWatchlistStore } from "@/stores/watchlist-store";
import { useMapStore } from "@/stores/map-store";
import { useUIStore } from "@/stores/ui-store";

export function WatchlistSection() {
  const items = useWatchlistStore((s) => s.items);
  const remove = useWatchlistStore((s) => s.remove);
  const clear = useWatchlistStore((s) => s.clear);
  const flyTo = useMapStore((s) => s.flyTo);
  const setSelectedParcelId = useMapStore((s) => s.setSelectedParcelId);
  const setSelectedArea = useMapStore((s) => s.setSelectedArea);
  const setRightPanelOpen = useUIStore((s) => s.setRightPanelOpen);

  if (items.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] uppercase tracking-wider text-fg-muted">
          {items.length} parsel
        </span>
        <button
          type="button"
          onClick={() => clear()}
          className="text-[11px] text-fg-muted hover:text-status-error transition-colors inline-flex items-center gap-1"
        >
          <Trash2 className="h-3 w-3" />
          Tümünü Temizle
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <ParcelCard
            key={item.id}
            parcel={{
              id: item.id,
              ada: item.ada,
              parsel: item.parsel,
              il: item.il,
              ilce: item.ilce,
              mahalle: item.mahalle,
              yuzolcumuM2: item.yuzolcumuM2,
              zoningType: item.zoningType as never
            }}
            onClick={() => {
              setSelectedArea(null);
              flyTo({ center: item.centroid, zoom: 16, parcelId: item.id });
              setSelectedParcelId(item.id);
              setRightPanelOpen(true);
            }}
            onRemove={() => remove(item.id)}
          />
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-md border border-dashed border-border-subtle bg-surface-1/40 px-3 py-5 text-center">
      <Star className="mx-auto h-5 w-5 text-fg-muted/70" />
      <p className="mt-2 text-xs text-fg-secondary">
        Takip ettiğiniz parsel yok.
      </p>
      <p className="mt-1 text-[11px] text-fg-muted leading-relaxed">
        Bir parsel seçip sağ paneldeki <span className="text-fg-secondary font-medium">Watchlist&apos;e Ekle</span> ile listeyi başlatın.
      </p>
    </div>
  );
}
