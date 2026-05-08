import { Injectable } from '@nestjs/common';
import { IntegrationErrorCode } from '../common/error-taxonomy';
import { DatabaseService } from '../database/database.service';
import { GeoIntersectionDto } from './dto/intersection.dto';

@Injectable()
export class GeoService {
  constructor(private readonly database: DatabaseService) {}

  async intersections(dto: GeoIntersectionDto): Promise<unknown> {
    if (!this.database.isConfigured()) {
      return {
        status: 'not_ready',
        issue: this.database.notConfiguredIssue()
      };
    }

    const result = await this.database.query(
      `select id, source_id, layer_type, zoning_function, plan_id, ST_AsGeoJSON(geom)::json as geometry
       from zoning_layers
       where ($2::text[] is null or id = any($2::text[]))
         and ST_Intersects(geom, ST_SetSRID(ST_GeomFromGeoJSON($1), 4326))
       limit 100`,
      [JSON.stringify(dto.geometry), dto.layerIds ?? null]
    );

    return {
      status: result.rowCount ? 'ok' : 'unavailable',
      intersections: result.rows,
      issue:
        result.rowCount === 0
          ? {
              code: IntegrationErrorCode.Unavailable,
              message: 'No ingested zoning layer intersects the submitted geometry.'
            }
          : undefined
    };
  }
}
