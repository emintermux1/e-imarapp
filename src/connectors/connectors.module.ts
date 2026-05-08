import { Module } from '@nestjs/common';
import { JobsModule } from '../jobs/jobs.module';
import { ConnectorsController } from './connectors.controller';
import { DiscoveryService } from './discovery.service';
import { HttpProbeService } from './http-probe.service';

@Module({
  imports: [JobsModule],
  controllers: [ConnectorsController],
  providers: [DiscoveryService, HttpProbeService],
  exports: [DiscoveryService, HttpProbeService]
})
export class ConnectorsModule {}
