import type {
  ParcelQueryResult,
  ParcelWorkflowResponse,
  PotentialSummary,
  StatusEnvelope,
} from '@/lib/api/types';

/**
 * The backend returns parcels as `Record<string, unknown>` because schema
 * varies by source. These helpers extract a small known set of fields with
 * tolerance for camelCase and snake_case keys.
 */
type AnyRecord = Record<string, unknown>;

function pick<T = unknown>(record: AnyRecord | undefined, ...keys: string[]): T | undefined {
  if (!record) return undefined;
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== '') return value as T;
  }
  return undefined;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const num = Number(value.replace(',', '.'));
    return Number.isFinite(num) ? num : undefined;
  }
  return undefined;
}

function toString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim() !== '') return value;
  if (typeof value === 'number') return String(value);
  return undefined;
}

export interface ParcelQuickFacts {
  id: string;
  ada?: string;
  parselNo?: string;
  areaM2?: number;
  zoningFunction?: string;
  emsal?: number;
  taks?: number;
  kaks?: number;
  gabari?: string;
  planTitle?: string;
  municipality?: string;
  province?: string;
  district?: string;
  neighborhood?: string;
  sourceName?: string;
  fetchedAt?: string;
  raw: AnyRecord;
}

export function extractParcelFacts(parcel: AnyRecord, fallbackId: string): ParcelQuickFacts {
  const id = toString(pick(parcel, 'id', 'parcelId', 'parselId', 'uuid')) ?? fallbackId;
  return {
    id,
    ada: toString(pick(parcel, 'ada', 'adaNo', 'ada_no', 'adaNumber')),
    parselNo: toString(pick(parcel, 'parselNo', 'parsel', 'parsel_no', 'parselNumber', 'parcelNo')),
    areaM2: toNumber(pick(parcel, 'areaM2', 'area_m2', 'alanM2', 'alan_m2', 'area', 'alan')),
    zoningFunction: toString(
      pick(parcel, 'zoningFunction', 'zoning_function', 'imarFonksiyonu', 'imar_fonksiyonu', 'kullanimAmaci'),
    ),
    emsal: toNumber(pick(parcel, 'emsal', 'eMSal', 'emsalRatio')),
    taks: toNumber(pick(parcel, 'taks', 'TAKS', 'taksRatio')),
    kaks: toNumber(pick(parcel, 'kaks', 'KAKS', 'kaksRatio')),
    gabari: toString(pick(parcel, 'gabari', 'maxBuildingHeight', 'gabariMetre')),
    planTitle: toString(pick(parcel, 'planTitle', 'plan_title', 'planAdi')),
    municipality: toString(pick(parcel, 'municipality', 'belediye')),
    province: toString(pick(parcel, 'province', 'il')),
    district: toString(pick(parcel, 'district', 'ilce', 'ilçe')),
    neighborhood: toString(pick(parcel, 'neighborhood', 'mahalle')),
    sourceName: toString(pick(parcel, 'sourceName', 'source_name', 'kaynak', 'source')),
    fetchedAt: toString(pick(parcel, 'fetchedAt', 'fetched_at', 'guncelleme', 'updatedAt')),
    raw: parcel,
  };
}

export interface ParcelPotentialFacts {
  maxBuildingType?: string;
  estimatedFloors?: number;
  estimatedIndependentUnits?: number;
  estimatedParkingNeed?: number;
  recommendedUse?: string;
  riskScore?: number;
  raw: AnyRecord;
}

export function extractPotentialFacts(input?: PotentialSummary | null): ParcelPotentialFacts | null {
  if (!input) return null;
  const summary = (input.summary && typeof input.summary === 'object' ? input.summary : input) as AnyRecord;
  return {
    maxBuildingType: toString(pick(summary, 'maxBuildingType', 'max_building_type', 'maksYapiTipi')),
    estimatedFloors: toNumber(pick(summary, 'estimatedFloors', 'estimated_floors', 'tahminiKat')),
    estimatedIndependentUnits: toNumber(
      pick(summary, 'estimatedIndependentUnits', 'estimated_independent_units', 'bagimsizBolumSayisi'),
    ),
    estimatedParkingNeed: toNumber(
      pick(summary, 'estimatedParkingNeed', 'estimated_parking_need', 'tahminiOtopark'),
    ),
    recommendedUse: toString(pick(summary, 'recommendedUse', 'recommended_use', 'onerilenKullanim')),
    riskScore: toNumber(pick(summary, 'riskScore', 'risk_score', 'risk')),
    raw: summary,
  };
}

