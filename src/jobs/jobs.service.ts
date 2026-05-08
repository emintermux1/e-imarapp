import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { randomUUID } from 'crypto';
import IORedis from 'ioredis';
import { IntegrationErrorCode } from '../common/error-taxonomy';

export interface JobRecord {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  status: 'queued' | 'unavailable';
  createdAt: string;
}

@Injectable()
export class JobsService {
  private readonly queue?: Queue;
  private readonly records = new Map<string, JobRecord>();

  constructor(config: ConfigService) {
    const redisUrl = config.get<string>('REDIS_URL');
    if (redisUrl) {
      this.queue = new Queue('eimar-ingestion', {
        connection: new IORedis(redisUrl, { maxRetriesPerRequest: null })
      });
    }
  }

  async enqueue(type: string, payload: Record<string, unknown>): Promise<JobRecord> {
    const id = randomUUID();
    const record: JobRecord = {
      id,
      type,
      payload,
      status: this.queue ? 'queued' : 'unavailable',
      createdAt: new Date().toISOString()
    };
    this.records.set(id, record);

    if (this.queue) {
      await this.queue.add(type, payload, {
        jobId: id,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 1000,
        removeOnFail: 5000
      });
    }

    return record;
  }

  list(): JobRecord[] {
    return [...this.records.values()];
  }

  get(id: string): JobRecord | { id: string; issue: { code: IntegrationErrorCode; message: string } } {
    return (
      this.records.get(id) ?? {
        id,
        issue: {
          code: IntegrationErrorCode.Unavailable,
          message: 'Job is not present in this process registry. Configure Redis-backed workers for durable job lookup.'
        }
      }
    );
  }
}
