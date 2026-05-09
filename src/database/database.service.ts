import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, QueryResult, QueryResultRow } from 'pg';
import { IntegrationErrorCode } from '../common/error-taxonomy';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool?: Pool;

  constructor(config?: ConfigService) {
    const connectionString = config?.get<string>('DATABASE_URL');
    if (connectionString) this.pool = new Pool({ connectionString });
  }

  isConfigured(): boolean {
    return Boolean(this.pool);
  }

  notConfiguredIssue() {
    return {
      code: IntegrationErrorCode.NotConfigured,
      message: 'DATABASE_URL is not configured. Configure PostGIS before querying persisted geospatial data.'
    };
  }

  async query<T extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]): Promise<QueryResult<T>> {
    if (!this.pool) throw new Error('DATABASE_URL is not configured.');
    return this.pool.query<T>(text, params as any[] | undefined);
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool?.end();
  }
}
