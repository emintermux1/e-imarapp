"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";
import { getLocationTargetForParcel, kindLabel, type LocationLevel, type LocationTarget } from "@/data/location-navigation";
import { useParcel } from "@/hooks/use-parcel";
import { adaParselText } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useMapStore } from "@/stores/map-store";
import { useUIStore } from "@/stores/ui-store";

interface BreadcrumbPart {
  key: string;
  label: string;
  level?: LocationLevel;
  target?: LocationTarget;
}

export function HeaderBreadcrumb() {
  const selectedId = useMapStore((s) => s.selectedParcelId);
  const setSelectedParcelId = useMapStore((s) => s.setSelectedParcelId);
  const flyTo = useMapStore((s) => s.flyTo);
  const setRightPanelOpen = useUIStore((s) => s.setRightPanelOpen);
  const parcel = useParcel(selectedId);

  const parts = React.useMemo<BreadcrumbPart[]>(() => {
    if (!parcel) {
      return [
        { key: "turkiye", label: "Türkiye" },
        { key: "tum-parseller", label: "Tüm Parseller" }
      ];
    }

    const p = parcel.properties;
    return [
      {
        key: "il",
        label: p.il,
        level: "il",
        target: getLocationTargetForParcel(parcel, "il")
      },
      {
        key: "ilce",
        label: p.ilce,
        level: "ilce",
        target: getLocationTargetForParcel(parcel, "ilce")
      },
      {
        key: "mahalle",
        label: p.mahalle,
        level: "mahalle",
        target: getLocationTargetForParcel(parcel, "mahalle")
      },
      {
        key: "parcel",
        label: adaParselText(p.ada, p.parsel),
        level: "parcel",
        target: getLocationTargetForParcel(parcel, "parcel")
      }
    ];
  }, [parcel]);

  function handleClick(part: BreadcrumbPart) {
    if (!part.target || !part.level) return;
    if (part.level === "parcel") {
      if (part.target.parcelId) setSelectedParcelId(part.target.parcelId);
      setRightPanelOpen(true);
      flyTo({ center: part.target.center, zoom: part.target.zoom, parcelId: part.target.parcelId });
      return;
    }
    setSelectedParcelId(null);
    setRightPanelOpen(false);
    flyTo({ center: part.target.center, zoom: part.target.zoom });
  }

  return (
    <nav
      aria-label="Yer hiyerarşisi"
      className="hidden md:flex items-center gap-1 text-xs text-fg-muted min-w-0"
    >
      {parts.map((part, i) => (
        <React.Fragment key={part.key}>
          {i > 0 && <ChevronRight className="h-3 w-3 text-fg-muted/70 shrink-0" />}
          {part.target && part.level ? (
            <button
              type="button"
              onClick={() => handleClick(part)}
              className={cn(
                "rounded-sm px-1 py-0.5 truncate transition-colors cursor-pointer",
                "hover:bg-surface-2 hover:text-fg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]",
                i === parts.length - 1
                  ? "text-fg-primary font-medium tabular-nums max-w-[140px]"
                  : "text-fg-secondary max-w-[120px]"
              )}
              aria-label={getAriaLabel(part)}
              title={getTitle(part)}
            >
              {part.label}
            </button>
          ) : (
            <span
              className={
                i === parts.length - 1
                  ? "text-fg-primary font-medium tabular-nums truncate max-w-[140px]"
                  : "text-fg-secondary truncate max-w-[120px]"
              }
              title={part.label}
            >
              {part.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

function getAriaLabel(part: BreadcrumbPart) {
  if (part.level === "il") return `${part.label} iline yakınlaş`;
  if (part.level === "ilce") return `${part.label} ilçesine yakınlaş`;
  if (part.level === "mahalle") return `${part.label} mahallesine yakınlaş`;
  return `${part.label} parseline dön`;
}

function getTitle(part: BreadcrumbPart) {
  if (!part.target) return part.label;
  return `Haritada ${part.label} ${kindLabel(part.target.kind).toLocaleLowerCase("tr-TR")} konumuna git`;
}
