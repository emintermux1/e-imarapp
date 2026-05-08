"use client";

import { useMemo } from "react";
import { getParcelById } from "@/data/parcels";

export function useParcel(id: string | null | undefined) {
  return useMemo(() => {
    if (!id) return null;
    return getParcelById(id) ?? null;
  }, [id]);
}
