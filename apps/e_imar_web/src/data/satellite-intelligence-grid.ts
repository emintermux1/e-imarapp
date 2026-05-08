import { DEMO_PARCEL_CLUSTERS } from "./parcel-seeds";

interface SatelliteSignalProps {
  score: number;
  confidence: number;
  trend: "up" | "down" | "stable";
  area: string;
}

function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

function makeGrid(): GeoJSON.FeatureCollection<GeoJSON.Point, SatelliteSignalProps> {
  const features: GeoJSON.Feature<GeoJSON.Point, SatelliteSignalProps>[] = [];
  const pointsPerCluster = 14;

  for (const cluster of DEMO_PARCEL_CLUSTERS) {
    for (let i = 0; i < pointsPerCluster; i += 1) {
      const hash = seeded(`${cluster.id}:${i}`);
      const dx = ((hash % 2000) / 2000 - 0.5) * 0.18;
      const dy = (((hash >> 6) % 2000) / 2000 - 0.5) * 0.14;
      const scoreBase = 28 + (hash % 67);
      const confidence = 58 + ((hash >> 5) % 41);
      const trendRaw = (hash >> 9) % 3;
      const trend: SatelliteSignalProps["trend"] =
        trendRaw === 0 ? "up" : trendRaw === 1 ? "stable" : "down";
      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [cluster.center[0] + dx, cluster.center[1] + dy]
        },
        properties: {
          score: Math.min(100, Math.max(0, scoreBase)),
          confidence,
          trend,
          area: `${cluster.ilce} / ${cluster.il}`
        }
      });
    }
  }

  return { type: "FeatureCollection", features };
}

let cached: GeoJSON.FeatureCollection<GeoJSON.Point, SatelliteSignalProps> | null =
  null;

export function getSatelliteIntelligenceGridCollection() {
  if (!cached) cached = makeGrid();
  return cached;
}

export const SATELLITE_INTELLIGENCE_SOURCE_ID = "satellite-intelligence-grid";
