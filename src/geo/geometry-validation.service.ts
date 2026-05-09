import { Injectable } from '@nestjs/common';
import type { Feature, FeatureCollection, Geometry, GeoJsonProperties, MultiPolygon, Point, Polygon, Position } from 'geojson';

type ValidationSeverity = 'info' | 'warning' | 'error';
type ValidationStatus = 'ok' | 'warning' | 'error';

type GeometryLike = Geometry | Feature | FeatureCollection;

type ValidationIssue = {
  code: string;
  message: string;
  severity: ValidationSeverity;
  path?: string;
  suggestion?: string;
};

export type GeometryValidationInput = {
  geometry?: unknown;
  feature?: unknown;
  featureCollection?: unknown;
  metadata?: Record<string, unknown> | null;
  srid?: number;
  expectedSrid?: 4326 | 3857;
  expectTurkeyBounds?: boolean;
  repair?: boolean;
  duplicateCandidates?: Array<Record<string, unknown>>;
};

export type GeometryValidationResult = {
  status: ValidationStatus;
  issues: ValidationIssue[];
  repairedGeometry?: GeometryLike;
  repairSuggestions: string[];
  confidenceScore: number;
};

const TURKEY_BOUNDS_4326 = { minX: 25.5, maxX: 45.5, minY: 35.5, maxY: 43.5 };
const TURKEY_BOUNDS_3857 = { minX: 2838317, maxX: 5065036, minY: 4232038, maxY: 5393638 };

@Injectable()
export class GeometryValidationService {
  validate(input: GeometryValidationInput): GeometryValidationResult {
    const issues: ValidationIssue[] = [];
    const repairSuggestions = new Set<string>();
    const expectedSrid = input.expectedSrid ?? 4326;
    const repair = input.repair === true;
    const value = input.geometry ?? input.feature ?? input.featureCollection;
    const normalized = this.normalize(value, issues);

    this.validateSrid(input.srid, expectedSrid, issues);
    this.validateMetadata(input.metadata, issues);

    let repairedGeometry: GeometryLike | undefined;
    if (normalized) {
      repairedGeometry = this.validateGeoJsonLike(normalized, issues, repairSuggestions, repair);
      if (input.expectTurkeyBounds ?? true) {
        this.validateTurkeyBounds(repairedGeometry ?? normalized, expectedSrid, issues);
      }
      this.detectDuplicateParcelCandidates(normalized, input.duplicateCandidates ?? [], issues);
    }

    const errorCount = issues.filter((issue) => issue.severity === 'error').length;
    const warningCount = issues.filter((issue) => issue.severity === 'warning').length;
    const confidenceScore = Math.max(0, Math.min(100, 100 - errorCount * 25 - warningCount * 8));
    const status: ValidationStatus = errorCount > 0 ? 'error' : warningCount > 0 ? 'warning' : 'ok';

    return {
      status,
      issues,
      ...(repair && repairedGeometry ? { repairedGeometry } : {}),
      repairSuggestions: Array.from(repairSuggestions),
      confidenceScore
    };
  }

  validateTimestamp(value: unknown): ValidationIssue | null {
    if (value === null || value === undefined || String(value).trim() === '') {
      return { code: 'NULL_TIMESTAMP', message: 'Timestamp metadata is missing.', severity: 'warning', suggestion: 'Attach source fetch/update timestamp before marking data official.' };
    }
    const parsed = Date.parse(String(value));
    if (Number.isNaN(parsed)) {
      return { code: 'INVALID_TIMESTAMP', message: 'Timestamp metadata is not parseable as an ISO-compatible date.', severity: 'warning', suggestion: 'Use ISO 8601 timestamps such as 2026-05-09T12:00:00.000Z.' };
    }
    if (parsed > Date.now() + 5 * 60_000) {
      return { code: 'FUTURE_TIMESTAMP', message: 'Timestamp is unexpectedly in the future.', severity: 'warning' };
    }
    return null;
  }

  duplicateCandidateKey(input: { ada?: unknown; parsel?: unknown; municipalityId?: unknown; geometry?: unknown }): string {
    return [input.municipalityId, input.ada, input.parsel, this.stableGeometryHash(input.geometry)].map((part) => String(part ?? '').trim().toLowerCase()).join('|');
  }

  private normalize(value: unknown, issues: ValidationIssue[]): GeometryLike | null {
    if (!value || typeof value !== 'object') {
      issues.push({ code: 'MISSING_GEOMETRY', message: 'GeoJSON geometry, feature, or featureCollection is required.', severity: 'error' });
      return null;
    }

    const candidate = value as { type?: unknown };
    if (typeof candidate.type !== 'string') {
      issues.push({ code: 'INVALID_GEOJSON', message: 'GeoJSON object must include a string type field.', severity: 'error' });
      return null;
    }

    return value as GeometryLike;
  }

