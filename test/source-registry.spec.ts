import { SOURCE_REGISTRY } from '../src/sources/source-registry';
import { ConnectorKind } from '../src/connectors/connector.types';

const ids = new Set(SOURCE_REGISTRY.map((source) => source.id));

describe('SOURCE_REGISTRY', () => {
  it('contains only concrete http sources and no placeholder URLs', () => {
    expect(SOURCE_REGISTRY.length).toBeGreaterThan(30);

    for (const source of SOURCE_REGISTRY) {
      expect(source.id).toMatch(/^[a-z0-9-]+$/);
      expect(source.homepageUrl).toMatch(/^https?:\/\//);
      expect(source.homepageUrl).not.toContain('example.com');
      expect(source.homepageUrl).not.toContain('localhost');
      expect(source.access.notes.length).toBeGreaterThan(20);
    }
  });

  it('marks protected national systems without pretending credentials are available', () => {
    const maks = SOURCE_REGISTRY.find((source) => source.id === 'maks');
    expect(maks?.access.status).toBe('requires_legal_agreement');
  });

  it('covers national, municipal, satellite, and tile service source families', () => {
    expect(ids.has('tkgm-parsel-sorgu')).toBe(true);
    expect(ids.has('e-plan')).toBe(true);
    expect(ids.has('csb-e-plan')).toBe(true);
    expect(ids.has('edevlet-csb-tucbs')).toBe(true);
    expect(ids.has('netcad-netgis-server')).toBe(true);
    expect(ids.has('copernicus-data-space')).toBe(true);
    expect(ids.has('esri-world-imagery')).toBe(true);
    expect(ids.has('mapbox-maps-api')).toBe(true);
    expect(ids.has('tusba-keos-imar')).toBe(true);
  });

  it('includes newly provided public municipal portal seeds', () => {
    expect(ids.has('suleymanpasa-keos-imar')).toBe(true);
    expect(ids.has('mustafakemalpasa-keos-imar')).toBe(true);
    expect(ids.has('gelibolu-keos-imar')).toBe(true);
    expect(ids.has('caycuma-keos')).toBe(true);
    expect(ids.has('kecioren-kbs')).toBe(true);
    expect(ids.has('adana-netcad-coverage-candidate')).toBe(true);
    expect(ids.has('ankara-netcad-coverage-candidate')).toBe(true);
    expect(ids.has('istanbul-municipal-coverage-candidate')).toBe(true);
  });

  it('includes multiple municipal vendor patterns across the country-scale coverage set', () => {
    const vendors = new Set(
      SOURCE_REGISTRY.map((source) => source.metadata?.vendor).filter((vendor): vendor is string => Boolean(vendor))
    );

    expect(vendors.has('netcad')).toBe(true);
    expect(vendors.has('webgis')).toBe(true);
    expect(vendors.has('ekent')).toBe(true);
    expect(vendors.has('municipal')).toBe(true);
    expect(vendors.has('kbs')).toBe(true);
  });

  it('does not force municipal vendor portals into Netcad connector flow', () => {
    const ibb = SOURCE_REGISTRY.find((source) => source.id === 'ibb-sehir-haritasi');
    const ankara = SOURCE_REGISTRY.find((source) => source.id === 'ankara-imar');
    const izmir = SOURCE_REGISTRY.find((source) => source.id === 'izmir-cbs');
    const cankaya = SOURCE_REGISTRY.find((source) => source.id === 'cankaya-imar-durumu');
    const kecioren = SOURCE_REGISTRY.find((source) => source.id === 'kecioren-kbs');

    for (const source of [ibb, ankara, izmir, cankaya, kecioren]) {
      expect(source?.metadata?.vendor).toBe('municipal');
      expect(source?.connectorKinds).not.toContain(ConnectorKind.NetcadKeos);
      expect(source?.capabilities).not.toContain('netcad_keos');
      expect(source?.connectorKinds).toContain(ConnectorKind.MunicipalPortal);
    }
  });

  it('does not store map provider secret values in source metadata', () => {
    const serialized = JSON.stringify(SOURCE_REGISTRY);
    expect(serialized).toContain('MAPBOX_ACCESS_TOKEN');
    expect(serialized).toContain('MAPTILER_API_KEY');
    expect(serialized).toContain('CESIUM_ION_TOKEN');
    expect(serialized).toContain('HERE_API_KEY');
    expect(serialized).not.toMatch(/pk\.|sk\.|eyJ|AIza|glpat|ghp_/);
  });
});
