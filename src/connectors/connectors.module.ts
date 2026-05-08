import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { JobsModule } from '../jobs/jobs.module';
import { ConnectorsController } from './connectors.controller';
import { DiscoveryService } from './discovery.service';
import { HttpProbeService } from './http-probe.service';
import { NetcadKeosService } from './netcad-keos.service';
import { OgcDiscoveryService } from './ogc-discovery.service';
import { OgcRefreshService } from './ogc-refresh.service';

@Module({
  imports: [JobsModule, DatabaseModule],
  controllers: [ConnectorsController],
  providers: [DiscoveryService, HttpProbeService, NetcadKeosService, OgcDiscoveryService, OgcRefreshService],
  exports: [DiscoveryService, HttpProbeService, NetcadKeosService, OgcDiscoveryService, OgcRefreshService]
})
export class ConnectorsModule {}
