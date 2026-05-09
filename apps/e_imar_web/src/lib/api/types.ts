export interface StatusEnvelope {
  status: string;
  message?: string;
  next_actions?: string[];
  fetched_at?: string;
}

export interface SourceEntry {
  id: string;
  name: string;
  base_url: string;
  provider: string;
  auth: string;
  category: string;
  discovery_strategy: string;
  capabilities: string[];
  municipality_name?: string | null;
  notes?: string | null;
}

export interface SourceProbe {
  status: string;
  http_status?: number | null;
  latency_ms?: number | null;
  discovered_endpoints?: string[];
  message?: string | null;
}

export interface SourcesResponse extends StatusEnvelope {
  sources: SourceEntry[];
  total: number;
}

export interface SourceDetailResponse extends StatusEnvelope {
  source: SourceEntry;
  probe: SourceProbe;
}

export interface SourceHealthResponse extends StatusEnvelope {
  total: number;
  rollup: Record<string, number>;
  sources: Array<SourceEntry & SourceProbe>;
}

export interface AskiNotice {
  id: string;
  title: string;
  document_url?: string;
  source_id: string;
}

export interface AskiActiveResponse extends StatusEnvelope {
  count: number;
  notices: AskiNotice[];
  sources: Array<Record<string, unknown>>;
  total_sources: number;
  ok_sources: number;
}

export interface AskiGeoJsonResponse {
  type: "FeatureCollection";
  status: string;
  count: number;
  features: GeoJSON.Feature[];
  sources: Array<Record<string, unknown>>;
  fetched_at?: string;
}

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };
