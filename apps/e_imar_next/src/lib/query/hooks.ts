'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createWatchlistSubscription,
  deleteWatchlistSubscription,
  explainPlanNote,
  getBootstrap,
  getMapProviders,
  getWorkspace,
  getZoningDiff,
  listSuspensionNotices,
  listWatchlistSubscriptions,
  listZoningSnapshots,
  runParcelWorkflow,
  type SuspensionNoticeQuery,
} from '@/lib/api/client';
import type {
  ApiFailure,
  ApiResult,
  BackendStatus,
  BootstrapResponse,
  MapProvider,
  ParcelWorkflowPayload,
  ParcelWorkflowResponse,
  PlanNoteExplainPayload,
  PlanNoteExplainResponse,
  SuspensionNoticeListResponse,
  WatchlistResponse,
  WatchlistRule,
  WatchlistSubscription,
  WorkspaceResponse,
  ZoningDiffResponse,
  ZoningSnapshotListResponse,
} from '@/lib/api/types';
import { parcelWorkflowCacheKey, queryKeys } from './keys';

/**
 * Helper that turns the typed `ApiResult<T>` into a TanStack-friendly value.
 * On `ok` we resolve with `data`. On failure we throw the typed `ApiFailure`
 * so it can be inspected from `error` in the consumer.
 */
function unwrap<T>(result: ApiResult<T>): T {
  if (result.ok) return result.data;
  throw result.error;
}

export function useBootstrap(userReference?: string) {
  const reference = userReference?.trim() || undefined;
  return useQuery<BootstrapResponse, ApiFailure>({
    queryKey: queryKeys.bootstrap(reference),
    queryFn: async () => unwrap(await getBootstrap(reference)),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });
}

export function useMapProviders() {
  return useQuery<MapProvider[], ApiFailure>({
    queryKey: queryKeys.mapProviders(),
    queryFn: async () => unwrap(await getMapProviders()),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });
}

export function useWorkspace(userReference: string | undefined) {
  const enabled = Boolean(userReference?.trim());
  return useQuery<WorkspaceResponse, ApiFailure>({
    queryKey: queryKeys.workspace(userReference || ''),
    queryFn: async () => unwrap(await getWorkspace(userReference!)),
    enabled,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

/**
 * The parcel workflow is a mutation in TanStack Query, but on success we
 * also write the result into the query cache keyed by `parcelWorkflowCacheKey`.
 * This lets `useParcelWorkflowResult(key)` read it in any component (e.g.
 * `app/parcel/[id]/page.tsx`) without re-firing the request.
 */
export function useParcelWorkflowMutation() {
  const client = useQueryClient();
  return useMutation<
    { response: ParcelWorkflowResponse; cacheKey: string },
    ApiFailure,
    ParcelWorkflowPayload
  >({
    mutationFn: async (payload: ParcelWorkflowPayload) => {
      const response = unwrap(await runParcelWorkflow(payload));
      const cacheKey = parcelWorkflowCacheKey(payload);
      return { response, cacheKey };
    },
    onSuccess: ({ response, cacheKey }) => {
      client.setQueryData(queryKeys.parcelWorkflow(cacheKey), response);
    },
  });
}

export function useParcelWorkflowResult(cacheKey: string | undefined) {
  return useQuery<ParcelWorkflowResponse | undefined>({
    queryKey: cacheKey ? queryKeys.parcelWorkflow(cacheKey) : ['parcel-workflow', 'noop'],
    queryFn: async () => undefined,
    enabled: false,
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
  });
}

export function usePlanExplainMutation() {
  return useMutation<PlanNoteExplainResponse, ApiFailure, PlanNoteExplainPayload>({
    mutationFn: async (payload: PlanNoteExplainPayload) => unwrap(await explainPlanNote(payload)),
  });
}

/** Alias kept for parity with the spec-supplied hook name. */
export const useExplainPlanNote = usePlanExplainMutation;

/* -------------------------------------------------------------------------- */
/*  Sprint 2 — askı / time machine / watchlist hooks                          */
/* -------------------------------------------------------------------------- */

function hasAnyFilter(query: SuspensionNoticeQuery): boolean {
  return Boolean(
    query.municipalityId ||
      (query.municipalityIds && query.municipalityIds.length > 0) ||
      query.from ||
      query.to ||
      (query.planTypes && query.planTypes.length > 0) ||
      (query.bbox && query.bbox.length === 4),
  );
}

/**
 * Fetch suspension notices. We always run the call even with an empty
 * filter set because the backend may legitimately return all active notices;
 * a `network_error` (404) is surfaced through the readiness gate.
 */
export function useSuspensionNotices(query: SuspensionNoticeQuery) {
  return useQuery<SuspensionNoticeListResponse, ApiFailure>({
    queryKey: queryKeys.suspensionNotices(query),
    queryFn: async () => unwrap(await listSuspensionNotices(query)),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    // Always enabled — even a no-filter call is allowed and will surface the
    // backend's status (or `network_error` if the route is missing).
    enabled: true,
    placeholderData: (previous) => (hasAnyFilter(query) ? previous : previous),
  });
}

export function useZoningSnapshots(parcelId: string | null | undefined) {
  const enabled = Boolean(parcelId);
  return useQuery<ZoningSnapshotListResponse, ApiFailure>({
    queryKey: queryKeys.zoningSnapshots(parcelId || ''),
    queryFn: async () => unwrap(await listZoningSnapshots(parcelId!)),
    enabled,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}

export function useZoningDiff(
  parcelId: string | null | undefined,
  from: string | null,
  to: string | null,
) {
  const enabled = Boolean(parcelId && from && to && from !== to);
  return useQuery<ZoningDiffResponse, ApiFailure>({
    queryKey: queryKeys.zoningDiff(parcelId || '', from || '', to || ''),
    queryFn: async () => unwrap(await getZoningDiff(parcelId!, from!, to!)),
    enabled,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}

export function useWatchlistSubscriptions(userReference: string | null | undefined) {
  const enabled = Boolean(userReference?.trim());
  return useQuery<WatchlistResponse, ApiFailure>({
    queryKey: queryKeys.watchlist(userReference || ''),
    queryFn: async () => unwrap(await listWatchlistSubscriptions(userReference!)),
    enabled,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

export function useCreateSubscription(userReference: string | null | undefined) {
  const client = useQueryClient();
  return useMutation<WatchlistSubscription, ApiFailure, WatchlistRule>({
    mutationFn: async (rule: WatchlistRule) => {
      if (!userReference?.trim()) {
        throw {
          status: 'network_error' as const,
          endpoint: '/eplan/subscriptions',
          message: 'userReference belirtilmedi',
        };
      }
      return unwrap(await createWatchlistSubscription(userReference, rule));
    },
    onSuccess: () => {
      if (userReference) {
        client.invalidateQueries({ queryKey: queryKeys.watchlist(userReference) });
      }
    },
  });
}

export function useDeleteSubscription(userReference: string | null | undefined) {
  const client = useQueryClient();
  return useMutation<{ status: BackendStatus }, ApiFailure, string>({
    mutationFn: async (subscriptionId: string) => {
      if (!userReference?.trim()) {
        throw {
          status: 'network_error' as const,
          endpoint: '/eplan/subscriptions',
          message: 'userReference belirtilmedi',
        };
      }
      return unwrap(await deleteWatchlistSubscription(userReference, subscriptionId));
    },
    onSuccess: () => {
      if (userReference) {
        client.invalidateQueries({ queryKey: queryKeys.watchlist(userReference) });
      }
    },
  });
}
