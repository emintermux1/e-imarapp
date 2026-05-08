"use client";

import { useMemo } from "react";
import { getAllParcels, slugify } from "@/data/parcels";
import { BELEDIYE_LIST } from "@/data/belediye";
import { useFilterStore } from "@/stores/filter-store";
import type { ParcelFeature } from "@/types/parcel";

export function useParcelFilters() {
  const filters = useFilterStore((s) => s.parcelFilters);

  return useMemo(() => {
    const all = getAllParcels();
    const hasActiveFilters =
      filters.belediyeler.length > 0 ||
      filters.planTipi.length > 0 ||
      filters.durum.length > 0 ||
      filters.zoning.length > 0 ||
      filters.yapilasma.length > 0;
    const matched = all.filter((parcel) => matchesParcel(parcel, filters));
    return {
      hasActiveFilters,
      totalCount: all.length,
      filteredCount: matched.length,
      filteredMapIds: matched.map((parcel) => parcel.properties.mapId)
    };
  }, [filters]);
}

function matchesParcel(
  parcel: ParcelFeature,
  filters: ReturnType<typeof useFilterStore.getState>["parcelFilters"]
) {
  const p = parcel.properties;
  if (filters.zoning.length > 0 && !filters.zoning.includes(p.zoningType)) {
    return false;
  }
  if (
    filters.yapilasma.length > 0 &&
    !filters.yapilasma.includes(p.yapilasmaSekli)
  ) {
    return false;
  }
  if (filters.durum.length > 0) {
    const status = p.aski?.durum ?? "yok";
    if (!filters.durum.includes(status)) return false;
  }
  if (filters.planTipi.length > 0) {
    const haystack = `${p.planAdi} ${p.planScale ?? ""} ${p.planStatus ?? ""}`;
    const matched = filters.planTipi.some((tip) =>
      haystack.toLocaleLowerCase("tr-TR").includes(tip.toLocaleLowerCase("tr-TR"))
    );
    if (!matched) return false;
  }
  if (filters.belediyeler.length > 0) {
    const ilceSlug = slugify(p.ilce);
    const ilSlug = slugify(p.il);
    const matched = filters.belediyeler.some((belediyeId) => {
      const record = BELEDIYE_LIST.find((item) => item.id === belediyeId);
      if (!record) return false;
      if (belediyeId.endsWith("bb")) return record.ilSlug === ilSlug;
      return belediyeId === ilceSlug || record.ilSlug === ilSlug;
    });
    if (!matched) return false;
  }
  return true;
}
