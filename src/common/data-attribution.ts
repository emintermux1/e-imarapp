import { ProvenanceRecord } from './provenance';

export interface DataAttribution {
  sourceUrl: string | null;
  retrievedAt: string;
  provenance: ProvenanceRecord[];
  confidence: number | null;
  limitations: string[];
}

export function dataAttribution(input: {
  provenance?: ProvenanceRecord[];
  sourceUrl?: string | null;
  retrievedAt?: string;
  confidence?: number | null;
  limitations?: string[];
}): DataAttribution {
  const provenance = input.provenance ?? [];
  const first = provenance[0];
  const retrievedAt = input.retrievedAt ?? first?.retrievedAt ?? first?.fetchedAt ?? new Date().toISOString();
  const confidence = input.confidence ?? confidenceFromProvenance(provenance);
  return {
    sourceUrl: input.sourceUrl ?? first?.sourceUrl ?? first?.endpoint ?? null,
    retrievedAt,
    provenance,
    confidence,
    limitations: Array.from(new Set([...(input.limitations ?? []), ...provenance.flatMap((record) => record.limitations ?? [])]))
  };
}

function confidenceFromProvenance(provenance: ProvenanceRecord[]): number | null {
  if (provenance.length === 0) return null;
  const values = provenance.map((record) => record.confidence).filter((value) => Number.isFinite(value));
  if (values.length === 0) return null;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100;
}
