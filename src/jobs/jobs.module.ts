import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({ imports: [ConfigModule], controllers: [JobsController], providers: [JobsService], exports: [JobsService] })
export class JobsModule {}
