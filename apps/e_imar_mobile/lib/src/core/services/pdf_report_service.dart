import 'dart:typed_data';

import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:syncfusion_flutter_pdf/pdf.dart' as sf;

abstract interface class ParcelReportService {
  Future<Uint8List> generateParcelReport({
    required String parcelTitle,
    required Map<String, Object?> metrics,
  });
}

class ParcelReportData {
  const ParcelReportData({
    required this.identity,
    required this.zoningMetrics,
    required this.riskSummary,
    required this.aiInsights,
    required this.valuationAssumptions,
    required this.generatedAt,
    required this.disclaimer,
    this.referenceCode,
    this.mapSnapshotBytes,
    this.usesMockData = true,
  });

  final ParcelIdentity identity;
  final ZoningMetrics zoningMetrics;
  final RiskSummary riskSummary;
  final List<AiInsight> aiInsights;
  final ValuationAssumptions valuationAssumptions;
  final DateTime generatedAt;
  final String disclaimer;
  final String? referenceCode;
  final Uint8List? mapSnapshotBytes;
  final bool usesMockData;
}

class ParcelIdentity {
  const ParcelIdentity({
    required this.city,
    required this.district,
    required this.neighborhood,
    required this.block,
    required this.parcel,
    required this.titleType,
    required this.zoningStatus,
    this.address,
    this.coordinates,
  });

  final String city;
  final String district;
  final String neighborhood;
  final String block;
  final String parcel;
  final String titleType;
  final String zoningStatus;
  final String? address;
  final String? coordinates;

  String get title => '$neighborhood $block/$parcel';
  String get location => '$city / $district';
}

class ZoningMetrics {
  const ZoningMetrics({
    required this.taks,
    required this.kaks,
    required this.emsal,
    required this.floorLimit,
    required this.roadFrontageMeters,
    this.coverageRatio,
    this.planFunction,
  });

  final double taks;
  final double kaks;
  final double emsal;
  final int floorLimit;
  final double roadFrontageMeters;
  final String? coverageRatio;
  final String? planFunction;
}

class RiskSummary {
  const RiskSummary(
      {required this.overallLabel, required this.items, this.notes});

  final String overallLabel;
  final List<RiskItem> items;
  final String? notes;
}

class RiskItem {
  const RiskItem(
      {required this.label, required this.level, required this.description});

  final String label;
  final int level;
  final String description;
}

class AiInsight {
  const AiInsight(
      {required this.title, required this.message, this.confidence});

  final String title;
  final String message;
  final int? confidence;
}

class ValuationAssumptions {
  const ValuationAssumptions({
    required this.investmentScore,
    required this.marketTrend,
    required this.projectPotential,
    this.comparableDataNote,
  });

  final int investmentScore;
  final String marketTrend;
  final String projectPotential;
  final String? comparableDataNote;
}

class PremiumParcelReportService implements ParcelReportService {
  const PremiumParcelReportService();

