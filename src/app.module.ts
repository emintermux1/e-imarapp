import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AnalysisModule } from './analysis/analysis.module';
import { CacheModule } from './cache/cache.module';
import { ConnectorsModule } from './connectors/connectors.module';
import { DatabaseModule } from './database/database.module';
import { GeoModule } from './geo/geo.module';
import { HealthModule } from './health/health.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { JobsModule } from './jobs/jobs.module';
import { MapModule } from './map/map.module';
import { MunicipalitiesModule } from './municipalities/municipalities.module';
import { ObservabilityModule } from './observability/observability.module';
import { ParcelsModule } from './parcels/parcels.module';
import { PlansModule } from './plans/plans.module';
import { SearchModule } from './search/search.module';
import { SourcesModule } from './sources/sources.module';
import { StorageModule } from './storage/storage.module';

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
    HealthModule,
    CacheModule,
    IngestionModule,
    SearchModule,
    StorageModule,
    MapModule,
    ObservabilityModule,
    AnalysisModule
  ]
})
export class AppModule {}
