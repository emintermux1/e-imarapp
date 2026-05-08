import type { WatchlistEntityType, WatchlistEventType } from '@/lib/api/types';

export const ENTITY_TYPE_LABEL: Record<WatchlistEntityType, string> = {
  parcel: 'Parsel',
  region: 'Bölge / poligon',
  municipality_feed: 'Belediye karar akışı',
};

export const ENTITY_TYPE_HINT: Record<WatchlistEntityType, string> = {
  parcel: 'Ada/parsel referansı (örn. 12345/7) veya parsel UUID',
  region: 'Bölge poligonu kimliği veya GeoJSON referansı',
  municipality_feed: 'Belediye kimliği (örn. tr-06)',
};

export const EVENT_LABEL: Record<WatchlistEventType, string> = {
  plan_change: 'Plan değişikliği',
  risk_change: 'Risk skoru değişimi',
  aski_start: 'Askı başlangıcı',
  aski_end: 'Askı bitişi',
};

export const EVENT_HINT: Record<WatchlistEventType, string> = {
  plan_change: 'Yürürlükteki uygulama imar planındaki revizyonlar',
  risk_change: 'Doğal afet ya da hesaplanan plan riski güncellendiğinde',
  aski_start: 'Yeni bir askı kaydı başladığında',
  aski_end: 'Aktif bir askı kaydı sona erdiğinde / itiraz süresi dolduğunda',
};