  private validateGeoJsonLike(value: GeometryLike, issues: ValidationIssue[], repairSuggestions: Set<string>, repair: boolean): GeometryLike | undefined {
    if (value.type === 'FeatureCollection') {
      if (!Array.isArray(value.features)) {
        issues.push({ code: 'INVALID_FEATURE_COLLECTION', message: 'FeatureCollection.features must be an array.', severity: 'error', path: 'features' });
        return undefined;
      }
      const features = value.features.map((feature, index) => this.validateFeature(feature, issues, repairSuggestions, repair, `features[${index}]`)).filter(Boolean) as Feature[];
      return { ...value, features };
    }

    if (value.type === 'Feature') return this.validateFeature(value, issues, repairSuggestions, repair, 'feature');
    return this.validateGeometry(value, issues, repairSuggestions, repair, 'geometry');
  }

  private validateFeature(feature: Feature, issues: ValidationIssue[], repairSuggestions: Set<string>, repair: boolean, path: string): Feature | undefined {
    this.validateMetadata(feature.properties as Record<string, unknown> | null, issues, path);
    if (!feature.geometry) {
      issues.push({ code: 'NULL_GEOMETRY', message: 'Feature geometry is null.', severity: 'error', path: `${path}.geometry` });
      return undefined;
    }
    const geometry = this.validateGeometry(feature.geometry, issues, repairSuggestions, repair, `${path}.geometry`);
    return geometry ? { ...feature, geometry } : undefined;
  }

  private validateGeometry(geometry: Geometry, issues: ValidationIssue[], repairSuggestions: Set<string>, repair: boolean, path: string): Geometry | undefined {
    switch (geometry.type) {
      case 'Polygon':
        return this.validatePolygon(geometry, issues, repairSuggestions, repair, path);
      case 'MultiPolygon':
        return this.validateMultiPolygon(geometry, issues, repairSuggestions, repair, path);
      case 'Point':
        this.validatePosition(geometry.coordinates, issues, `${path}.coordinates`);
        return geometry;
      case 'LineString':
      case 'MultiPoint':
      case 'MultiLineString':
        this.validateCoordinateTree(geometry.coordinates, issues, `${path}.coordinates`);
        return geometry;
      case 'GeometryCollection':
        return { ...geometry, geometries: geometry.geometries.map((item, index) => this.validateGeometry(item, issues, repairSuggestions, repair, `${path}.geometries[${index}]`)).filter(Boolean) as Geometry[] };
      default:
        issues.push({ code: 'UNSUPPORTED_GEOMETRY', message: `Unsupported geometry type ${(geometry as { type?: string }).type}.`, severity: 'error', path });
        return undefined;
    }
  }

  private validatePolygon(polygon: Polygon, issues: ValidationIssue[], repairSuggestions: Set<string>, repair: boolean, path: string): Polygon | undefined {
    if (!Array.isArray(polygon.coordinates) || polygon.coordinates.length === 0) {
      issues.push({ code: 'MISSING_COORDINATES', message: 'Polygon coordinates are missing.', severity: 'error', path: `${path}.coordinates` });
      return undefined;
    }
    const rings = polygon.coordinates.map((ring, index) => this.validateRing(ring, issues, repairSuggestions, repair, `${path}.coordinates[${index}]`)).filter((ring) => ring.length >= 4);
    if (rings.length === 0) {
      issues.push({ code: 'INVALID_POLYGON', message: 'Polygon has no valid rings.', severity: 'error', path });
      return undefined;
    }
    return { ...polygon, coordinates: rings };
  }

  private validateMultiPolygon(multiPolygon: MultiPolygon, issues: ValidationIssue[], repairSuggestions: Set<string>, repair: boolean, path: string): MultiPolygon | undefined {
    if (!Array.isArray(multiPolygon.coordinates) || multiPolygon.coordinates.length === 0) {
      issues.push({ code: 'MISSING_COORDINATES', message: 'MultiPolygon coordinates are missing.', severity: 'error', path: `${path}.coordinates` });
      return undefined;
    }
    const coordinates = multiPolygon.coordinates
      .map((polygon, polygonIndex) => polygon.map((ring, ringIndex) => this.validateRing(ring, issues, repairSuggestions, repair, `${path}.coordinates[${polygonIndex}][${ringIndex}]`)).filter((ring) => ring.length >= 4))
      .filter((polygon) => polygon.length > 0);
    if (coordinates.length === 0) {
      issues.push({ code: 'INVALID_MULTIPOLYGON', message: 'MultiPolygon has no valid polygon rings.', severity: 'error', path });
      return undefined;
    }
    return { ...multiPolygon, coordinates };
  }

