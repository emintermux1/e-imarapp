import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { AppEnvironment } from '../config/env.validation';
import { DiscoveryService, PublicHealthFilters } from '../connectors/discovery.service';
import { GeoService } from '../geo/geo.service';
import { GEO_INTEGRITY_DAILY_JOB, JOB_QUEUE_DEFINITIONS, SOURCE_PUBLIC_HEALTH_JOB, queueNameForJob } from './jobs.constants';

type QueueHealth = {
  name: string;
  jobs: readonly string[];
  purpose: string;
  counts?: Record<string, number>;
  error?: string;
};

type JobStatus = 'queued' | 'running' | 'completed' | 'failed';

type JobRecord = {
  id: string;
  name: string;
  queue?: string;
  payload: Record<string, unknown>;
  status: JobStatus;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  result?: unknown;
  error?: string;
};

@Injectable()
export class JobsService implements OnModuleDestroy {
  private readonly redisUrl?: string;
  private readonly connection?: IORedis;
  private readonly queues = new Map<string, Queue>();
  private readonly records = new Map<string, JobRecord>();
  private sequence = 0;

  constructor(
    config?: ConfigService<AppEnvironment>,
    private readonly geo?: GeoService,
    private readonly discovery?: DiscoveryService
  ) {
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
        status: 'ok',
        configured: false,
        backend: 'in_process_dev',
        queues,
        jobs: this.summarizeRecords(),
        diagnostics: {
          redisConfigured: false,
          redisConnection: 'unconfigured',
          productionTodo: 'REDIS_URL is not configured. This runtime executes jobs in-process for development/tests only; configure Redis/BullMQ workers for production.'
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

    if (!queueName) {
      return {
        status: 'not_ready',
        name,
        queue: queueName,
        payload,
        note: `No queue is registered for job '${name}'.`
      };
    }

    if (!this.isConfigured()) {
      const record = this.createRecord(name, queueName, payload);
      await this.executeRecord(record);
      return this.toEnqueueResponse(record, false, 'in_process_dev');
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

  async getJob(jobId: string) {
    const localRecord = this.records.get(jobId);
    if (localRecord) return localRecord;

    const bullJob = await this.findBullJob(jobId);
    if (!bullJob) return { status: 'not_found', jobId };

    return {
      status: await bullJob.job.getState(),
      configured: true,
      backend: 'bullmq',
      queue: bullJob.queueName,
      name: bullJob.job.name,
      jobId: String(bullJob.job.id),
      payload: bullJob.job.data,
      createdAt: new Date(bullJob.job.timestamp).toISOString(),
      processedAt: bullJob.job.processedOn ? new Date(bullJob.job.processedOn).toISOString() : undefined,
      finishedAt: bullJob.job.finishedOn ? new Date(bullJob.job.finishedOn).toISOString() : undefined,
      failedReason: bullJob.job.failedReason
    };
  }

  async getJobResult(jobId: string) {
    const localRecord = this.records.get(jobId);
    if (localRecord) {
      return {
        jobId,
        status: localRecord.status,
        result: localRecord.result,
        error: localRecord.error
      };
    }

    const bullJob = await this.findBullJob(jobId);
    if (!bullJob) return { status: 'not_found', jobId };

    return {
      jobId: String(bullJob.job.id),
      status: await bullJob.job.getState(),
      result: bullJob.job.returnvalue,
      error: bullJob.job.failedReason
    };
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([...this.queues.values()].map((queue) => queue.close()));
    await this.connection?.quit();
  }

  private safeError(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  private createRecord(name: string, queue: string, payload: Record<string, unknown>): JobRecord {
    const id = `dev-${Date.now()}-${++this.sequence}`;
    const record: JobRecord = {
      id,
      name,
      queue,
      payload,
      status: 'queued',
      createdAt: new Date().toISOString()
    };
    this.records.set(id, record);
    return record;
  }

  private async executeRecord(record: JobRecord): Promise<void> {
    record.status = 'running';
    record.startedAt = new Date().toISOString();

    try {
      record.result = await this.executeJob(record.name, record.payload);
      record.status = 'completed';
    } catch (error) {
      record.error = this.safeError(error);
      record.status = 'failed';
    } finally {
      record.finishedAt = new Date().toISOString();
    }
  }

  private async executeJob(name: string, payload: Record<string, unknown>): Promise<unknown> {
    if (name === GEO_INTEGRITY_DAILY_JOB) {
      if (!this.geo) throw new Error('GeoService is not available for job execution.');
      return this.geo.integrityScan(Number(payload.limit));
    }

    if (name === SOURCE_PUBLIC_HEALTH_JOB) {
      if (!this.discovery) throw new Error('DiscoveryService is not available for job execution.');
      return this.discovery.discoverPublicHealth(payload as PublicHealthFilters);
    }

    throw new Error(`No processor is registered for job '${name}'.`);
  }

  private toEnqueueResponse(record: JobRecord, configured: boolean, backend: string) {
    return {
      status: record.status === 'failed' ? 'failed' : 'queued',
      configured,
      backend,
      queue: record.queue,
      name: record.name,
      jobId: record.id,
      jobStatus: record.status,
      productionTodo: configured ? undefined : 'Configure REDIS_URL and BullMQ workers before using jobs in production.'
    };
  }

  private summarizeRecords() {
    const counts = { queued: 0, running: 0, completed: 0, failed: 0 };
    for (const record of this.records.values()) counts[record.status] += 1;
    return { counts, recent: [...this.records.values()].slice(-10).map(({ result, ...record }) => record) };
  }

  private async findBullJob(jobId: string) {
    for (const [queueName, queue] of this.queues) {
      const job = await queue.getJob(jobId);
      if (job) return { queueName, job };
    }
    return undefined;
  }
}
