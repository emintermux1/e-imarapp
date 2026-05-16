import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { AppEnvironment } from '../config/env.validation';
import { JOB_QUEUE_DEFINITIONS, queueNameForJob } from './jobs.constants';

type QueueHealth = {
  name: string;
  jobs: readonly string[];
  purpose: string;
  counts?: Record<string, number>;
  error?: string;
};

@Injectable()
export class JobsService implements OnModuleDestroy {
  private readonly redisUrl?: string;
  private readonly connection?: IORedis;
  private readonly queues = new Map<string, Queue>();

  constructor(config?: ConfigService<AppEnvironment>) {
    this.redisUrl = config?.get<string>('REDIS_URL');

    if (this.redisUrl) {
      this.connection = new IORedis(this.redisUrl, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        lazyConnect: true
      });

      for (const definition of JOB_QUEUE_DEFINITIONS) {
        this.queues.set(definition.name, new Queue(definition.name, { connection: this.connection }));
      }
    }
  }

  isConfigured(): boolean {
    return Boolean(this.redisUrl && this.connection && this.queues.size > 0);
  }

  async status() {
    const queues: QueueHealth[] = [];

    for (const definition of JOB_QUEUE_DEFINITIONS) {
      const queue = this.queues.get(definition.name);
      if (!queue) {
        queues.push({ ...definition });
        continue;
      }

      try {
        queues.push({
          ...definition,
          counts: await queue.getJobCounts('waiting', 'active', 'delayed', 'completed', 'failed')
        });
      } catch (error) {
        queues.push({ ...definition, error: this.safeError(error) });
      }
    }

    if (!this.isConfigured()) {
      return {
        status: 'not_ready',
        configured: false,
        backend: 'bullmq',
        queues,
        diagnostics: {
          redisConfigured: false,
          redisConnection: 'unconfigured',
          note: 'REDIS_URL is not configured. Configure Redis/BullMQ workers for job execution.'
        }
      };
    }

    return {
      status: queues.some((queue) => queue.error) ? 'degraded' : 'ok',
      configured: true,
      backend: 'bullmq',
      queues,
      diagnostics: {
        redisConfigured: true,
        redisConnection: this.connection?.status ?? 'unknown'
      }
    };
  }

  async enqueue(name: string, payload: Record<string, unknown>) {
    const queueName = queueNameForJob(name);

    if (!this.isConfigured() || !queueName) {
      return {
        status: 'not_ready',
        configured: false,
        name,
        queue: queueName,
        payload,
        note: queueName
          ? 'REDIS_URL is not configured. Configure Redis/BullMQ workers for job execution.'
          : `No queue is registered for job '${name}'.`
      };
    }

    const queue = this.queues.get(queueName);
    if (!queue) {
      return {
        status: 'not_ready',
        configured: false,
        name,
        queue: queueName,
        payload,
        note: `Queue '${queueName}' is not initialized.`
      };
    }

    const job = await queue.add(name, payload, {
      attempts: 2,
      backoff: { type: 'exponential', delay: 30_000 },
      removeOnComplete: { age: 86_400, count: 100 },
      removeOnFail: { age: 604_800, count: 500 }
    });

    return {
      status: 'queued',
      configured: true,
      backend: 'bullmq',
      queue: queueName,
      name,
      jobId: String(job.id),
      jobStatus: await job.getState()
    };
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([...this.queues.values()].map((queue) => queue.close()));
    await this.connection?.quit();
  }

  private safeError(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