  private validateRing(ring: Position[], issues: ValidationIssue[], repairSuggestions: Set<string>, repair: boolean, path: string): Position[] {
    if (!Array.isArray(ring)) {
      issues.push({ code: 'MISSING_COORDINATES', message: 'Polygon ring is not an array.', severity: 'error', path });
      return [];
    }

    const cleaned: Position[] = [];
    for (let index = 0; index < ring.length; index += 1) {
      const position = ring[index];
      if (!this.isValidPosition(position)) {
        issues.push({ code: 'INVALID_COORDINATE', message: 'Coordinate must contain finite numeric x/y values.', severity: 'error', path: `${path}[${index}]` });
        continue;
      }
      if (cleaned.length > 0 && this.samePosition(cleaned[cleaned.length - 1], position)) {
        issues.push({ code: 'DUPLICATE_CONSECUTIVE_VERTEX', message: 'Duplicate consecutive vertex detected.', severity: 'warning', path: `${path}[${index}]`, suggestion: 'Strip consecutive duplicate vertices before persisting.' });
        repairSuggestions.add('strip_duplicate_consecutive_vertices');
        if (!repair) cleaned.push(position);
        continue;
      }
      cleaned.push(position);
    }

    if (cleaned.length < 3) {
      issues.push({ code: 'MISSING_COORDINATES', message: 'Polygon ring needs at least three valid positions.', severity: 'error', path });
      return [];
    }

    if (!this.samePosition(cleaned[0], cleaned[cleaned.length - 1])) {
      issues.push({ code: 'UNCLOSED_RING', message: 'Polygon ring is not closed.', severity: 'warning', path, suggestion: 'Close the ring by appending the first coordinate when no self-intersection is introduced.' });
      repairSuggestions.add('close_unclosed_rings_when_safe');
      if (repair) cleaned.push([...cleaned[0]]);
    }

    const closed = this.samePosition(cleaned[0], cleaned[cleaned.length - 1]) ? cleaned : [...cleaned, [...cleaned[0]]];
    if (this.hasSelfIntersection(closed)) {
      issues.push({ code: 'SELF_INTERSECTION', message: 'Basic segment scan found polygon self-intersection.', severity: 'error', path, suggestion: 'Require manual/topology repair; do not silently mutate official geometry.' });
      repairSuggestions.add('manual_topology_review_required');
    }

    return repair ? closed : cleaned;
  }

  private validateCoordinateTree(value: unknown, issues: ValidationIssue[], path: string): void {
    if (!Array.isArray(value)) {
      issues.push({ code: 'INVALID_COORDINATE', message: 'Coordinate tree must be an array.', severity: 'error', path });
      return;
    }
    if (this.isPositionArray(value)) {
      this.validatePosition(value as Position, issues, path);
      return;
    }
    value.forEach((child, index) => this.validateCoordinateTree(child, issues, `${path}[${index}]`));
  }

  private validatePosition(position: Position, issues: ValidationIssue[], path: string): void {
    if (!this.isValidPosition(position)) {
      issues.push({ code: 'INVALID_COORDINATE', message: 'Coordinate must contain finite numeric x/y values.', severity: 'error', path });
    }
  }

  private validateSrid(srid: number | undefined, expectedSrid: 4326 | 3857, issues: ValidationIssue[]): void {
    if (srid === undefined || srid === null) return;
    if (![4326, 3857].includes(Number(srid))) {
      issues.push({ code: 'UNKNOWN_SRID', message: `Unsupported SRID ${srid}. Expected 4326 or 3857.`, severity: 'error', suggestion: 'Transform coordinates to EPSG:4326 or EPSG:3857 before validation.' });
      return;
    }
    if (Number(srid) !== expectedSrid) {
      issues.push({ code: 'CRS_MISMATCH', message: `Input SRID ${srid} does not match expected SRID ${expectedSrid}.`, severity: 'error', suggestion: `Use ST_Transform(geom, ${expectedSrid}) or reproject client-side before ingestion.` });
    }
  }

  private validateMetadata(metadata: Record<string, unknown> | GeoJsonProperties | null | undefined, issues: ValidationIssue[], path = 'metadata'): void {
    if (metadata === null || metadata === undefined) {
      issues.push({ code: 'NULL_METADATA', message: 'Metadata/properties object is missing.', severity: 'warning', path, suggestion: 'Attach source, municipality, ada/parsel, and timestamp metadata before official use.' });
      return;
    }
    const timestamp = metadata.updatedAt ?? metadata.updated_at ?? metadata.lastUpdate ?? metadata.sourceTimestamp;
    const timestampIssue = this.validateTimestamp(timestamp);
    if (timestampIssue) issues.push({ ...timestampIssue, path: `${path}.timestamp` });
  }

