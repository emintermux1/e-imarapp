import type { LayerCatalogItem } from '@/types/map';

/**
 * Seed catalog of map layers used by the workspace. The actual tile/source
 * URLs are not wired in Sprint 1 — we render readiness state instead.
 *
 * Categories follow the spec:
 *  - parsel        (TKGM/TUCBS parsel)
 *  - imar          (zoning function & boundaries)
 *  - idari         (administrative boundary)
 *  - risk          (natural risk / disaster)
 *  - ulasim        (transport infrastructure)
 *  - aski          (askı / plan değişim)
 */
export const DEFAULT_LAYER_CATALOG: LayerCatalogItem[] = [
  {
    id: 'parsel',
    label: 'Parsel sınırları',
    category: 'parsel',
    categoryLabel: 'Parsel',
    enabled: true,
    opacity: 0.85,
    source: 'tucbs',
    description: 'TKGM/TUCBS kadastral parsel sınırları',
  },
  {
    id: 'imar-zoning',
    label: 'İmar planı (fonksiyon)',
    category: 'imar',
    categoryLabel: 'İmar',
    enabled: false,
    opacity: 0.6,
    source: 'eplan',
    description: 'Yürürlükteki uygulama imar planı fonksiyon alanları',
  },
  {
    id: 'idari-sinir',
    label: 'İl/İlçe/Mahalle sınırları',
    category: 'idari',
    categoryLabel: 'İdari sınır',
    enabled: true,
    opacity: 0.7,
    source: 'tucbs',
    description: 'Mülki idare sınırları',
  },
  {
    id: 'dogal-risk',
    label: 'Doğal afet/risk',
    category: 'risk',
    categoryLabel: 'Doğal risk',
    enabled: false,
    opacity: 0.5,
    source: 'tucbs',
    description: 'Deprem fay hattı ve heyelan risk katmanları',
  },
  {
    id: 'ulasim-altyapi',
    label: 'Ulaşım ve altyapı',
    category: 'ulasim',
    categoryLabel: 'Ulaşım',
    enabled: false,
    opacity: 0.7,
    source: 'tucbs',
    description: 'Ana yol, demiryolu ve metro hatları',
  },
  {
    id: 'aski-plan-degisim',
    label: 'Askıdaki plan değişimleri',
    category: 'aski',
    categoryLabel: 'Askı/plan',
    enabled: false,
    opacity: 0.6,
    source: 'eplan',
    description: 'Belediye tarafından askıya çıkartılmış plan değişiklikleri',
  },
];
