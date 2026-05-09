import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IntegrationErrorCode } from '../common/error-taxonomy';
import { inspectOptionalSecret } from '../config/provider-env';

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
    const readiness = {
      recommendedLayers: [
        { id: 'parcels', table: 'parcels', geometryColumn: 'geom', minZoom: 12, maxZoom: 22 },
        { id: 'plans', table: 'plans', geometryColumn: 'geom', minZoom: 8, maxZoom: 18 },
        { id: 'zoning_layers', table: 'zoning_layers', geometryColumn: 'geom', minZoom: 10, maxZoom: 20 }
      ],
      cacheHeaders: {
        publicMetadata: 'Cache-Control: public, max-age=300, stale-while-revalidate=86400',
        officialOrUserScoped: 'Cache-Control: private, no-store'
      },
      tilePathTemplate: '/public.parcels/{z}/{x}/{y}.pbf'
    };

    if (!this.pgTileservUrl) {
      return {
        status: 'not_ready',
        issue: {
          code: IntegrationErrorCode.NotConfigured,
          message: 'PG_TILESERV_URL is not configured. Vector tile serving requires pg_tileserv or a compatible service.'
        },
        readiness
      };
    }

    try {
      const response = await fetch(this.pgTileservUrl);
      return {
        status: response.ok ? 'ok' : 'unavailable',
        endpoint: this.pgTileservUrl,
        httpStatus: response.status,
        readiness
      };
    } catch (error) {
      return {
        status: 'unavailable',
        endpoint: this.pgTileservUrl,
        issue: {
          code: IntegrationErrorCode.Unavailable,
          message: error instanceof Error ? error.message : 'Vector tile service status check failed.'
        },
        readiness
      };
    }
  }

  tileCacheStrategy() {
    return {
      status: this.pgTileservUrl ? 'ready_for_configuration' : 'not_ready',
      issue: this.pgTileservUrl ? undefined : {
        code: IntegrationErrorCode.NotConfigured,
        message: 'PG_TILESERV_URL is not configured; no real tile cache is active.'
      },
      strategy: {
        key: 'tiles:{layer}:{z}:{x}:{y}:{styleVersion}',
        ttlSeconds: { z0ToZ10: 86_400, z11ToZ14: 3_600, z15Plus: 300 },
        invalidation: ['source_id', 'municipality_id', 'plan_updated_at', 'style_version'],
        headers: 'public immutable for basemap metadata; no-store for user scoped analyses'
      }
    };
  }

  layers() {
    return {
      postgisLayers: ['parcels', 'plans', 'zoning_layers', 'municipalities'],
      tileService: this.pgTileservUrl ?? null,
      note: 'pg_tileserv exposes PostGIS layers after database migrations and real ingestion are available.'
    };
  }

  providers() {
    const diagnostics = this.providerDiagnostics();
    return [
      {
        id: 'maptiler',
        name: 'MapTiler Cloud',
        configured: diagnostics.MAPTILER_API_KEY.configured,
        requiredEnv: 'MAPTILER_API_KEY',
        envStatus: diagnostics.MAPTILER_API_KEY.status,
        issue: diagnostics.MAPTILER_API_KEY.configured ? undefined : diagnostics.MAPTILER_API_KEY.message,
        capabilities: ['vector_tiles', 'raster_tiles', 'basemap'],
        docsUrl: 'https://docs.maptiler.com/cloud/api/'
      },
      {
        id: 'mapbox',
        name: 'Mapbox Maps API',
        configured: diagnostics.MAPBOX_ACCESS_TOKEN.configured,
        requiredEnv: 'MAPBOX_ACCESS_TOKEN',
        envStatus: diagnostics.MAPBOX_ACCESS_TOKEN.status,
        issue: diagnostics.MAPBOX_ACCESS_TOKEN.configured ? undefined : diagnostics.MAPBOX_ACCESS_TOKEN.message,
        capabilities: ['vector_tiles', 'raster_tiles', 'basemap'],
        docsUrl: 'https://docs.mapbox.com/api/maps/'
      },
      {
        id: 'cesium-ion',
        name: 'Cesium ion',
        configured: diagnostics.CESIUM_ION_TOKEN.configured,
        requiredEnv: 'CESIUM_ION_TOKEN',
        envStatus: diagnostics.CESIUM_ION_TOKEN.status,
        issue: diagnostics.CESIUM_ION_TOKEN.configured ? undefined : diagnostics.CESIUM_ION_TOKEN.message,
        capabilities: ['terrain_tiles', '3d_tiles', 'citygml_pipeline'],
        docsUrl: 'https://cesium.com/platform/cesium-ion/'
      },
      {
        id: 'here',
        name: 'HERE APIs',
        configured: diagnostics.HERE_API_KEY.configured,
        requiredEnv: 'HERE_API_KEY',
        envStatus: diagnostics.HERE_API_KEY.status,
        issue: diagnostics.HERE_API_KEY.configured ? undefined : diagnostics.HERE_API_KEY.message,
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

  providerHealth() {
    const diagnostics = this.providerDiagnostics();
    return {
      status: Object.values(diagnostics).every((item) => item.configured) ? 'ok' : 'partial',
      providers: diagnostics,
      note: 'Provider diagnostics report only configuration state. Secret values are never returned.'
    };
  }

  private providerDiagnostics() {
    return {
      MAPTILER_API_KEY: inspectOptionalSecret('MAPTILER_API_KEY', this.providerKeys.maptiler),
      MAPBOX_ACCESS_TOKEN: inspectOptionalSecret('MAPBOX_ACCESS_TOKEN', this.providerKeys.mapbox),
      CESIUM_ION_TOKEN: inspectOptionalSecret('CESIUM_ION_TOKEN', this.providerKeys.cesiumIon),
      HERE_API_KEY: inspectOptionalSecret('HERE_API_KEY', this.providerKeys.here)
    };
  }

  private hasSecret(value: string | undefined): boolean {
    return inspectOptionalSecret('secret', value).configured;
  }
}
