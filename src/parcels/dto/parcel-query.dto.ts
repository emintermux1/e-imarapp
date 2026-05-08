import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ParcelQueryDto {
  @ApiProperty({ enum: ['ada_parsel', 'coordinate', 'address', 'geojson', 'kml'] })
  type!: 'ada_parsel' | 'coordinate' | 'address' | 'geojson' | 'kml';

  @ApiPropertyOptional() ada?: string;
  @ApiPropertyOptional() parselNo?: string;
  @ApiPropertyOptional() longitude?: number;
  @ApiPropertyOptional() latitude?: number;
  @ApiPropertyOptional({ default: 4326 }) srid?: number;
  @ApiPropertyOptional() address?: string;
  @ApiPropertyOptional({ description: 'GeoJSON geometry object' }) geometry?: Record<string, unknown>;
  @ApiPropertyOptional({ description: 'Raw KML string' }) kml?: string;
  @ApiPropertyOptional() municipalityId?: string;
}
