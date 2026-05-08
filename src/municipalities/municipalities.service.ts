import { Injectable } from '@nestjs/common';
import { IntegrationErrorCode } from '../common/error-taxonomy';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class MunicipalitiesService {
  constructor(private readonly database: DatabaseService) {}

  async list(): Promise<unknown> {
    if (!this.database.isConfigured()) {
      return { status: 'not_ready', issue: this.database.notConfiguredIssue() };
    }

    const result = await this.database.query(
      `select m.id, m.name, m.province_name, m.official_url,
              ST_AsGeoJSON(m.geom)::json as boundary,
              (select count(*) from connectors c where c.municipality_id = m.id) as connector_count,
              (select json_agg(json_build_object(
                'id', c.id, 'source_id', c.source_id, 'kind', c.kind, 'base_url', c.base_url, 'status', c.status
              )) from connectors c where c.municipality_id = m.id) as connectors
       from municipalities m
       order by m.name
       limit 500`
    );

    return {
      status: result.rowCount ? 'ok' : 'empty',
      count: result.rowCount,
      municipalities: result.rows,
      issue: result.rowCount === 0
        ? { code: IntegrationErrorCode.Unavailable, message: 'No municipalities ingested yet. Run discovery and sync connectors first.' }
        : undefined
    };
  }

  async getConnectors(municipalityId: string): Promise<unknown> {
    if (!this.database.isConfigured()) {
      return { status: 'not_ready', issue: this.database.notConfiguredIssue() };
    }

    const result = await this.database.query(
      `select c.id, c.source_id, c.kind, c.base_url, c.status, c.last_http_status, c.last_checked_at, c.metadata,
              ds.name as source_name, ds.homepage_url as source_homepage
       from connectors c
       join data_sources ds on ds.id = c.source_id
       where c.municipality_id = $1
       order by c.kind`,
      [municipalityId]
    );

    const ogcResult = await this.database.query(
      `select id, source_id, base_url, wms_url, wfs_url, available_layers, supported_srs, status, discovered_at, refresh_after
       from municipal_gis_endpoints
       where source_id in (select source_id from connectors where municipality_id = $1)
       order by discovered_at desc`,
      [municipalityId]
    );

    return {
      municipalityId,
      connectors: result.rows,
      ogcEndpoints: ogcResult.rows,
      issue: result.rowCount === 0
        ? { code: IntegrationErrorCode.Unavailable, message: 'No connectors registered for this municipality.' }
        : undefined
    };
  }
}
