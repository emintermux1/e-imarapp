import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ParcelQueryDto } from './dto/parcel-query.dto';
import { ParcelsService } from './parcels.service';

@ApiTags('parcels')
@Controller('parcels')
export class ParcelsController {
  constructor(private readonly parcels: ParcelsService) {}

  @Post('query')
  query(@Body() dto: ParcelQueryDto): Promise<unknown> {
    return this.parcels.queryParcel(dto);
  }
}
