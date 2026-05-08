import type {
  ApiResult,
  BootstrapResponse,
  MapProvider,
  ParcelWorkflowPayload,
  ParcelWorkflowResponse,
  PlanNoteExplainPayload,
  PlanNoteExplainResponse,
  WorkspaceResponse
} from './types';

const fallbackBaseUrl = 'http://localhost:3000';

export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || fallbackBaseUrl).replace(/\/$/, '');

async function request<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  const endpoint = `${apiBaseUrl}${path}`;
  try {
    const response = await fetch(endpoint, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers
      }
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    if (!response.ok) {
      return {
        ok: false,
        error: {
          status: 'network_error',
          endpoint,
          message: `HTTP ${response.status}: ${typeof data?.message === 'string' ? data.message : response.statusText}`
        }
      };
    }
    return { ok: true, data: data as T };
  } catch (error) {
    return {
      ok: false,
      error: {
        status: 'network_error',
        endpoint,
        message: error instanceof Error ? error.message : 'Unknown connectivity error'
      }
    };
  }
}

export function getBootstrap(userReference?: string): Promise<ApiResult<BootstrapResponse>> {
  const params = new URLSearchParams();
  if (userReference) params.set('userReference', userReference);
  const query = params.toString();
  return request<BootstrapResponse>(`/website/bootstrap${query ? `?${query}` : ''}`);
}

export function runParcelWorkflow(payload: ParcelWorkflowPayload): Promise<ApiResult<ParcelWorkflowResponse>> {
  return request<ParcelWorkflowResponse>('/website/bff/parcel-workflow', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function explainPlanNote(payload: PlanNoteExplainPayload): Promise<ApiResult<PlanNoteExplainResponse>> {
  return request<PlanNoteExplainResponse>('/website/bff/plan-note-explain', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function getWorkspace(userReference: string): Promise<ApiResult<WorkspaceResponse>> {
  return request<WorkspaceResponse>(`/website/workspace/${encodeURIComponent(userReference)}`);
}

export function getMapProviders(): Promise<ApiResult<MapProvider[]>> {
  return request<MapProvider[]>('/map/providers');
}
