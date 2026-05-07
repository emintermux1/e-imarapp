# Phase 3A: Emsal hesaplayıcı ve Etüt Hazırlama

Phase 3A iki özellik ekler: gelişmiş emsal hesaplayıcı ve `Etüt Hazırlama` talep akışı.

## Emsal hesaplayıcı (gelişmiş)

### Domain — `features/emsal/domain/emsal_calculator.dart`

Yeni modeller:
- `ApartmentTypeMix`: daire tipi (label, m² alan, adet, satış m² fiyatı), toplam alan ve satış hesapları
- `FloorBlueprint`: kat planı (kat no, daire tip listesi), toplam birim ve alan hesapları
- `FloorBreakdown`: kat bazında kırılım (kat no, inşaat alanı, birim sayısı, maliyet, satış potansiyeli, daire tipleri)

`EmsalInput` genişletildi:
- `blueprints: List<FloorBlueprint>` — isteğe bağlı kat planları

`EmsalResult` genişletildi:
- `tabanAlani: double?` — TAKS × arsa alanı (TAKS verilmişse)
- `floorBreakdowns: List<FloorBreakdown>` — kat bazında detaylı kırılım

`EmsalCalculatorService` yeni yetenekler:
- `resolveTabanAlani(input)`: TAKS varsa taban alanı hesaplar
- `resolveFloorCount(input)`: kat sayısını belirler — kullanıcı girdisi, TAKS+emsal'den türetme, veya varsayılan
- `calculate(input)`: blueprint varsa kat planlarına göre, yoksa ortalama daire alanına göre hesaplama yapar

### UI — `features/emsal/presentation/emsal_calculator_screen.dart`

Yeni bölümler:
- **Taban Alanı kartı**: TAKS verilmişse taban oturumu gösterilir
- **Kat Bazında Kırılım**: her kat için inşaat alanı, daire adedi, maliyet, satış potansiyeli; blueprint varsa daire tip rozetleri
- **Varsayımlar bölümü**: m² maliyet (₺18.500), satış m² fiyat (₺38.500), daire alanı (115 m²), veri kaynağı (Mock / Faz 2) ve fintech notu
- **Etüt CTA**: `Etüt Talebi Oluştur` butonu → `/study-request` rotasına yönlendirir

## Etüt Hazırlama akışı

### Domain — `features/study/domain/study_request.dart`

`StudyRequest` modeli:
- `deliveryTime`: teslim süresi (`1 hafta`, `2 hafta`, `1 ay`, `2 ay`)
- `city`, `district`: il/ilçe
- `ada`, `parsel`: ada/parsel bilgileri
- `landArea`: arsa alanı (m²)
- `description`: talep açıklaması
- `isValid`: tüm alanların dolu ve geçerli olduğunu kontrol eder

### UI — `features/study/presentation/study_request_screen.dart`

3 adımlı premium form akışı:

**Adım 1 — Bilgiler**:
- Teslim süresi seçimi (segmentli kontrol)
- İl / İlçe metin girişi
- Arsa alanı (m²) sayısal giriş
- Validasyon: il, ilçe, arsa alanı zorunlu

**Adım 2 — Detay**:
- Ada / Parsel metin girişi
- Açıklama (çok satırlı)
- Validasyon: ada, parsel, açıklama zorunlu

**Adım 3 — Onay**:
- Tüm bilgilerin özet görünümü
- Bilgilendirme notu: "Talebiniz incelendikten sonra danışmanlarımız en kısa sürede size dönüş yapacaktır."
- "Onayla ve Gönder" butonu

Alt çubuk: Geri / Devam navigasyonu, adım göstergesi (noktalar + çizgi)

## Rota

- Yeni rota: `StudyRequestRoute` — `path: '/study-request'`, `name: 'study-request'`
- `app_router.dart`'a `StudyRequestScreen` import ve `GoRoute` tanımı eklendi
- Emsal ekranından `Navigator.of(context).pushNamed('/study-request')` ile geçiş

## Tasarım notları

- Tüm UI bileşenleri mevcut tema token'ları (`AppColors`, `AppSpacing`, `AppRadius`, `AppGradients`, `AppShadows`) ve premium widget'ları (`GlassCard`, `GradientButton`, `StatusBadge`, `InsightCard`, `ValueScoreCard`, `MetricCard`, `AppSegmentedControl`, `PremiumHeader`) kullanır
- Türkçe dil desteği tam
- Mock veri uyarıları tüm finansal hesaplarda gösterilir
- Karanlık mod ve degrade arka plan desteği korunur

## Kapsam dışı

- Gerçek API entegrasyonu (Faz 2+)
- Firebase / backend kaydı
- Ödeme akışı
- Admin paneli / moderasyon
- Bildirimler
- Yeni bağımlılıklar

## Dosya değişiklikleri

| Dosya | Değişiklik |
|---|---|
| `apps/e_imar_mobile/lib/src/features/emsal/domain/emsal_calculator.dart` | Genişletilmiş domain modelleri ve servis |
| `apps/e_imar_mobile/lib/src/features/emsal/presentation/emsal_calculator_screen.dart` | Gelişmiş UI: kırılımlar, varsayımlar, CTA |
| `apps/e_imar_mobile/lib/src/features/study/domain/study_request.dart` | Yeni: StudyRequest modeli |
| `apps/e_imar_mobile/lib/src/features/study/presentation/study_request_screen.dart` | Yeni: 3 adımlı etüt formu |
| `apps/e_imar_mobile/lib/src/app/router/app_router.dart` | StudyRequestRoute eklendi |
| `docs/phase_3a_emsal_study.md` | Yeni: faz dokümantasyonu |
