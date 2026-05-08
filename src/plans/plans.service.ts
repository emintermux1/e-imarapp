import { Injectable } from '@nestjs/common';
import { IntegrationErrorCode } from '../common/error-taxonomy';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class PlansService {
  constructor(private readonly database: DatabaseService) {}

  async suspensions(limit = 100): Promise<unknown> {
    if (!this.database.isConfigured()) return { status: 'not_ready', issue: this.database.notConfiguredIssue() };

    const result = await this.database.query(
      `select sn.id, sn.source_id, sn.municipality_id, sn.title, sn.announcement_url,
              sn.published_at, sn.objection_deadline, sn.status, sn.extracted_text,
              sn.diff_summary,
              m.name as municipality_name
       from suspension_notices sn
       left join municipalities m on m.id = sn.municipality_id
       order by sn.published_at desc nulls last
       limit $1`,
      [limit]
    );

    return {
      status: result.rowCount ? 'ok' : 'empty',
      count: result.rowCount,
      notices: result.rows,
      issue: result.rowCount === 0
        ? { code: IntegrationErrorCode.Unavailable, message: 'No suspension notices ingested yet.' }
        : undefined
    };
  }

  async planHistory(parcelId: string): Promise<unknown> {
    if (!this.database.isConfigured()) return { status: 'not_ready', issue: this.database.notConfiguredIssue() };

    const result = await this.database.query(
      `select pzs.id, pzs.source_id, pzs.emsal, pzs.taks, pzs.kaks, pzs.gabari, pzs.building_height,
              pzs.approach_rules, pzs.created_at,
              pl.title as plan_title, pl.plan_number, pl.approval_date, pl.effective_date,
              zl.zoning_function, zl.legend_code, zl.layer_type
       from parcel_zoning_snapshots pzs
       left join plans pl on pl.id = pzs.plan_id
       left join zoning_layers zl on zl.id = pzs.zoning_layer_id
       where pzs.parcel_id = $1::uuid
       order by pzs.created_at desc`,
      [parcelId]
    );

    return {
      parcelId,
      status: result.rowCount ? 'ok' : 'empty',
      snapshots: result.rows,
      diffNote: 'Compare consecutive snapshots to see emsal, taks, kaks, or zoning_function changes over time.'
    };
  }

  async planSheets(planId: string): Promise<unknown> {
    if (!this.database.isConfigured()) return { status: 'not_ready', issue: this.database.notConfiguredIssue() };

    const result = await this.database.query(
      `select ps.id, ps.sheet_code, ps.document_url, ps.object_storage_key, ps.mime_type, ps.ocr_status, ps.metadata
       from plan_sheets ps where ps.plan_id = $1::uuid order by ps.sheet_code`,
      [planId]
    );

    return { planId, sheets: result.rows };
  }

  async planNotes(planId: string): Promise<unknown> {
    if (!this.database.isConfigured()) return { status: 'not_ready', issue: this.database.notConfiguredIssue() };

    const result = await this.database.query(
      `select pn.id, pn.note_text, pn.parsed_rules, pn.source_document_url, pn.created_at
       from plan_notes pn where pn.plan_id = $1::uuid order by pn.created_at`,
      [planId]
    );

    return { planId, notes: result.rows };
  }
}