  @override
  Future<Uint8List> generateParcelReport({
    required String parcelTitle,
    required Map<String, Object?> metrics,
  }) {
    final data = ParcelReportData(
      identity: ParcelIdentity(
        city: _readString(metrics, 'city', fallback: 'Belirtilmedi'),
        district: _readString(metrics, 'district', fallback: 'Belirtilmedi'),
        neighborhood:
            _readString(metrics, 'neighborhood', fallback: parcelTitle),
        block: _readString(metrics, 'block', fallback: '-'),
        parcel: _readString(metrics, 'parcel', fallback: '-'),
        titleType: _readString(metrics, 'titleType', fallback: 'Parsel'),
        zoningStatus: _readString(metrics, 'zoningStatus',
            fallback: 'İmar durumu teyit bekliyor'),
      ),
      zoningMetrics: ZoningMetrics(
        taks: _readDouble(metrics, 'TAKS'),
        kaks: _readDouble(metrics, 'KAKS'),
        emsal: _readDouble(metrics, 'Emsal'),
        floorLimit: _readInt(metrics, 'Kat'),
        roadFrontageMeters: _readDouble(metrics, 'Yol Cephesi'),
        coverageRatio: _readString(metrics, 'Yapılaşma'),
      ),
      riskSummary: const RiskSummary(
        overallLabel: 'Ön değerlendirme',
        items: [
          RiskItem(
              label: 'Deprem',
              level: 44,
              description:
                  'Bölgesel deprem verisi canlı entegrasyonla teyit edilmelidir.'),
          RiskItem(
              label: 'Likidite',
              level: 26,
              description:
                  'Bölge talebi ve emsal satışlar detaylandırılmalıdır.'),
          RiskItem(
              label: 'Plan',
              level: 18,
              description:
                  'Plan notları ve terk koşulları belediye kaydıyla doğrulanmalıdır.'),
        ],
      ),
      aiInsights: const [
        AiInsight(
            title: 'AI değer artışı',
            message:
                'Bölgede son 2 yılda yüksek değer artışı ve düşük arz baskısı görülüyor.',
            confidence: 82),
        AiInsight(
            title: 'Proje potansiyeli',
            message:
                'Mevcut metriklerle butik konut veya karma kullanım senaryosu analiz edilebilir.',
            confidence: 76),
      ],
      valuationAssumptions: const ValuationAssumptions(
        investmentScore: 86,
        marketTrend:
            'Merkezi konum ve güçlü cephe varsayımıyla pozitif görünüm.',
        projectPotential:
            'Bağımsız bölüm adedi, çekme mesafeleri ve otopark koşulları canlı plan notlarıyla netleşir.',
        comparableDataNote:
            'Emsal satışlar ve kira çarpanları henüz canlı veri kaynağına bağlanmamıştır.',
      ),
      generatedAt: DateTime.now(),
      disclaimer: defaultLegalDisclaimer,
      referenceCode: 'EIMAR-${DateTime.now().millisecondsSinceEpoch}',
    );
    return generatePremiumParcelReport(data);
  }

  Future<Uint8List> generatePremiumParcelReport(ParcelReportData data) async {
    final doc = pw.Document();
    final generatedAt = _formatDateTime(data.generatedAt);

    doc.addPage(
      pw.MultiPage(
        pageTheme: pw.PageTheme(
          margin: const pw.EdgeInsets.fromLTRB(32, 32, 32, 40),
          theme: pw.ThemeData.withFont(
              base: pw.Font.helvetica(), bold: pw.Font.helveticaBold()),
          buildBackground: (_) => data.usesMockData
              ? pw.FullPage(
                  ignoreMargins: true,
                  child: pw.Center(
                    child: pw.Transform.rotate(
                      angle: -0.55,
                      child: pw.Text(
                        'MOCK VERİ - RESMİ BELGE DEĞİLDİR',
                        style: pw.TextStyle(
                            color: PdfColors.grey300,
                            fontSize: 34,
                            fontWeight: pw.FontWeight.bold),
                      ),
                    ),
                  ),
                )
              : pw.SizedBox(),
        ),
        footer: (context) => pw.Row(
          mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
          children: [
            pw.Text('E-İmar • İmar ve Emsal Sorgu',
                style: _mutedStyle(size: 8)),
            pw.Text('Sayfa ${context.pageNumber}/${context.pagesCount}',
                style: _mutedStyle(size: 8)),
          ],
        ),
        build: (context) => [
          _header(data, generatedAt),
          pw.SizedBox(height: 18),
          _sectionTitle('Parsel ve konum özeti'),
          _summaryGrid([
            ('Parsel', data.identity.title),
            ('Konum', data.identity.location),
            ('Nitelik', data.identity.titleType),
            ('İmar durumu', data.identity.zoningStatus),
            if (data.identity.address != null)
              ('Adres', data.identity.address!),
            if (data.identity.coordinates != null)
              ('Koordinat', data.identity.coordinates!),
          ]),
          pw.SizedBox(height: 14),
          _sectionTitle('İmar metrikleri'),
          _metricsTable(data.zoningMetrics),
          pw.SizedBox(height: 14),
          _mapSnapshot(data.mapSnapshotBytes),
          pw.SizedBox(height: 14),
          _sectionTitle('Risk özeti'),
          _riskSection(data.riskSummary),
          pw.SizedBox(height: 14),
          _sectionTitle('AI içgörüleri'),
          _insightSection(data.aiInsights),
          pw.SizedBox(height: 14),
          _sectionTitle('Değerleme varsayımları'),
          _valuationSection(data.valuationAssumptions),
          pw.SizedBox(height: 14),
          _referenceBox(data.referenceCode),
          pw.SizedBox(height: 14),
          _disclaimer(data.disclaimer),
        ],
      ),
    );

    return doc.save();
  }

