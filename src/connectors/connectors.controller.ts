import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DiscoveryService } from './discovery.service';
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
