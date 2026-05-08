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

  @Get('layers')
  layers() {
    return this.map.layers();
  }
}
