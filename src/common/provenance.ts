import { createHash } from 'crypto';
import { ConnectorKind } from '../connectors/connector.types';

export type ProvenanceDataType = 'official' | 'public_metadata' | 'demo' | 'derived';

export interface ProvenanceRecord {
  sourceId: string;
  sourceName: string;
  sourceUrl?: string;
  endpoint?: string;
  retrievedAt: string;
  fetchedAt: string;
  responseHash?: string;
  dataType: ProvenanceDataType;
  confidence: number;
  connectorKind?: ConnectorKind | string;
  status: string;
  limitations: string[];
}

export function sha256ResponseBody(body?: string | Buffer): string | undefined {
  if (body === undefined || body === null) return undefined;
  return createHash('sha256').update(body).digest('hex');
}

export function provenanceRecord(input: Omit<ProvenanceRecord, 'retrievedAt' | 'fetchedAt' | 'confidence' | 'limitations'> & { retrievedAt?: string; fetchedAt?: string; confidence?: number; responseBody?: string | Buffer; limitations?: string[] }): ProvenanceRecord {
  const { responseBody, confidence, retrievedAt, fetchedAt, responseHash, sourceUrl, endpoint, limitations, ...rest } = input;
  const hash = responseHash ?? sha256ResponseBody(responseBody);
  const timestamp = retrievedAt ?? fetchedAt ?? new Date().toISOString();
  return {
    ...rest,
    endpoint,
    sourceUrl: sourceUrl ?? endpoint,
    retrievedAt: timestamp,
    fetchedAt: timestamp,
    ...(hash ? { responseHash: hash } : {}),
    confidence: Math.max(0, Math.min(1, confidence ?? 0.5)),
    limitations: limitations ?? []
  };
}
