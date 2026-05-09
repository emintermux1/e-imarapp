export type BackendStatus =
  | 'ok'
  | 'empty'
  | 'not_ready'
  | 'requires_credentials'
  | 'requires_legal_agreement'
  | 'unavailable'
  | 'captcha_required'
  | 'rate_limited'
  | 'invalid_input'
  | 'invalid'
  | 'unsupported'
  | 'requires_geocoder'
  | 'requires_data'
  | 'provider_error'
  | 'partial'
  | string;

export type ParcelQueryType = 'ada_parsel' | 'coordinate' | 'address' | 'geojson' | 'kml';
export type Audience = 'citizen' | 'architect' | 'investor';

export interface BackendIssue {
  code?: string;
  message?: string;
  [key: string]: unknown;
}

export interface StatusEnvelope {
  status?: BackendStatus;
  issue?: BackendIssue | string;
  message?: string;
  nextActions?: string[];
  [key: string]: unknown;
}

export interface MapProvider {
  id: string;
  name: string;
  configured?: boolean;
  requiredEnv?: string;
  envStatus?: string;
  issue?: string;
  capabilities?: string[];
  docsUrl?: string;
}

export interface BootstrapResponse extends StatusEnvelope {
  product?: {
    name?: string;
    mode?: string;
    ui?: string;
  };
  websiteCapabilities?: Record<string, boolean>;
  map?: {
    tileStatus?: StatusEnvelope;
    providers?: MapProvider[];
  };
  ingestionRequirements?: unknown;
  workspace?: WorkspaceResponse | null;
}

export interface ParcelWorkflowPayload {
  userReference?: string;
  query: {
    type: ParcelQueryType;
    ada?: string;
    parselNo?: string;
    longitude?: number;
    latitude?: number;
    srid?: number;
    address?: string;
    geometry?: Record<string, unknown>;
    kml?: string;
    municipalityId?: string;
  };
  emsalInput?: {
    parcelAreaM2: number;
    emsal: number;
    taksRatio?: number;
    floorAreaPerUnitM2?: number;
    parkingPerUnit?: number;
    ownerShareRatio?: number;
    contractorShareRatio?: number;
    circulationLossRatio?: number;
  };
}

export interface ParcelQueryResult extends StatusEnvelope {
  query?: unknown;
  count?: number;
  parcels?: Record<string, unknown>[];
  fields?: string[];
}

export interface PotentialSummary extends StatusEnvelope {
  summary?: Record<string, unknown>;
  assumptions?: Record<string, unknown>;
  provenance?: Record<string, unknown>;
}

export interface ParcelWorkflowResponse extends StatusEnvelope {
  parcelQuery?: ParcelQueryResult;
  potentialSummary?: PotentialSummary;
  emsalShare?: StatusEnvelope | Record<string, unknown> | null;
}

export interface PlanNoteExplainPayload {
  userReference?: string;
  noteText: string;
  audience?: Audience;
  maxBullets?: number;
}

export interface PlanNoteExplainResponse extends StatusEnvelope {
  provider?: string;
  model?: string;
  explanation?:
    | {
        sadeOzeti?: string;
        yapilasmaKosullari?: string[];
        riskler?: string[];
        gerekliKurumGorusleri?: string[];
        bilinmeyenler?: string[];
        [key: string]: unknown;
      }
    | string
    | Record<string, unknown>;
}

export interface ParcelReportRequest {
  query: {
    type?: string;
    ada?: string;
    parselNo?: string;
    municipalityId?: string;
    province?: string;
    district?: string;
    mahalle?: string;
  };
  parcelWorkflow?: Record<string, unknown> | null;
  municipalWorkflow?: Record<string, unknown> | null;
}

export interface ParcelReportResponse extends StatusEnvelope {
  reportId?: string;
  generatedAt?: string;
  title?: string;
  disclaimer?: string;
  query?: Record<string, unknown>;
  sections?: Array<{
    title?: string;
    fields?: Array<{ label?: string; value?: string; status?: BackendStatus }>;
  }>;
  provenance?: Array<Record<string, unknown>>;
  printableHtml?: string;
  downloadFilename?: string;
}

export interface WorkspaceResponse extends StatusEnvelope {
  userReference?: string;
  history?: StatusEnvelope & { history?: Record<string, unknown>[] };
  favorites?: StatusEnvelope & { favorites?: Record<string, unknown>[] };
  subscriptions?: StatusEnvelope & { subscriptions?: Record<string, unknown>[]; count?: number };
}

export interface ApiFailure {
  status: 'network_error';
  message: string;
  endpoint: string;
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiFailure };
