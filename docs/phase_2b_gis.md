# Phase 2B GIS layer engine

## Data source plan

- AFAD deprem tehlike katmanı: deprem risk skoru için resmi tehlike haritası veya AFAD tarafından sağlanan GeoJSON/WMS/WFS servisleri bağlanacak. Geçici endpoint uygulamada placeholder olarak tutulur.
- MTA diri fay katmanı: fay hattı yakınlığı için MTA diri fay verisi WFS tercih edilerek alınacak; lisans ve servis erişimi doğrulanmadan canlı çağrı yapılmaz.
- Belediye WMS/WFS katmanları: heyelan, sel/taşkın, zemin tipi ve imar planı gibi yerel katmanlar belediye geoserver servislerinden il bazlı konfigürasyonla beslenecek.
- e-Plan/TKGM placeholder katmanları: plan paftası, tarım alanı ve koruma/sit alanı çakışmaları için resmi servis URL'leri sözleşme ve kullanım koşulları netleşince değiştirilecek.

## WMS/WFS/GeoJSON conventions

- Tüm katmanlar `GisLayerDescriptor` metadata modeliyle tanımlanır: id, ad, tür, endpoint, kaynak kurum, atıf, opaklık, varsayılan görünürlük, risk kategorisi ve cache TTL.
- `GisLayerQuery` bounding box ve nokta sorgularını destekler. Nokta sorgusunda küçük bir varsayılan bbox üretilir.
- WMS URL'leri `GetMap`, şeffaf PNG, `EPSG:4326`, layer name ve bbox parametreleriyle inşa edilir.
- WFS URL'leri `GetFeature`, `outputFormat=application/geo+json`, `typeNames`, `srsName` ve bbox parametreleriyle inşa edilir.
- GeoJSON endpointleri bbox, srs ve format parametreleriyle scaffold edilir.
- Bu faz gerçek network çağrısı yapmaz; repository URL üretir ve mock `FeatureCollection` döndürür.

## Caching and isolate parsing plan

- TTL katman bazında descriptor üzerinde tutulur. Statik jeoloji/fay verisi 30-90 gün, belediye afet katmanları 7-14 gün arası cache edilmelidir.
- Canlı entegrasyonda cache anahtarı `layerId + bbox + srs + style/version` olarak kurulmalıdır.
- Büyük GeoJSON yanıtları UI thread üzerinde parse edilmemelidir. Flutter `compute` veya dedicated isolate ile JSON decode ve feature sadeleştirme yapılmalıdır.
- İlk aşamada ham GeoJSON wrapper saklanır; harita çizimi için yalnızca gerekli property ve geometry tipleri plain model alanlarına çıkarılır.
- Cache temizliği kurum güncelleme tarihi, HTTP cache header ve uygulama sürüm migrasyonları ile tetiklenmelidir.

## Legal and attribution notes

- Resmi kaynak verileri kurum kullanım şartlarına, telif/atıf zorunluluklarına ve ticari kullanım izinlerine göre bağlanmalıdır.
- AFAD, MTA, TKGM, e-Plan ve belediye servisleri ekranda kaynak badge'i ve raporlarda atıf metni ile gösterilmelidir.
- Placeholder URL'ler üretim ortamında kullanılmamalıdır; canlı endpointler doğrulanmadan risk sonuçları hukuki karar veya yapı güvenliği görüşü gibi sunulmamalıdır.
- Risk skoru karar destek göstergesidir. Nihai değerlendirme resmi imar durumu, zemin etüdü, afet kurum görüşleri ve yetkili uzman incelemesiyle yapılmalıdır.
