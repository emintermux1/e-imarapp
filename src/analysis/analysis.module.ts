import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';

@Module({ imports: [DatabaseModule, ConfigModule], controllers: [AnalysisController], providers: [AnalysisService], exports: [AnalysisService] })
export class AnalysisModule {}
