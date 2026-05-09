import { Injectable } from '@nestjs/common';
import { IntegrationErrorCode } from '../common/error-taxonomy';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class GeoService {
  constructor(private readonly db: DatabaseService) {}

  async integritySummary(): Promise<unknown> {
    if (!this.db.isConfigured()) {
      return {
        status: 'not_ready',
        issue: this.db.notConfiguredIssue(),
        scanMode: 'metadata_only',
        checks: this.integrityChecks(),
        note: 'No official validation result is fabricated without a configured PostGIS database.'
      };
    }

    const result = await this.db.query(
      `select
         count(*)::int as total_parcels,
         count(*) filter (where geom is null)::int as null_geometry,
         count(*) filter (where ada is null or parsel_no is null)::int as missing_parcel_key,
         count(distinct municipality_id)::int as municipalities
       from parcels`
    );

    return {
      status: 'ok',
      scanMode: 'limited_metadata_summary',
      summary: result.rows[0] ?? {},
      checks: this.integrityChecks(),
      nextSafeQuery: 'POST /geo/integrity/scan uses LIMIT-capped geometry metadata checks only.'
    };
  }

  async integrityScan(limit = 100): Promise<unknown> {
    const normalizedLimit = Number.isFinite(limit) ? Math.max(1, Math.min(500, Math.trunc(limit))) : 100;
    if (!this.db.isConfigured()) {
      return {
        status: 'not_ready',
        issue: this.db.notConfiguredIssue(),
        scanMode: 'metadata_only',
        requestedLimit: normalizedLimit,
        checks: this.integrityChecks()
      };
    }

    const result = await this.db.query(
      `select id, ada, parsel_no, municipality_id,
              ST_SRID(geom) as srid,
              ST_IsValid(geom) as is_valid,
              ST_IsClosed(ST_Boundary(geom)) as boundary_closed,
              ST_AsGeoJSON(ST_Envelope(geom))::json as bbox
       from parcels
       where geom is null
          or ST_SRID(geom) not in (4326, 3857)
          or not ST_IsValid(geom)
          or ada is null
          or parsel_no is null
       order by updated_at desc nulls last
       limit $1`,
      [normalizedLimit]
    );

    return {
      status: result.rowCount ? 'warning' : 'ok',
      scanMode: 'limited_safe_query',
      count: result.rowCount,
      rows: result.rows,
      note: 'Rows are candidates for review, not destructive repair targets.'
    };
  }

  auditContract() {
    return {
      status: 'not_ready',
      issue: {
        code: IntegrationErrorCode.NotConfigured,
        message: 'Audit/version/rollback tables are not enabled in this runtime.'
      },
      proposedModel: {
        geometry_audit_log: ['id', 'entity_type', 'entity_id', 'operation', 'actor_ref', 'reason', 'before_hash', 'after_hash', 'created_at'],
        geometry_versions: ['id', 'entity_type', 'entity_id', 'version_no', 'geometry', 'metadata', 'source_id', 'created_at'],
        rollbackRequest: { entityType: 'parcel', entityId: 'uuid', targetVersion: 3, reason: 'operator reviewed topology regression' }
      },
      guarantees: ['append_only_audit', 'no_silent_official_repair', 'rollback_requires_reason']
    };
  }

  indexRecommendations() {
    return {
      status: 'ok',
      recommendations: [
        'create index concurrently parcels_geom_gist on parcels using gist (geom);',
        'create index concurrently parcels_ada_parsel_idx on parcels (ada, parsel_no);',
        'create index concurrently parcels_municipality_id_idx on parcels (municipality_id);',
        'create index concurrently municipalities_slug_idx on municipalities (slug);',
        'create index concurrently plans_geom_gist on plans using gist (geom);',
        'create index concurrently plans_status_date_idx on plans (status, effective_date desc);',
        'create index concurrently parcel_zoning_snapshots_source_id_idx on parcel_zoning_snapshots (source_id);',
        'create index concurrently connector_runs_source_id_started_idx on connector_runs (source_id, started_at desc);'
      ],
      note: 'Run concurrently outside transaction windows on production-sized tables.'
    };
  }

  postgisOptimizations() {
    return {
      status: 'ok',
      patterns: [
        'Always pair ST_Intersects/ST_Within with bbox operators where possible: geom && ST_MakeEnvelope(..., 4326).',
        'Use ST_Subdivide for very large municipality/plan polygons before joins.',
        'Use ST_SimplifyPreserveTopology for low-zoom read models; never overwrite official geometry.',
        'Use ST_AsMVTGeom + ST_AsMVT for vector tile endpoints, clipped by tile envelope.',
        'Select only needed columns for map viewport queries and cap LIMIT values.'
      ]
    };
  }

  clientGuidance() {
    return {
      status: 'ok',
      queryControls: {
        debounceMs: 250,
        maxViewportRequestsPerSecond: 4,
        batchParcelLookupMax: 50,
        publicConnectorHardLimit: 25
      },
      antiScraping: 'Use viewport bbox, pagination cursors, and explicit user actions. Avoid bulk harvesting municipal connector endpoints.'
    };
  }

  private integrityChecks() {
    return [
      'null geometry/properties/timestamps',
      'SRID outside EPSG:4326/EPSG:3857',
      'invalid topology via ST_IsValid',
      'missing ada/parsel/municipality metadata',
      'duplicate parcel candidate keys',
      'Turkey-ish bbox sanity for WGS84/WebMercator inputs'
    ];
  }
}
