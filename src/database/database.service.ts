import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, QueryResult, QueryResultRow } from 'pg';
import { IntegrationErrorCode, IntegrationIssue } from '../common/error-taxonomy';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool?: Pool;

  constructor(config: ConfigService) {
    const connectionString = config.get<string>('DATABASE_URL');
    if (connectionString) {
      this.pool = new Pool({ connectionString });
    }
  }

  isConfigured(): boolean {
    return Boolean(this.pool);
  }

  notConfiguredIssue(): IntegrationIssue {
    return {
      code: IntegrationErrorCode.NotConfigured,
      message: 'DATABASE_URL is not configured. Start the PostGIS service and run migrations before querying geospatial data.'
    };
  }

  async query<T extends QueryResultRow = QueryResultRow>(sql: string, params: unknown[] = []): Promise<QueryResult<T>> {
    if (!this.pool) {
      throw new Error(this.notConfiguredIssue().message);
    }
    return this.pool.query<T>(sql, params);
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool?.end();
  }
}
