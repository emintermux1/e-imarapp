import { Module } from '@nestjs/common';
import { SourcesModule } from '../sources/sources.module';
import { MunicipalitiesController } from './municipalities.controller';

@Module({
  imports: [SourcesModule],
  controllers: [MunicipalitiesController]
})
export class MunicipalitiesModule {}
