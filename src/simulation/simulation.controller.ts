import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SimulationService } from './simulation.service';

@ApiTags('simulation')
@Controller('simulation')
export class SimulationController {
  constructor(private readonly simulation: SimulationService) {}

  @Get('building-envelope/:parcelId')
  buildingEnvelope(@Param('parcelId') parcelId: string, @Query('userReference') userReference?: string) {
    return this.simulation.buildingEnvelope(parcelId, userReference);
  }

  @Get('merge-candidates/:parcelId')
  mergeCandidates(@Param('parcelId') parcelId: string) {
    return this.simulation.mergeCandidates(parcelId);
  }

  @Post('emsal-share/calculate')
  calculateEmsalShare(
    @Body() body: {
      parcelAreaM2: number;
      emsal: number;
      taksRatio?: number;
      floorAreaPerUnitM2?: number;
      parkingPerUnit?: number;
      ownerShareRatio?: number;
      contractorShareRatio?: number;
      circulationLossRatio?: number;
    }
  ) {
    return this.simulation.calculateEmsalShare(body);
  }

  @Post('compliance')
  compliance(
    @Body() body: {
      parcel_id?: number;
      parcel_area_m2?: number;
      emsal?: number;
      kaks?: number;
      taks?: number;
      gabari_m?: number;
      floors?: number;
      floor_height_m?: number;
      geometry?: unknown;
    }
  ) {
    return this.simulation.checkCompliance(body);
  }
}
