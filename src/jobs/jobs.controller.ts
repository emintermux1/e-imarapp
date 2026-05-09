import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JobsService } from './jobs.service';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Get('status')
  status() { return { status: 'not_ready', note: 'Configure Redis/BullMQ workers for job execution.' }; }

  @Post('geo/integrity/daily')
  enqueueGeoIntegrity(@Body() body: { limit?: number } = {}) {
    return this.jobs.enqueue('geo.integrity.daily', { limit: Math.max(1, Math.min(500, Number(body.limit ?? 100))) });
  }
}
