import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class DiscoverSourceDto {
  @ApiPropertyOptional({
    description: 'Registered source id. Defaults to tkgm-parsel-sorgu when omitted for safe smoke checks.'
  })
  @IsOptional()
  @IsString()
  sourceId?: string;
}
