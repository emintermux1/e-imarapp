import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IntegrationErrorCode } from '../common/error-taxonomy';

@Injectable()
export class SearchService {
  private readonly opensearchUrl?: string;

  constructor(config: ConfigService) {
    this.opensearchUrl = config.get<string>('OPENSEARCH_URL');
  }

  async status(): Promise<unknown> {
    if (!this.opensearchUrl) {
      return {
        status: 'not_ready',
        issue: {
          code: IntegrationErrorCode.NotConfigured,
          message: 'OPENSEARCH_URL is not configured. OpenSearch/Elasticsearch is required for catalog and parcel search indexes.'
        }
      };
    }

    try {
      const response = await fetch(this.opensearchUrl);
      return {
        status: response.ok ? 'ok' : 'unavailable',
        httpStatus: response.status,
        endpoint: this.opensearchUrl
      };
    } catch (error) {
      return {
        status: 'unavailable',
        endpoint: this.opensearchUrl,
        issue: {
          code: IntegrationErrorCode.Unavailable,
          message: error instanceof Error ? error.message : 'OpenSearch status check failed.'
        }
      };
    }
  }

  indexDefinitions() {
    return {
      indices: [
        {
          name: 'sources',
          purpose: 'Source catalog, access requirements, connector capability search.'
        },
        {
          name: 'parcels',
          purpose: 'Parcel identifiers and normalized parcel metadata. Geometry remains canonical in PostGIS.'
        },
        {
          name: 'plans',
          purpose: 'Plan documents, suspension notices, and parsed plan notes.'
        }
      ],
      note: 'Index creation is an ingestion task and must use real normalized records from PostGIS/source connectors.'
    };
  }
}
