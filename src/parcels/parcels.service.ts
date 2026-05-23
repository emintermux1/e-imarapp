import { Injectable } from '@nestjs/common';
import { IntegrationErrorCode } from '../common/error-taxonomy';
import { DatabaseService } from '../database/database.service';
import { ParcelQueryDto } from './dto/parcel-query.dto';

type SchemaColumnRow = {
  table_name: string;
  column_name: string;
};

type ParcelResultRow = {
  id: string | null;
  source_id: string | null;
  municipality_id: string | null;
  ada: string | null;
  parsel_no: string | null;
  external_id: string | null;
  attributes: Record<string, unknown> | null;
  source_fetched_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  geometry: Record<string, unknown> | null;
  centroid: Record<string, unknown> | null;
  bbox: Record<string, unknown> | null;
  area_m2: string | number | null;
  source_name: string | null;
  source_homepage_url: string | null;
  source_access_status: string | null;
  source_category: string | null;
};

type QueryPlan = {
  where: string[];
  params: unknown[];
  limit: number;
  unsupportedReason?: string;
};

type NormalizedParcelQuery = {
  type: ParcelQueryDto['type'];
  ada?: string;
  parselNo?: string;
  municipalityId?: string;
  sourceId?: string;
  longitude?: number;
  latitude?: number;
  srid: number;
  bbox?: [number, number, number, number];
  geometry?: Record<string, unknown>;
  limit: number;
};

@Injectable()
export class ParcelsService {
  constructor(private readonly db: DatabaseService) {}

  async queryParcel(query: ParcelQueryDto): Promise<unknown> {
    const normalizedQuery = this.normalizeQuery(query);

    if (!this.db.isConfigured()) {
      return { status: 'not_ready', issue: this.db.notConfiguredIssue(), parcels: [], count: 0, query: normalizedQuery };
    }

    try {
      const schema = await this.loadSchema(['parcels', 'data_sources']);
      const parcelColumns = schema.get('parcels') ?? new Set<string>();
      if (parcelColumns.size === 0) {
        return this.notReady(normalizedQuery, 'Parcel table is unavailable in the configured database.', [
          'Run database migrations that create the PostGIS parcels table.',
          'Verify DATABASE_URL points at the intended schema/search_path.'
        ]);
      }

      const plan = this.buildQueryPlan(normalizedQuery, parcelColumns);
      if (plan.unsupportedReason) {
        return this.notReady(normalizedQuery, plan.unsupportedReason, [
          'Use ada/parsel, coordinate, bbox, municipalityId, or sourceId filters supported by the current parcels schema.',
          'Add the missing PostGIS geometry/source columns via migrations before enabling spatial/source queries.'
        ]);
      }

      const dataSourceColumns = schema.get('data_sources') ?? new Set<string>();
      const sql = this.buildParcelSql(parcelColumns, dataSourceColumns, plan.where, plan.params.length + 1);
      const result = await this.db.query<ParcelResultRow>(sql, [...plan.params, plan.limit]);
      const parcels = result.rows.map((row) => this.toParcel(row));
      const sources = this.uniqueSources(parcels);

      return {
        status: parcels.length > 0 ? 'ok' : 'empty',
        parcels,
        count: parcels.length,
        query: normalizedQuery,
        sources,
        provenance: {
          database: 'postgis',
          table: 'parcels',
          source: sources.length > 0 ? 'data_sources' : 'parcels.source_id',
          officialDataFabricated: false
        }
      };
    } catch (error) {
      return this.notReady(normalizedQuery, 'Configured parcel database query failed.', [
        'Confirm PostGIS is installed and migrations have completed.',
        'Check parcels table permissions, geometry column type/SRID, and query filters.'
      ], error);
    }
  }

  private async loadSchema(tableNames: string[]): Promise<Map<string, Set<string>>> {
    const result = await this.db.query<SchemaColumnRow>(
      `select table_name, column_name
       from information_schema.columns
       where table_schema = any(current_schemas(false))
         and table_name = any($1::text[])`,
      [tableNames]
    );

    return result.rows.reduce((acc, row) => {
      if (!acc.has(row.table_name)) acc.set(row.table_name, new Set<string>());
      acc.get(row.table_name)?.add(row.column_name);
      return acc;
    }, new Map<string, Set<string>>());
  }

