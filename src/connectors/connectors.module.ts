import { Module } from '@nestjs/common';
import { JobsModule } from '../jobs/jobs.module';
import { ConnectorsController } from './connectors.controller';
import { DiscoveryService } from './discovery.service';
import { HttpProbeService } from './http-probe.service';
import { NetcadKeosService } from './netcad-keos.service';

@Module({
  imports: [JobsModule],
  controllers: [ConnectorsController],
  providers: [DiscoveryService, HttpProbeService, NetcadKeosService],
  exports: [DiscoveryService, HttpProbeService, NetcadKeosService]
})
export class ConnectorsModule {}
