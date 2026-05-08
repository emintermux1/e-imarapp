import { Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EplanService } from './eplan.service';
import { TucbsCrossRefService } from './tucbs-cross-ref.service';
import { JobsService } from '../jobs/jobs.service';

@ApiTags('eplan')
@Controller('eplan')
export class EplanController {
  constructor(
    private readonly eplan: EplanService,
    private readonly tucbs: TucbsCrossRefService,
    private readonly jobs: JobsService
  ) {}

  @Get('askidaki-planlar')
  askidakiPlanlar(
    @Query('province') province?: string,
    @Query('district') district?: string
  ) {
    return this.eplan.scrapeAskidakiPlanlar(province, district);
  }

  @Get('yururlukteki-planlar')
  yururluktekiPlanlar(
    @Query('province') province?: string,
    @Query('district') district?: string
  ) {
    return this.eplan.scrapeYururluktekiPlanlar(province, district);
  }

  @Get('search')
  search(
    @Query('province') province?: string,
    @Query('district') district?: string,
    @Query('status') status?: string,
    @Query('planType') planType?: string,
    @Query('limit') limit?: string
  ) {
    return this.eplan.searchPlans({
      province, district, status, planType,
      limit: limit ? parseInt(limit, 10) : 100
    });
  }

  @Post('sync')
  async syncAll() {
    const job = await this.jobs.enqueue('eplan.daily-sync', {
      task: 'scrape_askidaki_and_yururlukteki',
      rateLimit: '1 req / 3 sec'
    });
    return {
      job,
      note: 'Daily sync queued. Worker will scrape e-Plan, persist to PostGIS, detect changes, and trigger watchlist notifications.'
    };
  }

  @Post('notify')
  async triggerNotifications() {
    return this.eplan.triggerWatchlistNotifications();
  }

  @Get('tucbs/capabilities')
  tucbsCapabilities() {
    return this.tucbs.discoverCapabilities();
  }
}
