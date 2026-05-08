import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConnectorsModule } from './connectors/connectors.module';
import { DatabaseModule } from './database/database.module';
import { GeoModule } from './geo/geo.module';
import { HealthModule } from './health/health.module';
import { JobsModule } from './jobs/jobs.module';
import { MunicipalitiesModule } from './municipalities/municipalities.module';
import { ParcelsModule } from './parcels/parcels.module';
import { PlansModule } from './plans/plans.module';
import { SourcesModule } from './sources/sources.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    ConnectorsModule,
    SourcesModule,
    MunicipalitiesModule,
    ParcelsModule,
    GeoModule,
    PlansModule,
    JobsModule,
    HealthModule
  ]
})
export class AppModule {}
