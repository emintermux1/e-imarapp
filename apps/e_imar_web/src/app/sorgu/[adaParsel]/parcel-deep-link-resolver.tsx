"use client";

import * as React from "react";
import { findParcelByAdaParselSlug } from "@/data/parcels";
import { lookupBackendParcel, getBackendParcelGeometry } from "@/lib/api/backend-client";
import { backendParcelId } from "@/lib/api/parcel-normalizer";
import { useBackendParcelStore } from "@/stores/backend-parcel-store";
import { useMapStore } from "@/stores/map-store";
import { useUIStore } from "@/stores/ui-store";
import { geometryCentroid } from "@/lib/api/parcel-normalizer";

interface ParcelDeepLinkResolverProps {
  adaParsel: string;
  il?: string;
  ilce?: string;
}

function parseAdaParselSlug(slug: string) {
  const match = slug.match(/^(\d+)[-/](\d+)$/);
  if (!match) return null;
  return { ada: match[1], parsel: match[2] };
}

export function ParcelDeepLinkResolver({
  adaParsel,
  il,
  ilce,
}: ParcelDeepLinkResolverProps) {
  const setSelectedParcelId = useMapStore((s) => s.setSelectedParcelId);
  const setSelectedArea = useMapStore((s) => s.setSelectedArea);
  const flyTo = useMapStore((s) => s.flyTo);
  const setRightPanelOpen = useUIStore((s) => s.setRightPanelOpen);
  const upsertParcel = useBackendParcelStore((s) => s.upsertParcel);

  React.useEffect(() => {
    let cancelled = false;

    async function resolve() {
      setSelectedArea(null);
      const demo = findParcelByAdaParselSlug(adaParsel, il, ilce);
      if (demo) {
        setSelectedParcelId(demo.properties.id);
        setRightPanelOpen(true);
        if (demo.properties.centroid) {
          setTimeout(() => {
            flyTo({
              center: demo.properties.centroid!,
              zoom: 17,
              parcelId: demo.properties.id,
            });
          }, 400);
        }
        return;
      }

      const parsed = parseAdaParselSlug(adaParsel);
      if (!parsed) return;

      try {
        const parcels = await lookupBackendParcel({
          ada: parsed.ada,
          parsel: parsed.parsel,
          il,
          ilce,
        });
        const parcel = Array.isArray(parcels) ? parcels[0] : null;
        if (cancelled || !parcel?.id) return;

        let hydrated = parcel;
        if (!parcel.geometri) {
          try {
            const geometry = await getBackendParcelGeometry(parcel.id);
            if (geometry) hydrated = { ...parcel, geometri: geometry };
          } catch {
            // Geometry optional for flyTo centroid fallback.
          }
        }

        upsertParcel(hydrated);
        const parcelId = backendParcelId(hydrated.id);
        const centroid = geometryCentroid(hydrated.geometri);
        setSelectedParcelId(parcelId);
        setRightPanelOpen(true);
        if (centroid) {
          setTimeout(() => {
            flyTo({ center: centroid, zoom: 17, parcelId });
          }, 400);
        }
      } catch {
        // Deep link stays on map shell; user can search manually.
      }
    }

    void resolve();
    return () => {
      cancelled = true;
    };
  }, [
    adaParsel,
    flyTo,
    il,
    ilce,
    setRightPanelOpen,
    setSelectedArea,
    setSelectedParcelId,
    upsertParcel,
  ]);

  return null;
}
