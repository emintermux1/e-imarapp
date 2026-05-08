import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StorageService } from './storage.service';

@ApiTags('storage')
@Controller('storage')
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  @Get('status')
  status(): Promise<unknown> {
    return this.storage.status();
  }

  @Get('buckets')
  buckets() {
    return this.storage.buckets();
  }
}
