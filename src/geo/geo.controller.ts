import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GeoService } from './geo.service';
import { GeometryValidationInput, GeometryValidationService } from './geometry-validation.service';

@ApiTags('geo')
@Controller('geo')
export class GeoController {
  constructor(
    private readonly geometryValidation: GeometryValidationService,
    private readonly geo: GeoService
  ) {}

  @Post('validate')
  validate(@Body() body: GeometryValidationInput) {
    return this.geometryValidation.validate(body);
  }

  @Get('integrity/summary')
  integritySummary() {
    return this.geo.integritySummary();
  }

  @Post('integrity/scan')
  integrityScan(@Body() body: { limit?: number } = {}) {
    return this.geo.integrityScan(body.limit);
  }

  @Get('audit/contract')
  auditContract() {
    return this.geo.auditContract();
  }

  @Get('performance/index-recommendations')
  indexRecommendations() {
    return this.geo.indexRecommendations();
  }

  @Get('performance/postgis-optimizations')
  postgisOptimizations() {
    return this.geo.postgisOptimizations();
  }

  @Get('performance/client-guidance')
  clientGuidance() {
    return this.geo.clientGuidance();
  }
}
