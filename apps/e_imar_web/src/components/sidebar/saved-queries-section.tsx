"use client";

import * as React from "react";
import { Bookmark } from "lucide-react";
import { ZoningBadge } from "@/components/gis/zoning-badge";
import { getParcelSourceMetadata } from "@/data/parcels";
import type { ZoningType } from "@/types/parcel";

interface SavedQuery {
  id: string;
  name: string;
  filterDescription: string;
  zoningHints: ZoningType[];
  count: number;
}

const metadata = getParcelSourceMetadata();

const SAVED: SavedQuery[] = [
  {
    id: "q-istanbul-tick-mia",
    name: "İstanbul · TİCK + MİA parselleri",
    filterDescription: "Levent · Şişli · Ataşehir · 1/1000 UİP ticaret aksları",
    zoningHints: ["Ticaret", "Karma"],
    count: 620
  },
  {
    id: "q-kiyi-koruma-kisit",
    name: "Kıyı / koruma kısıtı olan alanlar",
    filterDescription: "Kıyı kenar çizgisi · sit etkileşim · dere koruma bandı",
    zoningHints: ["Yesil", "Turizm"],
    count: 246
  },
  {
    id: "q-uip-revizyon",
    name: "1/1000 Uygulama Planı · Revizyon",
    filterDescription: "Askı/revizyon durumundaki sentetik uygulama plan kayıtları",
    zoningHints: ["Konut", "Karma"],
    count: 174
  },
  {
    id: "q-donusum-rezerv",
    name: "Kentsel dönüşüm / rezerv alanlar",
    filterDescription: "Marmara deprem riski · rezerv yapı alanı demo izlemesi",
    zoningHints: ["Konut", "Karma"],
    count: 480
  }
];

export function SavedQueriesSection() {
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
