import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type RateLimitDecision = {
  allowed: boolean;
  key: string;
  limit: number;
  remaining: number;
  resetAt: number;
};

type Bucket = { count: number; resetAt: number };

@Injectable()
export class RateLimitService {
  private readonly buckets = new Map<string, Bucket>();
  private readonly windowMs: number;
  private readonly max: number;

  constructor(config?: ConfigService) {
    this.windowMs = this.parsePositiveInt(config?.get<string | number>('RATE_LIMIT_WINDOW_MS'), 60_000);
    this.max = this.parsePositiveInt(config?.get<string | number>('RATE_LIMIT_MAX'), 120);
  }

  check(key: string, now = Date.now()): RateLimitDecision {
    const bucketKey = key || 'anonymous';
    const current = this.buckets.get(bucketKey);
    if (!current || current.resetAt <= now) {
      const resetAt = now + this.windowMs;
      this.buckets.set(bucketKey, { count: 1, resetAt });
      return { allowed: true, key: bucketKey, limit: this.max, remaining: Math.max(0, this.max - 1), resetAt };
    }

    current.count += 1;
    return {
      allowed: current.count <= this.max,
      key: bucketKey,
      limit: this.max,
      remaining: Math.max(0, this.max - current.count),
      resetAt: current.resetAt
    };
  }

  config() {
    return { windowMs: this.windowMs, max: this.max };
  }

  private parsePositiveInt(value: string | number | undefined, fallback: number): number {
    const parsed = Number(value ?? fallback);
    if (!Number.isInteger(parsed) || parsed < 1) return fallback;
    return parsed;
  }
}
