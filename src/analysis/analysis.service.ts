import { Injectable } from '@nestjs/common';
import { IntegrationErrorCode } from '../common/error-taxonomy';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AnalysisService {
  constructor(private readonly db: DatabaseService) {}

  pipeline() {
    return {
      stages: [
        { id: 'pdf_ocr', description: 'Extract text from plan sheet PDFs using OCR.', status: 'infrastructure_ready' },
        { id: 'plan_note_summary', description: 'Summarize extracted plan notes into structured zoning rules.', status: 'infrastructure_ready' },
        { id: 'legend_classification', description: 'Classify plan legend colors/codes into standard zoning function categories.', status: 'infrastructure_ready' },
        { id: 'zoning_risk', description: 'Compute imar risk score from zoning rules, sit areas, expropriation, and suspension history.', status: 'infrastructure_ready' },
        { id: 'source_confidence', description: 'Score data freshness and source reliability.', status: 'infrastructure_ready' },
        { id: 'provenance', description: 'Track which source, connector run, and timestamp produced each data point.', status: 'infrastructure_ready' }
      ],
      storage: 'Artifacts stored in S3/MinIO; structured results in ai_analysis_runs table.',
      reviewPolicy: 'Low confidence outputs are marked requires_review.'
    };
  }

  async runs(limit = 50): Promise<unknown> {
    if (!this.db.isConfigured()) return { status: 'not_ready', issue: this.db.notConfiguredIssue() };

    const result = await this.db.query(
      `select id, source_id, analysis_type, input_reference, status, confidence_score,
              result_summary, result_payload, created_at, completed_at
       from ai_analysis_runs
       order by created_at desc limit $1`,
      [limit]
    );

    return { status: result.rowCount ? 'ok' : 'empty', count: result.rowCount, runs: result.rows };
  }

  async provenance(parcelId: string): Promise<unknown> {
    if (!this.db.isConfigured()) return { status: 'not_ready', issue: this.db.notConfiguredIssue() };

    const snapshots = await this.db.query(
      `select pzs.id, pzs.source_id, pzs.created_at,
              ds.name as source_name, ds.homepage_url as source_url,
              cr.id as connector_run_id, cr.started_at as connector_run_started, cr.status as connector_run_status
       from parcel_zoning_snapshots pzs
       join data_sources ds on ds.id = pzs.source_id
       left join connector_runs cr on cr.source_id = pzs.source_id
         and cr.started_at <= pzs.created_at
       where pzs.parcel_id = $1::uuid
       order by pzs.created_at desc`,
      [parcelId]
    );

    const analyses = await this.db.query(
      `select id, analysis_type, status, confidence_score, result_summary, created_at
       from ai_analysis_runs
       where input_reference = $1
       order by created_at desc`,
      [parcelId]
    );

    return {
      parcelId,
      dataSources: snapshots.rows,
      aiAnalyses: analyses.rows,
      explanation: 'Each data point traces back to a specific source, connector run, and timestamp. AI analysis results include confidence scores.'
    };
  }
}
