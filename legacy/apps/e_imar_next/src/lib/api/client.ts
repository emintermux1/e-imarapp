import type {
  ApiResult,
  BootstrapResponse,
  MapProvider,
  ParcelWorkflowPayload,
  ParcelWorkflowResponse,
  PlanNoteExplainPayload,
  PlanNoteExplainResponse,
  WorkspaceResponse,
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