  private buildQueryPlan(query: NormalizedParcelQuery, columns: Set<string>): QueryPlan {
    const params: unknown[] = [];
    const where: string[] = [];
    const hasGeom = columns.has('geom');

    const addParam = (value: unknown): string => {
      params.push(value);
      return `$${params.length}`;
    };

    if (query.ada && columns.has('ada')) where.push(`p.ada = ${addParam(query.ada)}`);
    if (query.parselNo && columns.has('parsel_no')) where.push(`p.parsel_no = ${addParam(query.parselNo)}`);
    if (query.sourceId && columns.has('source_id')) where.push(`p.source_id = ${addParam(query.sourceId)}`);

    if (query.municipalityId) {
      const filters: string[] = [];
      if (columns.has('municipality_id')) filters.push(`p.municipality_id::text = ${addParam(query.municipalityId)}`);
      if (columns.has('source_id')) filters.push(`p.source_id = ${addParam(query.municipalityId)}`);
      if (filters.length > 0) where.push(`(${filters.join(' or ')})`);
    }

    if (query.bbox) {
      if (!hasGeom) return { where, params, limit: query.limit, unsupportedReason: 'BBox parcel lookup requires a geom column on parcels.' };
      where.push(`p.geom && ST_MakeEnvelope(${addParam(query.bbox[0])}, ${addParam(query.bbox[1])}, ${addParam(query.bbox[2])}, ${addParam(query.bbox[3])}, 4326)`);
    }

    if (query.longitude !== undefined && query.latitude !== undefined) {
      if (!hasGeom) return { where, params, limit: query.limit, unsupportedReason: 'Coordinate parcel lookup requires a geom column on parcels.' };
      const pointExpression = query.srid === 4326
        ? `ST_SetSRID(ST_MakePoint(${addParam(query.longitude)}, ${addParam(query.latitude)}), 4326)`
        : `ST_Transform(ST_SetSRID(ST_MakePoint(${addParam(query.longitude)}, ${addParam(query.latitude)}), ${addParam(query.srid)}), 4326)`;
      where.push(`ST_Intersects(p.geom, ${pointExpression})`);
    }

    if (query.geometry) {
      if (!hasGeom) return { where, params, limit: query.limit, unsupportedReason: 'GeoJSON parcel lookup requires a geom column on parcels.' };
      where.push(`ST_Intersects(p.geom, ST_SetSRID(ST_GeomFromGeoJSON(${addParam(JSON.stringify(query.geometry))}), 4326))`);
    }

    if (where.length === 0) {
      return {
        where,
        params,
        limit: query.limit,
        unsupportedReason: query.type === 'address' || query.type === 'kml'
          ? 'Address/KML parcel lookup requires a geocoder or parser that is not configured for this endpoint.'
          : 'Parcel lookup requires at least one supported filter in the current schema.'
      };
    }

    return { where, params, limit: query.limit };
  }

