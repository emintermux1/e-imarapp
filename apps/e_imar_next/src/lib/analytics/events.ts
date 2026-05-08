/**
 * Lightweight typed analytics emitter. Sprint 1 just logs to `console.info`
 * (real provider wiring happens in a later sprint). Keep this list typed
 * so we can statically catch typos in callers.
 */

import type { BackendStatus, ParcelQueryType } from '@/lib/api/types';
import type { LayerCategory, MapStyleName } from '@/types/map';

export type AnalyticsEvent =
  | { name: 'query_submitted'; payload: { type: ParcelQueryType; userReference?: string } }
  | { name: 'query_finished'; payload: { type: ParcelQueryType; status?: BackendStatus; count?: number } }
  | { name: 'query_failed'; payload: { type: ParcelQueryType; reason: string } }
  | { name: 'parcel_selected'; payload: { parcelId: string; source: 'search' | 'map' | 'route' } }
  | { name: 'analysis_opened'; payload: { parcelId: string } }
  | { name: 'report_requested'; payload: { parcelId: string; format: 'pdf' | 'csv' | 'geojson' } }
  | { name: 'layer_toggled'; payload: { id: string; category: LayerCategory; enabled: boolean } }
  | { name: 'map_style_changed'; payload: { style: MapStyleName } }
  | { name: 'theme_toggled'; payload: { theme: 'light' | 'dark' | 'system' } }
  | { name: 'plan_explain_started'; payload: { audience: string; length: number } }
  | { name: 'plan_explain_finished'; payload: { status?: BackendStatus } };

type EventName = AnalyticsEvent['name'];
type PayloadOf<N extends EventName> = Extract<AnalyticsEvent, { name: N }>['payload'];

export function trackEvent<N extends EventName>(name: N, payload: PayloadOf<N>): void {
  if (typeof console !== 'undefined') {
    console.info('[analytics]', name, payload);
  }
}