  static const defaultLegalDisclaimer =
      'Bu rapor bilgilendirme amaçlıdır; resmi imar durumu, tapu kaydı, ruhsat, plan notları ve takyidat yerine geçmez. KVKK kapsamında kişisel veri içermemesi hedeflenmiştir. Nihai karar öncesinde belediye, tapu müdürlüğü ve ilgili resmi kurumlardan doğrulama yapılmalıdır.';

  static String _readString(Map<String, Object?> metrics, String key,
      {String fallback = ''}) {
    final value = metrics[key];
    if (value == null) return fallback;
    final text = value.toString().trim();
    return text.isEmpty ? fallback : text;
  }

  static double _readDouble(Map<String, Object?> metrics, String key) {
    final value = metrics[key];
    if (value is num) return value.toDouble();
    if (value is String) {
      return double.tryParse(
              value.replaceAll(',', '.').replaceAll(RegExp('[^0-9.-]'), '')) ??
          0;
    }
    return 0;
  }

  static int _readInt(Map<String, Object?> metrics, String key) {
    final value = metrics[key];
    if (value is num) return value.toInt();
    if (value is String) {
      return int.tryParse(value.replaceAll(RegExp('[^0-9-]'), '')) ?? 0;
    }
    return 0;
  }
}

class SyncfusionReportTemplateProbe {
  const SyncfusionReportTemplateProbe();
  sf.PdfDocument createEmptyDocument() => sf.PdfDocument();
}

pw.Widget _header(ParcelReportData data, String generatedAt) => pw.Container(
      padding: const pw.EdgeInsets.all(18),
      decoration: pw.BoxDecoration(
          color: PdfColor.fromHex('#064E3B'),
          borderRadius: pw.BorderRadius.circular(16)),
      child: pw.Row(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Container(
            width: 54,
            height: 54,
            alignment: pw.Alignment.center,
            decoration: pw.BoxDecoration(
                color: PdfColors.white,
                borderRadius: pw.BorderRadius.circular(14)),
            child: pw.Text('Eİ',
                style: pw.TextStyle(
                    color: PdfColor.fromHex('#047857'),
                    fontSize: 22,
                    fontWeight: pw.FontWeight.bold)),
          ),
          pw.SizedBox(width: 14),
          pw.Expanded(
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Text('E-İmar',
                    style: pw.TextStyle(
                        color: PdfColors.white,
                        fontSize: 24,
                        fontWeight: pw.FontWeight.bold)),
                pw.SizedBox(height: 4),
                pw.Text('İmar ve Emsal Sorgu',
                    style: pw.TextStyle(
                        color: PdfColor.fromHex('#D1FAE5'), fontSize: 12)),
                pw.SizedBox(height: 10),
                pw.Text(data.identity.title,
                    style: pw.TextStyle(
                        color: PdfColors.white,
                        fontSize: 16,
                        fontWeight: pw.FontWeight.bold)),
              ],
            ),
          ),
          pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.end,
            children: [
              pw.Text('Premium Parsel Raporu',
                  style: pw.TextStyle(
                      color: PdfColors.white,
                      fontSize: 11,
                      fontWeight: pw.FontWeight.bold)),
              pw.SizedBox(height: 6),
              pw.Text(generatedAt,
                  style: pw.TextStyle(
                      color: PdfColor.fromHex('#A7F3D0'), fontSize: 9)),
            ],
          ),
        ],
      ),
    );

pw.Widget _sectionTitle(String title) => pw.Padding(
      padding: const pw.EdgeInsets.only(bottom: 8),
      child: pw.Text(title,
          style: pw.TextStyle(
              color: PdfColor.fromHex('#064E3B'),
              fontSize: 14,
              fontWeight: pw.FontWeight.bold)),
    );

pw.Widget _summaryGrid(List<(String, String)> rows) => pw.Wrap(
      spacing: 8,
      runSpacing: 8,
      children: rows.map((row) => _kvCard(row.$1, row.$2, width: 246)).toList(),
    );

