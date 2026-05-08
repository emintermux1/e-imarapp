import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class ReportsService {
  constructor(private readonly db: DatabaseService) {}

  async requestReport(payload: {
    userReference: string;
    parcelId?: string;
    planId?: string;
    reportType: 'bank' | 'architect' | 'notary' | 'investment' | 'zoning_summary';
    requestedPayload?: Record<string, unknown>;
  }): Promise<unknown> {
    if (!this.db.isConfigured()) return { status: 'not_ready', issue: this.db.notConfiguredIssue() };

    const shareToken = randomUUID();
    const result = await this.db.query(
      `insert into report_requests
        (user_reference, parcel_id, plan_id, report_type, share_token, requested_payload)
       values ($1, $2::uuid, $3::uuid, $4, $5, $6)
       returning id, status, share_token, created_at`,
      [
        payload.userReference,
        payload.parcelId ?? null,
        payload.planId ?? null,
        payload.reportType,
        shareToken,
        JSON.stringify(payload.requestedPayload ?? {})
      ]
    );

    return {
      status: 'queued',
      report: result.rows[0],
      note: 'PDF rendering worker will generate professional report from real parcel/plan data and store it in S3/MinIO.'
    };
  }

  async getReport(id: string): Promise<unknown> {
    if (!this.db.isConfigured()) return { status: 'not_ready', issue: this.db.notConfiguredIssue() };
    const result = await this.db.query(`select * from report_requests where id = $1::uuid`, [id]);
    return { status: result.rowCount ? 'ok' : 'not_found', report: result.rows[0] ?? null };
  }
}
