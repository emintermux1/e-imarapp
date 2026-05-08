import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';

const RATE_LIMIT_MS = 3000;

async function processEplanJob(job: Job): Promise<void> {
  await job.log(`[eplan-worker] Starting: ${job.data.task}`);
  await job.updateProgress(10);

  await delay(RATE_LIMIT_MS);
  await job.updateProgress(50);

  await job.log('[eplan-worker] Scraping + sync + change detection + watchlist notifications would execute here.');
  await job.log('[eplan-worker] Actual implementation calls EplanService.scrapeAskidakiPlanlar / syncToDatabase / triggerWatchlistNotifications.');

  await job.updateProgress(100);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function startEplanWorker(redisUrl: string) {
  const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

  const worker = new Worker('eimar-ingestion', processEplanJob, {
    connection,
    concurrency: 1,
    limiter: { max: 1, duration: 60_000 }
  });

  worker.on('completed', (job) => {
    console.log(`[eplan-worker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, error) => {
    console.error(`[eplan-worker] Job ${job?.id} failed: ${error.message}`);
  });

  return worker;
}

if (require.main === module) {
  const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
  console.log(`[eplan-worker] Starting on ${redisUrl}`);
  startEplanWorker(redisUrl);
}
