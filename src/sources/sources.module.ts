import { Module } from '@nestjs/common';
import { ConnectorsModule } from '../connectors/connectors.module';
import { SourceActivationService } from './source-activation.service';
import { SourcesController } from './sources.controller';
import { SourcesService } from './sources.service';

@Module({ imports: [ConnectorsModule], controllers: [SourcesController], providers: [SourcesService, SourceActivationService], exports: [SourcesService, SourceActivationService] })
export class SourcesModule {}
