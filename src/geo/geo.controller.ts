import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GeoIntersectionDto } from './dto/intersection.dto';
import { GeoService } from './geo.service';

@ApiTags('geo')
@Controller('geo')
export class GeoController {
  constructor(private readonly geo: GeoService) {}

  @Post('intersections')
  intersections(@Body() dto: GeoIntersectionDto): Promise<unknown> {
    return this.geo.intersections(dto);
  }

  @Get('point')
  pointInPolygon(
    @Query('lon') lon: string,
    @Query('lat') lat: string,
    @Query('srid') srid?: string
  ): Promise<unknown> {
    return this.geo.pointInPolygon(parseFloat(lon), parseFloat(lat), srid ? parseInt(srid, 10) : 4326);
  }

  @Get('buffer')
  buffer(
    @Query('lon') lon: string,
    @Query('lat') lat: string,
    @Query('radius') radius: string,
    @Query('srid') srid?: string
  ): Promise<unknown> {
    return this.geo.buffer(parseFloat(lon), parseFloat(lat), parseFloat(radius), srid ? parseInt(srid, 10) : 4326);
  }

  @Post('overlay')
  overlay(@Body() body: { geometry: Record<string, unknown> }): Promise<unknown> {
    return this.geo.zoningOverlay(body.geometry);
  }
}
