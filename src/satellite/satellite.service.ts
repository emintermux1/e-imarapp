import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class SatelliteService {
  constructor(private readonly db: DatabaseService) {}

  providers() {
    return [
      { id: 'copernicus-data-space', capabilities: ['sentinel_imagery', 'change_detection'], requiresCredentials: true },
      { id: 'usgs-landsat', capabilities: ['landsat_imagery', 'historical_archive'], requiresCredentials: false },
      { id: 'esri-world-imagery', capabilities: ['visual_basemap'], requiresCredentials: false }
    ];
  }

  async requestAnalysis(body: {
    userReference?: string;
    parcelId?: string;
    sourceId?: string;
    analysisType: 'illegal_building' | 'empty_parcel' | 'new_construction' | 'construction_progress' | 'excavation';
    area?: Record<string, unknown>;
    provider?: string;
  }): Promise<unknown> {
    if (!this.db.isConfigured()) return { status: 'not_ready', issue: this.db.notConfiguredIssue() };
    const result = await this.db.query(
      `insert into satellite_analysis_requests
        (user_reference, parcel_id, source_id, analysis_type, provider, area, status, result_payload)
       values ($1, $2::uuid, $3, $4, $5,
         case when $6::text is null then null else ST_SetSRID(ST_GeomFromGeoJSON($6), 4326) end,
         'queued', '{}'::jsonb)
       returning id, status, created_at`,
      [
        body.userReference ?? null,
        body.parcelId ?? null,
        body.sourceId ?? null,
        body.analysisType,
        body.provider ?? null,
        body.area ? JSON.stringify(body.area) : null
      ]
    );
    return { status: 'queued', request: result.rows[0] };
  }
}
