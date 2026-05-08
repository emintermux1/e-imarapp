import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SearchService } from './search.service';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Get('status')
  status(): Promise<unknown> {
    return this.search.status();
  }

  @Get('indices')
  indices() {
    return this.search.indexDefinitions();
  }
}
