import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConnectorsModule } from '../connectors/connectors.module';
import { DatabaseModule } from '../database/database.module';
import { MunicipalitiesModule } from '../municipalities/municipalities.module';
import { KeosConnector } from '../connectors/keos.connector';
import { DiscoveryJob } from './discovery.job';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  imports: [ConfigModule, DatabaseModule, ConnectorsModule, forwardRef(() => MunicipalitiesModule)],
  controllers: [JobsController],
  providers: [JobsService, KeosConnector, DiscoveryJob],
  exports: [JobsService, DiscoveryJob]
})
export class JobsModule {}
