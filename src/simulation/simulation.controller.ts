import { Controller, Get, Param, Query } from '@nestjs/common';
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
}
