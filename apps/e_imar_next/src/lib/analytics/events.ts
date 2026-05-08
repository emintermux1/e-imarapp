/**
 * Lightweight typed analytics emitter. Sprint 1 just logs to `console.info`
 * (real provider wiring happens in a later sprint). Keep this list typed
 * so we can statically catch typos in callers.
 */

import type { BackendStatus, ParcelQueryType } from '@/lib/api/types';
import type { LayerCategory, MapStyleName } from '@/types/map';
import type {
  SuspensionPlanType,
  WatchlistEntityType,
  WatchlistEventType,
  WatchlistSeverity,
} from '@/lib/api/types';

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
  | { name: 'plan_explain_finished'; payload: { status?: BackendStatus } }
  | {
      name: 'aski_filter_changed';
      payload: {
        dateFrom?: string | null;
        dateTo?: string | null;
        municipalityCount?: number;
        planTypeCount?: number;
      };
    }
  | { name: 'aski_plan_selected'; payload: { planId: string; planType?: SuspensionPlanType } }
  | {
      name: 'watchlist_entity_added';
      payload: { entityType: WatchlistEntityType; entityRef: string };
    }
  | {
      name: 'watchlist_rule_saved';
      payload: {
        entityType: WatchlistEntityType;
        events: WatchlistEventType[];
        severityFloor?: WatchlistSeverity;
      };
    }
  | { name: 'watchlist_subscription_deleted'; payload: { subscriptionId: string } }
  | { name: 'timemachine_range_set'; payload: { fromAt: string; toAt: string; parcelId?: string } }
  | { name: 'timemachine_compare_moved'; payload: { position: number } }
  | {
      name: 'plan_explain_submitted';
      payload: { audience: string; maxBullets: number; length: number };
    }
  | {
      name: 'plan_explain_received';
      payload: { status?: BackendStatus; provider?: string; model?: string };
    };

type EventName = AnalyticsEvent['name'];
type PayloadOf<N extends EventName> = Extract<AnalyticsEvent, { name: N }>['payload'];

export function trackEvent<N extends EventName>(name: N, payload: PayloadOf<N>): void {
  if (typeof console !== 'undefined') {
    console.info('[analytics]', name, payload);
  }
}
