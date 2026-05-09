import { createHash } from 'crypto';
import { ConnectorKind } from '../connectors/connector.types';

export type ProvenanceDataType = 'official' | 'public_metadata' | 'demo' | 'derived';

export interface ProvenanceRecord {
  sourceId: string;
  sourceName: string;
  endpoint?: string;
  fetchedAt: string;
  responseHash?: string;
  dataType: ProvenanceDataType;
  confidence: number;
  connectorKind?: ConnectorKind | string;
  status: string;
}

export function sha256ResponseBody(body?: string | Buffer): string | undefined {
  if (body === undefined || body === null) return undefined;
  return createHash('sha256').update(body).digest('hex');
}

export function provenanceRecord(input: Omit<ProvenanceRecord, 'fetchedAt' | 'confidence'> & { fetchedAt?: string; confidence?: number; responseBody?: string | Buffer }): ProvenanceRecord {
  const { responseBody, confidence, fetchedAt, responseHash, ...rest } = input;
  const hash = responseHash ?? sha256ResponseBody(responseBody);
  return {
    ...rest,
    fetchedAt: fetchedAt ?? new Date().toISOString(),
    ...(hash ? { responseHash: hash } : {}),
    confidence: Math.max(0, Math.min(1, confidence ?? 0.5))
  };
}
