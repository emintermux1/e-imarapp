"use client";

import * as React from "react";
import { useMapStore } from "@/stores/map-store";
import { useUIStore } from "@/stores/ui-store";

interface BootstrapProps {
  parcelId: string;
  centroid?: [number, number];
}

export function ParcelDeepLinkBootstrap({ parcelId, centroid }: BootstrapProps) {
  const setSelectedParcelId = useMapStore((s) => s.setSelectedParcelId);
  const flyTo = useMapStore((s) => s.flyTo);
  const setRightPanelOpen = useUIStore((s) => s.setRightPanelOpen);

  React.useEffect(() => {
    setSelectedParcelId(parcelId);
    setRightPanelOpen(true);
    if (centroid) {
      // Defer to next tick to give map time to mount
      const t = setTimeout(() => {
        flyTo({ center: centroid, zoom: 17, parcelId });
      }, 400);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parcelId]);
  return null;
}
