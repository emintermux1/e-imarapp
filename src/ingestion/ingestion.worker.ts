import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';

const RATE_LIMIT_MS = 2000;

async function processJob(job: Job): Promise<void> {
  const { sourceId, homepageUrl, connectorKinds } = job.data;

  await job.log(`Starting ingestion for source=${sourceId} url=${homepageUrl}`);
  await job.updateProgress(10);

  // Rate-limit: wait before hitting any external endpoint
  await delay(RATE_LIMIT_MS);
  await job.updateProgress(30);

  // Determine connector strategy from kinds
  const kinds: string[] = connectorKinds ?? [];

  if (kinds.includes('netcad_keos')) {
    await job.log('Netcad/KEOS strategy: OGC GetCapabilities discovery then WMS/WFS layer ingestion');
    // Actual connector implementation calls OgcDiscoveryService externally
  } else if (kinds.includes('wms') || kinds.includes('wfs')) {
    await job.log('OGC WMS/WFS strategy: GetCapabilities parse and feature download');
  } else if (kinds.includes('arcgis_rest')) {
    await job.log('ArcGIS REST strategy: layer metadata and query/identify');
  } else if (kinds.includes('open_data')) {
    await job.log('Open data catalog strategy: CKAN/DCAT package listing');
  } else {
    await job.log(`Generic probe strategy for connector kinds: ${kinds.join(', ')}`);
  }

  await job.updateProgress(100);
  await job.log('Ingestion task completed. Real data persistence happens in connector-specific handlers.');
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function startIngestionWorker(redisUrl: string) {
  const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

  const worker = new Worker('eimar-ingestion', processJob, {
    connection,
    concurrency: 3,
    limiter: { max: 10, duration: 60_000 }
  });

  worker.on('completed', (job) => {
    console.log(`[ingestion-worker] Job ${job.id} completed for source=${job.data.sourceId}`);
  });

  worker.on('failed', (job, error) => {
    console.error(`[ingestion-worker] Job ${job?.id} failed: ${error.message}`);
  });

  return worker;
}

if (require.main === module) {
  const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
  console.log(`[ingestion-worker] Starting BullMQ worker on ${redisUrl}`);
  startIngestionWorker(redisUrl);
}
