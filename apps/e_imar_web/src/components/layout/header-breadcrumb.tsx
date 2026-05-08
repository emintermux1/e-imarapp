"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";
import { useMapStore } from "@/stores/map-store";
import { useParcel } from "@/hooks/use-parcel";
import { adaParselText } from "@/lib/format";

export function HeaderBreadcrumb() {
  const selectedId = useMapStore((s) => s.selectedParcelId);
  const parcel = useParcel(selectedId);

  const parts = parcel
    ? [
        parcel.properties.il,
        parcel.properties.ilce,
        parcel.properties.mahalle,
        adaParselText(parcel.properties.ada, parcel.properties.parsel)
      ]
    : ["Türkiye", "Tüm Parseller"];

  return (
    <nav
      aria-label="Yer hiyerarşisi"
      className="hidden md:flex items-center gap-1 text-xs text-fg-muted min-w-0"
    >
      {parts.map((p, i) => (
        <React.Fragment key={`${p}-${i}`}>
          {i > 0 && <ChevronRight className="h-3 w-3 text-fg-muted/70 shrink-0" />}
          <span
            className={
              i === parts.length - 1
                ? "text-fg-primary font-medium tabular-nums truncate max-w-[140px]"
                : "text-fg-secondary truncate max-w-[120px]"
            }
            title={p}
          >
            {p}
          </span>
        </React.Fragment>
      ))}
    </nav>
  );
}