  private buildParcelSql(parcelColumns: Set<string>, dataSourceColumns: Set<string>, where: string[], limitParamIndex: number): string {
    const hasGeom = parcelColumns.has('geom');
    const hasDataSourceJoin = parcelColumns.has('source_id') && dataSourceColumns.has('id');
    const dsColumn = (column: string): string => hasDataSourceJoin && dataSourceColumns.has(column) ? `ds.${column}` : 'null';
    const parcelColumn = (column: string, expression = `p.${column}`): string => parcelColumns.has(column) ? expression : 'null';
    const join = hasDataSourceJoin ? 'left join data_sources ds on ds.id = p.source_id' : '';
    const orderBy = parcelColumns.has('updated_at')
      ? 'p.updated_at desc nulls last'
      : parcelColumns.has('id')
        ? 'p.id asc'
        : '1';

    return `select
        ${parcelColumn('id', 'p.id::text')} as id,
        ${parcelColumn('source_id')} as source_id,
        ${parcelColumn('municipality_id', 'p.municipality_id::text')} as municipality_id,
        ${parcelColumn('ada')} as ada,
        ${parcelColumn('parsel_no')} as parsel_no,
        ${parcelColumn('external_id')} as external_id,
        ${parcelColumn('attributes')} as attributes,
        ${parcelColumn('source_fetched_at')} as source_fetched_at,
        ${parcelColumn('created_at')} as created_at,
        ${parcelColumn('updated_at')} as updated_at,
        ${hasGeom ? 'ST_AsGeoJSON(p.geom)::json' : 'null::json'} as geometry,
        ${hasGeom ? 'ST_AsGeoJSON(ST_PointOnSurface(p.geom))::json' : 'null::json'} as centroid,
        ${hasGeom ? 'ST_AsGeoJSON(ST_Envelope(p.geom))::json' : 'null::json'} as bbox,
        ${hasGeom ? 'ST_Area(p.geom::geography)' : 'null'} as area_m2,
        ${dsColumn('name')} as source_name,
        ${dsColumn('homepage_url')} as source_homepage_url,
        ${dsColumn('access_status')} as source_access_status,
        ${dsColumn('category')} as source_category
      from parcels p
      ${join}
      where ${where.join(' and ')}
      order by ${orderBy}
      limit $${limitParamIndex}`;
  }

  private normalizeQuery(query: ParcelQueryDto): NormalizedParcelQuery {
    const limit = Number.isFinite(query.limit) ? Math.max(1, Math.min(100, Math.trunc(Number(query.limit)))) : 20;
    const bbox = Array.isArray(query.bbox) && query.bbox.length === 4 && query.bbox.every((value) => Number.isFinite(Number(value)))
      ? query.bbox.map((value) => Number(value)) as [number, number, number, number]
      : undefined;

    return {
      type: query.type,
      ada: this.cleanString(query.ada),
      parselNo: this.cleanString(query.parselNo),
      municipalityId: this.cleanString(query.municipalityId),
      sourceId: this.cleanString(query.sourceId),
      longitude: this.cleanNumber(query.longitude),
      latitude: this.cleanNumber(query.latitude),
      srid: this.cleanNumber(query.srid) ?? 4326,
      bbox,
      geometry: query.geometry,
      limit
    };
  }

  private toParcel(row: ParcelResultRow): Record<string, unknown> {
    const source = {
      sourceId: row.source_id,
      name: row.source_name,
      homepageUrl: row.source_homepage_url,
      accessStatus: row.source_access_status,
      category: row.source_category
    };

    return {
      id: row.id,
      sourceId: row.source_id,
      municipalityId: row.municipality_id,
      ada: row.ada,
      parselNo: row.parsel_no,
      externalId: row.external_id,
      attributes: row.attributes ?? {},
      geometry: row.geometry,
      centroid: row.centroid,
      bbox: row.bbox,
      areaM2: row.area_m2 === null || row.area_m2 === undefined ? null : Number(row.area_m2),
      sourceFetchedAt: row.source_fetched_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      source,
      provenance: {
        sourceId: row.source_id,
        sourceName: row.source_name,
        sourceUrl: row.source_homepage_url,
        accessStatus: row.source_access_status,
        officialDataFabricated: false
      }
    };
  }

  private uniqueSources(parcels: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
    const byId = new Map<string, Record<string, unknown>>();
    parcels.forEach((parcel) => {
      const source = parcel.source;
      if (!source || typeof source !== 'object') return;
      const record = source as Record<string, unknown>;
      const sourceId = typeof record.sourceId === 'string' && record.sourceId.length > 0 ? record.sourceId : undefined;
      if (sourceId && !byId.has(sourceId)) byId.set(sourceId, record);
    });
    return [...byId.values()];
  }

  private notReady(query: NormalizedParcelQuery, message: string, nextActions: string[], error?: unknown) {
    return {
      status: 'not_ready',
      parcels: [],
      count: 0,
      query,
      issue: {
        code: IntegrationErrorCode.Unavailable,
        message,
        detail: error instanceof Error ? error.message : undefined
      },
      nextActions,
      provenance: {
        database: 'postgis',
        table: 'parcels',
        officialDataFabricated: false
      }
    };
  }

  private cleanString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
  }

  private cleanNumber(value: unknown): number | undefined {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : undefined;
  }
}