pw.Widget _kvCard(String label, String value, {double? width}) => pw.Container(
      width: width,
      padding: const pw.EdgeInsets.all(10),
      decoration: _softBox(),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Text(label, style: _mutedStyle(size: 8)),
          pw.SizedBox(height: 4),
          pw.Text(value,
              style:
                  pw.TextStyle(fontSize: 11, fontWeight: pw.FontWeight.bold)),
        ],
      ),
    );

pw.Widget _metricsTable(ZoningMetrics metrics) => pw.Table(
      border: pw.TableBorder.all(color: PdfColor.fromHex('#DDE7E1'), width: .7),
      children: [
        _metricRow(['TAKS', 'KAKS', 'Emsal', 'Kat', 'Yol Cephesi']),
        _metricRow([
          metrics.taks.toStringAsFixed(2),
          metrics.kaks.toStringAsFixed(2),
          metrics.emsal.toStringAsFixed(2),
          '${metrics.floorLimit}',
          '${metrics.roadFrontageMeters.toStringAsFixed(1)} m',
        ], header: false),
        if (metrics.coverageRatio != null || metrics.planFunction != null)
          _metricRow([
            'Yapılaşma',
            metrics.coverageRatio ?? '-',
            'Plan fonksiyonu',
            metrics.planFunction ?? '-',
            ''
          ], header: false),
      ],
    );

pw.TableRow _metricRow(List<String> values, {bool header = true}) =>
    pw.TableRow(
      decoration:
          header ? pw.BoxDecoration(color: PdfColor.fromHex('#ECFDF5')) : null,
      children: values
          .map(
            (value) => pw.Padding(
              padding:
                  const pw.EdgeInsets.symmetric(horizontal: 8, vertical: 9),
              child: pw.Text(value,
                  style: pw.TextStyle(
                      fontSize: header ? 9 : 11,
                      fontWeight:
                          header ? pw.FontWeight.bold : pw.FontWeight.normal)),
            ),
          )
          .toList(),
    );

pw.Widget _mapSnapshot(Uint8List? bytes) {
  if (bytes == null || bytes.isEmpty) {
    return pw.Container(
      height: 88,
      alignment: pw.Alignment.center,
      decoration: pw.BoxDecoration(
          border: pw.Border.all(color: PdfColor.fromHex('#CBD5E1')),
          borderRadius: pw.BorderRadius.circular(12)),
      child: pw.Text(
          'Harita görüntüsü yer tutucusu - canlı Mapbox/GIS entegrasyonu ile doldurulacak',
          style: _mutedStyle(size: 10)),
    );
  }
  return pw.Image(pw.MemoryImage(bytes), height: 140, fit: pw.BoxFit.cover);
}

pw.Widget _riskSection(RiskSummary summary) => pw.Container(
      padding: const pw.EdgeInsets.all(12),
      decoration: _softBox(),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Text(summary.overallLabel,
              style:
                  pw.TextStyle(fontSize: 11, fontWeight: pw.FontWeight.bold)),
          pw.SizedBox(height: 8),
          ...summary.items.map(
            (item) => pw.Padding(
              padding: const pw.EdgeInsets.only(bottom: 7),
              child: pw.Row(
                children: [
                  pw.Container(
                      width: 74,
                      child: pw.Text(item.label,
                          style: pw.TextStyle(
                              fontSize: 10, fontWeight: pw.FontWeight.bold))),
                  pw.Container(
                    width: 120,
                    height: 7,
                    decoration: pw.BoxDecoration(
                        color: PdfColor.fromHex('#DCFCE7'),
                        borderRadius: pw.BorderRadius.circular(99)),
                    child: pw.Align(
                      alignment: pw.Alignment.centerLeft,
                      child: pw.Container(
                          width: 1.2 * item.level.clamp(0, 100).toDouble(),
                          color: PdfColor.fromHex('#10B981')),
                    ),
                  ),
                  pw.SizedBox(width: 8),
                  pw.Expanded(
                      child: pw.Text('${item.level}/100 • ${item.description}',
                          style: _mutedStyle(size: 9))),
                ],
              ),
            ),
          ),
          if (summary.notes != null)
            pw.Text(summary.notes!, style: _mutedStyle(size: 9)),
        ],
      ),
    );

