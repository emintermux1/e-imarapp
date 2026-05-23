import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { DatabaseModule } from '../database/database.module';
import { ConnectorsController } from './connectors.controller';
import { ConnectorPluginRegistryService } from './connector-plugin-registry.service';
import { DiscoveryService } from './discovery.service';
import { HttpProbeService } from './http-probe.service';
import { KeosConnector } from './keos.connector';
import { NetcadKeosService } from './netcad-keos.service';
import { OgcDiscoveryService } from './ogc-discovery.service';
import { OpenPublicSourceService } from './open-public-source.service';

@Module({
  imports: [DatabaseModule, CommonModule],
  controllers: [ConnectorsController],
  providers: [HttpProbeService, DiscoveryService, ConnectorPluginRegistryService, KeosConnector, NetcadKeosService, OgcDiscoveryService, OpenPublicSourceService],
  exports: [HttpProbeService, DiscoveryService, ConnectorPluginRegistryService, KeosConnector, NetcadKeosService, OgcDiscoveryService, OpenPublicSourceService]
})
export class ConnectorsModule {}
