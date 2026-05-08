import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ParcelsController } from './parcels.controller';
import { ParcelsService } from './parcels.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ParcelsController],
  providers: [ParcelsService],
  exports: [ParcelsService]
})
export class ParcelsModule {}
