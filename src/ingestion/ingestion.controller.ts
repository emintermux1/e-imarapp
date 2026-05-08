import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IngestionService } from './ingestion.service';

@ApiTags('ingestion')
@Controller('ingestion')
export class IngestionController {
  constructor(private readonly ingestion: IngestionService) {}

  @Get('capabilities')
  capabilities() {
    return this.ingestion.capabilities();
  }

  @Get('requirements')
  requirements() {
    return this.ingestion.accessRequirements();
  }

  @Get('ai-gis-pipeline')
  aiGisPipeline() {
    return this.ingestion.aiGisPipeline();
  }
}
