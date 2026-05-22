export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    }
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}): ${JSON.stringify(body)}`);
  }
  return body as T;
}

export const api = {
  getBootstrap: <T>() => request<T>('/website/bootstrap'),
  parcelWorkflow: <T>(payload: unknown) =>
    request<T>('/website/bff/parcel-workflow', { method: 'POST', body: JSON.stringify(payload) }),
  explainPlanNotes: <T>(payload: unknown) =>
    request<T>('/website/bff/plan-note-explain', { method: 'POST', body: JSON.stringify(payload) }),
  getWorkspace: <T>(userReference: string) => request<T>(`/website/workspace/${encodeURIComponent(userReference)}`),
  startSession: <T>(payload: unknown) =>
    request<T>('/website/session/start', { method: 'POST', body: JSON.stringify(payload) })
};
