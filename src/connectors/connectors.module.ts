import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ConnectorsController } from './connectors.controller';
import { DiscoveryService } from './discovery.service';
import { HttpProbeService } from './http-probe.service';
import { NetcadKeosService } from './netcad-keos.service';
import { OgcDiscoveryService } from './ogc-discovery.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ConnectorsController],
  providers: [HttpProbeService, DiscoveryService, NetcadKeosService, OgcDiscoveryService],
  exports: [HttpProbeService, DiscoveryService, NetcadKeosService, OgcDiscoveryService]
})
export class ConnectorsModule {}
