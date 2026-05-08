import { Controller, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DiscoveryService } from './discovery.service';
import { JobsService } from '../jobs/jobs.service';

@ApiTags('connectors')
@Controller('connectors')
export class ConnectorsController {
  constructor(
    private readonly discovery: DiscoveryService,
    private readonly jobs: JobsService
  ) {}

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
}
