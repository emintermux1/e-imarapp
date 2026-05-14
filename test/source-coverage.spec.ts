import { ConnectorKind, ProbeStatus } from '../src/connectors/connector.types';
import { DiscoveryService } from '../src/connectors/discovery.service';
import { HttpProbeService } from '../src/connectors/http-probe.service';
import { SOURCE_REGISTRY } from '../src/sources/source-registry';
import { SourceActivationService } from '../src/sources/source-activation.service';
import { summarizeSources } from '../src/sources/source-coverage';
import { TURKEY_PROVINCES } from '../src/sources/turkey-coverage';
import { SourcesController } from '../src/sources/sources.controller';
import { SourcesService } from '../src/sources/sources.service';
import { WebsiteService } from '../src/website/website.service';

describe('source coverage summary', () => {
  it('counts registered coverage dimensions and municipal seeds', () => {
    const summary = summarizeSources(SOURCE_REGISTRY, '2026-05-08T00:00:00.000Z');

    expect(summary.totalSources).toBe(SOURCE_REGISTRY.length);
    expect(summary.municipalSources).toBe(SOURCE_REGISTRY.filter((source) => source.jurisdiction === 'municipal').length);
    expect(summary.nationalSources).toBe(SOURCE_REGISTRY.filter((source) => source.jurisdiction === 'national').length);
    expect(summary.globalSources).toBe(SOURCE_REGISTRY.filter((source) => source.jurisdiction === 'global').length);
    expect(summary.nationalMunicipalCount.national).toBe(summary.nationalSources);
    expect(summary.nationalMunicipalCount.municipal).toBe(summary.municipalSources);
    expect(summary.byVendor.netcad).toBeGreaterThan(20);
    expect(summary.byCategory.municipal_gis).toBeGreaterThan(0);
    expect(summary.byCapability.municipal_gis).toBeGreaterThan(0);
    expect(summary.byProvince['İstanbul']).toBeGreaterThan(0);
    expect(summary.byConnectorKind[ConnectorKind.NetcadKeos]).toBeGreaterThan(0);
    expect(summary.publicCandidateCount).toBeGreaterThan(summary.protectedCount);
    expect(summary.legalProtectedCount).toBeGreaterThan(0);
    expect(summary.topCoveredProvinces.length).toBeGreaterThan(0);
    expect(summary.metadataOnlyProvinces.length).toBeGreaterThan(0);
    expect(summary.uncoveredProvinces.length).toBeLessThan(TURKEY_PROVINCES.length);
    expect(summary.lastGeneratedAt).toBe('2026-05-08T00:00:00.000Z');
  });

  it('covers all 81 provinces in the turkey coverage dataset', () => {
    const provinceNames = new Set(TURKEY_PROVINCES.map((province) => province.name));

    expect(TURKEY_PROVINCES).toHaveLength(81);
    expect(provinceNames.size).toBe(81);
    expect(provinceNames.has('İstanbul')).toBe(true);
    expect(provinceNames.has('Ankara')).toBe(true);
    expect(provinceNames.has('İzmir')).toBe(true);
    expect(provinceNames.has('Düzce')).toBe(true);
  });

  it('returns requested municipal seeds through municipalities summary filters', () => {
    const service = new SourcesService();
    const result = service.municipalities({ vendor: 'netcad' });
    const ids = new Set(result.municipalities.map((source) => source.id));

    expect(ids.has('suleymanpasa-keos-imar')).toBe(true);
    expect(ids.has('mustafakemalpasa-keos-imar')).toBe(true);
    expect(ids.has('gelibolu-keos-imar')).toBe(true);
    expect(ids.has('caycuma-keos')).toBe(true);
    expect(result.municipalities[0]).toHaveProperty('connectorKinds');
    expect(result.municipalities[0]).toHaveProperty('capability.imarQuerySupport');
  });

  it('keeps summary and municipality routes ahead of dynamic id lookup', () => {
    const controller = new SourcesController(new SourcesService());

    expect(controller.summary()).toHaveProperty('sourceCoverage.totalSources', SOURCE_REGISTRY.length);
    expect(controller.coverage()).toHaveProperty('sourceCoverage.totalSources', SOURCE_REGISTRY.length);
    expect(controller.municipalities(undefined, undefined, undefined, undefined)).toHaveProperty('count');
    expect(controller.municipalityCoverage('İstanbul', undefined, 'netcad', undefined)).toHaveProperty('count');
    expect(() => controller.get('summary')).toThrow("Source 'summary' is not registered.");
  });

  it('returns municipality capability status without live probe assumptions', () => {
    const service = new SourcesService();
    const capability = service.municipalityCapability('pendik');

    expect(capability.registered).toBe(true);
    expect(capability.source?.id).toBe('pendik-keos-imar');
    expect(capability.lastHealth).toBeNull();
    expect(capability.imarQuerySupport).toBe('method_contract_required');
    expect(capability.parcelGeometrySupport).toBe('tkgm_candidate');
    expect(capability.reasonNoData).toContain('method contract');
  });

  it('normalizes source candidate preview without registry writes', () => {
    const service = new SourcesService();
    const preview = service.normalizeCandidate({ url: 'https://keos.ornek.bel.tr/imardurumu/', name: 'Örnek Belediyesi', province: 'Ankara', district: 'Örnek', probe: true }) as any;

    expect(preview.status).toBe('ok');
    expect(preview.vendor).toBe('netcad');
    expect(preview.municipalitySlug).toBe('ornek');
    expect(preview.wouldRegister.id).toBe('ornek-netcad-candidate');
    expect(preview.probeCandidates.length).toBeGreaterThan(0);
    expect(() => service.get('ornek-netcad-candidate')).toThrow();
  });

  it('does not store secret values beyond environment variable names', () => {
    const serialized = JSON.stringify({ registry: SOURCE_REGISTRY, summary: summarizeSources(SOURCE_REGISTRY) });

    expect(serialized).toContain('MAPBOX_ACCESS_TOKEN');
    expect(serialized).toContain('MAPTILER_API_KEY');
    expect(serialized).toContain('CESIUM_ION_TOKEN');
    expect(serialized).toContain('HERE_API_KEY');
    expect(serialized).not.toMatch(/pk\.|sk\.|eyJ|AIza|glpat|ghp_/);
  });

  it('does not fabricate official parcel results for protected national systems', () => {
    const tkgm = SOURCE_REGISTRY.find((source) => source.id === 'tkgm-parsel-sorgu');
    const parcelSources = SOURCE_REGISTRY.filter((source) => source.category === 'parcel');

    expect(tkgm?.access.status).toBe('requires_legal_agreement');
    expect(tkgm?.access.notes).toContain('lawful automation');
    expect(parcelSources.every((source) => source.access.status !== 'public')).toBe(true);
    expect(parcelSources.some((source) => source.access.status === 'requires_legal_agreement')).toBe(true);
  });
});

