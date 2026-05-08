import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class DiscoverMunicipalityDto {
  @ApiProperty({
    description: 'Lowercase municipality slug used in common bel.tr GIS subdomain patterns, for example pendik or cankaya.'
  })
  @IsString()
  @Matches(/^[a-z0-9-]+$/)
  municipalitySlug!: string;
}
