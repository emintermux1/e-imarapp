import { Module, forwardRef } from '@nestjs/common';
import { ConnectorsModule } from '../connectors/connectors.module';
import { DatabaseModule } from '../database/database.module';
import { SourcesModule } from '../sources/sources.module';
import { MunicipalGisDiscoveryService } from './municipal-gis-discovery.service';
import { MunicipalitiesController } from './municipalities.controller';

@Module({
  imports: [forwardRef(() => SourcesModule), ConnectorsModule, DatabaseModule],
  controllers: [MunicipalitiesController],
  providers: [MunicipalGisDiscoveryService],
  exports: [MunicipalGisDiscoveryService]
})
export class MunicipalitiesModule {}
