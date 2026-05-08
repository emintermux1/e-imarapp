export type ReadinessState =
  | "ok"
  | "empty"
  | "not_ready"
  | "requires_credentials"
  | "unavailable"
  | "rate_limited"
  | "invalid_input";

export interface ParcelWorkflowResponse {
  status: ReadinessState | string;
  parcelQuery?: {
    status?: ReadinessState | string;
    count?: number;
    parcels?: Array<Record<string, unknown>>;
    issue?: { message?: string };
  };
  potentialSummary?: {
    summary?: {
      maxBuildingType?: string;
      estimatedFloors?: number | null;
      estimatedIndependentUnits?: number;
      estimatedParkingNeed?: number;
      recommendedUse?: string;
      riskScore?: number;
    };
  };
  emsalShare?: {
    output?: {
      totalConstructionAreaM2?: number;
      netSellableAreaM2?: number;
      estimatedIndependentUnits?: number;
    };
  };
}

export interface BootstrapResponse {
  status: string;
  websiteCapabilities?: Record<string, boolean>;
  map?: {
    tileStatus?: { status?: string; endpoint?: string };
    providers?: Array<{ id: string; configured: boolean; name?: string }>;
  };
}
