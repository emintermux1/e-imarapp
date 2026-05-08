const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      `API ${response.status} @ ${path}: ${JSON.stringify(body).slice(0, 500)}`
    );
  }
  return body as T;
}

export const api = {
  getBootstrap: <T>() => request<T>("/website/bootstrap"),
  parcelWorkflow: <T>(payload: unknown) =>
    request<T>("/website/bff/parcel-workflow", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  explainPlanNotes: <T>(payload: unknown) =>
    request<T>("/website/bff/plan-note-explain", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getWorkspace: <T>(userReference: string) =>
    request<T>(`/website/workspace/${encodeURIComponent(userReference)}`),
};
