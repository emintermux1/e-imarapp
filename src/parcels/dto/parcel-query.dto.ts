import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn, IsInt, IsNumber, IsObject, IsOptional, IsString, Max, Min } from 'class-validator';

export class ParcelQueryDto {
  @ApiProperty({ enum: ['ada_parsel', 'coordinate', 'address', 'geojson', 'kml'] })
  @IsIn(['ada_parsel', 'coordinate', 'address', 'geojson', 'kml'])
  type!: 'ada_parsel' | 'coordinate' | 'address' | 'geojson' | 'kml';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ada?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  parselNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ default: 4326 })
  @IsOptional()
  @IsNumber()
  srid?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'GeoJSON geometry object' })
  @IsOptional()
  @IsObject()
  geometry?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Raw KML string' })
  @IsOptional()
  @IsString()
  kml?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  municipalityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceId?: string;

  @ApiPropertyOptional({ description: 'WGS84 bbox as [minLon, minLat, maxLon, maxLat]' })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  bbox?: number[];

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
