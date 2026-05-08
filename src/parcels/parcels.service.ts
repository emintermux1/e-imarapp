import { Injectable } from '@nestjs/common';
import { IntegrationErrorCode } from '../common/error-taxonomy';
import { DatabaseService } from '../database/database.service';
import { ParcelQueryDto } from './dto/parcel-query.dto';

@Injectable()
export class ParcelsService {
  constructor(private readonly database: DatabaseService) {}

  async queryParcel(dto: ParcelQueryDto) {
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

    if (dto.type === 'coordinate') {
      const result = await this.database.query(
        `select id, source_id, ada, parsel_no, ST_AsGeoJSON(geom)::json as geometry
         from parcels
         where ST_Intersects(geom, ST_Transform(ST_SetSRID(ST_MakePoint($1, $2), $3), ST_SRID(geom)))
         limit 25`,
        [dto.longitude, dto.latitude, dto.srid ?? 4326]
      );
      return {
        status: result.rowCount ? 'ok' : 'unavailable',
        query: dto,
        parcels: result.rows,
        issue:
          result.rowCount === 0
            ? {
                code: IntegrationErrorCode.Unavailable,
                message: 'No ingested parcel geometry matched this coordinate. Sync verified parcel connectors first.'
              }
            : undefined
      };
    }

    return {
      status: 'requires_ingested_source',
      query: dto,
      issue: {
        code: IntegrationErrorCode.Unavailable,
        message: 'This query type requires a normalized connector dataset. No fake parcel result is generated.'
      }
    };
  }
}
