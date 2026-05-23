import { validateEnv } from '../src/config/env.validation';

describe('validateEnv', () => {
  it('normalizes valid config without requiring optional providers', () => {
    const env = validateEnv({
      NODE_ENV: 'production',
      PORT: '3010',
      DATABASE_URL: 'postgres://user:pass@localhost:5432/eimar',
      REDIS_URL: 'redis://localhost:6379',
      MINIO_ENDPOINT: 'http://localhost:9000',
      OPENSEARCH_URL: 'http://localhost:9200',
      PG_TILESERV_URL: 'http://localhost:7800',
      NEXT_PUBLIC_EIMAR_API_BASE_URL: 'https://api.example.test',
      NEXT_PUBLIC_EIMAR_SITE_URL: 'https://www.example.test',
      OPENAI_MODEL: 'gpt-4.1-mini'
    });

    expect(env.NODE_ENV).toBe('production');
    expect(env.PORT).toBe(3010);
    expect(env.RATE_LIMIT_WINDOW_MS).toBe(60_000);
    expect(env.RATE_LIMIT_MAX).toBe(120);
    expect(env.DATABASE_URL).toBe('postgres://user:pass@localhost:5432/eimar');
    expect(env.NEXT_PUBLIC_EIMAR_API_BASE_URL).toBe('https://api.example.test');
    expect(env.NEXT_PUBLIC_EIMAR_SITE_URL).toBe('https://www.example.test');
  });

  it('rejects malformed urls and placeholder secrets with actionable messages', () => {
    expect(() =>
      validateEnv({
        PORT: '70000',
        DATABASE_URL: 'mysql://localhost/db',
        REDIS_URL: 'not-a-url',
        PG_TILESERV_URL: 'ftp://tiles.example.com',
        MAPTILER_API_KEY: 'change-me'
      })
    ).toThrow(/Environment validation failed/);
  });
});
