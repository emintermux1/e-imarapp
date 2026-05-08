import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { JobsService } from '../jobs/jobs.service';

@Injectable()
export class OgcRefreshService {
  constructor(
    private readonly db: DatabaseService,
    private readonly jobs: JobsService
  ) {}

  async discoverAll(): Promise<unknown> {
    if (!this.db.isConfigured()) {
      return { status: 'not_ready', message: 'Database not configured.' };
    }

    const sources = await this.db.query(
      `select ds.id as source_id, ds.homepage_url
       from data_sources ds
       where ds.category = 'municipal_gis'
         and not exists (
           select 1 from municipal_gis_endpoints mge
           where mge.source_id = ds.id and mge.refresh_after > now()
         )
       order by ds.name`
    );

    const jobs = [];
    for (const row of sources.rows as { source_id: string; homepage_url: string }[]) {
      const job = await this.jobs.enqueue('ogc.discover', {
        sourceId: row.source_id,
        homepageUrl: row.homepage_url
      });
      jobs.push(job);
    }

    return {
      status: 'ok',
      sourcesQueued: jobs.length,
      jobs,
      note: 'Each queued source will have its OGC GetCapabilities probed. Results are persisted in municipal_gis_endpoints with a 7-day refresh window.'
    };
  }

  async staleEndpoints(): Promise<unknown> {
    if (!this.db.isConfigured()) return { status: 'not_ready' };

    const result = await this.db.query(
      `select mge.id, mge.source_id, mge.base_url, mge.status, mge.discovered_at, mge.refresh_after,
              ds.name as source_name
       from municipal_gis_endpoints mge
       join data_sources ds on ds.id = mge.source_id
       where mge.refresh_after <= now()
       order by mge.refresh_after`
    );

    return { count: result.rowCount, endpoints: result.rows };
  }
}
