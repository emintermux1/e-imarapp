import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IntegrationErrorCode } from '../common/error-taxonomy';

@Injectable()
export class MapService {
  private readonly pgTileservUrl?: string;

  constructor(config: ConfigService) {
    this.pgTileservUrl = config.get<string>('PG_TILESERV_URL');
  }

  async tileServerStatus(): Promise<unknown> {
    if (!this.pgTileservUrl) {
      return {
        status: 'not_ready',
        issue: {
          code: IntegrationErrorCode.NotConfigured,
          message: 'PG_TILESERV_URL is not configured. Vector tile serving requires pg_tileserv or a compatible service.'
        }
      };
    }

    try {
      const response = await fetch(this.pgTileservUrl);
      return {
        status: response.ok ? 'ok' : 'unavailable',
        endpoint: this.pgTileservUrl,
        httpStatus: response.status
      };
    } catch (error) {
      return {
        status: 'unavailable',
        endpoint: this.pgTileservUrl,
        issue: {
          code: IntegrationErrorCode.Unavailable,
          message: error instanceof Error ? error.message : 'Vector tile service status check failed.'
        }
      };
    }
  }

  layers() {
    return {
      postgisLayers: ['parcels', 'plans', 'zoning_layers', 'municipalities'],
      tileService: this.pgTileservUrl ?? null,
      note: 'pg_tileserv exposes PostGIS layers after database migrations and real ingestion are available.'
    };
  }
}
