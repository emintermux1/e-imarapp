# Veri Kaynakları

Bu proje Türkiye e-imar verisini tek yerden toplamaya çalışırken kaynakları dürüstçe sınıflandırır.

## Durum kategorileri

- `public`: public probe edilebilir
- `public_partial`: kısmen public; bazı detay akışları login isteyebilir
- `requires_credentials`: kurumsal/oturum gerekli
- `captcha_required`: captcha veya anti-bot koruması var
- `requires_legal_agreement`: resmi veri paylaşım protokolü gerekli
- `unavailable`: kaynak o anda erişilemedi

## Registry kapsamı

- Merkezi kaynaklar: TKGM, e-Plan, TUCBS, Atlas, ÇŞB CBS, Yerel Veri Platformları, BulutKBS, MAKS
- Büyükşehir/il portalları: İBB, Ankara, İzmir, Çankaya
- Belediye KEOS/WebGIS portalları: Pendik, Esenler, Çanakkale, Pamukkale, Çerkezköy, Kahramankazan, Alanya, Konak, Merkezefendi, Altınordu, Aksaray, Şehitkamil, Sultangazi, Başakşehir, Tuşba, Süleymanpaşa, Mustafakemalpaşa, Gelibolu, Çaycuma, Keçiören

## İlk entegrasyon yaklaşımı

1. Kaynağın ana HTML sayfasını probe et
2. HTML/JS içinden `.ashx`, `.asmx`, WMS/WFS, ArcGIS REST ve GeoServer endpoint izlerini çıkar
3. Public ise discovered endpoint'leri sakla
4. Captcha/login gerekiyorsa bunu açıkça kullanıcıya göster
5. Sahte parsel/askı üretme; yalnızca gerçek response veya readiness state göster
