import { Module } from '@nestjs/common';
import { ConnectorsModule } from '../connectors/connectors.module';
import { SourcesController } from './sources.controller';

@Module({
  imports: [ConnectorsModule],
  controllers: [SourcesController]
})
export class SourcesModule {}
