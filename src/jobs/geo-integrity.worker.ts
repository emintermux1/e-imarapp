import 'reflect-metadata';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { DatabaseService } from '../database/database.service';
import { GeoService } from '../geo/geo.service';
import { GEO_INTEGRITY_DAILY_JOB, GEO_INTEGRITY_QUEUE, normalizeJobLimit } from './jobs.constants';

type WorkerEnv = {
  REDIS_URL?: string;
  DATABASE_URL?: string;
};

export function createGeoIntegrityDailyWorker(env: WorkerEnv = process.env) {
  if (!env.REDIS_URL) {
    throw new Error('REDIS_URL is required to start the geo integrity worker.');
  }

  const connection = new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
  });
  const geo = new GeoService(new DatabaseService({ get: (key: string) => env[key as keyof WorkerEnv] } as never));

  const worker = new Worker(
    GEO_INTEGRITY_QUEUE,
    async (job) => {
      if (job.name !== GEO_INTEGRITY_DAILY_JOB) {
        throw new Error(`Unsupported job '${job.name}' for queue '${GEO_INTEGRITY_QUEUE}'.`);
      }

      return geo.integrityScan(normalizeJobLimit(job.data?.limit));
    },
    { connection }
  );

  return { worker, connection };
}

async function bootstrap(): Promise<void> {
  const { worker, connection } = createGeoIntegrityDailyWorker();

  worker.on('completed', (job) => {
    console.log(`[jobs] completed ${job.name}#${job.id}`);
  });
  worker.on('failed', (job, error) => {
    console.error(`[jobs] failed ${job?.name ?? 'unknown'}#${job?.id ?? 'unknown'}: ${error.message}`);
  });
  worker.on('error', (error) => {
    console.error(`[jobs] worker error: ${error.message}`);
  });

  const shutdown = async () => {
    await worker.close();
    await connection.quit();
    process.exit(0);
  };

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);

  console.log(`[jobs] geo integrity worker listening on '${GEO_INTEGRITY_QUEUE}'.`);
}

if (require.main === module) {
  void bootstrap().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[jobs] ${message}`);
    process.exit(1);
  });
}
