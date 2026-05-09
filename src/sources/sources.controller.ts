import { Controller, Get, Param, Query } from '@nestjs/common';
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
    @Query('vendor') vendor?: string,
    @Query('accessStatus') accessStatus?: SourceAccessStatus
  ) {
    return this.sources.municipalities({ province, vendor, accessStatus });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.sources.get(id);
  }
}
