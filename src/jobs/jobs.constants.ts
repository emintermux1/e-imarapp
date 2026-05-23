export const GEO_INTEGRITY_QUEUE = 'geo-integrity';
export const GEO_INTEGRITY_DAILY_JOB = 'geo.integrity.daily';
export const SOURCE_PROBES_QUEUE = 'source-probes';
export const SOURCE_PUBLIC_HEALTH_JOB = 'source.public-health';
export const EPLAN_SYNC_QUEUE = 'eplan-sync';
export const EPLAN_DAILY_SYNC_JOB = 'eplan.daily-sync';

export const JOB_QUEUE_DEFINITIONS = [
  {
    name: GEO_INTEGRITY_QUEUE,
    jobs: [GEO_INTEGRITY_DAILY_JOB],
    purpose: 'Read-only parcel geometry integrity scans.'
  },
  {
    name: SOURCE_PROBES_QUEUE,
    jobs: [SOURCE_PUBLIC_HEALTH_JOB],
    purpose: 'Public source metadata probing without protected-flow bypasses.'
  },
  {
    name: EPLAN_SYNC_QUEUE,
    jobs: [EPLAN_DAILY_SYNC_JOB],
    purpose: 'e-Plan synchronization orchestration.'
  }
] as const;

export function queueNameForJob(jobName: string): string | undefined {
  return JOB_QUEUE_DEFINITIONS.find((definition) => definition.jobs.includes(jobName as never))?.name;
}

export function normalizeJobLimit(value: unknown, fallback = 100): number {
  const numeric = typeof value === 'number' ? value : Number(value ?? fallback);
  return Number.isFinite(numeric) ? Math.max(1, Math.min(500, Math.trunc(numeric))) : fallback;
}
