import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNumber, IsObject, IsOptional, IsString, Max, Min, ValidateIf } from 'class-validator';

export class ParcelQueryDto {
  @ApiPropertyOptional({ enum: ['ada_parsel', 'coordinate', 'address', 'geojson', 'kml'] })
  @IsIn(['ada_parsel', 'coordinate', 'address', 'geojson', 'kml'])
  type!: 'ada_parsel' | 'coordinate' | 'address' | 'geojson' | 'kml';

  @ValidateIf((dto: ParcelQueryDto) => dto.type === 'ada_parsel')
  @IsString()
  municipalityId?: string;

  @ValidateIf((dto: ParcelQueryDto) => dto.type === 'ada_parsel')
  @IsString()
  ada?: string;

  @ValidateIf((dto: ParcelQueryDto) => dto.type === 'ada_parsel')
  @IsString()
  parsel?: string;

  @ValidateIf((dto: ParcelQueryDto) => dto.type === 'coordinate')
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ValidateIf((dto: ParcelQueryDto) => dto.type === 'coordinate')
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ValidateIf((dto: ParcelQueryDto) => dto.type === 'address')
  @IsString()
  address?: string;

  @ValidateIf((dto: ParcelQueryDto) => dto.type === 'geojson')
  @IsObject()
  geojson?: Record<string, unknown>;

  @ValidateIf((dto: ParcelQueryDto) => dto.type === 'kml')
  @IsString()
  kml?: string;

  @ApiPropertyOptional({ description: 'Optional EPSG code for coordinate inputs. Defaults to 4326.' })
  @IsOptional()
  @IsNumber()
  srid?: number;
}
