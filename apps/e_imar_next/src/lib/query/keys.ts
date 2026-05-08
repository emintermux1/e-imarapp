import type { ParcelWorkflowPayload } from '@/lib/api/types';
import type { SuspensionNoticeQuery } from '@/lib/api/client';

export const queryKeys = {
  bootstrap: (userReference?: string) => ['bootstrap', userReference || 'anon'] as const,
  parcelWorkflow: (key: string) => ['parcel-workflow', key] as const,
  workspace: (userReference: string) => ['workspace', userReference] as const,
  mapProviders: () => ['map-providers'] as const,
  planExplain: (key: string) => ['plan-explain', key] as const,
  suspensionNotices: (q: SuspensionNoticeQuery) =>
    ['aski', stableSerialize(q as Record<string, unknown>)] as const,
  zoningSnapshots: (parcelId: string) => ['zoning-snapshots', parcelId] as const,
  zoningDiff: (parcelId: string, from: string, to: string) =>
    ['zoning-diff', parcelId, from, to] as const,
  watchlist: (userReference: string) => ['watchlist', userReference] as const,
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

/**
 * Deterministic JSON serialiser used to key suspension-notice queries. Keys
 * are sorted so the cache identity does not depend on object insertion order.
 */
function stableSerialize(input: Record<string, unknown>): string {
  try {
    const keys = Object.keys(input).sort();
    const obj: Record<string, unknown> = {};
    for (const key of keys) obj[key] = input[key];
    return JSON.stringify(obj);
  } catch {
    return '{}';
  }
}
