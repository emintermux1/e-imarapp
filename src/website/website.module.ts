import { Module } from '@nestjs/common';
import { AnalysisModule } from '../analysis/analysis.module';
import { EplanModule } from '../eplan/eplan.module';
import { IngestionModule } from '../ingestion/ingestion.module';
import { MapModule } from '../map/map.module';
import { ParcelsModule } from '../parcels/parcels.module';
import { SimulationModule } from '../simulation/simulation.module';
import { UserDataModule } from '../user-data/user-data.module';
import { WebsiteController } from './website.controller';
import { WebsiteService } from './website.service';

@Module({
  imports: [ParcelsModule, AnalysisModule, SimulationModule, UserDataModule, EplanModule, MapModule, IngestionModule],
  controllers: [WebsiteController],
  providers: [WebsiteService]
})
export class WebsiteModule {}
