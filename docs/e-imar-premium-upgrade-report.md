# E-İmar Premium GIS Yükseltme Raporu

> Historical implementation report. The current canonical web app is `apps/e_imar_web`; legacy `frontend/` references below describe the archived prototype-era implementation.

Bu doküman mevcut sistemi baştan yazmadan, profesyonel belediye/GIS platform seviyesine çıkarma çalışmasının analiz + uygulama özetini içerir.

## 1) Mevcut sistem analizi (tespit edilen boşluklar)

### UX ve akış boşlukları
- Harita sayfası tek katman seçimi ve temel görüntüleme ile sınırlıydı.
- Parsel hover/click geri bildirimi zayıftı; mini önizleme/popup akışı yoktu.
- Çoklu seçim, hızlı kıyaslama, çalışma alanı (workspace) hissi eksikti.
- Mobilde sağ panel/katman kullanımında tek elle kullanım odağı yoktu.

### Harita etkileşim eksikleri
- Hover glow, seçili sınır animasyonu, pulse vurgusu yoktu.
- Shift + drag çoklu seçim yoktu.
- Yoğun bölgelerde clustering yoktu.
- Adaptif etiket ölçekleme ve opacity kontrolü sınırlıydı.

### Performans / GIS rendering darboğazları
- Yüksek parsel sayısında farklı LOD (zoom’a göre render davranışı) stratejisi zayıftı.
- Katman aktivasyonu tekil ve manuel akıştaydı; çok katmanlı kıyas sınırlıydı.
- Vektör tile tabanlı yüksek ölçek stratejisi kodda standartlaştırılmamıştı.

### Veri doğrulama açıklıkları
- GeoJSON girişinde güçlü bütünlük taraması yoktu.
- Polygon ring kapanma, self-intersection, duplicate, timestamp, CRS kontrolü yoktu.
- Güven skoru / şüpheli veri bildirimi harita operatörüne gösterilmiyordu.

## 2) Bu iterasyonda yapılan profesyonel geliştirmeler

## Harita deneyimi iyileştirmeleri
- `frontend/components/MapViewer.tsx` tamamen premium GIS odaklı yeniden yapılandırıldı:
  - Hover glow efekti
  - Click sonrası animated border (dash phase)
  - Seçili parsellerde pulse etkisi
  - Shift + click ile çoklu parsel seçimi
  - Shift + drag box selection
  - Hover tooltip preview + mini bilgi kartı
  - Popup içinde TAKS/KAKS/risk/güncelleme alanları
  - Katman bazlı opacity kontrolü (parsel + WMS)
  - Adaptif etiket boyutlandırma (zoom bazlı)
  - Yoğunluk clustering (centroid + cluster source)
  - Mesafe / radius / polygon ölçüm araçları

## Veri doğrulama sistemi
- Yeni modül: `frontend/lib/geo-validation.ts`
  - Eksik koordinat kontrolü
  - Bozuk polygon/ring onarım denemesi
  - Self-intersection tespiti
  - Duplicate parcel detection (ada/parsel + geometri hash)
  - CRS mismatch kontrolü
  - Timestamp format kontrolü
  - Güven skoru üretimi (confidence score)
- Haritada “Veri güven skoru” paneli + integrity scan issue listesi gösterimi eklendi.

## Harita sayfası revizyonu
- `frontend/app/map/page.tsx` premium kontrol merkezine dönüştürüldü:
  - Katmanları yükle + parsel verisini çek akışları ayrıldı
  - İl/ilçe/ada/parsel tabanlı hızlı parsel yükleme
  - Kırmızı/beyaz kurumsal temaya uygun ciddi belediye/GIS hissi
  - Sağ panelde WMS katman görünürlüğü ve harita kullanım notları

## 3) Refactor ve mimari öneriler (devam backlog)

### Component parçalama önerisi
- `MapViewer` aşağıdaki parçalara ayrılmalı:
  - `MapShell` (instance lifecycle)
  - `ParcelInteractionController`
  - `LayerControlPanel`
  - `ParcelPopupCard`
  - `ValidationOverlay`
  - `MeasurementTools`
- Zustand/Redux ile harita state merkezi hale getirilmeli (selection/layer/filter/history).

### State management optimizasyonu
- UI state ve map feature-state ayrıştırılmalı.
- Harita event’leri debounce edilerek store update sayısı azaltılmalı.
- Query sonuçları için stale-while-revalidate cache uygulanmalı.

## 4) API / DB / PostGIS önerileri

### API bottleneck
- Tek tek parsel geometri endpoint’i yerine batch geo endpoint önerisi:
  - `POST /parsel/geometry/batch`
- Harita viewport bazlı sorgu endpoint’i:
  - `GET /parsel/in-bbox?bbox=...&zoom=...`

### PostgreSQL/PostGIS index önerileri
- `parcels(geom)` üzerinde `GIST` zorunlu (mevcutsa fillfactor/tuning gözden geçirilmeli).
- Sık filtre alanları için kompozit index:
  - `(il, ilce, ada, parsel)`
  - `(municipality_id, updated_at desc)`
- Büyük geometriler için:
  - `ST_Subdivide` ile parçalama ve materialized view
  - `ST_SimplifyPreserveTopology` ile zoom seviyeli cache tabloları
- Sorgu örnekleri:
  - `ST_Intersects` yerine uygun yerde `&&` bbox prefilter + `ST_Intersects`
  - `ANALYZE` + `EXPLAIN (ANALYZE, BUFFERS)` rutin izleme

## 5) Güvenlik, anti-scraping, rate limit

- IP + user + API key tabanlı kademeli rate limit (burst + sustained)
- Harita tile endpoint’lerinde tokenized signed URL ve kısa TTL
- Davranışsal anti-bot:
  - Aşırı bbox sweep pattern tespiti
  - Şüpheli seri indirme durumunda progressive throttling
- Audit log:
  - kritik veri değişiklikleri için immutable log tablosu
  - operator rollback için version chain
- WAF/CDN seviyesinde:
  - geo fencing
  - bot management
  - edge cache + abuse signature kuralları

## 6) Tile server ve render optimizasyonları (hedef mimari)

- pg_tileserv / tegola / tilelive zincirinde vector tile standardizasyonu
- Zoom bazlı iki seviyeli geometri:
  - düşük zoom: sadeleştirilmiş geometri
  - yüksek zoom: tam doğruluk
- Background worker ile precompute tile cache
- Mobil GPU için:
  - layer cap (eşzamanlı çizim üst sınırı)
  - label collision ve halo maliyetinin zoom bazlı adaptasyonu

---

Bu iterasyonda odak, harita deneyimini doğrudan ürün yüzeyinde premium seviyeye çekmek ve veri güvenilirliğini görünür kılmak oldu. Sonraki adımda backend tarafında vector tile + PostGIS query pipeline’ı büyütülerek milyonlarca parsel ölçeğine taşınmalıdır.
