import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MunicipalGisDiscoveryService } from './municipal-gis-discovery.service';

@ApiTags('municipalities')
@Controller(['municipalities', 'api/v1/municipalities'])
export class MunicipalitiesController {
  constructor(private readonly discovery: MunicipalGisDiscoveryService) {}

  @Post(':slug/discover')
  discover(@Param('slug') slug: string, @Query('force') force?: string) {
    return this.discovery.discover(slug, force === 'true');
  }

  @Get(':slug/gis-endpoints')
  listGisEndpoints(@Param('slug') slug: string) {
    return this.discovery.listEndpoints(slug);
  }

  @Post(':slug/gis-endpoints/refresh')
  refreshGisEndpoints(@Param('slug') slug: string, @Query('force') force?: string) {
    return this.discovery.discover(slug, force !== 'false');
  }
}
