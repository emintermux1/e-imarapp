import { DEMO_PARCEL_CLUSTERS } from "./parcel-seeds";

export type ActivePlanType = "Nazım İmar Planı" | "Uygulama İmar Planı";

export interface ActivePlanFeature {
  id: string;
  pin: string;
  title: string;
  planType: ActivePlanType;
  province: string;
  district: string;
  registeredAt: string;
  center: [number, number];
}

const TITLE_SUFFIXES = [
  "Revizyon Nazım İmar Planı",
  "1/1000 Ölçekli Uygulama İmar Planı",
  "Merkez Mahallesi İlave ve Revizyon İmar Planı",
  "Kentsel Çalışma Alanı Amaçlı Uygulama İmar Planı",
  "Koruma Amaçlı Nazım İmar Planı Değişikliği",
  "Sanayi Alanı Amaçlı Uygulama İmar Planı"
] as const;

export const ACTIVE_PLANS: ActivePlanFeature[] = DEMO_PARCEL_CLUSTERS.slice(0, 44).map(
  (cluster, index) => {
    const isNazim = index % 3 === 0;
    const day = String(1 + (index % 27)).padStart(2, "0");
    const month = String(1 + (index % 9)).padStart(2, "0");
    const pinPrefix = isNazim ? "NİP" : "UİP";
    const offsetLng = ((index % 5) - 2) * 0.028;
    const offsetLat = ((index % 4) - 1.5) * 0.018;

    return {
      id: `yururlukte-${cluster.id}`,
      pin: `${pinPrefix}-${cluster.plaka}${cluster.ilceCode.charCodeAt(0)}${String(
        140000 + index * 731
      ).slice(-6)}`,
      title: `${cluster.ilce} ${cluster.mahalle} ${TITLE_SUFFIXES[index % TITLE_SUFFIXES.length]}`,
      planType: isNazim ? "Nazım İmar Planı" : "Uygulama İmar Planı",
      province: cluster.il,
      district: cluster.ilce,
      registeredAt: `2026-${month}-${day} ${String(9 + (index % 8)).padStart(2, "0")}:${String(
        (index * 7) % 60
      ).padStart(2, "0")}`,
      center: [cluster.center[0] + offsetLng, cluster.center[1] + offsetLat]
    };
  }
);

export function getActivePlanCollection(): GeoJSON.FeatureCollection<
  GeoJSON.Point,
  ActivePlanFeature
> {
  return {
    type: "FeatureCollection",
    features: ACTIVE_PLANS.map((plan, index) => ({
      type: "Feature",
      id: index + 1,
      properties: plan,
      geometry: {
        type: "Point",
        coordinates: plan.center
      }
    }))
  };
}

export function activePlansInBounds(bounds: {
  west: number;
  south: number;
  east: number;
  north: number;
}) {
  return ACTIVE_PLANS.filter((plan) => {
    const [lng, lat] = plan.center;
    return (
      lng >= bounds.west &&
      lng <= bounds.east &&
      lat >= bounds.south &&
      lat <= bounds.north
    );
  });
}