  private detectDuplicateParcelCandidates(value: GeometryLike, candidates: Array<Record<string, unknown>>, issues: ValidationIssue[]): void {
    if (candidates.length === 0) return;
    const geometry = this.firstGeometry(value);
    const baseProperties = value.type === 'Feature' ? value.properties ?? {} : {};
    const key = this.duplicateCandidateKey({ ...baseProperties, geometry });
    for (const candidate of candidates) {
      if (this.duplicateCandidateKey(candidate) === key) {
        issues.push({ code: 'DUPLICATE_PARCEL_CANDIDATE', message: 'Input matches an existing parcel candidate key and geometry hash.', severity: 'warning', suggestion: 'Review candidate before insert/upsert; do not create a second official parcel record.' });
        return;
      }
    }
  }

  private validateTurkeyBounds(value: GeometryLike, srid: 4326 | 3857, issues: ValidationIssue[]): void {
    const bounds = srid === 3857 ? TURKEY_BOUNDS_3857 : TURKEY_BOUNDS_4326;
    const positions = this.collectPositions(value);
    if (positions.length === 0) return;
    const xs = positions.map((position) => position[0]);
    const ys = positions.map((position) => position[1]);
    const bbox = { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
    if (bbox.minX < bounds.minX || bbox.maxX > bounds.maxX || bbox.minY < bounds.minY || bbox.maxY > bounds.maxY) {
      issues.push({ code: 'EXTENT_OUTSIDE_TURKEY_BOUNDS', message: `Geometry bbox is outside expected Turkey-ish bounds for EPSG:${srid}.`, severity: 'warning', suggestion: 'Check CRS/SRID and coordinate order before ingestion.' });
    }
  }

  private collectPositions(value: GeometryLike | Geometry): Position[] {
    if (value.type === 'FeatureCollection') return value.features.flatMap((feature) => feature.geometry ? this.collectPositions(feature.geometry) : []);
    if (value.type === 'Feature') return value.geometry ? this.collectPositions(value.geometry) : [];
    if (value.type === 'GeometryCollection') return value.geometries.flatMap((geometry) => this.collectPositions(geometry));
    if (value.type === 'Point') return [value.coordinates];
    return this.flattenPositions(value.coordinates);
  }

  private flattenPositions(value: unknown): Position[] {
    if (!Array.isArray(value)) return [];
    if (this.isPositionArray(value)) return [value as Position];
    return value.flatMap((child) => this.flattenPositions(child));
  }

  private firstGeometry(value: GeometryLike): Geometry | undefined {
    if (value.type === 'FeatureCollection') return value.features.find((feature) => feature.geometry)?.geometry ?? undefined;
    if (value.type === 'Feature') return value.geometry ?? undefined;
    return value;
  }

  private hasSelfIntersection(ring: Position[]): boolean {
    for (let i = 0; i < ring.length - 1; i += 1) {
      const a1 = ring[i];
      const a2 = ring[i + 1];
      for (let j = i + 2; j < ring.length - 1; j += 1) {
        if (i === 0 && j === ring.length - 2) continue;
        if (this.segmentsIntersect(a1, a2, ring[j], ring[j + 1])) return true;
      }
    }
    return false;
  }

  private segmentsIntersect(p1: Position, p2: Position, q1: Position, q2: Position): boolean {
    const o1 = this.orientation(p1, p2, q1);
    const o2 = this.orientation(p1, p2, q2);
    const o3 = this.orientation(q1, q2, p1);
    const o4 = this.orientation(q1, q2, p2);
    if (o1 !== o2 && o3 !== o4) return true;
    return false;
  }

  private orientation(a: Position, b: Position, c: Position): number {
    const v = (b[1] - a[1]) * (c[0] - b[0]) - (b[0] - a[0]) * (c[1] - b[1]);
    if (Math.abs(v) < 1e-10) return 0;
    return v > 0 ? 1 : 2;
  }

  private isPositionArray(value: unknown[]): boolean {
    return value.length >= 2 && typeof value[0] === 'number' && typeof value[1] === 'number';
  }

  private isValidPosition(position: unknown): position is Position {
    return Array.isArray(position) && position.length >= 2 && Number.isFinite(position[0]) && Number.isFinite(position[1]);
  }

  private samePosition(a: Position, b: Position): boolean {
    return a.length >= 2 && b.length >= 2 && a[0] === b[0] && a[1] === b[1];
  }

  private stableGeometryHash(value: unknown): string {
    try {
      return JSON.stringify(value ?? null);
    } catch {
      return 'unhashable_geometry';
    }
  }
}
