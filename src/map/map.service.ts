import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IntegrationErrorCode } from '../common/error-taxonomy';

@Injectable()
export class MapService {
  private readonly pgTileservUrl?: string;
  private readonly providerKeys: Record<string, string | undefined>;

  constructor(config: ConfigService) {
    this.pgTileservUrl = config.get<string>('PG_TILESERV_URL');
    this.providerKeys = {
      maptiler: config.get<string>('MAPTILER_API_KEY'),
      mapbox: config.get<string>('MAPBOX_ACCESS_TOKEN'),
      cesiumIon: config.get<string>('CESIUM_ION_TOKEN'),
      here: config.get<string>('HERE_API_KEY')
    };
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

  providers() {
    return [
      {
        id: 'maptiler',
        name: 'MapTiler Cloud',
        configured: this.hasSecret(this.providerKeys.maptiler),
        requiredEnv: 'MAPTILER_API_KEY',
        capabilities: ['vector_tiles', 'raster_tiles', 'basemap'],
        docsUrl: 'https://docs.maptiler.com/cloud/api/'
      },
      {
        id: 'mapbox',
        name: 'Mapbox Maps API',
        configured: this.hasSecret(this.providerKeys.mapbox),
        requiredEnv: 'MAPBOX_ACCESS_TOKEN',
        capabilities: ['vector_tiles', 'raster_tiles', 'basemap'],
        docsUrl: 'https://docs.mapbox.com/api/maps/'
      },
      {
        id: 'cesium-ion',
        name: 'Cesium ion',
        configured: this.hasSecret(this.providerKeys.cesiumIon),
        requiredEnv: 'CESIUM_ION_TOKEN',
        capabilities: ['terrain_tiles', '3d_tiles', 'citygml_pipeline'],
        docsUrl: 'https://cesium.com/platform/cesium-ion/'
      },
      {
        id: 'here',
        name: 'HERE APIs',
        configured: this.hasSecret(this.providerKeys.here),
        requiredEnv: 'HERE_API_KEY',
        capabilities: ['raster_tiles', 'vector_tiles', 'routing_context'],
        docsUrl: 'https://developer.here.com/documentation'
      }
    ];
  }

  providerStyles() {
    return {
      note: 'URLs are templates. API keys are read from environment variables and are never returned by this endpoint.',
      templates: {
        maptilerStyleJson: this.hasSecret(this.providerKeys.maptiler)
          ? 'https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_API_KEY}'
          : null,
        mapboxStyleJson: this.hasSecret(this.providerKeys.mapbox)
          ? 'https://api.mapbox.com/styles/v1/mapbox/streets-v12?access_token=${MAPBOX_ACCESS_TOKEN}'
          : null,
        cesiumIonAssets: this.hasSecret(this.providerKeys.cesiumIon)
          ? 'https://api.cesium.com/v1/assets?access_token=${CESIUM_ION_TOKEN}'
          : null,
        hereRasterTiles: this.hasSecret(this.providerKeys.here)
          ? 'https://maps.hereapi.com/v3/base/mc/{z}/{x}/{y}/png?apiKey=${HERE_API_KEY}'
          : null
      }
    };
  }

  private hasSecret(value: string | undefined): boolean {
    return Boolean(value && value.trim().length > 0);
  }
}
