import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DiscoveryService } from '../connectors/discovery.service';
import { SourceDiscoveryResult, SourceMetadata } from '../connectors/connector.types';
import { DiscoverMunicipalityDto } from './dto/discover-municipality.dto';
import { DiscoverSourceDto } from './dto/discover-source.dto';

@ApiTags('sources')
@Controller('sources')
export class SourcesController {
  constructor(private readonly discovery: DiscoveryService) {}

  @Get()
  listSources(): readonly SourceMetadata[] {
    return this.discovery.listSources();
  }

  @Post('discover')
  discover(@Body() dto: DiscoverSourceDto): Promise<SourceDiscoveryResult> {
    return this.discovery.discoverSource(dto.sourceId ?? 'tkgm-parsel-sorgu');
  }

  @Post('discover/municipality')
  discoverMunicipality(@Body() dto: DiscoverMunicipalityDto) {
    return this.discovery.discoverMunicipalityPatterns(dto.municipalitySlug);
  }
}
