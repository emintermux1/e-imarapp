import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GEO_INTEGRITY_DAILY_JOB, SOURCE_PUBLIC_HEALTH_JOB, normalizeJobLimit } from './jobs.constants';
import { JobsService } from './jobs.service';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Get('status')
  status() {
    return this.jobs.status();
  }

  @Get(':jobId')
  jobStatus(@Param('jobId') jobId: string) {
    return this.jobs.getJob(jobId);
  }

  @Get(':jobId/result')
  jobResult(@Param('jobId') jobId: string) {
    return this.jobs.getJobResult(jobId);
  }

  @Post('geo/integrity/daily')
  enqueueGeoIntegrity(@Body() body: { limit?: number } = {}) {
    return this.jobs.enqueue(GEO_INTEGRITY_DAILY_JOB, { limit: normalizeJobLimit(body.limit) });
  }

  @Post('source/probes/public-health')
  enqueueSourcePublicHealth(@Body() body: { limit?: number; connectorKind?: string; vendor?: string; province?: string; accessStatus?: string } = {}) {
    return this.jobs.enqueue(SOURCE_PUBLIC_HEALTH_JOB, { ...body, limit: normalizeJobLimit(body.limit, 25) });
  }
}
