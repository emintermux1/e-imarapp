import { IsArray, IsObject, IsOptional, IsString } from 'class-validator';

export class GeoIntersectionDto {
  @IsObject()
  geometry!: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  layerIds?: string[];
}
