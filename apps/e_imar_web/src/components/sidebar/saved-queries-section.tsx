"use client";

import * as React from "react";
import { Bookmark } from "lucide-react";
import { ZoningBadge } from "@/components/gis/zoning-badge";

interface SavedQuery {
  id: string;
  name: string;
  filterDescription: string;
  zoningHints: Array<"Konut" | "Ticaret" | "Karma">;
  count: number;
}

const SAVED: SavedQuery[] = [
  {
    id: "q-yatirim-istanbul",
    name: "İstanbul · Yüksek Yatırım Skoru",
    filterDescription: "Yatırım Skoru ≥ 75 · Konut/Karma · İstanbul",
    zoningHints: ["Konut", "Karma"],
    count: 12
  },
  {
    id: "q-aski-besiktas",
    name: "Beşiktaş · Askıdaki Planlar",
    filterDescription: "Askı: Açık · Plan tipi: UİP · Beşiktaş",
    zoningHints: ["Konut", "Ticaret"],
    count: 4
  },
  {
    id: "q-ankara-cukurambar",
    name: "Çukurambar · Karma Bölgeler",
    filterDescription: "Zoning: Karma · TAKS ≥ 0.35 · Çankaya",
    zoningHints: ["Karma"],
    count: 6
  }
];

export function SavedQueriesSection() {
  return (
    <div className="flex flex-col gap-2">
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
            <span className="inline-flex h-6 min-w-[28px] items-center justify-center rounded-sm border border-border-subtle bg-surface-1 px-1.5 text-[11px] tabular-nums text-fg-secondary">
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
