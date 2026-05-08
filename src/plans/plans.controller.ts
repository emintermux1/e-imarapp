import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PlansService } from './plans.service';

@ApiTags('plans')
@Controller('plans')
export class PlansController {
  constructor(private readonly plans: PlansService) {}

  @Get('suspensions')
  suspensions(@Query('limit') limit?: string): Promise<unknown> {
    return this.plans.suspensions(limit ? parseInt(limit, 10) : 100);
  }

  @Get(':planId/sheets')
  sheets(@Param('planId') planId: string): Promise<unknown> {
    return this.plans.planSheets(planId);
  }

  @Get(':planId/notes')
  notes(@Param('planId') planId: string): Promise<unknown> {
    return this.plans.planNotes(planId);
  }

  @Get('parcel/:parcelId/history')
  parcelHistory(@Param('parcelId') parcelId: string): Promise<unknown> {
    return this.plans.planHistory(parcelId);
  }
}
