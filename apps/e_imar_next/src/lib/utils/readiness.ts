import type { BackendStatus } from '@/lib/api/types';
import type { ReadinessDescriptor, ReadinessState, ReadinessTone } from '@/types/readiness';

/**
 * Turkish user-facing labels for every backend status the website BFF can
 * return, plus a couple of frontend-only states (idle/loading) used by
 * the readiness gate.
 */
export const STATUS_LABEL_TR: Record<string, string> = {
  idle: 'Hazır',
  loading: 'Yükleniyor',
  ok: 'Hazır',
  empty: 'Kayıt yok',
  not_ready: 'Hazır değil',
  requires_credentials: 'Kimlik bilgisi gerekli',
  requires_legal_agreement: 'Yasal onay gerekli',
  unavailable: 'Erişilemiyor',
  captcha_required: 'CAPTCHA doğrulaması gerekli',
  rate_limited: 'Çok fazla istek',
  invalid_input: 'Geçersiz giriş',
  invalid: 'Geçersiz veri',
  unsupported: 'Desteklenmiyor',
  unsupported_format: 'Desteklenmeyen biçim',
  requires_geocoder: 'Adres çözümleyici gerekli',
  requires_data: 'Veri ingest gerekli',
  provider_error: 'Sağlayıcı hatası',
  partial: 'Kısmi sonuç',
  network_error: 'Bağlantı hatası',
};

const TONE_BY_STATUS: Record<string, ReadinessTone> = {
  idle: 'neutral',
  loading: 'info',
  ok: 'success',
  empty: 'neutral',
  not_ready: 'warn',
  requires_credentials: 'warn',
  requires_legal_agreement: 'warn',
  captcha_required: 'warn',
  rate_limited: 'warn',
  requires_geocoder: 'warn',
  requires_data: 'warn',
  partial: 'warn',
  unavailable: 'danger',
  invalid_input: 'danger',
  invalid: 'danger',
  unsupported: 'danger',
  unsupported_format: 'danger',
  provider_error: 'danger',
  network_error: 'danger',
};

export function readinessTone(status?: ReadinessState | null): ReadinessTone {
  if (!status) return 'neutral';
  return TONE_BY_STATUS[status] ?? 'neutral';
}

export function readinessLabel(status?: ReadinessState | null): string {
  if (!status) return 'Bilinmiyor';
  return STATUS_LABEL_TR[status] ?? status;
}

export function describeReadiness(input: {
  status?: BackendStatus | ReadinessState | null;
  message?: string;
  nextActions?: string[];
}): ReadinessDescriptor {
  const state = (input.status ?? 'idle') as ReadinessState;
  return {
    state,
    tone: readinessTone(state),
    label: readinessLabel(state),
    description: input.message,
    nextActions: input.nextActions,
  };
}

export function isReady(status?: ReadinessState | null): boolean {
  return status === 'ok';
}

export function isLoading(status?: ReadinessState | null): boolean {
  return status === 'loading';
}

export function isErrorState(status?: ReadinessState | null): boolean {
  return readinessTone(status) === 'danger';
}
