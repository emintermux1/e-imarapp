import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { JobsModule } from '../jobs/jobs.module';
import { EplanController } from './eplan.controller';
import { EplanService } from './eplan.service';
import { TucbsCrossRefService } from './tucbs-cross-ref.service';

@Module({
  imports: [DatabaseModule, JobsModule],
  controllers: [EplanController],
  providers: [EplanService, TucbsCrossRefService],
  exports: [EplanService, TucbsCrossRefService]
})
export class EplanModule {}
