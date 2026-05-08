import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DatabaseService } from '../database/database.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly database: DatabaseService) {}

  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'turkiye-e-imar-platform',
      databaseConfigured: this.database.isConfigured(),
      timestamp: new Date().toISOString()
    };
  }
}
