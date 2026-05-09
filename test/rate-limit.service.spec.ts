import { ConfigService } from '@nestjs/config';
import { RateLimitService } from '../src/common/rate-limit.service';

describe('RateLimitService', () => {
  it('allows requests until max and then rejects inside the window', () => {
    const config = { get: (key: string) => ({ RATE_LIMIT_WINDOW_MS: 1000, RATE_LIMIT_MAX: 2 })[key] } as unknown as ConfigService;
    const service = new RateLimitService(config);

    expect(service.check('ip:ua', 1000).allowed).toBe(true);
    expect(service.check('ip:ua', 1100).allowed).toBe(true);
    expect(service.check('ip:ua', 1200).allowed).toBe(false);
    expect(service.check('ip:ua', 2101).allowed).toBe(true);
  });

  it('uses safe defaults for invalid env knobs', () => {
    const config = { get: () => '0' } as unknown as ConfigService;
    const service = new RateLimitService(config);

    expect(service.config()).toEqual({ windowMs: 60_000, max: 120 });
  });
});
