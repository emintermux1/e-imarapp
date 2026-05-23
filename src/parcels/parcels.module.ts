import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ParselCompatController, ReportsCompatController, WatchlistCompatController } from './parsel-compat.controller';
import { ParcelsController } from './parcels.controller';
import { ParcelsService } from './parcels.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ParcelsController, ParselCompatController, WatchlistCompatController, ReportsCompatController],
  providers: [ParcelsService],
  exports: [ParcelsService]
})
export class ParcelsModule {}
