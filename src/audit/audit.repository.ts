import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export type AuditedEntityType = 'parcel' | 'source' | 'report';
export type AuditOperation = 'create' | 'update' | 'delete' | 'rollback' | 'status_change' | 'source_refresh' | 'report_generated';

export interface AuditChangeInput {
  entityType: AuditedEntityType;
  entityId: string;
  operation: AuditOperation;
  actorRef: string;
  reason: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  sourceId?: string | null;
}

@Injectable()
export class AuditRepository {
  constructor(private readonly db: DatabaseService) {}

  isPersistent(): boolean {
    return this.db.isConfigured();
  }

  async recordChange(input: AuditChangeInput): Promise<{ status: 'persisted' | 'not_ready'; id?: string }> {
    if (!this.db.isConfigured()) return { status: 'not_ready' };
    const result = await this.db.query<{ id: string }>(
      `insert into entity_audit_log
        (entity_type, entity_id, operation, actor_ref, reason, before_value, after_value, source_id)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       returning id`,
      [
        input.entityType,
        input.entityId,
        input.operation,
        input.actorRef,
        input.reason,
        input.before ? JSON.stringify(input.before) : null,
        input.after ? JSON.stringify(input.after) : null,
        input.sourceId ?? null
      ]
    );
    return { status: 'persisted', id: result.rows[0]?.id };
  }

  async appendVersion(input: AuditChangeInput): Promise<{ status: 'persisted' | 'not_ready'; versionNo?: number }> {
    if (!this.db.isConfigured()) return { status: 'not_ready' };
    const result = await this.db.query<{ version_no: number }>(
      `insert into entity_versions
        (entity_type, entity_id, version_no, value, source_id, created_by, reason)
       values (
         $1, $2,
         coalesce((select max(version_no) + 1 from entity_versions where entity_type = $1 and entity_id = $2), 1),
         $3, $4, $5, $6
       )
       returning version_no`,
      [input.entityType, input.entityId, JSON.stringify(input.after ?? {}), input.sourceId ?? null, input.actorRef, input.reason]
    );
    return { status: 'persisted', versionNo: result.rows[0]?.version_no };
  }

  sampleRecords() {
    return [
      {
        id: 'sample-audit-parcel-001',
        entityType: 'parcel',
        entityId: 'parcel/TR-34-BES-1234-2',
        operation: 'update',
        actorRef: 'connector:netcad-keos',
        reason: 'Municipal source refresh changed zoning attributes; geometry retained as source-provided.',
        status: 'sample_record',
        beforeHash: 'sha256:parcel-before-sample',
        afterHash: 'sha256:parcel-after-sample',
        createdAt: '2026-05-23T00:00:00.000Z'
      },
      {
        id: 'sample-audit-source-001',
        entityType: 'source',
        entityId: 'source/istanbul-besiktas-keos',
        operation: 'source_refresh',
        actorRef: 'worker:source-health',
        reason: 'Public endpoint status changed after scheduled probe.',
        status: 'sample_record',
        beforeHash: 'sha256:source-before-sample',
        afterHash: 'sha256:source-after-sample',
        createdAt: '2026-05-23T00:05:00.000Z'
      },
      {
        id: 'sample-audit-report-001',
        entityType: 'report',
        entityId: 'report/demo-feasibility-001',
        operation: 'report_generated',
        actorRef: 'api:reports',
        reason: 'Report snapshot created from parcel, plan, and source provenance inputs.',
        status: 'sample_record',
        beforeHash: null,
        afterHash: 'sha256:report-after-sample',
        createdAt: '2026-05-23T00:10:00.000Z'
      }
    ];
  }
}
