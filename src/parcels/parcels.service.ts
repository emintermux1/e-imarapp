import { Injectable } from '@nestjs/common';
import { IntegrationErrorCode } from '../common/error-taxonomy';
import { DatabaseService } from '../database/database.service';
import { ParcelQueryDto } from './dto/parcel-query.dto';

const PARCEL_COLUMNS = `
  p.id, p.source_id, p.municipality_id, p.ada, p.parsel_no, p.external_id,
  ST_AsGeoJSON(p.geom)::json as geometry,
  ST_AsGeoJSON(p.centroid)::json as centroid,
  p.attributes, p.source_fetched_at
`;

const ZONING_JOIN = `
  left join lateral (
    select pzs.emsal, pzs.taks, pzs.kaks, pzs.gabari, pzs.building_height,
           pzs.approach_rules, pzs.source_payload,
           pl.title as plan_title, pl.plan_number, pl.scale as plan_scale,
           zl.layer_type, zl.zoning_function, zl.legend_code
    from parcel_zoning_snapshots pzs
    left join plans pl on pl.id = pzs.plan_id
    left join zoning_layers zl on zl.id = pzs.zoning_layer_id
    where pzs.parcel_id = p.id
    order by pzs.created_at desc
    limit 1
  ) z on true
`;

@Injectable()
export class ParcelsService {
  constructor(private readonly database: DatabaseService) {}

  async queryParcel(dto: ParcelQueryDto): Promise<unknown> {
    if (!this.database.isConfigured()) {
      return {
        status: 'not_ready',
        query: dto,
        issue: this.database.notConfiguredIssue(),
        nextActions: [
          'Start PostgreSQL/PostGIS with docker compose.',
          'Run migrations in database/migrations.',
          'Sync at least one verified connector before expecting parcel/zoning results.'
        ]
      };
    }

    switch (dto.type) {
      case 'ada_parsel':
        return this.queryByAdaParsel(dto);
      case 'coordinate':
        return this.queryByCoordinate(dto);
      case 'address':
        return this.queryByAddress(dto);
      case 'geojson':
        return this.queryByGeojson(dto);
      case 'kml':
        return this.queryByKml(dto);
      default:
        return { status: 'unsupported', query: dto, issue: { code: IntegrationErrorCode.UnsupportedFormat, message: `Query type '${dto.type}' is not supported.` } };
    }
  }

  private async queryByAdaParsel(dto: ParcelQueryDto) {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 0;

    if (dto.ada) { conditions.push(`p.ada = $${++idx}`); params.push(dto.ada); }
    if (dto.parselNo) { conditions.push(`p.parsel_no = $${++idx}`); params.push(dto.parselNo); }
    if (dto.municipalityId) { conditions.push(`p.municipality_id = $${++idx}::uuid`); params.push(dto.municipalityId); }

    if (conditions.length === 0) {
      return { status: 'invalid', issue: { code: IntegrationErrorCode.UnsupportedFormat, message: 'At least ada or parselNo is required.' } };
    }

    const sql = `select ${PARCEL_COLUMNS}, z.* from parcels p ${ZONING_JOIN} where ${conditions.join(' and ')} limit 50`;
    return this.wrapResult(dto, await this.database.query(sql, params));
  }

  private async queryByCoordinate(dto: ParcelQueryDto) {
    const srid = dto.srid ?? 4326;
    const sql = `
      select ${PARCEL_COLUMNS}, z.*
      from parcels p ${ZONING_JOIN}
      where ST_Intersects(p.geom, ST_Transform(ST_SetSRID(ST_MakePoint($1, $2), $3), 4326))
      limit 25`;
    return this.wrapResult(dto, await this.database.query(sql, [dto.longitude, dto.latitude, srid]));
  }

  private async queryByAddress(dto: ParcelQueryDto) {
    return {
      status: 'requires_geocoder',
      query: dto,
      issue: {
        code: IntegrationErrorCode.NotConfigured,
        message: 'Address-based parcel query requires a geocoder service (e.g., MAKS, Nominatim, or Google Geocoding). Configure GEOCODER_URL first.'
      }
    };
  }

  private async queryByGeojson(dto: ParcelQueryDto) {
    if (!dto.geometry) {
      return { status: 'invalid', issue: { code: IntegrationErrorCode.UnsupportedFormat, message: 'geometry field is required for geojson queries.' } };
    }
    const sql = `
      select ${PARCEL_COLUMNS}, z.*
      from parcels p ${ZONING_JOIN}
      where ST_Intersects(p.geom, ST_SetSRID(ST_GeomFromGeoJSON($1), 4326))
      limit 100`;
    return this.wrapResult(dto, await this.database.query(sql, [JSON.stringify(dto.geometry)]));
  }

  private async queryByKml(dto: ParcelQueryDto) {
    if (!dto.kml) {
      return { status: 'invalid', issue: { code: IntegrationErrorCode.UnsupportedFormat, message: 'kml field is required for KML queries.' } };
    }
    const sql = `
      select ${PARCEL_COLUMNS}, z.*
      from parcels p ${ZONING_JOIN}
      where ST_Intersects(p.geom, ST_Transform(ST_GeomFromKML($1), 4326))
      limit 100`;
    return this.wrapResult(dto, await this.database.query(sql, [dto.kml]));
  }

  private wrapResult(dto: ParcelQueryDto, result: { rowCount: number | null; rows: unknown[] }) {
    const parcels = result.rows;
    return {
      status: result.rowCount ? 'ok' : 'empty',
      query: dto,
      count: result.rowCount,
      parcels,
      fields: [
        'imar_durumu', 'emsal', 'taks', 'kaks', 'gabari', 'building_height',
        'zoning_function', 'legend_code', 'plan_title', 'plan_number', 'plan_scale',
        'approach_rules', 'source_payload', 'geometry', 'centroid'
      ],
      issue: result.rowCount === 0
        ? { code: IntegrationErrorCode.Unavailable, message: 'No ingested parcel matched this query. Sync verified connectors first.' }
        : undefined
    };
  }
}
