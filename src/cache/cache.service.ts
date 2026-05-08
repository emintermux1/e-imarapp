import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import IORedis from 'ioredis';
import { IntegrationErrorCode } from '../common/error-taxonomy';

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly client?: IORedis;

  constructor(config: ConfigService) {
    const redisUrl = config.get<string>('REDIS_URL');
    if (redisUrl) {
      this.client = new IORedis(redisUrl, { maxRetriesPerRequest: null, lazyConnect: true });
    }
  }

  isConfigured(): boolean {
    return Boolean(this.client);
  }

  async status(): Promise<unknown> {
    if (!this.client) {
      return {
        status: 'not_ready',
        issue: {
          code: IntegrationErrorCode.NotConfigured,
          message: 'REDIS_URL is not configured. Redis is required for cache/session state and BullMQ orchestration.'
        }
      };
    }

    if (this.client.status === 'wait') {
      await this.client.connect();
    }

    return {
      status: 'ok',
      redis: await this.client.ping()
    };
  }

  async onModuleDestroy(): Promise<void> {
    this.client?.disconnect();
  }
}
