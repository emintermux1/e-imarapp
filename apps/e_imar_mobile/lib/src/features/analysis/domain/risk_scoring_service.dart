import '../../../core/services/gis_layers.dart';

class RiskLayerSignal {
  const RiskLayerSignal(
      {required this.layer,
      required this.severity,
      required this.confidence,
      required this.summary});

  final RiskLayer layer;
  final int severity;
  final double confidence;
  final String summary;
}

class RiskScoreResult {
  const RiskScoreResult(
      {required this.score,
      required this.label,
      required this.confidence,
      required this.explanation,
      required this.signals});

  final int score;
  final String label;
  final double confidence;
  final String explanation;
  final List<RiskLayerSignal> signals;
}

class RiskScoringService {
  const RiskScoringService();

  RiskScoreResult score(
      {required Iterable<RiskLayer> selectedLayers,
      GisPoint point = const GisPoint(latitude: 41.0082, longitude: 28.9784)}) {
    final signals = selectedLayers
        .map((layer) => _mockSignal(layer, point))
        .toList(growable: false);
    if (signals.isEmpty) {
      return const RiskScoreResult(
          score: 0,
          label: 'Katman seçilmedi',
          confidence: 0,
          explanation:
              'Risk analizi için en az bir resmi katman seçilmelidir. Bu ekranda canlı servis yerine deterministik mock sinyaller kullanılır.',
          signals: []);
    }

    final weighted = signals.fold<double>(
        0, (total, signal) => total + signal.severity * signal.confidence);
    final confidenceTotal =
        signals.fold<double>(0, (total, signal) => total + signal.confidence);
    final score = (weighted / confidenceTotal).round().clamp(0, 100).toInt();
    final confidence =
        (confidenceTotal / signals.length).clamp(0, 1).toDouble();
    final label = score >= 72
        ? 'Yüksek risk'
        : score >= 44
            ? 'Orta risk'
            : 'Düşük risk';
    final dominant = [...signals]
      ..sort((a, b) => b.severity.compareTo(a.severity));
    final primary = dominant.first;
    final secondary = dominant.length > 1 ? dominant[1] : dominant.first;
    return RiskScoreResult(
      score: score,
      label: label,
      confidence: confidence,
      explanation:
          '$label skoru, seçili ${signals.length} katmanın ağırlıklı mock değerlendirmesiyle üretildi. En belirgin etki ${_layerTitle(primary.layer)} için ${primary.summary}; ikinci sinyal ${_layerTitle(secondary.layer)} tarafında ${secondary.summary}. Canlı WMS/WFS bağlantıları açıldığında aynı model resmi özellik yoğunluğu, mesafe ve zon kesişimlerinden beslenecek.',
      signals: signals,
    );
  }

  RiskLayerSignal _mockSignal(RiskLayer layer, GisPoint point) {
    final locationBias =
        ((point.latitude * 10).round() + (point.longitude * 10).round()).abs() %
            9;
    return switch (layer) {
      RiskLayer.deprem => RiskLayerSignal(
          layer: layer,
          severity: 76 + locationBias,
          confidence: .86,
          summary: 'AFAD tehlike bandı yüksek ivme bölgesi varsayımı'),
      RiskLayer.fayHatti => RiskLayerSignal(
          layer: layer,
          severity: 68 + locationBias,
          confidence: .82,
          summary: 'MTA diri fay yakınlığı orta-yüksek duyarlılık veriyor'),
      RiskLayer.heyelan => RiskLayerSignal(
          layer: layer,
          severity: 42 + locationBias,
          confidence: .66,
          summary: 'eğim/jeoloji sinyali kontrollü zemin incelemesi öneriyor'),
      RiskLayer.sel => RiskLayerSignal(
          layer: layer,
          severity: 36 + locationBias,
          confidence: .64,
          summary: 'taşkın ve dere koruma bandı etkisi sınırlı görünüyor'),
      RiskLayer.zeminTipi => RiskLayerSignal(
          layer: layer,
          severity: 58 + locationBias,
          confidence: .78,
          summary:
              'zemin sınıfı yapılaşma öncesi mikro-bölgeleme kontrolü gerektiriyor'),
      RiskLayer.tarimAlani => RiskLayerSignal(
          layer: layer,
          severity: 31 + locationBias,
          confidence: .7,
          summary: 'tarımsal koruma çakışması düşük-orta seviyede'),
      RiskLayer.sitAlani => RiskLayerSignal(
          layer: layer,
          severity: 24 + locationBias,
          confidence: .72,
          summary: 'koruma statüsü çakışması mock alanda düşük'),
    };
  }

  String _layerTitle(RiskLayer layer) => switch (layer) {
        RiskLayer.deprem => 'deprem',
        RiskLayer.fayHatti => 'fay hattı',
        RiskLayer.heyelan => 'heyelan',
        RiskLayer.sel => 'sel',
        RiskLayer.zeminTipi => 'zemin tipi',
        RiskLayer.tarimAlani => 'tarım alanı',
        RiskLayer.sitAlani => 'sit alanı',
      };
}