describe('public source health discovery', () => {
  it('skips protected sources without probing them', async () => {
    const probe = { probe: jest.fn() } as unknown as HttpProbeService;
    const service = new DiscoveryService(probe);

    const result = await service.discoverPublicHealth({ accessStatus: 'requires_credentials', limit: 10 });

    expect(result.totals.checked).toBe(0);
    expect(result.totals.skippedProtected).toBeGreaterThan(0);
    expect(result.results.every((entry) => entry.bestStatus === 'skipped_protected')).toBe(true);
    expect(probe.probe).not.toHaveBeenCalled();
  });

  it('applies the hard limit cap for public candidate probes', async () => {
    const probe = {
      probe: jest.fn(async (endpoint: string) => ({ endpoint, status: ProbeStatus.Unavailable, detectedKinds: [] }))
    } as unknown as HttpProbeService;
    const service = new DiscoveryService(probe);

    const result = await service.discoverPublicHealth({ limit: 500 });

    expect(result.limit).toBe(50);
    expect(result.totals.checked).toBeLessThanOrEqual(50);
    expect(result.totals.skippedProtected).toBeGreaterThan(0);
  });

  it('summarizes available endpoints without secret material', async () => {
    const probe = {
      probe: jest.fn(async (endpoint: string) => ({
        endpoint,
        status: endpoint.includes('MapService') ? ProbeStatus.Available : ProbeStatus.Unavailable,
        detectedKinds: endpoint.includes('MapService') ? [ConnectorKind.NetcadKeos] : []
      }))
    } as unknown as HttpProbeService;
    const service = new DiscoveryService(probe);

    const result = await service.discoverPublicHealth({ connectorKind: ConnectorKind.NetcadKeos, province: 'İstanbul', limit: 1 });

    expect(result.status).toBe('ok');
    expect(result.totals.checked).toBe(1);
    expect(result.totals.available).toBe(1);
    expect(result.results[0].availableEndpoints.join(' ')).not.toMatch(/token|key|secret|cookie/i);
  });
});

