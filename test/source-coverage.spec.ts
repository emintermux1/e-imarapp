import { ConnectorKind, ProbeStatus } from '../src/connectors/connector.types';
import { DiscoveryService } from '../src/connectors/discovery.service';
import { HttpProbeService } from '../src/connectors/http-probe.service';
import { SOURCE_REGISTRY } from '../src/sources/source-registry';
import { summarizeSources } from '../src/sources/source-coverage';
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
    expect(summary.byVendor.netcad).toBeGreaterThan(20);
    expect(summary.byProvince['İstanbul']).toBeGreaterThan(0);
    expect(summary.byConnectorKind[ConnectorKind.NetcadKeos]).toBeGreaterThan(0);
    expect(summary.publicCandidateCount).toBeGreaterThan(summary.protectedCount);
    expect(summary.lastGeneratedAt).toBe('2026-05-08T00:00:00.000Z');
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
    expect(preview.accessStatusGuess).toBe('public');
    expect(preview.accessStatusReason.toLowerCase()).toContain('portal');
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

describe('website bootstrap source coverage', () => {
  it('returns registry-only source coverage without live probing', async () => {
    const map = {
      tileServerStatus: jest.fn(async () => ({ status: 'ok' })),
      providers: jest.fn(async () => ({ status: 'ok', providers: [] }))
    };
    const ingestion = { accessRequirements: jest.fn(() => ({ status: 'ok' })) };
    const sources = new SourcesService();
    const service = new WebsiteService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      map as any,
      ingestion as any,
      sources
    );

    const bootstrap = (await service.bootstrap()) as { sourceCoverage?: { totalSources: number; publicCandidateCount: number }; websiteCapabilities?: { municipalParcelWorkflow: boolean } };

    expect(bootstrap.sourceCoverage?.totalSources).toBe(SOURCE_REGISTRY.length);
    expect(bootstrap.sourceCoverage?.publicCandidateCount).toBeGreaterThan(0);
    expect(bootstrap.websiteCapabilities?.municipalParcelWorkflow).toBe(true);
    expect(map.tileServerStatus).toHaveBeenCalledTimes(1);
  });
});
