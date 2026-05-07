import 'dart:typed_data';

import 'package:flutter/material.dart';

import '../../../core/services/pdf_report_service.dart';
import '../../../core/theme/tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../../map/domain/parcel.dart';

class ParcelReportPreviewScreen extends StatefulWidget {
  const ParcelReportPreviewScreen(
      {this.parcel = ParcelDetail.sample, super.key});

  final ParcelDetail parcel;

  @override
  State<ParcelReportPreviewScreen> createState() =>
      _ParcelReportPreviewScreenState();
}

class _ParcelReportPreviewScreenState extends State<ParcelReportPreviewScreen> {
  final ParcelReportService _reportService = const PremiumParcelReportService();
  Uint8List? _generatedReport;
  bool _isGenerating = false;

  @override
  Widget build(BuildContext context) {
    final parcel = widget.parcel;
    final metrics = _reportMetrics(parcel);
    final reportBytes = _generatedReport;

    return Scaffold(
      appBar: AppBar(title: const Text('Premium Parsel Raporu')),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          DecoratedBox(
            decoration: BoxDecoration(
                gradient: AppGradients.premium,
                borderRadius: BorderRadius.circular(AppRadius.xl),
                boxShadow: AppShadows.glow(AppColors.emerald)),
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(children: [
                      Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                              color: Colors.white.withOpacity(.16),
                              borderRadius:
                                  BorderRadius.circular(AppRadius.md)),
                          child: const Icon(Icons.picture_as_pdf_rounded,
                              color: Colors.white)),
                      const Spacer(),
                      _StatusPill(
                          label: reportBytes == null
                              ? 'Taslak Önizleme'
                              : 'Rapor Hazır'),
                    ]),
                    const SizedBox(height: 18),
                    Text(
                        '${parcel.neighborhood} ${parcel.block}/${parcel.parcel}',
                        style: Theme.of(context)
                            .textTheme
                            .headlineSmall
                            ?.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.w900)),
                    const SizedBox(height: 6),
                    Text(
                        '${parcel.city} / ${parcel.district} • ${parcel.titleType} • ${parcel.zoningStatus}',
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(
                                color: Colors.white.withOpacity(.86),
                                fontWeight: FontWeight.w700)),
                    const SizedBox(height: 16),
                    Text(
                        'Tek sayfalık yatırım özeti, imar metrikleri, piyasa/risk istihbaratı yer tutucuları ve hukuki uyarılarla müşteriye sunuma hazır premium PDF akışı.',
                        style: Theme.of(context)
                            .textTheme
                            .bodyMedium
                            ?.copyWith(color: Colors.white.withOpacity(.84))),
                  ]),
            ),
          ),
          const SizedBox(height: 18),
          GlassCard(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                _SectionTitle(
                    icon: Icons.badge_rounded, title: 'Parsel Kimliği'),
                const SizedBox(height: 12),
                _KeyValueGrid(values: {
                  'İl / İlçe': '${parcel.city} / ${parcel.district}',
                  'Mahalle': parcel.neighborhood,
                  'Ada / Parsel': '${parcel.block} / ${parcel.parcel}',
                  'Nitelik': parcel.titleType,
                }),
              ])),
          const SizedBox(height: 14),
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            childAspectRatio: 1.35,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            children: [
              MetricCard(
                  title: 'TAKS',
                  value: parcel.taks.toStringAsFixed(2),
                  subtitle: 'Taban oturumu',
                  icon: Icons.square_foot_rounded),
              MetricCard(
                  title: 'KAKS / Emsal',
                  value: parcel.emsal.toStringAsFixed(2),
                  subtitle: 'Yapılaşma hakkı',
                  icon: Icons.functions_rounded),
              MetricCard(
                  title: 'Kat Limiti',
                  value: '${parcel.floorLimit} kat',
                  subtitle: parcel.zoningStatus,
                  icon: Icons.apartment_rounded),
              MetricCard(
                  title: 'Yol Cephesi',
                  value: '${parcel.roadFrontage.toStringAsFixed(1)} m',
                  subtitle: parcel.coverageRatio,
                  icon: Icons.alt_route_rounded),
            ],
          ),
          const SizedBox(height: 14),
          GlassCard(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                _SectionTitle(
                    icon: Icons.insights_rounded,
                    title: 'Risk ve Piyasa İstihbaratı'),
                const SizedBox(height: 12),
                const _InsightRow(
                    icon: Icons.shield_rounded,
                    label: 'Risk özeti',
                    value:
                        'Deprem, taşkın ve zemin katmanları için premium analiz alanı ayrıldı.'),
                const _InsightRow(
                    icon: Icons.trending_up_rounded,
                    label: 'Piyasa sinyali',
                    value:
                        'Yakın çevre değer trendleri ve arz/talep göstergeleri mock veriyle temsil edilir.'),
                const _InsightRow(
                    icon: Icons.auto_graph_rounded,
                    label: 'Yatırım notu',
                    value:
                        'Ruhsat, satış hızı ve finansman varsayımları ayrıca doğrulanmalıdır.'),
              ])),
          const SizedBox(height: 14),
          GlassCard(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                _SectionTitle(
                    icon: Icons.article_rounded,
                    title: 'Rapora Dahil Bölümler'),
                const SizedBox(height: 12),
                for (final section in _sections)
                  _IncludedSection(section: section),
              ])),
          const SizedBox(height: 14),
          GlassCard(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                _SectionTitle(icon: Icons.gavel_rounded, title: 'Yasal Uyarı'),
                const SizedBox(height: 10),
                Text(_disclaimer,
                    style: Theme.of(context)
                        .textTheme
                        .bodyMedium
                        ?.copyWith(color: AppColors.slate, height: 1.35)),
              ])),
          const SizedBox(height: 18),
          GradientButton(
              label: _isGenerating
                  ? 'Rapor hazırlanıyor...'
                  : reportBytes == null
                      ? 'PDF Raporu Oluştur'
                      : 'PDF Yeniden Oluştur',
              icon: Icons.workspace_premium_rounded,
              onPressed: _isGenerating ? null : () => _generateReport(metrics)),
          if (reportBytes != null) ...[
            const SizedBox(height: 12),
            GlassCard(
                child: Row(children: [
              const Icon(Icons.check_circle_rounded, color: AppColors.emerald),
              const SizedBox(width: 12),
              Expanded(
                  child: Text(
                      'Rapor bellekte oluşturuldu. Paylaşım eklentisi olmadığı için dosya kaydetmeden ${_formatBytes(reportBytes.length)} üretim bilgisi gösteriliyor.',
                      style: Theme.of(context)
                          .textTheme
                          .bodyMedium
                          ?.copyWith(fontWeight: FontWeight.w700))),
            ])),
          ],
        ],
      ),
    );
  }

  Future<void> _generateReport(Map<String, Object?> metrics) async {
    setState(() => _isGenerating = true);
    final bytes = await _reportService.generateParcelReport(
        parcelTitle: _parcelTitle(widget.parcel), metrics: metrics);
    if (!mounted) return;
    setState(() {
      _generatedReport = bytes;
      _isGenerating = false;
    });
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content:
            Text('Premium PDF raporu hazır: ${_formatBytes(bytes.length)}')));
  }

  Map<String, Object?> _reportMetrics(ParcelDetail parcel) => {
        'İl / İlçe': '${parcel.city} / ${parcel.district}',
        'Mahalle': parcel.neighborhood,
        'Ada / Parsel': '${parcel.block} / ${parcel.parcel}',
        'İmar Durumu': parcel.zoningStatus,
        'Tapu Niteliği': parcel.titleType,
        'TAKS': parcel.taks.toStringAsFixed(2),
        'KAKS': parcel.kaks.toStringAsFixed(2),
        'Emsal': parcel.emsal.toStringAsFixed(2),
        'Kat Limiti': '${parcel.floorLimit}',
        'Yapılaşma': parcel.coverageRatio,
        'Yol Cephesi': '${parcel.roadFrontage.toStringAsFixed(1)} m',
        'Risk Özeti':
            'Deprem, taşkın ve zemin katmanları için premium analiz yer tutucusu',
        'Piyasa İstihbaratı':
            'Yakın çevre değer trendleri mock veriyle temsil edilir',
      };

  String _parcelTitle(ParcelDetail parcel) =>
      '${parcel.city} ${parcel.district} ${parcel.neighborhood} ${parcel.block}/${parcel.parcel}';
  String _formatBytes(int bytes) =>
      bytes < 1024 ? '$bytes B' : '${(bytes / 1024).toStringAsFixed(1)} KB';
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) => Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
          color: Colors.white.withOpacity(.16),
          borderRadius: BorderRadius.circular(AppRadius.pill)),
      child: Text(label,
          style: Theme.of(context)
              .textTheme
              .labelLarge
              ?.copyWith(color: Colors.white, fontWeight: FontWeight.w800)));
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.icon, required this.title});
  final IconData icon;
  final String title;

  @override
  Widget build(BuildContext context) => Row(children: [
        Icon(icon, color: AppColors.emerald),
        const SizedBox(width: 10),
        Text(title,
            style: Theme.of(context)
                .textTheme
                .titleLarge
                ?.copyWith(fontWeight: FontWeight.w900))
      ]);
}