export interface EmsalShareFacts {
  totalConstructionAreaM2?: number;
  netSellableAreaM2?: number;
  estimatedIndependentUnits?: number;
  ownerShareRatio?: number;
  contractorShareRatio?: number;
  ownerShareUnits?: number;
  contractorShareUnits?: number;
  raw: AnyRecord;
}

export function extractEmsalShareFacts(
  input?: StatusEnvelope | AnyRecord | null,
): EmsalShareFacts | null {
  if (!input || typeof input !== 'object') return null;
  const record = input as AnyRecord;
  return {
    totalConstructionAreaM2: toNumber(
      pick(record, 'totalConstructionAreaM2', 'total_construction_area_m2', 'toplamInsaatAlani'),
    ),
    netSellableAreaM2: toNumber(
      pick(record, 'netSellableAreaM2', 'net_sellable_area_m2', 'netSatilabilirAlan'),
    ),
    estimatedIndependentUnits: toNumber(
      pick(record, 'estimatedIndependentUnits', 'estimated_independent_units', 'bagimsizBolumSayisi'),
    ),
    ownerShareRatio: toNumber(pick(record, 'ownerShareRatio', 'owner_share_ratio', 'arsaSahipPay')),
    contractorShareRatio: toNumber(
      pick(record, 'contractorShareRatio', 'contractor_share_ratio', 'muteahhitPay'),
    ),
    ownerShareUnits: toNumber(pick(record, 'ownerShareUnits', 'owner_share_units')),
    contractorShareUnits: toNumber(pick(record, 'contractorShareUnits', 'contractor_share_units')),
    raw: record,
  };
}

export interface ProvenanceFacts {
  sourceId?: string;
  sourceName?: string;
  fetchedAt?: string;
  confidence?: number;
}

export function extractProvenance(input?: PotentialSummary | null, parcel?: AnyRecord | null): ProvenanceFacts {
  const provenance = (input?.provenance && typeof input.provenance === 'object'
    ? (input.provenance as AnyRecord)
    : {}) as AnyRecord;
  const parcelRecord = parcel ?? {};
  return {
    sourceId: toString(pick(provenance, 'sourceId', 'source_id')) ?? toString(pick(parcelRecord, 'sourceId', 'source_id')),
    sourceName: toString(pick(provenance, 'sourceName', 'source_name', 'kaynak')) ??
      toString(pick(parcelRecord, 'sourceName', 'source_name', 'kaynak')),
    fetchedAt: toString(pick(provenance, 'fetchedAt', 'fetched_at')) ??
      toString(pick(parcelRecord, 'fetchedAt', 'fetched_at')),
    confidence: toNumber(pick(provenance, 'confidence', 'confidenceScore')),
  };
}

export interface ParcelWorkflowView {
  status?: string;
  parcelStatus?: string;
  potentialStatus?: string;
  emsalStatus?: string;
  parcelQuery?: ParcelQueryResult;
  parcels: ParcelQuickFacts[];
  selectedParcel: ParcelQuickFacts | null;
  potential: ParcelPotentialFacts | null;
  emsalShare: EmsalShareFacts | null;
  provenance: ProvenanceFacts;
  potentialSummary?: PotentialSummary;
}

export function buildParcelWorkflowView(
  response: ParcelWorkflowResponse | undefined,
  selectedParcelId?: string | null,
): ParcelWorkflowView {
  const parcelQuery = response?.parcelQuery;
  const rawParcels = parcelQuery?.parcels ?? [];
  const parcels = rawParcels.map((parcel, idx) => extractParcelFacts(parcel, `parcel-${idx}`));
  const selectedParcel =
    parcels.find((parcel) => parcel.id === selectedParcelId) ?? parcels[0] ?? null;
  const potential = extractPotentialFacts(response?.potentialSummary);
  const emsalShare = extractEmsalShareFacts(
    response?.emsalShare ?? null,
  );
  const provenance = extractProvenance(response?.potentialSummary, selectedParcel?.raw);
  const emsalStatus =
    response?.emsalShare && typeof response.emsalShare === 'object' && 'status' in response.emsalShare
      ? (response.emsalShare as StatusEnvelope).status
      : undefined;
  return {
    status: response?.status,
    parcelStatus: parcelQuery?.status,
    potentialStatus: response?.potentialSummary?.status,
    emsalStatus,
    parcelQuery,
    parcels,
    selectedParcel,
    potential,
    emsalShare,
    provenance,
    potentialSummary: response?.potentialSummary,
  };
}
