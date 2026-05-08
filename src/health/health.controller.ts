import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DatabaseService } from '../database/database.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly database: DatabaseService) {}

  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'turkiye-e-imar-platform',
      databaseConfigured: this.database.isConfigured(),
      modules: [
        'database_postgis',
        'redis_cache_session',
        'bullmq_jobs',
        'source_discovery',
        'ingestion_pipeline',
        'opensearch',
        's3_minio',
        'map_tiles',
        'observability'
      ],
      timestamp: new Date().toISOString()
    };
  }
}
