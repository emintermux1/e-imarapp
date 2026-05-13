import type * as GeoJSON from "geojson";

export type ValidationSeverity = "info" | "warning" | "error";

export interface ValidationIssue {
  code: string;
  message: string;
  severity: ValidationSeverity;
}

export interface ValidationResult {
  issues: ValidationIssue[];
  confidenceScore: number;
  repairedGeoJson: GeoJSON.FeatureCollection;
}

type ParcelFeature = GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon, Record<string, unknown>>;

const DEFAULT_CRS = "EPSG:4326";

export function validateAndRepairGeoJson(input: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];
  const normalized = normalizeFeatureCollection(input);
  const repairedFeatures: ParcelFeature[] = [];
  const duplicateTracker = new Set<string>();

  for (const feature of normalized.features) {
    const repaired = repairFeatureGeometry(feature, issues);
    if (!repaired) continue;

    const props = repaired.properties ?? {};
    const dupKey = `${String(props.ada ?? "")}:${String(props.parsel ?? "")}:${hashGeometry(repaired.geometry.coordinates)}`;
    if (duplicateTracker.has(dupKey)) {
      issues.push({
        code: "DUPLICATE_PARCEL",
        message: "Aynı ada/parsel ve geometriye sahip mükerrer kayıt tespit edildi.",
        severity: "warning"
      });
      continue;
    }
    duplicateTracker.add(dupKey);

    const timestamp = props.updatedAt ?? props.updated_at ?? props.lastUpdate;
    if (timestamp && Number.isNaN(Date.parse(String(timestamp)))) {
      issues.push({
        code: "INVALID_TIMESTAMP",
        message: "Parsel metadata zaman damgası geçersiz formatta.",
        severity: "warning"
      });
    }

    const metaIssues = validateParcelMetadata(props);
    issues.push(...metaIssues);

    const bboxIssues = validateGeometryRoughExtent(repaired.geometry);
    issues.push(...bboxIssues);

    repairedFeatures.push(repaired);
  }

  const crs = (normalized as { crs?: { properties?: { name?: string } } }).crs?.properties?.name;
  if (crs && crs !== DEFAULT_CRS) {
    issues.push({
      code: "CRS_MISMATCH",
      message: `Beklenen CRS ${DEFAULT_CRS}, gelen veri ${crs}.`,
      severity: "error"
    });
  }

  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;
  const confidenceScore = Math.max(0, Math.min(100, 100 - errorCount * 25 - warningCount * 8));

  return {
    issues,
    confidenceScore,
    repairedGeoJson: {
      type: "FeatureCollection",
      features: repairedFeatures
    }
  };
}

function normalizeFeatureCollection(input: unknown): GeoJSON.FeatureCollection {
  if (!input || typeof input !== "object") {
    return { type: "FeatureCollection", features: [] };
  }
  const asCollection = input as GeoJSON.FeatureCollection;
  if (asCollection.type === "FeatureCollection" && Array.isArray(asCollection.features)) {
    return asCollection;
  }
  const asFeature = input as GeoJSON.Feature;
  if (asFeature.type === "Feature") {
    return { type: "FeatureCollection", features: [asFeature] };
  }
  return { type: "FeatureCollection", features: [] };
}

function repairFeatureGeometry(
  feature: GeoJSON.Feature,
  issues: ValidationIssue[]
): ParcelFeature | null {
  if (!feature.geometry) {
    issues.push({
      code: "NULL_GEOMETRY",
      message: "Boş geometriye sahip kayıt atlandı.",
      severity: "error"
    });
    return null;
  }
  if (feature.geometry.type !== "Polygon" && feature.geometry.type !== "MultiPolygon") {
    issues.push({
      code: "UNSUPPORTED_GEOMETRY",
      message: "Polygon olmayan geometri türü atlandı.",
      severity: "warning"
    });
    return null;
  }

  if (feature.geometry.type === "Polygon") {
    const repairedRingSet = feature.geometry.coordinates
      .map((ring) => repairRing(ring, issues))
      .filter((ring) => ring.length >= 4);
    if (repairedRingSet.length === 0) {
      issues.push({
        code: "INVALID_POLYGON",
        message: "Onarılamayan bozuk polygon tespit edildi.",
        severity: "error"
      });
      return null;
    }
    return {
      type: "Feature",
      id: feature.id,
      properties: feature.properties as Record<string, unknown>,
      geometry: { type: "Polygon", coordinates: repairedRingSet }
    };
  }

  const repairedMulti = feature.geometry.coordinates
    .map((poly) => poly.map((ring) => repairRing(ring, issues)).filter((ring) => ring.length >= 4))
    .filter((poly) => poly.length > 0);
  if (repairedMulti.length === 0) {
    issues.push({
      code: "INVALID_MULTIPOLYGON",
      message: "Onarılamayan multipolygon geometri tespit edildi.",
      severity: "error"
    });
    return null;
  }
  return {
    type: "Feature",
    id: feature.id,
    properties: feature.properties as Record<string, unknown>,
    geometry: { type: "MultiPolygon", coordinates: repairedMulti }
  };
}

