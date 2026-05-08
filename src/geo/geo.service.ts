import { Injectable } from '@nestjs/common';
import { IntegrationErrorCode } from '../common/error-taxonomy';
import { DatabaseService } from '../database/database.service';
import { GeoIntersectionDto } from './dto/intersection.dto';

@Injectable()
export class GeoService {
  constructor(private readonly database: DatabaseService) {}

  async intersections(dto: GeoIntersectionDto): Promise<unknown> {
    if (!this.database.isConfigured()) return { status: 'not_ready', issue: this.database.notConfiguredIssue() };

    const result = await this.database.query(
      `select id, source_id, layer_type, zoning_function, legend_code, plan_id,
              rules, ST_AsGeoJSON(geom)::json as geometry
       from zoning_layers
       where ST_Intersects(geom, ST_SetSRID(ST_GeomFromGeoJSON($1), 4326))
       limit 100`,
      [JSON.stringify(dto.geometry)]
    );

    return this.wrap('intersections', result.rows, result.rowCount);
  }

  async pointInPolygon(lon: number, lat: number, srid = 4326): Promise<unknown> {
    if (!this.database.isConfigured()) return { status: 'not_ready', issue: this.database.notConfiguredIssue() };

    const parcelResult = await this.database.query(
      `select p.id, p.ada, p.parsel_no, p.source_id, ST_AsGeoJSON(p.geom)::json as geometry
       from parcels p
       where ST_Contains(p.geom, ST_Transform(ST_SetSRID(ST_MakePoint($1, $2), $3), 4326))
       limit 10`,
      [lon, lat, srid]
    );

    const zoningResult = await this.database.query(
      `select zl.id, zl.layer_type, zl.zoning_function, zl.legend_code, zl.rules
       from zoning_layers zl
       where ST_Contains(zl.geom, ST_Transform(ST_SetSRID(ST_MakePoint($1, $2), $3), 4326))
       limit 10`,
      [lon, lat, srid]
    );

    const municipalityResult = await this.database.query(
      `select m.id, m.name, m.province_name
       from municipalities m
       where ST_Contains(m.geom, ST_Transform(ST_SetSRID(ST_MakePoint($1, $2), $3), 4326))
       limit 1`,
      [lon, lat, srid]
    );

    return {
      status: 'ok',
      point: { lon, lat, srid },
      parcels: parcelResult.rows,
      zoningLayers: zoningResult.rows,
      municipality: municipalityResult.rows[0] ?? null
    };
  }

  async buffer(lon: number, lat: number, radiusMeters: number, srid = 4326): Promise<unknown> {
    if (!this.database.isConfigured()) return { status: 'not_ready', issue: this.database.notConfiguredIssue() };

    const result = await this.database.query(
      `select p.id, p.ada, p.parsel_no, p.source_id,
              ST_Distance(p.geom::geography, ST_SetSRID(ST_MakePoint($1, $2), $3)::geography) as distance_m,
              ST_AsGeoJSON(p.geom)::json as geometry
       from parcels p
       where ST_DWithin(p.geom::geography, ST_SetSRID(ST_MakePoint($1, $2), $3)::geography, $4)
       order by distance_m
       limit 100`,
      [lon, lat, srid, radiusMeters]
    );

    return this.wrap('nearby_parcels', result.rows, result.rowCount);
  }

  async zoningOverlay(geojson: Record<string, unknown>): Promise<unknown> {
    if (!this.database.isConfigured()) return { status: 'not_ready', issue: this.database.notConfiguredIssue() };

    const result = await this.database.query(
      `select zl.id, zl.layer_type, zl.zoning_function, zl.legend_code, zl.rules,
              ST_Area(ST_Intersection(zl.geom, ST_SetSRID(ST_GeomFromGeoJSON($1), 4326))::geography) as overlap_m2,
              ST_AsGeoJSON(ST_Intersection(zl.geom, ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)))::json as intersection_geometry
       from zoning_layers zl
       where ST_Intersects(zl.geom, ST_SetSRID(ST_GeomFromGeoJSON($1), 4326))
       order by overlap_m2 desc
       limit 50`,
      [JSON.stringify(geojson)]
    );

    return this.wrap('overlay', result.rows, result.rowCount);
  }

  private wrap(key: string, rows: unknown[], count: number | null) {
    return {
      status: count ? 'ok' : 'empty',
      count,
      [key]: rows,
      issue: count === 0
        ? { code: IntegrationErrorCode.Unavailable, message: 'No ingested data matched this spatial query.' }
        : undefined
    };
  }
}
