import type {
  ApiResult,
  BackendStatus,
  BootstrapResponse,
  MapProvider,
  ParcelWorkflowPayload,
  ParcelWorkflowResponse,
  PlanNoteExplainPayload,
  PlanNoteExplainResponse,
  SuspensionNoticeListResponse,
  SuspensionPlanType,
  WatchlistResponse,
  WatchlistRule,
  WatchlistSubscription,
  WorkspaceResponse,
  ZoningDiffResponse,
  ZoningSnapshotListResponse,
} from './types';

const fallbackBaseUrl = 'http://localhost:3000';

export const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || fallbackBaseUrl).replace(/\/$/, '');

interface RequestOptions extends RequestInit {
  signal?: AbortSignal;
}

async function request<T>(path: string, init?: RequestOptions): Promise<ApiResult<T>> {
  const endpoint = `${apiBaseUrl}${path}`;
  try {
    const response = await fetch(endpoint, {
      cache: 'no-store',
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    });
    const text = await response.text();
    let data: unknown = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }
    }
    if (!response.ok) {
      const message =
        data && typeof data === 'object' && 'message' in data && typeof (data as { message: unknown }).message === 'string'
          ? (data as { message: string }).message
          : response.statusText;
      return {
        ok: false,
        error: {
          status: 'network_error',
          endpoint,
          message: `HTTP ${response.status}: ${message}`,
        },
      };
    }
    return { ok: true, data: data as T };
  } catch (error) {
    return {
      ok: false,
      error: {
        status: 'network_error',
        endpoint,
        message: error instanceof Error ? error.message : 'Unknown connectivity error',
      },
    };
  }
}

export function getBootstrap(userReference?: string, init?: RequestOptions): Promise<ApiResult<BootstrapResponse>> {
  const params = new URLSearchParams();
  if (userReference) params.set('userReference', userReference);
  const query = params.toString();
  return request<BootstrapResponse>(`/website/bootstrap${query ? `?${query}` : ''}`, init);
}

export function runParcelWorkflow(
  payload: ParcelWorkflowPayload,
  init?: RequestOptions,
): Promise<ApiResult<ParcelWorkflowResponse>> {
  return request<ParcelWorkflowResponse>('/website/bff/parcel-workflow', {
    method: 'POST',
    body: JSON.stringify(payload),
    ...init,
  });
}

export function explainPlanNote(
  payload: PlanNoteExplainPayload,
  init?: RequestOptions,
): Promise<ApiResult<PlanNoteExplainResponse>> {
  return request<PlanNoteExplainResponse>('/website/bff/plan-note-explain', {
    method: 'POST',
    body: JSON.stringify(payload),
    ...init,
  });
}

export function getWorkspace(userReference: string, init?: RequestOptions): Promise<ApiResult<WorkspaceResponse>> {
  return request<WorkspaceResponse>(`/website/workspace/${encodeURIComponent(userReference)}`, init);
}

export function getMapProviders(init?: RequestOptions): Promise<ApiResult<MapProvider[]>> {
  return request<MapProvider[]>('/map/providers', init);
}

/* -------------------------------------------------------------------------- */
/*  Sprint 2 — defensive endpoint helpers                                     */
/*                                                                            */
/*  These call backend endpoints that may not yet exist. Each call uses the   */
/*  shared `request<T>` wrapper so a 404 / connectivity failure surfaces as a */
/*  typed `ApiResult<T>` failure with `status: 'network_error'`. The UI keys  */
/*  off that to render a `<ReadinessGate>` instead of throwing.               */
/* -------------------------------------------------------------------------- */

export interface SuspensionNoticeQuery {
  municipalityId?: string;
  municipalityIds?: string[];
  from?: string; // ISO date or datetime
  to?: string; // ISO date or datetime
  planTypes?: SuspensionPlanType[];
  bbox?: [number, number, number, number];
}

function buildSuspensionQuery(query: SuspensionNoticeQuery): string {
  const params = new URLSearchParams();
  if (query.municipalityId) params.set('municipalityId', query.municipalityId);
  if (query.municipalityIds && query.municipalityIds.length > 0) {
    params.set('municipalityIds', query.municipalityIds.join(','));
  }
  if (query.from) params.set('from', query.from);
  if (query.to) params.set('to', query.to);
  if (query.planTypes && query.planTypes.length > 0) {
    params.set('planTypes', query.planTypes.join(','));
  }
  if (query.bbox && query.bbox.length === 4) {
    params.set('bbox', query.bbox.join(','));
  }
  return params.toString();
}

export function listSuspensionNotices(
  query: SuspensionNoticeQuery,
  init?: RequestOptions,
): Promise<ApiResult<SuspensionNoticeListResponse>> {
  const qs = buildSuspensionQuery(query);
  return request<SuspensionNoticeListResponse>(
    `/eplan/suspension-notices${qs ? `?${qs}` : ''}`,
    init,
  );
}

export function listZoningSnapshots(
  parcelId: string,
  init?: RequestOptions,
): Promise<ApiResult<ZoningSnapshotListResponse>> {
  return request<ZoningSnapshotListResponse>(
    `/parcels/${encodeURIComponent(parcelId)}/zoning-snapshots`,
    init,
  );
}

export function getZoningDiff(
  parcelId: string,
  from: string,
  to: string,
  init?: RequestOptions,
): Promise<ApiResult<ZoningDiffResponse>> {
  const params = new URLSearchParams();
  params.set('from', from);
  params.set('to', to);
  return request<ZoningDiffResponse>(
    `/parcels/${encodeURIComponent(parcelId)}/zoning-diff?${params.toString()}`,
    init,
  );
}

export function listWatchlistSubscriptions(
  userReference: string,
  init?: RequestOptions,
): Promise<ApiResult<WatchlistResponse>> {
  return request<WatchlistResponse>(
    `/eplan/subscriptions/${encodeURIComponent(userReference)}`,
    init,
  );
}

export function createWatchlistSubscription(
  userReference: string,
  rule: WatchlistRule,
  init?: RequestOptions,
): Promise<ApiResult<WatchlistSubscription>> {
  return request<WatchlistSubscription>('/eplan/subscriptions', {
    method: 'POST',
    body: JSON.stringify({ userReference, rule }),
    ...init,
  });
}

export function deleteWatchlistSubscription(
  userReference: string,
  subscriptionId: string,
  init?: RequestOptions,
): Promise<ApiResult<{ status: BackendStatus }>> {
  const params = new URLSearchParams();
  params.set('userReference', userReference);
  return request<{ status: BackendStatus }>(
    `/eplan/subscriptions/${encodeURIComponent(subscriptionId)}?${params.toString()}`,
    {
      method: 'DELETE',
      ...init,
    },
  );
}
