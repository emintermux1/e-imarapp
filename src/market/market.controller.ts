import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MarketService } from './market.service';
import type { ParcelMarketContext } from './market.types';

@ApiTags('market')
@Controller('market')
export class MarketController {
  constructor(private readonly market: MarketService) {}

  @Get('capabilities')
  capabilities() {
    return {
      status: 'ok',
      providers: ['sahibinden', 'emlakjet', 'hepsiemlak', 'zingat']
    };
  }

  @Post('parcel')
  parcel(@Body() body: { query: ParcelMarketContext }) {
    return this.market.inspectParcelMarket(body.query);
  }
}

