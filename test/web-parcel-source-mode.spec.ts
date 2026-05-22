import { getParcelSourceSnapshot } from '../apps/e_imar_web/src/data/parcel-source';

const ENV_KEYS = [
  'NODE_ENV',
  'NEXT_PUBLIC_VERCEL_ENV',
  'NEXT_PUBLIC_EIMAR_DATA_MODE',
  'NEXT_PUBLIC_EIMAR_API_BASE_URL',
  'NEXT_PUBLIC_API_BASE_URL',
  'NEXT_PUBLIC_EIMAR_VECTOR_TILE_URL',
  'NEXT_PUBLIC_EIMAR_ENABLE_DEMO_FALLBACK',
  'NEXT_PUBLIC_EIMAR_ALLOW_DEMO_DATA'
] as const;

const originalEnv = new Map(ENV_KEYS.map((key) => [key, process.env[key]]));

function resetParcelEnv(overrides: Partial<Record<(typeof ENV_KEYS)[number], string>> = {}) {
  ENV_KEYS.forEach((key) => delete process.env[key]);
  Object.entries(overrides).forEach(([key, value]) => {
    if (value !== undefined) process.env[key] = value;
  });
}

describe('web parcel source mode gate', () => {
  afterAll(() => {
    ENV_KEYS.forEach((key) => {
      const value = originalEnv.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    });
  });

  it('uses labelled sample parcels by default in development', () => {
    resetParcelEnv({ NODE_ENV: 'development' });

    const snapshot = getParcelSourceSnapshot();

    expect(snapshot.metadata.mode).toBe('demo');
    expect(snapshot.metadata.availability).toBe('ready');
    expect(snapshot.metadata.featureCount).toBeGreaterThan(0);
    expect(snapshot.metadata.official).toBe(false);
  });

  it('falls back to labelled sample data for missing live config outside production', () => {
    resetParcelEnv({ NODE_ENV: 'development', NEXT_PUBLIC_EIMAR_DATA_MODE: 'api' });

    const snapshot = getParcelSourceSnapshot();

    expect(snapshot.metadata.mode).toBe('demo');
    expect(snapshot.metadata.requestedMode).toBe('api');
    expect(snapshot.metadata.availability).toBe('development_sample_fallback');
    expect(snapshot.metadata.fallbackReason).toContain('NEXT_PUBLIC_EIMAR_API_BASE_URL');
    expect(snapshot.metadata.unavailableReason).toBeUndefined();
    expect(snapshot.collection.features.length).toBeGreaterThan(0);
  });

  it('does not silently draw sample parcels in production when live config is missing', () => {
    resetParcelEnv({ NODE_ENV: 'production', NEXT_PUBLIC_EIMAR_DATA_MODE: 'api' });

    const snapshot = getParcelSourceSnapshot();

    expect(snapshot.metadata.mode).toBe('unavailable');
    expect(snapshot.metadata.availability).toBe('production_unavailable');
    expect(snapshot.metadata.demoFallbackAllowed).toBe(false);
    expect(snapshot.metadata.unavailableReason).toContain('örnek veri fallback kapalı');
    expect(snapshot.metadata.featureCount).toBe(0);
    expect(snapshot.collection.features).toHaveLength(0);
  });

  it('allows intentional production sample previews only with an explicit flag', () => {
    resetParcelEnv({
      NODE_ENV: 'production',
      NEXT_PUBLIC_EIMAR_DATA_MODE: 'demo',
      NEXT_PUBLIC_EIMAR_ENABLE_DEMO_FALLBACK: 'true'
    });

    const snapshot = getParcelSourceSnapshot();

    expect(snapshot.metadata.mode).toBe('demo');
    expect(snapshot.metadata.demoFallbackAllowed).toBe(true);
    expect(snapshot.metadata.unavailableReason).toBeUndefined();
    expect(snapshot.collection.features.length).toBeGreaterThan(0);
  });

  it('accepts API-v1 aliases without breaking production API mode', () => {
    resetParcelEnv({
      NODE_ENV: 'production',
      NEXT_PUBLIC_EIMAR_DATA_MODE: 'api',
      NEXT_PUBLIC_API_BASE_URL: 'https://api.example.test/api/v1'
    });

    const snapshot = getParcelSourceSnapshot();

    expect(snapshot.metadata.mode).toBe('api');
    expect(snapshot.metadata.availability).toBe('ready');
    expect(snapshot.metadata.endpoint).toBe('https://api.example.test/api/v1');
    expect(snapshot.metadata.unavailableReason).toBeUndefined();
  });
});
