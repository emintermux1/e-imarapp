import 'valuation_models.dart';

enum MarketDataAccessMode { partnerApi, permittedDataset, manualEntry, unauthorizedScraping }

enum IngestionDecision { allowed, rejected }

class MarketDataConsent {
  const MarketDataConsent({required this.consentId, required this.grantedBy, required this.grantedAt, required this.allowedPurpose, this.expiresAt});

  final String consentId;
  final String grantedBy;
  final DateTime grantedAt;
  final String allowedPurpose;
  final DateTime? expiresAt;
}

class MarketDataRateLimit {
  const MarketDataRateLimit({required this.requestsPerMinute, required this.requestsPerDay, required this.burstSize});

  final int requestsPerMinute;
  final int requestsPerDay;
  final int burstSize;
}

class MarketDataAuditTrail {
  const MarketDataAuditTrail({required this.actorId, required this.purpose, required this.requestedAt, required this.source, required this.accessMode, this.consent});

  final String actorId;
  final String purpose;
  final DateTime requestedAt;
  final MarketDataSource source;
  final MarketDataAccessMode accessMode;
  final MarketDataConsent? consent;
}

class MarketDataAccessRequest {
  const MarketDataAccessRequest({required this.source, required this.accessMode, required this.region, required this.auditTrail, this.rateLimit = const MarketDataRateLimit(requestsPerMinute: 30, requestsPerDay: 1000, burstSize: 5)});

  final MarketDataSource source;
  final MarketDataAccessMode accessMode;
  final String region;
  final MarketDataAuditTrail auditTrail;
  final MarketDataRateLimit rateLimit;
}

class MarketDataAccessResult {
  const MarketDataAccessResult._({required this.decision, required this.reason});

  const MarketDataAccessResult.allowed(String reason) : this._(decision: IngestionDecision.allowed, reason: reason);
  const MarketDataAccessResult.rejected(String reason) : this._(decision: IngestionDecision.rejected, reason: reason);

  final IngestionDecision decision;
  final String reason;

  bool get isAllowed => decision == IngestionDecision.allowed;
}

abstract interface class EthicalMarketDataAdapter {
  MarketDataSource get source;
  bool supports(MarketDataAccessMode mode);
  Future<MarketDataAccessResult> authorize(MarketDataAccessRequest request);
  Future<List<MarketComparable>> fetchComparableListings(MarketDataAccessRequest request);
}

abstract base class PartnerDatasetMarketDataAdapter implements EthicalMarketDataAdapter {
  const PartnerDatasetMarketDataAdapter();

  @override
  bool supports(MarketDataAccessMode mode) => mode == MarketDataAccessMode.partnerApi || mode == MarketDataAccessMode.permittedDataset || mode == MarketDataAccessMode.manualEntry;

  @override
  Future<MarketDataAccessResult> authorize(MarketDataAccessRequest request) async {
    if (request.accessMode == MarketDataAccessMode.unauthorizedScraping) {
      return const MarketDataAccessResult.rejected('Yetkisiz scraping reddedildi. Yalnızca partner API, izinli veri seti veya manuel ekspertiz kabul edilir.');
    }
    if (!supports(request.accessMode)) {
      return MarketDataAccessResult.rejected('${request.source.label} için erişim modu desteklenmiyor.');
    }
    if (request.auditTrail.purpose.trim().isEmpty) {
      return const MarketDataAccessResult.rejected('Denetim kaydı için kullanım amacı zorunludur.');
    }
    return MarketDataAccessResult.allowed('${request.source.label} için etik erişim ön kontrolü geçti.');
  }
}

class MockMarketDataAdapter extends PartnerDatasetMarketDataAdapter {
  const MockMarketDataAdapter({required this.source});

  @override
  final MarketDataSource source;

  @override
  Future<List<MarketComparable>> fetchComparableListings(MarketDataAccessRequest request) async {
    final auth = await authorize(request);
    if (!auth.isAllowed) return const [];
    final now = DateTime(2026, 5, 7);
    return [
      MarketComparable(source: source, locationLabel: '${request.region} merkez aksı', areaSquareMeters: 520, pricePerSquareMeter: const MoneyAmount(amount: 42100), totalPrice: const MoneyAmount(amount: 21892000), distanceMeters: 420, zoningStatus: 'Konut + Ticaret', observedAt: now, sourceNote: 'Mock partner/veri seti kaydı; gerçek ilan içeriği değildir.', confidence: .74),
      MarketComparable(source: source, locationLabel: '${request.region} sahil bağlantısı', areaSquareMeters: 610, pricePerSquareMeter: const MoneyAmount(amount: 39800), totalPrice: const MoneyAmount(amount: 24278000), distanceMeters: 980, zoningStatus: 'Konut', observedAt: now, sourceNote: 'Mock karşılaştırma; lisanslı veri entegrasyonu beklenir.', confidence: .68),
    ];
  }
}
