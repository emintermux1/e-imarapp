import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { SatelliteController } from './satellite.controller';
import { SatelliteService } from './satellite.service';

@Module({
  imports: [DatabaseModule],
  controllers: [SatelliteController],
  providers: [SatelliteService]
})
export class SatelliteModule {}
