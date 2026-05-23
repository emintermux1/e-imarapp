import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MarketAnalysisService } from './market-analysis.service';
import { MarketController } from './market.controller';
import { MarketService } from './market.service';

@Module({
  imports: [ConfigModule],
  controllers: [MarketController],
  providers: [MarketService, MarketAnalysisService],
  exports: [MarketService]
})
export class MarketModule {}

