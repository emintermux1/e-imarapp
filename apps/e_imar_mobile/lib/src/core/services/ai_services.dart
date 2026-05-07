class AiParcelInsight {
  const AiParcelInsight({required this.title, required this.summary, required this.confidence});
  final String title;
  final String summary;
  final double confidence;
}

abstract interface class ParcelAiService {
  Future<List<AiParcelInsight>> analyzeParcel({required String parcelId, required String zoningSummary});
  Future<double> estimatePricePerSquareMeter({required String district, required String zoningStatus});
}

class MockParcelAiService implements ParcelAiService {
  const MockParcelAiService();

  @override
  Future<List<AiParcelInsight>> analyzeParcel({required String parcelId, required String zoningSummary}) async => const [
        AiParcelInsight(title: 'Değer Artışı', summary: 'Bu bölgede son 2 yılda yüksek değer artışı görüldü.', confidence: .82),
        AiParcelInsight(title: 'Proje Potansiyeli', summary: 'Bu arsaya tahmini 24 dairelik proje yapılabilir.', confidence: .76),
      ];

  @override
  Future<double> estimatePricePerSquareMeter({required String district, required String zoningStatus}) async => 38500;
}

class Gpt4oParcelAiService extends MockParcelAiService {
  const Gpt4oParcelAiService({required this.apiKey});
  final String apiKey;
}

class GrokPriceAiService extends MockParcelAiService {
  const GrokPriceAiService({required this.apiKey});
  final String apiKey;
}
