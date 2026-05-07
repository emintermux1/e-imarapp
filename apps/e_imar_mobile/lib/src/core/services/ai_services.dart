import '../../features/valuation/domain/market_data_ingestion.dart';
import '../../features/valuation/domain/valuation_models.dart';

abstract interface class ParcelAiAnalysisService {
  Future<ParcelAnalysisResponse> analyzeParcel(ParcelAnalysisRequest request);
}

abstract interface class MarketValuationService {
  Future<PriceEstimateResponse> estimatePrice(PriceEstimateRequest request);
  Future<List<MarketComparable>> findComparables(PriceEstimateRequest request);
}

abstract interface class ParcelAiService implements ParcelAiAnalysisService, MarketValuationService {
  Future<List<AiParcelInsight>> analyzeParcelLegacy({required String parcelId, required String zoningSummary});
  Future<double> estimatePricePerSquareMeter({required String district, required String zoningStatus});
}

class MockParcelAiService implements ParcelAiService {
  const MockParcelAiService();

  @override
  Future<ParcelAnalysisResponse> analyzeParcel(ParcelAnalysisRequest request) async => ParcelAnalysisResponse(
        provider: AiModelProvider.mock,
        summary: '${request.district}/${request.neighborhood} parseli için ${request.zoningSummary} notu güçlü; emsal ve kat limiti orta-üst segment geliştirme potansiyeli veriyor.',
        insights: [
          AiParcelInsight(title: 'Değer artışı', summary: '${request.district} çevresinde ulaşım ve kentsel yenileme beklentisi nedeniyle arsa m² değerinde kontrollü artış varsayılır.', confidence: .82, citations: _mockCitations),
          AiParcelInsight(title: 'Proje potansiyeli', summary: 'E:${(request.emsal ?? request.kaks ?? 1.75).toStringAsFixed(2)} ve ${request.floorLimit ?? 8} kat sınırı, butik konut + zemin ticaret senaryosunu destekler.', confidence: .76, citations: _mockCitations),
          const AiParcelInsight(title: 'Likidite', summary: 'Benzer bölgelerde pazarlık payı yüksek; nihai fiyat için tapu, cephe ve yola terk kontrolleri gerekir.', confidence: .69, citations: _mockCitations),
        ],
        riskCaveats: const [
          'Bu çıktı ekspertiz raporu değildir; lisanslı değerleme ve belediye imar durumu ile doğrulanmalıdır.',
          'Deprem, zemin, şerh ve terk gibi hukuki/teknik riskler modele sınırlı girildiğinde belirsizlik artar.',
          'Piyasa ilanları talep fiyatıdır; gerçekleşen satış verisi olmadan güven aralığı geniş tutulur.',
        ],
        investmentScore: const InvestmentScore(score: 78, label: 'Güçlü ama doğrulama gerekli', drivers: ['Merkezi lokasyon', 'Konut + ticaret esnekliği', 'Geniş güven aralığı']),
        sourceNotes: _mockSourceNotes,
        generatedAt: DateTime(2026, 5, 7, 9),
        promptBoundaryNote: 'Model yalnızca kullanıcı/izinli veri girdilerini özetler; kişisel veri, gizli tapu kaydı veya yetkisiz scraping kullanılmaz.',
      );

  @override
  Future<List<AiParcelInsight>> analyzeParcelLegacy({required String parcelId, required String zoningSummary}) async {
    final response = await analyzeParcel(ParcelAnalysisRequest(parcelId: parcelId, city: 'İstanbul', district: 'Kadıköy', neighborhood: 'Fenerbahçe', zoningSummary: zoningSummary, parcelAreaSquareMeters: 500));
    return response.insights;
  }

