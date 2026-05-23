"use client";

import { useMemo } from "react";
import { getParcelById } from "@/data/parcels";
import { useBackendParcelStore } from "@/stores/backend-parcel-store";

export function useParcel(id: string | null | undefined) {
  const getBackendFeature = useBackendParcelStore((s) => s.getFeature);
  return useMemo(() => {
    if (!id) return null;
    return getParcelById(id) ?? getBackendFeature(id) ?? null;
  }, [getBackendFeature, id]);
}