class _KeyValueGrid extends StatelessWidget {
  const _KeyValueGrid({required this.values});
  final Map<String, String> values;

  @override
  Widget build(BuildContext context) =>
      Wrap(spacing: 10, runSpacing: 10, children: [
        for (final entry in values.entries)
          SizedBox(
            width: (MediaQuery.sizeOf(context).width - 68) / 2,
            child: DecoratedBox(
              decoration: BoxDecoration(
                  color: AppColors.emerald.withOpacity(.08),
                  borderRadius: BorderRadius.circular(AppRadius.md)),
              child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(entry.key,
                            style: Theme.of(context)
                                .textTheme
                                .labelMedium
                                ?.copyWith(color: AppColors.slate)),
                        const SizedBox(height: 4),
                        Text(entry.value,
                            style: Theme.of(context)
                                .textTheme
                                .titleSmall
                                ?.copyWith(fontWeight: FontWeight.w800))
                      ])),
            ),
          ),
      ]);
}

class _InsightRow extends StatelessWidget {
  const _InsightRow(
      {required this.icon, required this.label, required this.value});
  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Icon(icon, color: AppColors.emerald),
          const SizedBox(width: 12),
          Expanded(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                Text(label,
                    style: Theme.of(context)
                        .textTheme
                        .titleSmall
                        ?.copyWith(fontWeight: FontWeight.w900)),
                const SizedBox(height: 3),
                Text(value,
                    style: Theme.of(context)
                        .textTheme
                        .bodyMedium
                        ?.copyWith(color: AppColors.slate))
              ]))
        ]),
      );
}

class _IncludedSection extends StatelessWidget {
  const _IncludedSection({required this.section});
  final String section;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: Row(children: [
          const Icon(Icons.check_circle_rounded,
              color: AppColors.emerald, size: 20),
          const SizedBox(width: 10),
          Expanded(
              child: Text(section,
                  style: Theme.of(context)
                      .textTheme
                      .bodyLarge
                      ?.copyWith(fontWeight: FontWeight.w700)))
        ]),
      );
}

const _sections = [
  'Parsel kimliği ve konum özeti',
  'İmar durumu, TAKS/KAKS/Emsal metrikleri',
  'Yapılaşma potansiyeli ve cephe göstergeleri',
  'Risk analizi alanları için yönetici özeti',
  'Piyasa istihbaratı ve yatırım notları',
  'Yasal uyarı ve veri doğrulama hatırlatmaları',
];

const _disclaimer =
    'Bu rapor bilgilendirme amaçlı önizleme çıktısıdır. Resmi imar durumu belgesi, tapu kayıtları, belediye plan notları ve ilgili kurum görüşleri yerine geçmez. Nihai yatırım, ruhsat ve proje kararları yetkili kurum belgeleriyle doğrulanmalıdır.';
