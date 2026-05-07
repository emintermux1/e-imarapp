# E-İmar Faz 2B — GIS Katman Entegrasyonu

## Genel Bakış

Bu belge, E-İmar mobil uygulamasının GIS (Coğrafi Bilgi Sistemi) katman altyapısının mimarisini, model katmanını, ve canlı bağlantı planını açıklar. Amaç, Türkiye'deki resmî risk katmanlarını (AFAD, MTA, DSİ, Kültür Bakanlığı, TOBB) mobil harita üzerinde sorgulanabilir ve analiz edilebilir hale getirmektir.

## Veri Modeli

### Katman Türleri (`GisLayerKind`)

| Tip      | Protokol     | Çıktı Formatı    |
|----------|-------------|------------------|
| `wms`    | WMS 1.3.0   | PNG görüntü      |
| `wfs`    | WFS 2.0.0   | GeoJSON / GML    |
| `geoJson`| REST API    | GeoJSON          |

### Risk Katmanları (`RiskLayer`)

- `deprem` — Deprem Tehlike Haritası (AFAD)
- `fayHatti` — Diri Fay Hatları (MTA)
- `heyelan` — Heyelan Envanteri (AFAD)
- `sel` — Sel ve Taşkın Tehlike (DSİ)
- `zeminTipi` — Zemin Sınıflaması (MTA)
- `tarimAlani` — Tarım Alanları (TOBB)
- `sitAlani` — Sit Alanları (Kültür Bakanlığı)

### Ana Sınıflar

- `GisLayerDescriptor` — Katman tanımlayıcı (id, ad, tür, uç nokta, risk katmanı, cache TTL)
- `GisLayerQuery` — Sorgu parametreleri (sınırlayıcı kutu, CRS, format, maksimum özellik)
- `GisBoundingBox` — Coğrafi sınırlayıcı kutu (min/max enlem-boylam)
- `GisFeature` — Tek bir GeoJSON özelliği (id, özellikler, geometri)
- `GisFeatureCollection` — Özellik koleksiyonu (GeoJSON FeatureCollection karşılığı)
- `GisPoint` — Enlem/boylam noktası

## Arayüz

`GisLayerRepository` soyut arayüzü:

```dart
abstract interface class GisLayerRepository {
  Future<List<GisLayerDescriptor>> availableLayers();
  Future<GisFeatureCollection> fetchFeatures(GisLayerDescriptor layer, GisLayerQuery query);
  String buildRequestUrl(GisLayerDescriptor layer, GisLayerQuery query);
  Future<String> fetchGeoJson(GisLayerDescriptor layer, {required double latitude, required double longitude});
}
```

## URL Oluşturucular

Tüm URL oluşturma işlevleri `gis_layers.dart` içinde tanımlanmıştır:

- `buildWmsRequestUrl()` — WMS 1.3.0 `GetMap` isteği (1024×1024, PNG, saydam)
- `buildWfsRequestUrl()` — WFS 2.0.0 `GetFeature` isteği (GeoJSON çıktı)
- `buildGeoJsonRequestUrl()` — REST GeoJSON uç noktası
- `buildGisRequestUrl()` — Sorgu formatına göre otomatik seçim

## Resmî Katman Tanımları

`officialRiskLayerPresets` listesi 8 katman içerir:

1. `afad-deprem-tehlike` — AFAD TDTH WMS
2. `mta-diri-fay` — MTA Diri Fay WFS
3. `afad-heyelan` — AFAD Heyelan WMS
4. `dsi-sel-tehlike` — DSİ Sel Tehlike WMS
5. `mta-zemin` — MTA Jeoloji WMS
6. `tobb-tarim` — TOBB Tarım WMS
7. `kultur-sit` — Kültür Bakanlığı Sit WFS
8. `cevre-arazi-ortusu` — CORINE Arazi Örtüsü GeoJSON

Her katmanın kendi `cacheTtl` değeri vardır (15 dakika ile 1 yıl arası).

## Mock Uygulama

`MockGisLayerRepository`:
- 3 örnek katman döndürür (deprem, fay hattı, imar planı)
- `fetchFeatures()` boş koleksiyon döndürür
- `fetchGeoJson()` boş FeatureCollection JSON döndürür
- Ağ bağlantısı olmadığında güvenli yedek olarak kullanılır

## Analiz Ekranı

`analysis_screen.dart`:
- Riverpod `ConsumerWidget`
- `gisOfficialLayersProvider` üzerinden resmî katman listesini alır
- `gisLayerRepositoryProvider` üzerinden canlı/mock depoyu alır
- Her katman bir kart olarak gösterilir — yükleme düğmesi ile `fetchFeatures()` çağrılır
- Dio yoksa mock uyarısı gösterilir
- Yükleme durumu, hata mesajları, özellik sayısı gösterilir

---

## Faz 3 — Canlı Entegrasyon

### Amaç

