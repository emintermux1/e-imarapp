import { Body, Controller, Get, HttpException, HttpStatus, Param, Post, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { RateLimitService } from '../common/rate-limit.service';
import { DiscoveryService, PublicHealthFilters } from './discovery.service';
import { NetcadKeosService } from './netcad-keos.service';
import { OgcDiscoveryService } from './ogc-discovery.service';

@ApiTags('connectors')
@Controller('connectors')
export class ConnectorsController {
  constructor(
    private readonly discovery: DiscoveryService,
    private readonly netcad: NetcadKeosService,
    private readonly ogc: OgcDiscoveryService,
    private readonly rateLimit: RateLimitService
  ) {}

  @Get('netcad/strategy')
  netcadStrategy() {
    return this.netcad.strategy();
  }

  @Post('discover-public')
  discoverPublic(@Body() body: PublicHealthFilters = {}, @Query() query: PublicHealthFilters = {}, @Req() request: FastifyRequest) {
    this.enforceConnectorRateLimit(request, 'discover-public');
    return this.discovery.discoverPublicHealth({ ...body, ...query, limit: this.capLimit(body.limit ?? query.limit, 25) });
  }

  @Post('public-health')
  publicHealth(@Body() body: PublicHealthFilters = {}, @Query() query: PublicHealthFilters = {}, @Req() request: FastifyRequest) {
    this.enforceConnectorRateLimit(request, 'public-health');
    return this.discovery.discoverPublicHealth({ ...body, ...query, limit: this.capLimit(body.limit ?? query.limit, 25) });
  }

  @Post(':id/netcad/discover')
  discoverNetcad(@Param('id') id: string) {
    return this.netcad.discover(id);
  }

  @Post(':id/netcad/resolve-methods')
  resolveNetcadMethods(@Param('id') id: string, @Body() body: { endpoint?: string } = {}) {
    return this.netcad.resolveMethods(id, body);
  }

  @Post(':id/ogc/catalog')
  ogcCatalog(@Param('id') id: string, @Body() body: { endpoint?: string; service?: 'WMS' | 'WFS' } = {}, @Query('endpoint') endpoint?: string, @Query('service') service?: 'WMS' | 'WFS') {
    return this.ogc.catalog(id, { ...body, endpoint: endpoint ?? body.endpoint, service: service ?? body.service });
  }

  @Post(':id/discover')
  discoverSource(@Param('id') id: string, @Req() request: FastifyRequest) {
    this.enforceConnectorRateLimit(request, 'source-discover');
    return this.discovery.discoverSource(id);
  }

  @Post('municipality-patterns/:slug')
  municipalityPatterns(@Param('slug') slug: string, @Req() request: FastifyRequest) {
    this.enforceConnectorRateLimit(request, 'municipality-patterns');
    return this.discovery.discoverMunicipalityPatterns(slug);
  }

  private enforceConnectorRateLimit(request: FastifyRequest, action: string): void {
    const ip = request.ip ?? request.socket.remoteAddress ?? 'unknown';
    const userAgent = request.headers['user-agent'] ?? 'unknown';
    const decision = this.rateLimit.check(`connector:${action}:${ip}:${userAgent}`);
    if (!decision.allowed) {
      throw new HttpException({
        status: 'rate_limited',
        message: 'Public connector metadata endpoints are rate limited to protect upstream municipal systems.',
        retryAfterMs: Math.max(0, decision.resetAt - Date.now())
      }, HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private capLimit(limit: unknown, fallback: number): number {
    const parsed = Number(limit ?? fallback);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(1, Math.min(fallback, Math.trunc(parsed)));
  }
}
