import type { ParcelWorkflowPayload } from '@/lib/api/types';

export const queryKeys = {
  bootstrap: (userReference?: string) => ['bootstrap', userReference || 'anon'] as const,
  parcelWorkflow: (key: string) => ['parcel-workflow', key] as const,
  parcelReport: (key: string) => ['parcel-report', key] as const,
  workspace: (userReference: string) => ['workspace', userReference] as const,
  mapProviders: () => ['map-providers'] as const,
  planExplain: (key: string) => ['plan-explain', key] as const,
};

/**
 * Stable cache key for a parcel-workflow request. Used to deduplicate query
 * cache entries between equivalent calls (the BFF is idempotent for a given
 * user/query/emsalInput tuple).
 */
export function parcelWorkflowCacheKey(payload: ParcelWorkflowPayload): string {
  try {
    return JSON.stringify(payload);
  } catch {
    return Math.random().toString(36).slice(2);
  }
}
