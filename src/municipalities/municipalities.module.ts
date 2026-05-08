import { Module } from '@nestjs/common';
import { ConnectorsModule } from '../connectors/connectors.module';
import { DatabaseModule } from '../database/database.module';
import { MunicipalitiesController } from './municipalities.controller';
import { MunicipalitiesService } from './municipalities.service';

@Module({
  imports: [ConnectorsModule, DatabaseModule],
  controllers: [MunicipalitiesController],
  providers: [MunicipalitiesService],
  exports: [MunicipalitiesService]
})
export class MunicipalitiesModule {}
