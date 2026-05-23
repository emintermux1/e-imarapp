"use client";

import * as React from "react";
import { TimelinePanel } from "@/components/gis/timeline-panel";
import { PlanChangeCard } from "@/components/gis/plan-change-card";
import { SatelliteCompareSlider } from "@/components/gis/satellite-compare-slider";
import { ThreeDPreviewPanel } from "@/components/gis/three-d-preview-panel";
import { Button } from "@/components/ui/button";
import { History, Box } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { useMapStore } from "@/stores/map-store";
import { getPlanChanges } from "@/data/historical-snapshots";
import type { ParcelProps } from "@/types/parcel";
import { cn } from "@/lib/utils";

interface SectionGecmisProps {
  parcel: ParcelProps;
}

export function SectionGecmis({ parcel }: SectionGecmisProps) {
  const setTimelineYear = useUIStore((s) => s.setTimelineYear);
  const timelineYear = useUIStore((s) => s.timelineYear);
  const setMapMode = useUIStore((s) => s.setMapMode);
  const setSelectedParcelId = useMapStore((s) => s.setSelectedParcelId);
  const setSelectedArea = useMapStore((s) => s.setSelectedArea);
  const flyTo = useMapStore((s) => s.flyTo);

  const entries = React.useMemo(() => getPlanChanges(parcel.id), [parcel.id]);

  const recentSummary = entries.length
    ? `${entries[0].yil} → ${entries[entries.length - 1].yil} arası ${entries.length} kayıt`
    : "Bu parsel için kayıtlı değişiklik bulunmuyor.";

  function openInTimeline(year: number) {
    setTimelineYear(year);
    setSelectedArea(null);
    setSelectedParcelId(parcel.id);
    if (parcel.centroid) {
      flyTo({ center: parcel.centroid, zoom: 16 });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <TimelinePanel summary={recentSummary} />

      {/* Vertical timeline */}
      <div className="relative">
        <span
          aria-hidden
          className="absolute left-[7px] top-1 bottom-1 w-px bg-border-subtle"
        />
        <ul className="flex flex-col gap-3">
          {entries.map((entry) => {
            const matchesYear =
              timelineYear != null && timelineYear === entry.yil;
            return (
              <li key={entry.tarih} className="relative pl-5">
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-[3px] top-3.5 h-2 w-2 rounded-full bg-surface-2 border",
                    matchesYear ? "border-brand-red" : "border-border-strong"
                  )}
                />
                <PlanChangeCard
                  entry={entry}
                  highlighted={matchesYear}
                  onOpenInTimeline={openInTimeline}
                />
              </li>
            );
          })}
        </ul>
      </div>

      <SatelliteCompareSlider />
      <ThreeDPreviewPanel parcel={parcel} />

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => openInTimeline(2020)}
        >
          <History className="h-4 w-4" />
          Zaman Çizelgesi'ni Aç
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMapMode("3d")}
          className="border border-border-subtle"
        >
          <Box className="h-4 w-4" />
          3D Modunda Aç
        </Button>
      </div>
    </div>
  );
}
