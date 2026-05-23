import { Controller, Get, Module } from '@nestjs/common';

@Controller(['health', 'api/v1/health'])
export class HealthController {
  @Get()
  health() {
    return {
      status: 'ok',
      service: 'turkiye-e-imar-platform',
      generatedAt: new Date().toISOString()
    };
  }
}

@Module({ controllers: [HealthController] })
export class HealthModule {}
