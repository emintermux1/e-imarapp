import { Injectable, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import IORedis from 'ioredis';
import { KeosConnector, ConnectorCapability } from '../connectors/keos.connector';
import { MunicipalGisDiscoveryService } from '../municipalities/municipal-gis-discovery.service';
import { MunicipalRegistryEntry, MUNICIPAL_REGISTRY } from '../sources/municipal-registry';

export interface MunicipalDiscoveryStatus {
  id: string;
  name: string;
  status: 'available' | 'captcha_required' | 'requires_credentials' | 'unavailable' | 'unknown';
  method: ConnectorCapability['method'];
  lastChecked: string | null;
  endpoints?: string[];
  baseUrl: string;
  type: MunicipalRegistryEntry['type'];
  vendor: MunicipalRegistryEntry['vendor'];
  region: MunicipalRegistryEntry['region'];
  bbox: MunicipalRegistryEntry['bbox'];
}

const CACHE_KEY = 'sources:municipal-discovery';
const TTL_SECONDS = 3600;
const CONCURRENCY = 5;

@Injectable()
export class DiscoveryJob implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly redis?: IORedis;
  private readonly memory = new Map<string, ConnectorCapability>();
  private interval?: NodeJS.Timeout;
  private running = false;

  constructor(
    private readonly keos: KeosConnector,
    private readonly municipalGis: MunicipalGisDiscoveryService,
    config?: ConfigService
  ) {
    const redisUrl = config?.get<string>('REDIS_URL');
    if (redisUrl) {
      this.redis = new IORedis(redisUrl, {
        maxRetriesPerRequest: 1,
        enableReadyCheck: false,
        lazyConnect: true
      });
    }
  }

  onApplicationBootstrap(): void {
    if (this.shouldSkipAutoStart()) return;
    void this.refreshAll();
    this.interval = setInterval(() => void this.refreshAll(), TTL_SECONDS * 1000);
    this.interval.unref?.();
  }

  private shouldSkipAutoStart(): boolean {
    const flag = process.env.DISCOVERY_AUTO_START?.trim().toLowerCase();
    if (flag === '0' || flag === 'false' || flag === 'off') return true;
    return process.env.NODE_ENV === 'test';
  }

  async onModuleDestroy(): Promise<void> {
    if (this.interval) clearInterval(this.interval);
    if (this.running) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    if (this.redis?.status === 'ready' || this.redis?.status === 'connecting') {
      await this.redis.quit().catch(() => undefined);
    }
  }

  async refreshAll(): Promise<MunicipalDiscoveryStatus[]> {
    if (this.running) return this.status();
    this.running = true;
    try {
      await this.runPool(MUNICIPAL_REGISTRY, async (entry) => {
        const [capability] = await Promise.all([
          this.keos.discover(entry),
          this.municipalGis.discover(entry.id).catch(() => null)
        ]);
        this.memory.set(entry.id, capability);
      });
      await this.writeRedis();
      return this.status();
    } finally {
      this.running = false;
    }
  }

  async status(): Promise<MunicipalDiscoveryStatus[]> {
    const cached = await this.readRedis();
    const capabilities = cached ?? this.memory;
    return MUNICIPAL_REGISTRY.map((entry) => {
      const capability = capabilities.get(entry.id);
      return {
        id: entry.id,
        name: entry.name,
        status: capability?.status ?? entry.status,
        method: capability?.method ?? 'unknown',
        lastChecked: capability?.discoveredAt.toISOString() ?? null,
        endpoints: capability?.endpoints ?? [],
        baseUrl: entry.baseUrl,
        type: entry.type,
        vendor: entry.vendor,
        region: entry.region,
        bbox: entry.bbox
      };
    });
  }

  private async runPool<T>(items: T[], worker: (item: T) => Promise<void>): Promise<void> {
    let index = 0;
    const workers = Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
      while (index < items.length) {
        const current = items[index++];
        await worker(current);
      }
    });
    await Promise.all(workers);
  }

  private async readRedis(): Promise<Map<string, ConnectorCapability> | null> {
    if (!this.redis) return null;
    try {
      const raw = await this.redis.get(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Array<ConnectorCapability & { discoveredAt: string }>;
      return new Map(parsed.map((item) => [item.municipalityId, { ...item, discoveredAt: new Date(item.discoveredAt) }]));
    } catch {
      return null;
    }
  }

  private async writeRedis(): Promise<void> {
    if (!this.redis) return;
    try {
      await this.redis.set(CACHE_KEY, JSON.stringify([...this.memory.values()]), 'EX', TTL_SECONDS);
    } catch {}
  }
}