function repairRing(
  ring: GeoJSON.Position[],
  issues: ValidationIssue[]
): GeoJSON.Position[] {
  const cleaned = ring.filter(
    (coord) =>
      Array.isArray(coord) &&
      coord.length >= 2 &&
      Number.isFinite(coord[0]) &&
      Number.isFinite(coord[1])
  );
  if (cleaned.length < 3) {
    issues.push({
      code: "MISSING_COORDINATES",
      message: "Eksik veya bozuk koordinatlara sahip ring tespit edildi.",
      severity: "error"
    });
    return [];
  }

  const first = cleaned[0];
  const last = cleaned[cleaned.length - 1];
  const isClosed = first[0] === last[0] && first[1] === last[1];
  const closed = isClosed ? cleaned : [...cleaned, [...first]];

  if (hasSelfIntersection(closed)) {
    issues.push({
      code: "SELF_INTERSECTION",
      message: "Self-intersection tespit edildi, ring koruyucu biçimde sadeleştirildi.",
      severity: "warning"
    });
    return simplifyRing(closed);
  }
  return closed;
}

function hasSelfIntersection(ring: GeoJSON.Position[]): boolean {
  for (let i = 0; i < ring.length - 1; i++) {
    const a1 = ring[i];
    const a2 = ring[i + 1];
    for (let j = i + 2; j < ring.length - 1; j++) {
      if (i === 0 && j === ring.length - 2) continue;
      const b1 = ring[j];
      const b2 = ring[j + 1];
      if (segmentsIntersect(a1, a2, b1, b2)) return true;
    }
  }
  return false;
}

function segmentsIntersect(
  p1: GeoJSON.Position,
  p2: GeoJSON.Position,
  q1: GeoJSON.Position,
  q2: GeoJSON.Position
): boolean {
  const o1 = orientation(p1, p2, q1);
  const o2 = orientation(p1, p2, q2);
  const o3 = orientation(q1, q2, p1);
  const o4 = orientation(q1, q2, p2);
  return o1 !== o2 && o3 !== o4;
}

function orientation(a: GeoJSON.Position, b: GeoJSON.Position, c: GeoJSON.Position): number {
  const v = (b[1] - a[1]) * (c[0] - b[0]) - (b[0] - a[0]) * (c[1] - b[1]);
  if (Math.abs(v) < 1e-10) return 0;
  return v > 0 ? 1 : 2;
}

function simplifyRing(ring: GeoJSON.Position[]): GeoJSON.Position[] {
  const stride = ring.length > 12 ? 2 : 1;
  const simplified = ring.filter((_, idx) => idx === 0 || idx === ring.length - 1 || idx % stride === 0);
  const head = simplified[0];
  const tail = simplified[simplified.length - 1];
  if (!head || !tail || head[0] !== tail[0] || head[1] !== tail[1]) {
    simplified.push(head);
  }
  return simplified;
}

function hashGeometry(value: unknown): string {
  try {
    return JSON.stringify(value).slice(0, 180);
  } catch {
    return "hash-error";
  }
}

/** Administrative metadata gaps — does not reject geometry; lowers audit clarity only. */
function validateParcelMetadata(props: Record<string, unknown>): ValidationIssue[] {
  const out: ValidationIssue[] = [];
  const ada = props.ada != null && String(props.ada).trim() !== "";
  const parsel = props.parsel != null && String(props.parsel).trim() !== "";
  if (!ada || !parsel) {
    out.push({
      code: "INCOMPLETE_PARCEL_ID",
      message: "Ada veya parsel alanı eksik; mükerrer/iş kuralları için zayıf anahtar.",
      severity: "warning"
    });
  }
  const il = props.il ?? props.province;
  const ilce = props.ilce ?? props.district;
  if ((il == null || String(il).trim() === "") && (ilce == null || String(ilce).trim() === "")) {
    out.push({
      code: "MISSING_ADMIN_BOUNDARY",
      message: "İl / ilçe metadata bilgisi yok; belediye doğrulaması için eksik.",
      severity: "info"
    });
  }
  return out;
}

/** Rough WGS84 sanity — Turkey-centric bbox with margin for islands / border corridors. */
function validateGeometryRoughExtent(geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const lngLatBounds = { minLng: 25.5, maxLng: 45.5, minLat: 35.5, maxLat: 43.5 };
  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  const consumeRing = (ring: GeoJSON.Position[]) => {
    for (const pos of ring) {
      const lng = pos[0];
      const lat = pos[1];
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    }
  };

  if (geometry.type === "Polygon") {
    for (const ring of geometry.coordinates) consumeRing(ring);
  } else {
    for (const polygon of geometry.coordinates) {
      for (const ring of polygon) consumeRing(ring);
    }
  }

  if (!Number.isFinite(minLng)) return issues;
  if (
    minLng < lngLatBounds.minLng ||
    maxLng > lngLatBounds.maxLng ||
    minLat < lngLatBounds.minLat ||
    maxLat > lngLatBounds.maxLat
  ) {
    issues.push({
      code: "EXTENT_OUTSIDE_TR_BOX",
      message:
        "Geometri beklenen Türkiye WGS84 kutusunun dışında — CRS karışması veya yanlış projeksiyon olabilir.",
      severity: "warning"
    });
  }
  return issues;
}

/**
 * Export for tests / tooling: ring orientation sign (positive = counter-clockwise in GIS convention for outer ring).
 */
export function ringSignedArea(ring: GeoJSON.Position[]): number {
  if (ring.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    sum += x1 * y2 - x2 * y1;
  }
  return sum / 2;
}
