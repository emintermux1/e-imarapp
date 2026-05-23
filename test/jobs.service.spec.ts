import { ConfigService } from '@nestjs/config';
import { AppEnvironment } from '../src/config/env.validation';
import { JobsController } from '../src/jobs/jobs.controller';
import { GEO_INTEGRITY_DAILY_JOB, GEO_INTEGRITY_QUEUE, SOURCE_PUBLIC_HEALTH_JOB, SOURCE_PROBES_QUEUE } from '../src/jobs/jobs.constants';
import { JobsService } from '../src/jobs/jobs.service';

const queueInstances: Array<{
  name: string;
  getJobCounts: jest.Mock;
  getJob: jest.Mock;
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
      getJob: jest.fn().mockResolvedValue(undefined),
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

function jobDependencies() {
  return {
    geo: {
      integrityScan: jest.fn().mockResolvedValue({ status: 'ok', scanMode: 'deterministic_test', count: 0 })
    },
    discovery: {
      discoverPublicHealth: jest.fn().mockResolvedValue({ status: 'ok', totals: { checked: 1 }, results: [] })
    }
  };
}

describe('JobsService', () => {
  beforeEach(() => {
    queueInstances.length = 0;
    jest.clearAllMocks();
  });

  it('uses the safe in-process dev queue without Redis and exposes geo job status/result', async () => {
    const { geo, discovery } = jobDependencies();
    const service = new JobsService(configWith(), geo as never, discovery as never);

    await expect(service.status()).resolves.toMatchObject({
      status: 'ok',
      configured: false,
      backend: 'in_process_dev',
      diagnostics: {
        redisConfigured: false,
        redisConnection: 'unconfigured',
        productionTodo: expect.stringContaining('production')
      },
      queues: expect.arrayContaining([
        expect.objectContaining({ name: GEO_INTEGRITY_QUEUE, jobs: [GEO_INTEGRITY_DAILY_JOB] })
      ])
    });

    const enqueued = await service.enqueue(GEO_INTEGRITY_DAILY_JOB, { limit: 100 });

    expect(geo.integrityScan).toHaveBeenCalledWith(100);
    expect(enqueued).toMatchObject({
      status: 'queued',
      configured: false,
      backend: 'in_process_dev',
      name: GEO_INTEGRITY_DAILY_JOB,
      queue: GEO_INTEGRITY_QUEUE,
      jobStatus: 'completed'
    });
    expect(queueInstances).toHaveLength(0);

    const jobId = String(enqueued.jobId);

    await expect(service.getJob(jobId)).resolves.toMatchObject({
      id: jobId,
      status: 'completed',
      result: { status: 'ok', scanMode: 'deterministic_test', count: 0 }
    });
    await expect(service.getJobResult(jobId)).resolves.toEqual({
      jobId,
      status: 'completed',
      result: { status: 'ok', scanMode: 'deterministic_test', count: 0 },
      error: undefined
    });
  });

  it('executes source public health probes through the in-process dev queue', async () => {
    const { geo, discovery } = jobDependencies();
    const service = new JobsService(configWith(), geo as never, discovery as never);

    const enqueued = await service.enqueue(SOURCE_PUBLIC_HEALTH_JOB, { limit: 2, province: 'İstanbul' });

    expect(discovery.discoverPublicHealth).toHaveBeenCalledWith({ limit: 2, province: 'İstanbul' });
    expect(enqueued).toMatchObject({
      status: 'queued',
      configured: false,
      backend: 'in_process_dev',
      name: SOURCE_PUBLIC_HEALTH_JOB,
      queue: SOURCE_PROBES_QUEUE,
      jobStatus: 'completed'
    });
    await expect(service.getJobResult(String(enqueued.jobId))).resolves.toMatchObject({
      status: 'completed',
      result: { status: 'ok', totals: { checked: 1 }, results: [] }
    });
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
  it('delegates status/results and normalizes job limits before enqueueing', async () => {
    const jobs = {
      status: jest.fn().mockResolvedValue({ status: 'ok' }),
      enqueue: jest.fn().mockResolvedValue({ status: 'queued', jobId: 'job-1' }),
      getJob: jest.fn().mockResolvedValue({ status: 'completed' }),
      getJobResult: jest.fn().mockResolvedValue({ result: { status: 'ok' } })
    } as unknown as JobsService;
    const controller = new JobsController(jobs);

    await expect(controller.status()).resolves.toEqual({ status: 'ok' });
    await expect(controller.jobStatus('job-1')).resolves.toEqual({ status: 'completed' });
    await expect(controller.jobResult('job-1')).resolves.toEqual({ result: { status: 'ok' } });
    await expect(controller.enqueueGeoIntegrity({ limit: 999 })).resolves.toEqual({ status: 'queued', jobId: 'job-1' });
    await expect(controller.enqueueSourcePublicHealth({ limit: 999, province: 'İzmir' })).resolves.toEqual({ status: 'queued', jobId: 'job-1' });

    expect(jobs.enqueue).toHaveBeenCalledWith(GEO_INTEGRITY_DAILY_JOB, { limit: 500 });
    expect(jobs.enqueue).toHaveBeenCalledWith(SOURCE_PUBLIC_HEALTH_JOB, { limit: 500, province: 'İzmir' });
  });
});
