import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SourceActivationService } from './source-activation.service';
import { SourceAccessStatus } from './source-registry';
import { SourcesService } from './sources.service';

@ApiTags('sources')
@Controller('sources')
export class SourcesController {
  constructor(private readonly sources: SourcesService, private readonly activation?: SourceActivationService) {}

  @Get()
  list() {
    return this.sources.list();
  }

  @Get('summary')
  summary() {
    return this.sources.summary();
  }

  @Get('coverage')
  coverage() {
    return this.sources.summary();
  }

  @Get('activation')
  activationState(@Query('live_check') liveCheck?: string, @Query('limit') limit?: string, @Query('force') force?: string) {
    return liveCheck === 'true'
      ? this.activation?.activateLive({ limit: this.parseLimit(limit), force: force === 'true' })
      : this.activation?.activation({ limit: this.parseLimit(limit) });
  }

  @Get('activation/summary')
  activationSummary() {
    return { status: 'ok', generatedAt: new Date().toISOString(), summary: this.activation?.activationSummary() };
  }

  @Get('health')
  health() {
    const activation = this.activation?.activation({ limit: 100 });
    return {
      status: 'ok',
      sources: activation?.sources.map((source) => ({
        source_id: source.sourceId,
        name: source.name,
        slug: source.metadata?.municipalitySlug,
        kind: source.category,
        homepage_url: source.homepageUrl,
        status: this.healthStatus(source.activationStatus),
        checked_url: source.usableEndpoints[0] ?? source.homepageUrl,
        requires_approval: source.accessStatus === 'requires_legal_agreement',
        requires_credentials: source.accessStatus === 'requires_credentials'
      })) ?? []
    };
  }

  @Get('quality')
  quality(@Query('limit') limit?: string, @Query('live_check') liveCheck?: string, @Query('capability') capability?: string) {
    const activation = this.activation?.activation({ limit: this.parseLimit(limit) ?? 12 });
    const sources = activation?.sources.filter((source) => !capability || source.capabilities.includes(capability)) ?? [];
    const rollup = sources.reduce<Record<string, number>>((acc, source) => {
      const status = this.qualityStatus(source.activationStatus);
      acc[status] = (acc[status] ?? 0) + 1;
      return acc;
    }, {});
    return {
      status: sources.some((source) => source.activationStatus === 'active') ? 'live' : 'public_metadata',
      fetched_at: activation?.generatedAt ?? new Date().toISOString(),
      history_available: false,
      total: sources.length,
      live_checked: liveCheck === 'true',
      rollup,
      sources: sources.map((source) => ({
        source_id: source.sourceId,
        key: source.sourceId,
        name: source.name,
        province: source.metadata?.province ?? null,
        district: source.metadata?.district ?? null,
        municipality_name: source.metadata?.municipalitySlug ?? null,
        category: source.category,
        type: source.jurisdiction,
        provider: source.metadata?.vendor ?? source.connectorKinds[0] ?? null,
        status: this.qualityStatus(source.activationStatus),
        raw_status: source.activationStatus,
        last_checked_at: source.lastCheckedAt,
        last_success_at: source.activationStatus === 'active' ? source.lastCheckedAt : null,
        latency_ms: null,
        http_status: null,
        endpoint_url: source.usableEndpoints[0] ?? source.homepageUrl,
        service_url: source.usableEndpoints[0] ?? null,
        failure_reason: source.blockedReason ?? null,
        coverage: {
          has_geometry: source.capabilities.some((item) => ['parcel_lookup', 'municipal_gis', 'wms', 'wfs', 'arcgis_rest'].includes(item)),
          has_imar: source.capabilities.some((item) => ['zoning_status', 'plan_lookup', 'plan_catalog'].includes(item)),
          has_aski: source.capabilities.some((item) => item.includes('aski') || item.includes('plan')),
          has_documents: source.capabilities.some((item) => item.includes('catalog') || item.includes('legal_reference')),
          capabilities: source.capabilities
        },
        geometry_available: source.activationStatus === 'active' && source.capabilities.some((item) => ['parcel_lookup', 'wms', 'wfs', 'arcgis_rest'].includes(item)),
        imar_available: source.activationStatus === 'active' && source.capabilities.some((item) => ['zoning_status', 'plan_lookup', 'plan_catalog'].includes(item)),
        aski_available: source.activationStatus === 'active' && source.capabilities.some((item) => item.includes('plan')),
        history_available: false,
        endpoint_count: source.usableEndpoints.length,
        discovered_endpoints: source.usableEndpoints.map((url) => ({ url })),
        next_action: source.nextAction,
        user_message: source.blockedReason ? `Kaynak aktif değil: ${source.blockedReason}` : source.nextAction
      }))
    };
  }

  @Get('municipalities')
  municipalities(
    @Query('province') province?: string,
    @Query('district') district?: string,
    @Query('vendor') vendor?: string,
    @Query('accessStatus') accessStatus?: SourceAccessStatus
  ) {
    return this.sources.municipalities({ province, district, vendor, accessStatus });
  }

  @Get('municipality-coverage')
  municipalityCoverage(
    @Query('province') province?: string,
    @Query('district') district?: string,
    @Query('vendor') vendor?: string,
    @Query('accessStatus') accessStatus?: SourceAccessStatus
  ) {
    return this.sources.municipalityCoverage({ province, district, vendor, accessStatus });
  }

  @Get('municipalities/:id/capability')
  municipalityCapability(@Param('id') id: string) {
    return this.sources.municipalityCapability(id);
  }

  @Post('candidates/normalize')
  normalizeCandidate(@Body() body: { url: string; name?: string; province?: string; district?: string; probe?: boolean }) {
    return this.sources.normalizeCandidate(body);
  }

  @Post(':id/discover')
  async discover(@Param('id') id: string) {
    const source = this.sources.get(id);
    const record = this.activation?.activationForSource(source);
    return { status: 'ok', source, activation: record };
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.sources.get(id);
  }

  private parseLimit(value?: string): number | undefined {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : undefined;
  }

  private healthStatus(status: string): string {
    if (status === 'active') return 'live';
    if (status === 'blocked') return 'requires_approval';
    if (status === 'unavailable') return 'timeout';
    return 'external_only';
  }

  private qualityStatus(status: string): string {
    if (status === 'active') return 'live';
    if (status === 'blocked' || status === 'unavailable') return 'unavailable';
    if (status === 'needs_contract' || status === 'metadata_only') return 'public_metadata';
    return 'not_ready';
  }
}
