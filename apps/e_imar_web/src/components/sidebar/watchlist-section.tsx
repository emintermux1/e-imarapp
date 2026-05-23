"use client";

import * as React from "react";
import { Star, Trash2, ShieldAlert } from "lucide-react";
import { ParcelCard } from "@/components/gis/parcel-card";
import { useWatchlistStore } from "@/stores/watchlist-store";
import { useMapStore } from "@/stores/map-store";
import { useUIStore } from "@/stores/ui-store";
import { ASKI_ALERT_INTENT_LABELS, DEFAULT_WATCHLIST_ALERT_INTENTS, PARSEL_ALARM_NAME, formatProvenanceBadge } from "@/lib/aski-tracking";
import { cn } from "@/lib/utils";

export function WatchlistSection() {
  const items = useWatchlistStore((s) => s.items);
  const remove = useWatchlistStore((s) => s.remove);
  const clear = useWatchlistStore((s) => s.clear);
  const toggleAlertIntent = useWatchlistStore((s) => s.toggleAlertIntent);
  const flyTo = useMapStore((s) => s.flyTo);
  const setSelectedParcelId = useMapStore((s) => s.setSelectedParcelId);
  const setSelectedArea = useMapStore((s) => s.setSelectedArea);
  const setRightPanelOpen = useUIStore((s) => s.setRightPanelOpen);

  if (items.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-md border border-border-subtle bg-surface-1/60 px-3 py-2 text-[11px] text-fg-secondary">
        <div className="flex items-center gap-2 text-fg-primary">
          <ShieldAlert className="h-3.5 w-3.5 text-fg-muted" />
          <span className="font-medium">{PARSEL_ALARM_NAME} yerel modda</span>
        </div>
        <p className="mt-1 leading-relaxed">
          Alarm profilleri yalnızca bu tarayıcıda saklanır. Server sync ve canlı bildirimler hazır değil; burada gördüğünüz niyet ayarları yerel alarm tercihidir.
        </p>
      </div>

      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] uppercase tracking-wider text-fg-muted">
          {items.length} {PARSEL_ALARM_NAME}
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
          <div key={item.id} className="rounded-md border border-border-subtle bg-surface-2 p-2.5">
            <ParcelCard
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
            <div className="mt-2 grid gap-2 text-[11px]">
              <div className="flex flex-wrap items-center gap-2 text-fg-secondary">
                <span className="rounded-full border border-border-subtle px-2 py-0.5 uppercase tracking-wider text-fg-muted">
                  local_only
                </span>
                <span>·</span>
                <span className="text-fg-primary">{item.ilce} / {item.il}</span>
                <span>·</span>
                <span className="text-fg-muted">Eklendi {new Date(item.addedAt).toLocaleString("tr-TR")}</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-full border border-border-subtle px-2 py-0.5 text-[10px] uppercase tracking-wider text-fg-muted">
                  {formatProvenanceBadge(item.provenance)}
                </span>
                {DEFAULT_WATCHLIST_ALERT_INTENTS.map((intent) => (
                  <button
                    key={intent}
                    type="button"
                    onClick={() => toggleAlertIntent(item.id, intent)}
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider transition-colors",
                      item.alertIntents.includes(intent)
                        ? "border-brand-blue bg-brand-blue/10 text-brand-blue"
                        : "border-border-subtle text-fg-secondary"
                    )}
                  >
                    {ASKI_ALERT_INTENT_LABELS[intent]}
                  </button>
                ))}
              </div>
            </div>
          </div>
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
        Henüz {PARSEL_ALARM_NAME} yok.
      </p>
      <p className="mt-1 text-[11px] text-fg-muted leading-relaxed">
        Bir parsel seçip sağ paneldeki <span className="text-fg-secondary font-medium">{PARSEL_ALARM_NAME}&apos;a ekle</span> ile alarm profilini başlatın.
      </p>
    </div>
  );
}
