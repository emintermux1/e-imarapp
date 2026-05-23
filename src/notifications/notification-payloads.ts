export type NotificationChannel = 'push' | 'webhook';

export type WatchlistChangeType =
  | 'new_plan'
  | 'status_change'
  | 'aski_started'
  | 'aski_ended'
  | 'geometry_change'
  | 'source_access_status_change';

export interface NotificationSubscriptionPayload {
  userReference: string;
  channel: NotificationChannel;
  target: string;
  platform?: string | null;
  metadata?: Record<string, unknown>;
}

export interface WatchlistNotificationPayload {
  changeId: string;
  changeType: WatchlistChangeType | string;
  userReference: string;
  planTitle?: string | null;
  province?: string | null;
  district?: string | null;
  watchedTarget?: string | null;
  detectedAt?: string | null;
  data: Record<string, unknown>;
}

export interface PushGatewayPayload {
  token: string;
  platform: string;
  title: string;
  body: string;
  payload: WatchlistNotificationPayload;
}

export function buildWatchlistNotificationPayload(row: Record<string, unknown>): WatchlistNotificationPayload {
  return {
    changeId: String(row.change_id ?? row.changeId ?? ''),
    changeType: String(row.change_type ?? row.changeType ?? 'status_change'),
    userReference: String(row.user_reference ?? row.userReference ?? ''),
    planTitle: readNullableString(row.plan_title ?? row.planTitle),
    province: readNullableString(row.province),
    district: readNullableString(row.district),
    watchedTarget: readNullableString(row.watch_target ?? row.watchTarget),
    detectedAt: readNullableString(row.detected_at ?? row.detectedAt),
    data: sanitizePayloadData(row)
  };
}

export function buildPushGatewayPayload(token: string, payload: WatchlistNotificationPayload, platform?: string | null): PushGatewayPayload {
  return {
    token,
    platform: platform ?? 'unknown',
    title: notificationTitle(payload),
    body: notificationBody(payload),
    payload
  };
}

function notificationTitle(payload: WatchlistNotificationPayload): string {
  if (payload.changeType === 'aski_started' || payload.changeType === 'new_plan') return 'Yeni askı planı bildirimi';
  if (payload.changeType === 'aski_ended') return 'Askı süresi güncellendi';
  if (payload.changeType === 'source_access_status_change') return 'Kaynak erişim durumu değişti';
  return 'İmar değişikliği bildirimi';
}

function notificationBody(payload: WatchlistNotificationPayload): string {
  const place = [payload.province, payload.district].filter(Boolean).join(' / ');
  const plan = payload.planTitle ? `: ${payload.planTitle}` : '';
  return `${place || 'Takip ettiğiniz bölgede'} ${payload.changeType} tespit edildi${plan}.`;
}

function readNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function sanitizePayloadData(row: Record<string, unknown>): Record<string, unknown> {
  const blocked = new Set(['webhook_url', 'target', 'token']);
  return Object.fromEntries(Object.entries(row).filter(([key]) => !blocked.has(key)));
}
