import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GEO_INTEGRITY_DAILY_JOB, normalizeJobLimit } from './jobs.constants';
import { JobsService } from './jobs.service';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Get('status')
  status() {
    return this.jobs.status();
  }

  @Post('geo/integrity/daily')
  enqueueGeoIntegrity(@Body() body: { limit?: number } = {}) {
    return this.jobs.enqueue(GEO_INTEGRITY_DAILY_JOB, { limit: normalizeJobLimit(body.limit) });
  }
}
