import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GeoIntersectionDto } from './dto/intersection.dto';
import { GeoService } from './geo.service';

@ApiTags('geo')
@Controller('geo')
export class GeoController {
  constructor(private readonly geo: GeoService) {}

  @Post('intersections')
  intersections(@Body() dto: GeoIntersectionDto) {
    return this.geo.intersections(dto);
  }
}
