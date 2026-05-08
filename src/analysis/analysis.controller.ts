import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AnalysisService } from './analysis.service';

@ApiTags('analysis')
@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analysis: AnalysisService) {}

  @Get('pipeline')
  pipeline() {
    return this.analysis.pipeline();
  }

  @Get('runs')
  runs(@Query('limit') limit?: string): Promise<unknown> {
    return this.analysis.runs(limit ? parseInt(limit, 10) : 50);
  }

  @Get('provenance/:parcelId')
  provenance(@Param('parcelId') parcelId: string): Promise<unknown> {
    return this.analysis.provenance(parcelId);
  }
}
