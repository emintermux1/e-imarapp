import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IngestionService } from './ingestion.service';

@ApiTags('ingestion')
@Controller('ingestion')
export class IngestionController {
  constructor(private readonly ingestion: IngestionService) {}

  @Get('requirements')
  requirements() {
    return this.ingestion.accessRequirements();
  }

  @Get('readiness')
  readiness() {
    return this.ingestion.readiness();
  }
}
