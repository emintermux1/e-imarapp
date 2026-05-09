import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MapService } from './map.service';

@ApiTags('map')
@Controller('map')
export class MapController {
  constructor(private readonly map: MapService) {}

  @Get('tiles/status')
  tileServerStatus(): Promise<unknown> {
    return this.map.tileServerStatus();
  }

  @Get('tiles/cache-strategy')
  tileCacheStrategy() {
    return this.map.tileCacheStrategy();
  }

  @Get('layers')
  layers() {
    return this.map.layers();
  }

  @Get('providers')
  providers() {
    return this.map.providers();
  }

  @Get('providers/health')
  providerHealth() {
    return this.map.providerHealth();
  }

  @Get('providers/styles')
  providerStyles() {
    return this.map.providerStyles();
  }
}
