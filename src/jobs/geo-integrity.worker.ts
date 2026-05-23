import 'reflect-metadata';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { AuditRepository } from '../audit/audit.repository';
import { DiscoveryService } from '../connectors/discovery.service';
import { HttpProbeService } from '../connectors/http-probe.service';
import { DatabaseService } from '../database/database.service';
import { GeoService } from '../geo/geo.service';
import { GEO_INTEGRITY_DAILY_JOB, GEO_INTEGRITY_QUEUE, SOURCE_PROBES_QUEUE, SOURCE_PUBLIC_HEALTH_JOB, normalizeJobLimit } from './jobs.constants';

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
  const database = new DatabaseService({ get: (key: string) => env[key as keyof WorkerEnv] } as never);
  const geo = new GeoService(database, new AuditRepository(database));
  const discovery = new DiscoveryService(new HttpProbeService());

  const geoWorker = new Worker(
    GEO_INTEGRITY_QUEUE,
    async (job) => {
      if (job.name !== GEO_INTEGRITY_DAILY_JOB) {
        throw new Error(`Unsupported job '${job.name}' for queue '${GEO_INTEGRITY_QUEUE}'.`);
      }

      return geo.integrityScan(normalizeJobLimit(job.data?.limit));
    },
    { connection }
  );

  const sourceWorker = new Worker(
    SOURCE_PROBES_QUEUE,
    async (job) => {
      if (job.name !== SOURCE_PUBLIC_HEALTH_JOB) {
        throw new Error(`Unsupported job '${job.name}' for queue '${SOURCE_PROBES_QUEUE}'.`);
      }

      return discovery.discoverPublicHealth(job.data);
    },
    { connection }
  );

  return { workers: [geoWorker, sourceWorker], worker: geoWorker, connection };
}

async function bootstrap(): Promise<void> {
  const { workers, connection } = createGeoIntegrityDailyWorker();

  for (const worker of workers) {
    worker.on('completed', (job) => {
      console.log(`[jobs] completed ${job.name}#${job.id}`);
    });
    worker.on('failed', (job, error) => {
      console.error(`[jobs] failed ${job?.name ?? 'unknown'}#${job?.id ?? 'unknown'}: ${error.message}`);
    });
    worker.on('error', (error) => {
      console.error(`[jobs] worker error: ${error.message}`);
    });
  }

  const shutdown = async () => {
    await Promise.all(workers.map((worker) => worker.close()));
    await connection.quit();
    process.exit(0);
  };

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);

  console.log(`[jobs] workers listening on '${GEO_INTEGRITY_QUEUE}' and '${SOURCE_PROBES_QUEUE}'.`);
}

if (require.main === module) {
  void bootstrap().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[jobs] ${message}`);
    process.exit(1);
  });
}
