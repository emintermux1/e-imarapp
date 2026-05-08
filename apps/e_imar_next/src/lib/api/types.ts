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
        plainSummary?: string;
        bullets?: string[];
        risks?: string[];
        uncertainties?: string[];
        [key: string]: unknown;
      }
    | string
    | Record<string, unknown>;
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

/* -------------------------------------------------------------------------- */
/*  Sprint 2 — askı haritası                                                  */
/* -------------------------------------------------------------------------- */

export type SuspensionPlanType =
  | 'imar_plani'
  | 'plan_degisikligi'
  | 'mevzi'
  | 'koruma'
  | 'kentsel_donusum'
  | string;

export interface SuspensionNotice extends StatusEnvelope {
  id: string;
  municipalityId?: string;
  municipalityName?: string;
  planTitle?: string;
  planType?: SuspensionPlanType;
  startDate?: string; // ISO
  endDate?: string; // ISO
  postedAt?: string;
  documentUrl?: string;
  geometry?: Record<string, unknown> | null; // GeoJSON geometry
  bbox?: [number, number, number, number] | null;
  sourceName?: string;
  fetchedAt?: string;
}

export interface SuspensionNoticeListResponse extends StatusEnvelope {
  notices?: SuspensionNotice[];
  count?: number;
}

/* -------------------------------------------------------------------------- */
/*  Sprint 2 — watchlist                                                      */
/* -------------------------------------------------------------------------- */

export type WatchlistEntityType = 'parcel' | 'region' | 'municipality_feed';
export type WatchlistEventType =
  | 'plan_change'
  | 'risk_change'
  | 'aski_start'
  | 'aski_end';
export type WatchlistSeverity = 'low' | 'medium' | 'high' | 'critical';
export type WatchlistChannel = 'push' | 'email';

export interface WatchlistRule {
  id?: string;
  entityType: WatchlistEntityType;
  entityRef: string; // parcel id, region polygon id, municipality id
  events: WatchlistEventType[];
  severityFloor?: WatchlistSeverity;
  channels?: WatchlistChannel[];
  label?: string;
}

export interface WatchlistSubscription extends StatusEnvelope {
  id: string;
  rule: WatchlistRule;
  unreadCount?: number;
  lastEventAt?: string;
  lastEventSeverity?: WatchlistSeverity;
}

export interface WatchlistResponse extends StatusEnvelope {
  subscriptions?: WatchlistSubscription[];
  count?: number;
}

/* -------------------------------------------------------------------------- */
/*  Sprint 2 — time machine (zoning snapshots + diff)                         */
/* -------------------------------------------------------------------------- */

export interface ZoningSnapshot extends StatusEnvelope {
  id: string;
  parcelId: string;
  effectiveAt?: string;
  zoningFunction?: string;
  emsal?: number;
  taks?: number;
  kaks?: number;
  gabari?: string;
  planTitle?: string;
  sourceName?: string;
  fetchedAt?: string;
}

export interface ZoningSnapshotListResponse extends StatusEnvelope {
  snapshots?: ZoningSnapshot[];
  count?: number;
}

export interface ZoningDiffField<T = unknown> {
  field: string;
  before?: T;
  after?: T;
  changed: boolean;
}

export interface ZoningDiffResponse extends StatusEnvelope {
  parcelId?: string;
  fromSnapshotId?: string;
  toSnapshotId?: string;
  fromAt?: string;
  toAt?: string;
  fields?: ZoningDiffField[];
}
