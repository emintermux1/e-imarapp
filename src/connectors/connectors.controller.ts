import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DiscoveryService } from './discovery.service';
import { JobsService } from '../jobs/jobs.service';
import { NetcadKeosService } from './netcad-keos.service';
import { OgcDiscoveryService } from './ogc-discovery.service';
import { OgcRefreshService } from './ogc-refresh.service';

@ApiTags('connectors')
@Controller('connectors')
export class ConnectorsController {
  constructor(
    private readonly discovery: DiscoveryService,
    private readonly jobs: JobsService,
    private readonly netcadKeos: NetcadKeosService,
    private readonly ogc: OgcDiscoveryService,
    private readonly ogcRefresh: OgcRefreshService
  ) {}

  @Get('netcad/strategy')
  netcadStrategy() {
    return this.netcadKeos.strategy();
  }

  @Post(':id/netcad/discover')
  netcadDiscover(@Param('id') id: string) {
    return this.netcadKeos.discover(id);
  }

  @Post(':id/sync')
  async sync(@Param('id') id: string) {
    const source = this.discovery.getSource(id);
    const job = await this.jobs.enqueue('connector.sync', {
      sourceId: source.id,
      homepageUrl: source.homepageUrl,
      connectorKinds: source.connectorKinds
    });

    return {
      source,
      job,
      note: 'The job records the real connector target. Workers must perform source-specific auth/session discovery before ingesting data.'
    };
  }

  @Post(':id/ogc/discover')
  discoverOgc(@Param('id') id: string) {
    return this.ogc.discoverForSource(id);
  }

  @Post('ogc/discover-all')
  discoverAllOgc() {
    return this.ogcRefresh.discoverAll();
  }

  @Get('ogc/stale')
  staleOgcEndpoints() {
    return this.ogcRefresh.staleEndpoints();
  }
}
