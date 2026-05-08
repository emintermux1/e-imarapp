import { Injectable } from '@nestjs/common';
import { SOURCE_REGISTRY } from '../sources/source-registry';

@Injectable()
export class IngestionService {
  accessRequirements() {
    const sources = SOURCE_REGISTRY
      .filter((source) => ['requires_credentials', 'requires_legal_agreement'].includes(source.access.status))
      .map((source) => ({
        sourceId: source.id,
        name: source.name,
        accessStatus: source.access.status,
        reason: source.access.notes,
        homepageUrl: source.homepageUrl,
        requiredEnv: this.requiredEnvFor(source.id)
      }));

    return {
      status: 'ok',
      count: sources.length,
      sources,
      note: 'Only source metadata and required environment variable names are returned. Secret values are never exposed.'
    };
  }

  private requiredEnvFor(sourceId: string): string[] {
    const env: Record<string, string[]> = {
      'mapbox-maps-api': ['MAPBOX_ACCESS_TOKEN'],
      'maptiler-cloud-api': ['MAPTILER_API_KEY'],
      'cesium-ion': ['CESIUM_ION_TOKEN'],
      'here-map-tile-api': ['HERE_API_KEY'],
      'maks': ['MAKS_CREDENTIALS_REF'],
      'edevlet-csb-tucbs': ['EDEVLET_TUCBS_CREDENTIALS_REF'],
      'copernicus-data-space': ['COPERNICUS_OAUTH_REF']
    };
    return env[sourceId] ?? [];
  }
}
