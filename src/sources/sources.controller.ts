import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SourceAccessStatus } from './source-registry';
import { SourcesService } from './sources.service';

@ApiTags('sources')
@Controller('sources')
export class SourcesController {
  constructor(private readonly sources: SourcesService) {}

  @Get()
  list() {
    return this.sources.list();
  }

  @Get('summary')
  summary() {
    return this.sources.summary();
  }

  @Get('coverage')
  coverage() {
    return this.sources.summary();
  }

  @Get('municipalities')
  municipalities(
    @Query('province') province?: string,
    @Query('district') district?: string,
    @Query('vendor') vendor?: string,
    @Query('accessStatus') accessStatus?: SourceAccessStatus
  ) {
    return this.sources.municipalities({ province, district, vendor, accessStatus });
  }

  @Get('municipality-coverage')
  municipalityCoverage(
    @Query('province') province?: string,
    @Query('district') district?: string,
    @Query('vendor') vendor?: string,
    @Query('accessStatus') accessStatus?: SourceAccessStatus
  ) {
    return this.sources.municipalityCoverage({ province, district, vendor, accessStatus });
  }

  @Get('municipalities/:id/capability')
  municipalityCapability(@Param('id') id: string) {
    return this.sources.municipalityCapability(id);
  }

  @Post('candidates/normalize')
  normalizeCandidate(@Body() body: { url: string; name?: string; province?: string; district?: string; probe?: boolean }) {
    return this.sources.normalizeCandidate(body);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.sources.get(id);
  }
}
