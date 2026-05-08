"use client";

import * as React from "react";
import { Bookmark } from "lucide-react";
import { ZoningBadge } from "@/components/gis/zoning-badge";
import { getParcelSourceMetadata } from "@/data/parcels";

interface SavedQuery {
  id: string;
  name: string;
  filterDescription: string;
  zoningHints: Array<"Konut" | "Ticaret" | "Karma">;
  count: number;
}

const metadata = getParcelSourceMetadata();

const SAVED: SavedQuery[] = [
  {
    id: "q-istanbul-karma-ticaret",
    name: "İstanbul · Karma/Ticaret yoğunluk",
    filterDescription: "Levent · Şişli · Ataşehir · ticaret + karma aksları",
    zoningHints: ["Ticaret", "Karma"],
    count: 620
  },
  {
    id: "q-ankara-aski-planlar",
    name: "Ankara · Askıdaki planlar",
    filterDescription: "Çankaya/Çukurambar · aktif demo askı kayıtları",
    zoningHints: ["Konut", "Karma"],
    count: 74
  },
  {
    id: "q-izmir-kiyi-ticaret",
    name: "İzmir · Kıyı ticaret parselleri",
    filterDescription: "Alsancak · Bostanlı · Bayraklı kıyı bandı",
    zoningHints: ["Ticaret", "Karma"],
    count: 210
  },
  {
    id: "q-marmara-risk-donusum",
    name: "Marmara · Risk + dönüşüm izleme",
    filterDescription: "İstanbul/Bursa/Kocaeli · deprem riski yüksek demo kümeler",
    zoningHints: ["Konut", "Karma"],
    count: 480
  }
];

export function SavedQueriesSection() {
  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-md border border-border-subtle bg-surface-1 px-3 py-2 text-[11px] text-fg-secondary">
        <span className="font-medium text-fg-primary tabular-nums">{metadata.featureCount.toLocaleString("tr-TR")}</span>{" "}
        sentetik parsel üzerinden yoğun demo sorgular
      </div>
      {SAVED.map((q) => (
        <button
          key={q.id}
          type="button"
          className="text-left rounded-md border border-border-subtle bg-surface-2 hover:bg-surface-1 transition-colors px-3 py-2.5"
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
            <span className="inline-flex h-6 min-w-[34px] items-center justify-center rounded-sm border border-border-subtle bg-surface-1 px-1.5 text-[11px] tabular-nums text-fg-secondary">
              {q.count}
            </span>
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