pw.Widget _insightSection(List<AiInsight> insights) => pw.Column(
      children: insights
          .map(
            (insight) => pw.Container(
              margin: const pw.EdgeInsets.only(bottom: 8),
              padding: const pw.EdgeInsets.all(12),
              decoration: _softBox(),
              child: pw.Row(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Container(
                      width: 8,
                      height: 36,
                      decoration: pw.BoxDecoration(
                          color: PdfColor.fromHex('#10B981'),
                          borderRadius: pw.BorderRadius.circular(99))),
                  pw.SizedBox(width: 10),
                  pw.Expanded(
                    child: pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.start,
                      children: [
                        pw.Text(
                            insight.confidence == null
                                ? insight.title
                                : '${insight.title} • Güven ${insight.confidence}%',
                            style: pw.TextStyle(
                                fontSize: 11, fontWeight: pw.FontWeight.bold)),
                        pw.SizedBox(height: 4),
                        pw.Text(insight.message, style: _mutedStyle(size: 10)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          )
          .toList(),
    );

pw.Widget _valuationSection(ValuationAssumptions assumptions) => pw.Column(
      children: [
        _kvCard('Yatırım skoru', '${assumptions.investmentScore}/100'),
        pw.SizedBox(height: 8),
        _kvCard('Piyasa trendi', assumptions.marketTrend),
        pw.SizedBox(height: 8),
        _kvCard('Proje potansiyeli', assumptions.projectPotential),
        if (assumptions.comparableDataNote != null) ...[
          pw.SizedBox(height: 8),
          _kvCard('Emsal veri notu', assumptions.comparableDataNote!)
        ],
      ],
    );

pw.Widget _referenceBox(String? referenceCode) => pw.Container(
      padding: const pw.EdgeInsets.all(12),
      decoration: pw.BoxDecoration(
          border: pw.Border.all(color: PdfColor.fromHex('#064E3B'), width: .8),
          borderRadius: pw.BorderRadius.circular(12)),
      child: pw.Row(
        children: [
          pw.Container(
              width: 58,
              height: 58,
              alignment: pw.Alignment.center,
              decoration: pw.BoxDecoration(color: PdfColor.fromHex('#F1F5F9')),
              child: pw.Text('QR',
                  style: pw.TextStyle(
                      fontWeight: pw.FontWeight.bold,
                      color: PdfColor.fromHex('#334155')))),
          pw.SizedBox(width: 12),
          pw.Expanded(
              child: pw.Text(
                  'Referans ve QR yer tutucusu. Canlı paylaşım akışında doğrulanabilir rapor bağlantısı üretilecektir.',
                  style: _mutedStyle(size: 10))),
          pw.Text(referenceCode ?? 'EIMAR-REF',
              style:
                  pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold)),
        ],
      ),
    );

pw.Widget _disclaimer(String disclaimer) => pw.Container(
      padding: const pw.EdgeInsets.all(12),
      decoration: pw.BoxDecoration(
          color: PdfColor.fromHex('#FFFBEB'),
          borderRadius: pw.BorderRadius.circular(12)),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Text('KVKK ve yasal uyarı',
              style: pw.TextStyle(
                  fontSize: 10,
                  fontWeight: pw.FontWeight.bold,
                  color: PdfColor.fromHex('#92400E'))),
          pw.SizedBox(height: 5),
          pw.Text(disclaimer,
              style: pw.TextStyle(
                  fontSize: 8.5, color: PdfColor.fromHex('#78350F'))),
        ],
      ),
    );

pw.BoxDecoration _softBox() => pw.BoxDecoration(
      color: PdfColor.fromHex('#F8FAFC'),
      border: pw.Border.all(color: PdfColor.fromHex('#E2E8F0'), width: .7),
      borderRadius: pw.BorderRadius.circular(12),
    );

pw.TextStyle _mutedStyle({required double size}) =>
    pw.TextStyle(fontSize: size, color: PdfColor.fromHex('#64748B'));

String _formatDateTime(DateTime value) {
  String two(int input) => input.toString().padLeft(2, '0');
  return '${two(value.day)}.${two(value.month)}.${value.year} ${two(value.hour)}:${two(value.minute)}';
}
