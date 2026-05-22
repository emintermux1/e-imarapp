import type { BackendStatus } from '@/lib/api/types';

/**
 * Readiness state union — every backend status the website BFF can return,
 * plus a small set of frontend-only states for transport/UI errors.
 */
export type ReadinessState =
  | 'idle'
  | 'loading'
  | BackendStatus;

export type ReadinessTone = 'success' | 'warn' | 'danger' | 'neutral' | 'info';

export interface ReadinessDescriptor {
  state: ReadinessState;
  tone: ReadinessTone;
  /** Turkish user-facing label (short, fits in a pill). */
  label: string;
  /** Optional longer description shown in banners. */
  description?: string;
  /** Backend-provided next actions (passed through verbatim). */
  nextActions?: string[];
}
