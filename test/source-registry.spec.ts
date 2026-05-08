import { SOURCE_REGISTRY } from '../src/sources/source-registry';

describe('SOURCE_REGISTRY', () => {
  it('contains only concrete http sources and no placeholder URLs', () => {
    expect(SOURCE_REGISTRY.length).toBeGreaterThan(10);

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
});
