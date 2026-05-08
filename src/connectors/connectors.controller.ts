import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DiscoveryService, PublicHealthFilters } from './discovery.service';
import { NetcadKeosService } from './netcad-keos.service';

@ApiTags('connectors')
@Controller('connectors')
export class ConnectorsController {
  constructor(
    private readonly discovery: DiscoveryService,
    private readonly netcad: NetcadKeosService
  ) {}

  @Get('netcad/strategy')
  netcadStrategy() {
    return this.netcad.strategy();
  }

  @Post('discover-public')
  discoverPublic(@Body() body: PublicHealthFilters = {}, @Query() query: PublicHealthFilters = {}) {
    return this.discovery.discoverPublicHealth({ ...body, ...query });
  }

  @Post('public-health')
  publicHealth(@Body() body: PublicHealthFilters = {}, @Query() query: PublicHealthFilters = {}) {
    return this.discovery.discoverPublicHealth({ ...body, ...query });
  }

  @Post(':id/netcad/discover')
  discoverNetcad(@Param('id') id: string) {
    return this.netcad.discover(id);
  }

  @Post(':id/discover')
  discoverSource(@Param('id') id: string) {
    return this.discovery.discoverSource(id);
  }

  @Post('municipality-patterns/:slug')
  municipalityPatterns(@Param('slug') slug: string) {
    return this.discovery.discoverMunicipalityPatterns(slug);
  }
}
