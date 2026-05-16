import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { createGeoIntegrityDailyWorker } from '../src/jobs/geo-integrity.worker';
import { GEO_INTEGRITY_DAILY_JOB, GEO_INTEGRITY_QUEUE } from '../src/jobs/jobs.constants';

jest.mock('ioredis', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({ quit: jest.fn().mockResolvedValue('OK') }))
}));

jest.mock('bullmq', () => ({
  Queue: jest.fn(),
  Worker: jest.fn().mockImplementation((queueName: string, processor: unknown, options: unknown) => ({
    queueName,
    processor,
    options,
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined)
  }))
}));

jest.mock('../src/geo/geo.service', () => ({
  GeoService: jest.fn().mockImplementation(() => ({
    integrityScan: jest.fn().mockResolvedValue({ status: 'not_ready', scanMode: 'metadata_only' })
  }))
}));

describe('geo integrity worker entrypoint', () => {
  beforeEach(() => jest.clearAllMocks());

  it('requires REDIS_URL before starting', () => {
    expect(() => createGeoIntegrityDailyWorker({})).toThrow(/REDIS_URL is required/);
  });

  it('registers a BullMQ worker for the read-only geo integrity queue', async () => {
    const created = createGeoIntegrityDailyWorker({
      REDIS_URL: 'redis://redis:6379',
      DATABASE_URL: 'postgres://user:pass@postgres:5432/eimar'
    });

    expect(IORedis).toHaveBeenCalledWith('redis://redis:6379', expect.objectContaining({ maxRetriesPerRequest: null }));
    expect(Worker).toHaveBeenCalledWith(
      GEO_INTEGRITY_QUEUE,
      expect.any(Function),
      expect.objectContaining({ connection: created.connection })
    );

    const processor = (Worker as unknown as jest.Mock).mock.calls[0][1] as (job: { name: string; data?: Record<string, unknown> }) => Promise<unknown>;
    await expect(processor({ name: GEO_INTEGRITY_DAILY_JOB, data: { limit: 1000 } })).resolves.toMatchObject({
      status: 'not_ready',
      scanMode: 'metadata_only'
    });
    await expect(processor({ name: 'unknown.job' })).rejects.toThrow(/Unsupported job/);
  });
});
