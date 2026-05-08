import { Module } from '@nestjs/common';
import { ConnectorsModule } from '../connectors/connectors.module';
import { MunicipalitiesController } from './municipalities.controller';

@Module({
  imports: [ConnectorsModule],
  controllers: [MunicipalitiesController]
})
export class MunicipalitiesModule {}
