import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SatelliteService } from './satellite.service';

@ApiTags('satellite')
@Controller('satellite')
export class SatelliteController {
  constructor(private readonly satellite: SatelliteService) {}

  @Get('providers')
  providers() {
    return this.satellite.providers();
  }

  @Post('analysis/request')
  request(@Body() body: Parameters<SatelliteService['requestAnalysis']>[0]) {
    return this.satellite.requestAnalysis(body);
  }
}
