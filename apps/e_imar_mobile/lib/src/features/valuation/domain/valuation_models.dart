enum AiModelProvider { mock, gpt4o, grok }

class MoneyAmount {
  const MoneyAmount({required this.amount, this.currency = 'TRY'});

  final double amount;
  final String currency;
}

class ConfidenceInterval {
  const ConfidenceInterval({required this.low, required this.mid, required this.high, required this.confidence});

  final MoneyAmount low;
  final MoneyAmount mid;
  final MoneyAmount high;
  final double confidence;
}

class AiCitation {
  const AiCitation({required this.title, required this.sourceName, required this.note, this.url, this.retrievedAt});

  final String title;
  final String sourceName;
  final String note;
  final String? url;
  final DateTime? retrievedAt;
}

class SourceNote {
  const SourceNote({required this.label, required this.description, required this.citations});

  final String label;
  final String description;
  final List<AiCitation> citations;
}

class ParcelAnalysisRequest {
  const ParcelAnalysisRequest({required this.parcelId, required this.city, required this.district, required this.neighborhood, required this.zoningSummary, required this.parcelAreaSquareMeters, this.taks, this.kaks, this.emsal, this.floorLimit});

  final String parcelId;
  final String city;
  final String district;
  final String neighborhood;
  final String zoningSummary;
  final double parcelAreaSquareMeters;
  final double? taks;
  final double? kaks;
  final double? emsal;
  final int? floorLimit;
}

class ParcelAnalysisResponse {
  const ParcelAnalysisResponse({required this.provider, required this.summary, required this.insights, required this.riskCaveats, required this.investmentScore, required this.sourceNotes, required this.generatedAt, this.promptBoundaryNote});

  final AiModelProvider provider;
  final String summary;
  final List<AiParcelInsight> insights;
  final List<String> riskCaveats;
  final InvestmentScore investmentScore;
  final List<SourceNote> sourceNotes;
  final DateTime generatedAt;
  final String? promptBoundaryNote;
}

class AiParcelInsight {
  const AiParcelInsight({required this.title, required this.summary, required this.confidence, this.citations = const []});

  final String title;
  final String summary;
  final double confidence;
  final List<AiCitation> citations;
}

class PriceEstimateRequest {
  const PriceEstimateRequest({required this.parcelId, required this.city, required this.district, required this.neighborhood, required this.zoningStatus, required this.parcelAreaSquareMeters, this.parcelAnalysis});

  final String parcelId;
  final String city;
  final String district;
  final String neighborhood;
  final String zoningStatus;
  final double parcelAreaSquareMeters;
  final ParcelAnalysisResponse? parcelAnalysis;
}

class PriceEstimateResponse {
  const PriceEstimateResponse({required this.provider, required this.estimatedTotalValue, required this.pricePerSquareMeter, required this.confidenceInterval, required this.comparables, required this.marketTrend, required this.aiInsight, required this.investmentScore, required this.riskCaveats, required this.sourceNotes, required this.generatedAt});

  final AiModelProvider provider;
  final MoneyAmount estimatedTotalValue;
  final MoneyAmount pricePerSquareMeter;
  final ConfidenceInterval confidenceInterval;
  final List<MarketComparable> comparables;
  final String marketTrend;
  final String aiInsight;
  final InvestmentScore investmentScore;
  final List<String> riskCaveats;
  final List<SourceNote> sourceNotes;
  final DateTime generatedAt;
}

class MarketComparable {
  const MarketComparable({required this.source, required this.locationLabel, required this.areaSquareMeters, required this.pricePerSquareMeter, required this.totalPrice, required this.distanceMeters, required this.zoningStatus, required this.observedAt, required this.sourceNote, this.confidence = .7});

  final MarketDataSource source;
  final String locationLabel;
  final double areaSquareMeters;
  final MoneyAmount pricePerSquareMeter;
  final MoneyAmount totalPrice;
  final double distanceMeters;
  final String zoningStatus;
  final DateTime observedAt;
  final String sourceNote;
  final double confidence;
}

class InvestmentScore {
  const InvestmentScore({required this.score, required this.label, required this.drivers});

  final int score;
  final String label;
  final List<String> drivers;
}

enum MarketDataSource { sahibinden, emlakjet, hepsiemlak, municipalityOpenData, manualAppraisal }

extension MarketDataSourceLabel on MarketDataSource {
  String get label => switch (this) {
        MarketDataSource.sahibinden => 'Sahibinden',
        MarketDataSource.emlakjet => 'Emlakjet',
        MarketDataSource.hepsiemlak => 'Hepsiemlak',
        MarketDataSource.municipalityOpenData => 'Belediye açık veri',
        MarketDataSource.manualAppraisal => 'Manuel ekspertiz',
      };
}
