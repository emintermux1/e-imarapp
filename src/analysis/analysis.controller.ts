import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
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

  @Post('parcel-potential')
  parcelPotential(
    @Body() body: {
      parcelId?: string;
      parcelAreaM2?: number;
      emsal?: number;
      taks?: number;
      zoningFunction?: string;
      averageUnitM2?: number;
    }
  ): Promise<unknown> {
    return this.analysis.parcelPotentialSummary(body);
  }

  @Post('plan-notes/explain')
  explainPlanNotes(
    @Body() body: {
      noteText: string;
      audience?: 'citizen' | 'architect' | 'investor';
      maxBullets?: number;
    }
  ): Promise<unknown> {
    return this.analysis.explainPlanNotes(body);
  }
}
