import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuditModule } from '../audit/audit.module';
import { GeoController } from './geo.controller';
import { GeoService } from './geo.service';
import { GeometryValidationService } from './geometry-validation.service';

@Module({
  imports: [DatabaseModule, AuditModule],
  controllers: [GeoController],
  providers: [GeoService, GeometryValidationService],
  exports: [GeoService, GeometryValidationService]
})
export class GeoModule {}
