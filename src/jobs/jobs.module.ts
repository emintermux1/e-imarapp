import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { KeosConnector } from '../connectors/keos.connector';
import { DiscoveryJob } from './discovery.job';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({ imports: [ConfigModule, DatabaseModule], controllers: [JobsController], providers: [JobsService, KeosConnector, DiscoveryJob], exports: [JobsService, DiscoveryJob] })
export class JobsModule {}
