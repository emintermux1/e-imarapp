import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SOURCE_REGISTRY } from './source-registry';
import { SourcesService } from './sources.service';

@ApiTags('sources')
@Controller('sources')
export class SourcesController {
  constructor(private readonly sources: SourcesService) {}

  @Get()
  list() {
    return this.sources.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.sources.get(id);
  }
}
