import { Injectable } from '@nestjs/common';
import { SOURCE_REGISTRY } from '../sources/source-registry';
import { AccessStatus } from '../connectors/connector.types';

@Injectable()
export class IngestionService {
  capabilities() {
    return {
      supportedTaskTypes: ['api', 'wms', 'wfs', 'arcgis_rest', 'scrape', 'browser', 'webhook', 'tile_index', 'ocr'],
      reliability: {
        retry: 'BullMQ attempts with exponential backoff',
        rateLimit: 'per-source limits must be configured by connector plugin',
        sessionPersistence: 'Redis-backed sessions for protected browser/scraping flows',
        provenance: 'source_id, connector_id, source_fetched_at, and source_payload retained in PostGIS'
      },
      noMockPolicy: 'Connectors must return explicit blocked/requires_credentials states instead of fake data.'
    };
  }

  accessRequirements() {
    return SOURCE_REGISTRY.filter((source) =>
      [AccessStatus.RequiresCredentials, AccessStatus.RequiresLegalAgreement].includes(source.access.status)
    ).map((source) => ({
      sourceId: source.id,
      name: source.name,
      homepageUrl: source.homepageUrl,
      accessStatus: source.access.status,
      requiredAction: this.requiredActionFor(source.access.status),
      notes: source.access.notes
    }));
  }

  aiGisPipeline() {
    return {
      stages: [
        'pdf_ocr',
        'plan_note_summary',
        'legend_classification',
        'zoning_risk',
        'source_confidence',
        'provenance_explanation'
      ],
      storage: 'Artifacts go to S3-compatible storage; structured outputs go to ai_analysis_runs.',
      reviewPolicy: 'Low confidence OCR/AI outputs must be marked requires_review.'
    };
  }

  private requiredActionFor(status: AccessStatus): string {
    if (status === AccessStatus.RequiresLegalAgreement) {
      return 'Legal protocol, institutional permission, and credential onboarding required.';
    }
    return 'Credential/API key/OAuth/session details must be provided through environment or secret manager.';
  }
}
