import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IntegrationErrorCode } from '../common/error-taxonomy';

@Injectable()
export class StorageService {
  private readonly endpoint?: string;

  constructor(config: ConfigService) {
    this.endpoint = config.get<string>('MINIO_ENDPOINT');
  }

  async status(): Promise<unknown> {
    if (!this.endpoint) {
      return {
        status: 'not_ready',
        issue: {
          code: IntegrationErrorCode.NotConfigured,
          message: 'MINIO_ENDPOINT is not configured. S3-compatible storage is required for plan PDFs, OCR artifacts, and raster/vector processing outputs.'
        }
      };
    }

    try {
      const response = await fetch(new URL('/minio/health/live', this.endpoint));
      return {
        status: response.ok ? 'ok' : 'unavailable',
        httpStatus: response.status,
        endpoint: this.endpoint
      };
    } catch (error) {
      return {
        status: 'unavailable',
        endpoint: this.endpoint,
        issue: {
          code: IntegrationErrorCode.Unavailable,
          message: error instanceof Error ? error.message : 'S3-compatible storage status check failed.'
        }
      };
    }
  }

  buckets() {
    return {
      buckets: [
        'plan-documents',
        'plan-ocr',
        'source-snapshots',
        'raster-cache',
        'ai-analysis-artifacts'
      ],
      note: 'Bucket provisioning must be run by infrastructure setup. The API does not fabricate stored artifacts.'
    };
  }
}
