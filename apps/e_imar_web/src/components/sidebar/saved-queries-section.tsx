"use client";

import * as React from "react";
import { ArrowRight, Bookmark } from "lucide-react";
import { ZoningBadge } from "@/components/gis/zoning-badge";
import {
  buildFlyTargetFromLocationTarget,
  findBestLocationTarget,
  type LocationTargetQuery
} from "@/data/location-navigation";
import { getParcelSourceMetadata } from "@/data/parcels";
import { useMapStore } from "@/stores/map-store";
import { useUIStore } from "@/stores/ui-store";
import type { ZoningType } from "@/types/parcel";
import { cn } from "@/lib/utils";

interface SavedQuery {
  id: string;
  name: string;
  filterDescription: string;
  zoningHints: ZoningType[];
  count: number;
  location: LocationTargetQuery;
  hoverCopy: string;
}

const metadata = getParcelSourceMetadata();

const SAVED: SavedQuery[] = [
  {
    id: "q-istanbul-tick-mia",
    name: "İstanbul · TİCK + MİA parselleri",
    filterDescription: "Levent · Şişli · Ataşehir · 1/1000 UİP ticaret aksları",
    zoningHints: ["Ticaret", "Karma"],
    count: 620,
    location: { il: "İstanbul", ilce: "Beşiktaş", mahalle: "Levent" },
    hoverCopy: "Haritada bu sorgu alanına git"
  },
  {
    id: "q-kiyi-koruma-kisit",
    name: "Kıyı / koruma kısıtı olan alanlar",
    filterDescription: "Kıyı kenar çizgisi · sit etkileşim · dere koruma bandı",
    zoningHints: ["Yesil", "Turizm"],
    count: 246,
    location: { il: "İzmir", ilce: "Balçova", mahalle: "İnciraltı" },
    hoverCopy: "Haritada kıyı-koruma bandına git"
  },
  {
    id: "q-uip-revizyon",
    name: "1/1000 Uygulama Planı · Revizyon",
    filterDescription: "Askı/revizyon durumundaki sentetik uygulama plan kayıtları",
    zoningHints: ["Konut", "Karma"],
    count: 174,
    location: { il: "Ankara", ilce: "Çankaya", mahalle: "Kavaklıdere" },
    hoverCopy: "Haritada revizyon yoğunluğuna git"
  },
  {
    id: "q-donusum-rezerv",
    name: "Kentsel dönüşüm / rezerv alanlar",
    filterDescription: "Marmara deprem riski · rezerv yapı alanı demo izlemesi",
    zoningHints: ["Konut", "Karma"],
    count: 480,
    location: { il: "İstanbul", ilce: "Başakşehir", mahalle: "Başak" },
    hoverCopy: "Haritada dönüşüm alanına git"
  }
];

export function SavedQueriesSection() {
  const flyTo = useMapStore((s) => s.flyTo);
  const setSelectedParcelId = useMapStore((s) => s.setSelectedParcelId);
  const setRightPanelOpen = useUIStore((s) => s.setRightPanelOpen);

  function openQuery(query: SavedQuery) {
    const target = findBestLocationTarget(query.location);
    if (!target) return;
    setSelectedParcelId(null);
    setRightPanelOpen(false);
    flyTo(buildFlyTargetFromLocationTarget(target));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-md border border-border-subtle bg-surface-1 px-3 py-2 text-[11px] text-fg-secondary">
        <span className="font-medium text-fg-primary tabular-nums">{metadata.featureCount.toLocaleString("tr-TR")}</span>{" "}
        sentetik Türkiye demo parseli · resmi TKGM/belediye kaydı değildir
      </div>
      {SAVED.map((q) => (
        <button
          key={q.id}
          type="button"
          onClick={() => openQuery(q)}
          title={q.hoverCopy}
          className="group text-left rounded-md border border-border-subtle bg-surface-2 hover:bg-surface-1 transition-colors px-3 py-2.5"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-medium text-fg-primary truncate">
                {q.name}
              </div>
              <div className="text-[11px] text-fg-muted truncate">
                {q.filterDescription}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="inline-flex h-6 min-w-[34px] items-center justify-center rounded-sm border border-border-subtle bg-surface-1 px-1.5 text-[11px] tabular-nums text-fg-secondary">
                {q.count}
              </span>
              <span className={cn(
                "inline-flex h-6 items-center gap-1 rounded-sm border border-border-subtle bg-surface-1 px-1.5 text-[10px] uppercase tracking-wider text-fg-secondary",
                "opacity-80 group-hover:opacity-100"
              )}>
                Aç
                <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            {q.zoningHints.map((z) => (
              <ZoningBadge key={z} type={z} size="xs" />
            ))}
          </div>
        </button>
      ))}
      <button
        type="button"
        className="mt-1 inline-flex items-center justify-center gap-1.5 h-8 rounded-md border border-dashed border-border-strong bg-bg/0 text-[11px] text-fg-secondary hover:bg-surface-1 transition-colors"
      >
        <Bookmark className="h-3.5 w-3.5" />
        Yeni Sorguyu Kaydet
      </button>
    </div>
  );
}