Faz 3, GIS katman altyapısını canlı HTTP bağlantılarına yükseltir. Dio tabanlı ağ istekleri, Isar önbellekleme ve Isolate tabanlı GeoJSON ayrıştırma eklenir.

### Dosyalar

| Dosya | Açıklama |
|-------|----------|
| `gis_connector.dart` | Canlı depo, isolate ayrıştırma, Riverpod sağlayıcılar |
| `gis_cache_service.dart` | Önbellek hizmeti (in-memory, Isar'a hazır) |
| `gis_layers.dart` | Genişletilmiş modeller ve URL oluşturucular |

### LiveGisLayerRepository

- `Dio` istemcisi ile HTTP GET istekleri yapar
- Varsayılan zaman aşımı: 15 saniye (bağlantı, alma, gönderme)
- `fetchFeatures()` akışı:
  1. Önbellek kontrolü (`GisCacheService.get()`)
  2. Hız sınırlayıcı beklemesi (host başına minimum 300ms)
  3. HTTP isteği (`_fetchHttp()`)
  4. Durum kodu kontrolü (200-299)
  5. JSON/ikili yanıt ayrımı
  6. Küçük yanıtlar (<50KB) → ana iş parçacığında ayrıştırma
  7. Büyük yanıtlar (≥50KB) → `parseGeoJsonInIsolate()`
  8. Başarılı sonuç → önbelleğe yazma
- Asla UI'a hata fırlatmaz — hata durumunda `GisFeatureCollection.withError()` döndürür
- Tüm hatalar `debugPrint` ile loglanır

### Hata Yönetimi

| Durum | Davranış |
|-------|----------|
| Zaman aşımı | `GisFeatureCollection.withError("Bağlantı zaman aşımı: ...")` |
| HTTP 4xx/5xx | `GisFeatureCollection.withError("HTTP xxx: ...")` |
| Boş yanıt | Boş `GisFeatureCollection` |
| Geçersiz JSON | `GisFeatureCollection.withError("GeoJSON ayrıştırma hatası: ...")` |
| DioException | Tür bazlı Türkçe hata mesajı |
| Isolate hatası | Ana iş parçacığına düşüş (`_parseGeoJsonMainThread`) |

### Hız Sınırlama

`_RateLimiter` sınıfı:
- Host bazlı `DateTime` takip haritası
- Minimum 300ms bekleme (`Duration(milliseconds: 300)`)
- `waitIfNeeded(host)` ile istek öncesi kontrol

### Isolate GeoJSON Ayrıştırma

`parseGeoJsonInIsolate()` işlevi:
- `Isolate.spawn()` ile yeni isolate başlatır
- İki yönlü iletişim: `SendPort` / `ReceivePort`
- 50KB üzeri JSON yanıtlar için otomatik kullanım
- Hata durumunda `_parseGeoJsonMainThread()` yedeğine düşer
- `FeatureCollection`, `Feature`, ve ham `features` listesi formatlarını destekler

### GisCacheService

- `LinkedHashMap` tabanlı in-memory depolama
- Anahtar: `{layerId}|{bbox}|{srs}` (URI encoded)
- `get(cacheKey)` — süresi dolmuş girdileri otomatik temizler
- `put(cacheKey, features, ttl)` — TTL ile depolar
- `invalidate(layerId)` — katman bazlı toplu temizlik
- `pruneExpired()` — tüm süresi dolmuş girdileri temizler
- Isar entegrasyonu için hazır API (`@Collection` şeması eklendiğinde değiştirilebilir)

### Riverpod Sağlayıcılar

| Sağlayıcı | Tür | Açıklama |
|-----------|-----|----------|
| `_dioProvider` | `Provider<Dio?>` | Dio istemcisi (hata durumunda null) |
| `gisCacheServiceProvider` | `Provider<GisCacheService>` | Önbellek hizmeti tekil |
| `gisLayerRepositoryProvider` | `Provider<GisLayerRepository>` | Dio varsa canlı, yoksa mock depo |
| `gisOfficialLayersProvider` | `Provider<List<GisLayerDescriptor>>` | Resmî katman listesi |

### Geriye Dönük Uyumluluk

- `MockGisLayerRepository` tüm API'leriyle korunur
- Dio oluşturulamazsa `MockGisLayerRepository` otomatik seçilir
- Mevcut `fetchGeoJson()` arayüz metodu kırılmaz — varsayılan uygulama `fetchFeatures()` üzerine inşa edilir
- Tüm mevcut `GisLayerDescriptor` alanları korunur, yenileri isteğe bağlı eklenir

### Kısıtlamalar

- `firebase_repositories.dart`, `ai_services.dart`, `pdf_report_service.dart` değiştirilmemiştir
- `.agents/`, `CAPTAIN.md`, CI iş akışları değiştirilmemiştir
- Yeni paket bağımlılığı eklenmemiştir
- Tüm kopya Türkçe'dir (hata mesajları, UI, belgeler)
- Ağ bağlantısı olmadan derlenebilir — graceful degradation