describe('government source activation', () => {
  it('keeps protected government systems blocked without live probing', () => {
    const activation = new SourceActivationService();
    const result = activation.activation();
    const tkgm = result.sources.find((source) => source.sourceId === 'tkgm-parsel-sorgu');
    const edevlet = result.sources.find((source) => source.sourceId === 'edevlet-csb-tucbs');

    expect(tkgm?.activationStatus).toBe('blocked');
    expect(tkgm?.blockedReason).toBe('requires_legal_agreement');
    expect(tkgm?.usableEndpoints).toHaveLength(0);
    expect(edevlet?.activationStatus).toBe('blocked');
    expect(edevlet?.blockedReason).toBe('requires_credentials');
    expect(result.summary.blocked).toBeGreaterThanOrEqual(2);
  });

  it('promotes public probe availability into active activation state', () => {
    const activation = new SourceActivationService();
    const source = SOURCE_REGISTRY.find((entry) => entry.id === 'pendik-keos-imar')!;
    const record = activation.activationForSource(source, [
      {
        endpoint: 'https://keos.pendik.bel.tr/imardurumu/Services/MapService.ashx',
        status: ProbeStatus.Available,
        detectedKinds: [ConnectorKind.NetcadKeos]
      }
    ]);

    expect(record.activationStatus).toBe('active');
    expect(record.runtimeStatus).toBe('public');
    expect(record.usableEndpoints[0]).toContain('MapService');
    expect(record.nextAction).toContain('Public endpoint aktif');
  });

  it('maps captcha or credential probes to blocked activation state', () => {
    const activation = new SourceActivationService();
    const source = SOURCE_REGISTRY.find((entry) => entry.id === 'pendik-keos-imar')!;
    const record = activation.activationForSource(source, [
      {
        endpoint: source.homepageUrl,
        status: ProbeStatus.CaptchaRequired,
        detectedKinds: [ConnectorKind.NetcadKeos]
      }
    ]);

    expect(record.activationStatus).toBe('blocked');
    expect(record.runtimeStatus).toBe('captcha_required');
    expect(record.blockedReason).toBe('captcha_required');
    expect(record.usableEndpoints).toHaveLength(0);
  });
});

describe('website bootstrap source coverage', () => {
  it('returns registry-only source coverage without live probing', async () => {
    const map = {
      tileServerStatus: jest.fn(async () => ({ status: 'ok' })),
      providers: jest.fn(async () => ({ status: 'ok', providers: [] }))
    };
    const ingestion = { accessRequirements: jest.fn(() => ({ status: 'ok' })) };
    const sources = new SourcesService();
    const sourceActivation = new SourceActivationService();
    const service = new WebsiteService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      map as any,
      ingestion as any,
      sources,
      sourceActivation,
      {} as any
    );

    const bootstrap = (await service.bootstrap()) as { sourceCoverage?: { totalSources: number; publicCandidateCount: number }; sourceActivation?: { total: number; blocked: number }; activeSources?: unknown[]; websiteCapabilities?: { municipalParcelWorkflow: boolean } };

    expect(bootstrap.sourceCoverage?.totalSources).toBe(SOURCE_REGISTRY.length);
    expect(bootstrap.sourceActivation?.total).toBeGreaterThan(0);
    expect(bootstrap.sourceActivation?.blocked).toBeGreaterThan(0);
    expect(bootstrap.activeSources?.length).toBeGreaterThan(0);
    expect(bootstrap.sourceCoverage?.publicCandidateCount).toBeGreaterThan(0);
    expect(bootstrap.websiteCapabilities?.municipalParcelWorkflow).toBe(true);
    expect(map.tileServerStatus).toHaveBeenCalledTimes(1);
  });
});
