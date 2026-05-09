"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchActiveAski,
  fetchActiveAskiGeoJSON,
  fetchSourceDetail,
  fetchSourceHealth,
  fetchSources,
} from "@/lib/api/eimar";

export function useSources() {
  return useQuery({ queryKey: ["eimar-sources"], queryFn: fetchSources, staleTime: 5 * 60_000 });
}

export function useSourceHealth() {
  return useQuery({ queryKey: ["eimar-source-health"], queryFn: fetchSourceHealth, staleTime: 60_000, refetchInterval: 60_000 });
}

export function useSourceDetail(sourceId: string | null) {
  return useQuery({
    queryKey: ["eimar-source-detail", sourceId],
    queryFn: () => fetchSourceDetail(sourceId as string),
    enabled: Boolean(sourceId),
    staleTime: 60_000,
  });
}

export function useActiveAski() {
  return useQuery({ queryKey: ["eimar-aski-active"], queryFn: fetchActiveAski, staleTime: 2 * 60_000, refetchInterval: 2 * 60_000 });
}

export function useActiveAskiGeoJSON() {
  return useQuery({ queryKey: ["eimar-aski-geojson"], queryFn: fetchActiveAskiGeoJSON, staleTime: 2 * 60_000, refetchInterval: 2 * 60_000 });
}
