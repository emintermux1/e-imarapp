import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConnectorsModule } from '../connectors/connectors.module';
import { GeoModule } from '../geo/geo.module';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({ imports: [ConfigModule, GeoModule, ConnectorsModule], controllers: [JobsController], providers: [JobsService], exports: [JobsService] })
export class JobsModule {}
