export type LngLatTuple = [number, number];

const EARTH_RADIUS_M = 6_371_008.8;
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

export function haversineDistanceMeters(a: LngLatTuple, b: LngLatTuple): number {
  const lat1 = a[1] * DEG_TO_RAD;
  const lat2 = b[1] * DEG_TO_RAD;
  const dLat = (b[1] - a[1]) * DEG_TO_RAD;
  const dLng = (b[0] - a[0]) * DEG_TO_RAD;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function pathDistanceMeters(points: LngLatTuple[]): number {
  return points.reduce((sum, point, index) => {
    if (index === 0) return 0;
    return sum + haversineDistanceMeters(points[index - 1], point);
  }, 0);
}

export function polygonAreaSquareMeters(points: LngLatTuple[]): number {
  if (points.length < 3) return 0;
  const closed = closeRing(points);
  let area = 0;
  for (let i = 0; i < closed.length - 1; i += 1) {
    const [lng1, lat1] = closed[i];
    const [lng2, lat2] = closed[i + 1];
    area += (lng2 - lng1) * DEG_TO_RAD * (2 + Math.sin(lat1 * DEG_TO_RAD) + Math.sin(lat2 * DEG_TO_RAD));
  }
  return Math.abs(area * EARTH_RADIUS_M * EARTH_RADIUS_M / 2);
}

export function radiusAreaSquareMeters(radiusMeters: number): number {
  return Math.PI * radiusMeters * radiusMeters;
}

export function circlePolygon(center: LngLatTuple, radiusMeters: number, steps = 72): LngLatTuple[] {
  const angularDistance = radiusMeters / EARTH_RADIUS_M;
  const lat1 = center[1] * DEG_TO_RAD;
  const lng1 = center[0] * DEG_TO_RAD;
  const ring: LngLatTuple[] = [];

  for (let i = 0; i <= steps; i += 1) {
    const bearing = (i / steps) * 2 * Math.PI;
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(angularDistance) +
      Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing)
    );
    const lng2 = lng1 + Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
      Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2)
    );
    ring.push([normalizeLongitude(lng2 * RAD_TO_DEG), lat2 * RAD_TO_DEG]);
  }

  return ring;
}

export function formatMetricDistance(meters: number): string {
  if (!Number.isFinite(meters)) return "—";
  if (meters >= 1000) return `${(meters / 1000).toLocaleString("tr-TR", { maximumFractionDigits: 2 })} km`;
  return `${meters.toLocaleString("tr-TR", { maximumFractionDigits: 1 })} m`;
}

export function formatMetricArea(squareMeters: number): string {
  if (!Number.isFinite(squareMeters)) return "—";
  if (squareMeters >= 1_000_000) return `${(squareMeters / 1_000_000).toLocaleString("tr-TR", { maximumFractionDigits: 2 })} km²`;
  return `${squareMeters.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} m²`;
}

export function closeRing(points: LngLatTuple[]): LngLatTuple[] {
  if (points.length === 0) return [];
  const first = points[0];
  const last = points[points.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) return points;
  return [...points, first];
}

function normalizeLongitude(lng: number): number {
  return ((lng + 540) % 360) - 180;
}
