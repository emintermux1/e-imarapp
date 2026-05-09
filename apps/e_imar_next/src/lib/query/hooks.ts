'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  explainPlanNote,
  getBootstrap,
  getMapProviders,
  getWorkspace,
  runParcelReport,
  runParcelWorkflow,
} from '@/lib/api/client';
import type {
  ApiFailure,
  ApiResult,
  BootstrapResponse,
  MapProvider,
  ParcelReportRequest,
  ParcelReportResponse,
  ParcelWorkflowPayload,
  ParcelWorkflowResponse,
  PlanNoteExplainPayload,
  PlanNoteExplainResponse,
  WorkspaceResponse,
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

export function useParcelReportMutation() {
  return useMutation<ParcelReportResponse, ApiFailure, ParcelReportRequest>({
    mutationFn: async (payload: ParcelReportRequest) => unwrap(await runParcelReport(payload)),
  });
}
