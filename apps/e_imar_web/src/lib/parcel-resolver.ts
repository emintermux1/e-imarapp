import { getParcelById } from "@/data/parcels";
import { useBackendParcelStore } from "@/stores/backend-parcel-store";
import type { ParcelFeature } from "@/types/parcel";

export function resolveParcelFeature(
  id: string | null | undefined,
): ParcelFeature | null {
  if (!id) return null;
  return getParcelById(id) ?? useBackendParcelStore.getState().getFeature(id);
}

export function resolveParcelProperties(id: string | null | undefined) {
  return resolveParcelFeature(id)?.properties ?? null;
}