  @override
  Future<PriceEstimateResponse> estimatePrice(PriceEstimateRequest request) async {
    final pricePerSquareMeter = _basePricePerSquareMeter(request.district, request.zoningStatus);
    final total = pricePerSquareMeter * request.parcelAreaSquareMeters;
    final comps = await findComparables(request);
    return PriceEstimateResponse(
      provider: AiModelProvider.mock,
      estimatedTotalValue: MoneyAmount(amount: total),
      pricePerSquareMeter: MoneyAmount(amount: pricePerSquareMeter),
      confidenceInterval: ConfidenceInterval(low: MoneyAmount(amount: total * .84), mid: MoneyAmount(amount: total), high: MoneyAmount(amount: total * 1.18), confidence: .72),
      comparables: comps,
      marketTrend: 'Son 6 ayda nitelikli arsa arzı sınırlı; talep fiyatları yatay-yukarı bantta izleniyor.',
      aiInsight: '${request.neighborhood} için mock analiz, imar esnekliği ve cephe varsayımı nedeniyle güçlü yatırım skoru üretir; nihai karar için ekspertiz ve belediye teyidi gerekir.',
      investmentScore: const InvestmentScore(score: 81, label: 'Premium fırsat adayı', drivers: ['Yakın emsal yoğunluğu', 'Ticari zemin opsiyonu', 'Ulaşım aksına yakınlık']),
      riskCaveats: const ['İlan verileri gerçekleşmiş satış değildir.', 'KVKK ve platform kullanım şartları nedeniyle yalnızca izinli kaynaklar kullanılmalıdır.', 'Zemin/deprem ve takyidat kontrolleri fiyatı değiştirebilir.'],
      sourceNotes: _mockSourceNotes,
      generatedAt: DateTime(2026, 5, 7, 9, 15),
    );
  }

  @override
  Future<List<MarketComparable>> findComparables(PriceEstimateRequest request) async {
    final auditTrail = MarketDataAuditTrail(actorId: 'mock-user', purpose: 'Parsel değerleme önizlemesi', requestedAt: DateTime(2026, 5, 7, 9, 10), source: MarketDataSource.manualAppraisal, accessMode: MarketDataAccessMode.manualEntry, consent: MarketDataConsent(consentId: 'mock-consent', grantedBy: 'demo', grantedAt: DateTime(2026, 5, 7), allowedPurpose: 'Değerleme önizlemesi'));
    final adapters = const [
      MockMarketDataAdapter(source: MarketDataSource.manualAppraisal),
      MockMarketDataAdapter(source: MarketDataSource.municipalityOpenData),
      MockMarketDataAdapter(source: MarketDataSource.sahibinden),
    ];
    final requestRegion = '${request.district}/${request.neighborhood}';
    final comps = <MarketComparable>[];
    for (final adapter in adapters) {
      comps.addAll(await adapter.fetchComparableListings(MarketDataAccessRequest(source: adapter.source, accessMode: adapter.source == MarketDataSource.sahibinden ? MarketDataAccessMode.permittedDataset : MarketDataAccessMode.manualEntry, region: requestRegion, auditTrail: auditTrail)));
    }
    return comps.take(4).toList(growable: false);
  }

  @override
  Future<double> estimatePricePerSquareMeter({required String district, required String zoningStatus}) async => _basePricePerSquareMeter(district, zoningStatus);

  double _basePricePerSquareMeter(String district, String zoningStatus) {
    final districtPremium = district.toLowerCase().contains('kadıköy') ? 1.18 : district.toLowerCase().contains('beşiktaş') ? 1.24 : 1.0;
    final zoningPremium = zoningStatus.toLowerCase().contains('ticaret') ? 1.12 : 1.0;
    return 38500 * districtPremium * zoningPremium;
  }
}

class Gpt4oParcelAiService extends MockParcelAiService {
  const Gpt4oParcelAiService({required this.apiKey});
  final String apiKey;
}

class GrokPriceAiService extends MockParcelAiService {
  const GrokPriceAiService({required this.apiKey});
  final String apiKey;
}

const _mockCitations = [
  AiCitation(title: 'Mock belediye açık veri özeti', sourceName: 'Belediye açık veri', note: 'İmar planı ve bölge notları için izinli açık veri yer tutucusu.'),
  AiCitation(title: 'Mock manuel ekspertiz karşılaştırması', sourceName: 'Manuel ekspertiz', note: 'Lisanslı değerleme girdisi yerine kullanılan demo notu.'),
];

const _mockSourceNotes = [
  SourceNote(label: 'İzinli veri sınırı', description: 'Karşılaştırmalar mock/izinli veri mimarisini temsil eder; gerçek platform scraping yapılmaz.', citations: _mockCitations),
  SourceNote(label: 'Model sınırı', description: 'GPT-4o/Grok entegrasyonu geldiğinde yanıtlar kaynak notu ve güven aralığı olmadan gösterilmemelidir.', citations: _mockCitations),
];
