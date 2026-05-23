import { GeoService } from '../src/geo/geo.service';
import { AuditRepository } from '../src/audit/audit.repository';

const notConfiguredDb = {
  isConfigured: () => false,
  notConfiguredIssue: () => ({ code: 'not_configured', message: 'no database' })
};

describe('GeoService audit contract', () => {
  test('returns concrete sample audit records instead of schema-only output', async () => {
    const audit = new AuditRepository(notConfiguredDb as any);
    const service = new GeoService(notConfiguredDb as any, audit);

    const contract = await service.auditContract() as any;

    expect(contract.status).toBe('sample_ready');
    expect(contract.supportedEntities).toEqual(['parcel', 'source', 'report']);
    expect(contract.sampleRecords).toHaveLength(3);
    expect(contract.sampleRecords.map((record: any) => record.entityType)).toEqual(['parcel', 'source', 'report']);
    expect(contract.sampleRecords.every((record: any) => record.status === 'sample_record')).toBe(true);
    expect(contract.model.entity_audit_log).toContain('before_hash');
  });

  test('queries persisted audit and version rows when database is configured', async () => {
    const queries: string[] = [];
    const db = {
      isConfigured: () => true,
      query: async (sql: string) => {
        queries.push(sql);
        if (sql.includes('entity_versions')) {
          return {
            rowCount: 1,
            rows: [{
              id: 'version-1',
              entity_type: 'parcel',
              entity_id: 'parcel/TR-34-BES-1234-2',
              version_no: 2,
              source_id: 'istanbul-besiktas-keos',
              created_by: 'worker:test',
              reason: 'version test',
              created_at: '2026-05-23T00:00:00.000Z'
            }]
          };
        }
        return {
          rowCount: 1,
          rows: [{
            id: 'row-1',
            entity_type: 'parcel',
            entity_id: 'parcel/TR-34-BES-1234-2',
            operation: 'update',
            actor_ref: 'worker:test',
            reason: 'audit test',
            before_hash: 'sha256:before',
            after_hash: 'sha256:after',
            source_id: 'istanbul-besiktas-keos',
            created_at: '2026-05-23T00:00:00.000Z'
          }]
        };
      }
    };
    const service = new GeoService(db as any, new AuditRepository(db as any));

    const contract = await service.auditContract() as any;

    expect(contract.status).toBe('ok');
    expect(contract.persistence).toBe('database');
    expect(contract.records).toEqual([expect.objectContaining({
      id: 'row-1',
      entityType: 'parcel',
      entityId: 'parcel/TR-34-BES-1234-2',
      actorRef: 'worker:test',
      beforeHash: 'sha256:before',
      sourceId: 'istanbul-besiktas-keos',
      createdAt: '2026-05-23T00:00:00.000Z'
    })]);
    expect(contract.versions).toEqual([expect.objectContaining({
      id: 'version-1',
      entityType: 'parcel',
      versionNo: 2,
      createdBy: 'worker:test'
    })]);
    expect(queries.join('\n')).toContain('entity_audit_log');
    expect(queries.join('\n')).toContain('entity_versions');
  });
});
