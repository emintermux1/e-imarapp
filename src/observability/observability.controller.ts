import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('observability')
@Controller('observability')
export class ObservabilityController {
  private readonly startedAt = Date.now();

  @Get('metrics')
  @Header('content-type', 'text/plain; version=0.0.4')
  metrics(): string {
    const uptimeSeconds = Math.floor((Date.now() - this.startedAt) / 1000);
    return [
      '# HELP eimar_api_up API process health.',
      '# TYPE eimar_api_up gauge',
      'eimar_api_up 1',
      '# HELP eimar_api_uptime_seconds API process uptime in seconds.',
      '# TYPE eimar_api_uptime_seconds counter',
      `eimar_api_uptime_seconds ${uptimeSeconds}`
    ].join('\n');
  }

  @Get('status')
  status() {
    return {
      structuredLogging: 'Fastify/Pino JSON logger enabled through Nest Fastify adapter.',
      metrics: '/observability/metrics',
      prometheus: 'docker compose service prometheus scrapes /observability/metrics',
      grafana: 'docker compose service grafana exposed on port 3001',
      opentelemetry: 'OpenTelemetry collector/exporter wiring is reserved for deployment-specific configuration.'
    };
  }
}
