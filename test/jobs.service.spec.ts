import { ConfigService } from '@nestjs/config';
import { AppEnvironment } from '../src/config/env.validation';
import { JobsController } from '../src/jobs/jobs.controller';
import { GEO_INTEGRITY_DAILY_JOB, GEO_INTEGRITY_QUEUE } from '../src/jobs/jobs.constants';
import { JobsService } from '../src/jobs/jobs.service';

const queueInstances: Array<{
  name: string;
  getJobCounts: jest.Mock;
  add: jest.Mock;
  close: jest.Mock;
}> = [];

jest.mock('ioredis', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    status: 'wait',
    quit: jest.fn().mockResolvedValue('OK')
  }))
}));

jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation((name: string) => {
    const queue = {
      name,
      getJobCounts: jest.fn().mockResolvedValue({ waiting: 0, active: 0, delayed: 0, completed: 0, failed: 0 }),
      add: jest.fn().mockResolvedValue({ id: 'job-1', getState: jest.fn().mockResolvedValue('waiting') }),
      close: jest.fn().mockResolvedValue(undefined)
    };
    queueInstances.push(queue);
    return queue;
  }),
  Worker: jest.fn()
}));

function configWith(redisUrl?: string): ConfigService<AppEnvironment> {
  return {
    get: (key: string) => (key === 'REDIS_URL' ? redisUrl : undefined)
  } as unknown as ConfigService<AppEnvironment>;
}

describe('JobsService', () => {
  beforeEach(() => {
    queueInstances.length = 0;
    jest.clearAllMocks();
  });

  it('reports unconfigured readiness and preserves not_ready enqueue response without Redis', async () => {
    const service = new JobsService(configWith());

    await expect(service.status()).resolves.toMatchObject({
      status: 'not_ready',
      configured: false,
      backend: 'bullmq',
      diagnostics: {
        redisConfigured: false,
        redisConnection: 'unconfigured'
      },
      queues: expect.arrayContaining([
        expect.objectContaining({ name: GEO_INTEGRITY_QUEUE, jobs: [GEO_INTEGRITY_DAILY_JOB] })
      ])
    });

    await expect(service.enqueue(GEO_INTEGRITY_DAILY_JOB, { limit: 100 })).resolves.toMatchObject({
      status: 'not_ready',
      configured: false,
      name: GEO_INTEGRITY_DAILY_JOB,
      queue: GEO_INTEGRITY_QUEUE
    });
    expect(queueInstances).toHaveLength(0);
  });

  it('reports configured queues with safe diagnostics when Redis is configured', async () => {
    const service = new JobsService(configWith('redis://secret-user:secret-pass@redis:6379/0'));

    const status = await service.status() as any;

    expect(status).toMatchObject({
      status: 'ok',
      configured: true,
      backend: 'bullmq',
      diagnostics: {
        redisConfigured: true,
        redisConnection: 'wait'
      }
    });
    expect(status.queues).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: GEO_INTEGRITY_QUEUE, counts: expect.objectContaining({ waiting: 0 }) })
    ]));
    expect(JSON.stringify(status)).not.toContain('secret-pass');
    expect(JSON.stringify(status)).not.toContain('redis://');
  });

  it('enqueues the geo integrity daily job through BullMQ and returns job id/state', async () => {
    const service = new JobsService(configWith('redis://redis:6379'));

    const result = await service.enqueue(GEO_INTEGRITY_DAILY_JOB, { limit: 250 });

    const geoQueue = queueInstances.find((queue) => queue.name === GEO_INTEGRITY_QUEUE);
    expect(geoQueue?.add).toHaveBeenCalledWith(
      GEO_INTEGRITY_DAILY_JOB,
      { limit: 250 },
      expect.objectContaining({ attempts: 2 })
    );
    expect(result).toEqual({
      status: 'queued',
      configured: true,
      backend: 'bullmq',
      queue: GEO_INTEGRITY_QUEUE,
      name: GEO_INTEGRITY_DAILY_JOB,
      jobId: 'job-1',
      jobStatus: 'waiting'
    });
  });
});

describe('JobsController', () => {
  it('delegates status and normalizes the geo daily limit before enqueueing', async () => {
    const jobs = {
      status: jest.fn().mockResolvedValue({ status: 'ok' }),
      enqueue: jest.fn().mockResolvedValue({ status: 'queued', jobId: 'job-1' })
    } as unknown as JobsService;
    const controller = new JobsController(jobs);

    await expect(controller.status()).resolves.toEqual({ status: 'ok' });
    await expect(controller.enqueueGeoIntegrity({ limit: 999 })).resolves.toEqual({ status: 'queued', jobId: 'job-1' });
    expect(jobs.enqueue).toHaveBeenCalledWith(GEO_INTEGRITY_DAILY_JOB, { limit: 500 });
  });
});
