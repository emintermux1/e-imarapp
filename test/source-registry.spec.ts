import { SOURCE_REGISTRY } from '../src/sources/source-registry';

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
    const ids = new Set(SOURCE_REGISTRY.map((source) => source.id));

    expect(ids.has('tkgm-parsel-sorgu')).toBe(true);
    expect(ids.has('edevlet-csb-tucbs')).toBe(true);
    expect(ids.has('netcad-netgis-server')).toBe(true);
    expect(ids.has('copernicus-data-space')).toBe(true);
    expect(ids.has('esri-world-imagery')).toBe(true);
    expect(ids.has('mapbox-maps-api')).toBe(true);
    expect(ids.has('tusba-keos-imar')).toBe(true);
  });
});
