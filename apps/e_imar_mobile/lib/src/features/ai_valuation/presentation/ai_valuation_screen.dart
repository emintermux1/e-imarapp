import 'package:flutter/material.dart';

import '../../../core/services/ai_services.dart';
import '../../../core/theme/tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../../map/domain/parcel.dart';
import '../../valuation/domain/valuation_models.dart';

class AiValuationScreen extends StatelessWidget {
  const AiValuationScreen(
      {super.key,
      this.parcel = ParcelDetail.sample,
      this.aiService = const MockParcelAiService()});

  final ParcelDetail parcel;
  final ParcelAiService aiService;

  @override
  Widget build(BuildContext context) {
    final parcelId = '${parcel.block}/${parcel.parcel}';
    final zoningSummary =
        '${parcel.zoningStatus}, TAKS ${parcel.taks.toStringAsFixed(2)}, KAKS ${parcel.kaks.toStringAsFixed(2)}, ${parcel.floorLimit} kat';
    return Scaffold(
      appBar: AppBar(title: const Text('AI Değerleme')),
      body: FutureBuilder<_AiValuationViewModel>(
        future: _AiValuationViewModel.load(
            parcel: parcel,
            aiService: aiService,
            parcelId: parcelId,
            zoningSummary: zoningSummary),
        builder: (context, snapshot) {
          if (!snapshot.hasData)
            return const AppStateView(
                title: 'AI raporu hazırlanıyor',
                message:
                    'Mock servis ve deterministik piyasa kanıtları birleştiriliyor.',
                icon: Icons.auto_awesome_rounded);
          final model = snapshot.data!;
          return ListView(
            padding: const EdgeInsets.fromLTRB(
                AppSpacing.lg, AppSpacing.md, AppSpacing.lg, AppSpacing.xl),
            children: [
              _HeroSummary(model: model),
              const SizedBox(height: AppSpacing.md),
              const _ConsentGuardrailCard(),
              const SizedBox(height: AppSpacing.md),
              _ValuationRangeCard(model: model),
              const SizedBox(height: AppSpacing.md),
              _InsightSection(insights: model.insights),
              const SizedBox(height: AppSpacing.md),
              _ComparableListingsCard(listings: model.comparables),
              const SizedBox(height: AppSpacing.md),
              _SourcePlaceholdersCard(sources: model.sources),
              const SizedBox(height: AppSpacing.md),
              const _GovernanceCard(),
            ],
          );
        },
      ),
    );
  }
}

class _AiValuationViewModel {
  const _AiValuationViewModel(
      {required this.parcel,
      required this.insights,
      required this.pricePerSquareMeter,
      required this.parcelArea,
      required this.confidence,
      required this.comparables,
      required this.sources});

  final ParcelDetail parcel;
  final List<AiParcelInsight> insights;
  final double pricePerSquareMeter;
  final double parcelArea;
  final double confidence;
  final List<_ComparableListing> comparables;
  final List<_MarketSource> sources;

  double get lowPricePerSquareMeter => pricePerSquareMeter * .88;
  double get highPricePerSquareMeter => pricePerSquareMeter * 1.14;
  double get lowParcelValue => lowPricePerSquareMeter * parcelArea;
  double get highParcelValue => highPricePerSquareMeter * parcelArea;
  String get parcelLabel =>
      '${parcel.neighborhood} ${parcel.block}/${parcel.parcel}';

  static Future<_AiValuationViewModel> load({required ParcelDetail parcel, required ParcelAiService aiService, required String parcelId, required String zoningSummary}) async {
    const parcelArea = 1240.0;
    final analysis = await aiService.analyzeParcel(
      ParcelAnalysisRequest(
        parcelId: parcelId,
        city: parcel.city,
        district: parcel.district,
        neighborhood: parcel.neighborhood,
        zoningSummary: zoningSummary,
        parcelAreaSquareMeters: parcelArea,
        taks: parcel.taks,
        kaks: parcel.kaks,
        emsal: parcel.emsal,
        floorLimit: parcel.floorLimit,
      ),
    );
    final price = await aiService.estimatePrice(
      PriceEstimateRequest(
        parcelId: parcelId,
        city: parcel.city,
        district: parcel.district,
        neighborhood: parcel.neighborhood,
        zoningStatus: parcel.zoningStatus,
        parcelAreaSquareMeters: parcelArea,
        parcelAnalysis: analysis,
      ),
    );
    return _AiValuationViewModel(
      parcel: parcel,
      insights: analysis.insights,
      pricePerSquareMeter: price.pricePerSquareMeter.amount,
      parcelArea: parcelArea,
      confidence: price.confidenceInterval.confidence,
      comparables: const [
        _ComparableListing(
            title: 'Fenerbahçe arsa benzeri',
            distance: '450 m',
            pricePerSquareMeter: 40200,
            source: 'Partner ilan API taslağı',
            freshness: 'Son 14 gün',
            confidence: .74),
        _ComparableListing(
            title: 'Konut + ticaret parseli',
            distance: '1,1 km',
            pricePerSquareMeter: 37100,
            source: 'Açık veri rayiç placeholder',
            freshness: 'Son 30 gün',
            confidence: .69),
        _ComparableListing(
            title: 'Cadde cepheli geliştirme arsası',
            distance: '1,8 km',
            pricePerSquareMeter: 41600,
            source: 'Lisanslı pazar veri sağlayıcı',
            freshness: 'Son 45 gün',
            confidence: .72),
      ],
      sources: const [
        _MarketSource(
            name: 'Belediye açık veri entegrasyonu',
            citation: '[Açık Veri-TR-001]',
            status: 'Planlanan resmi veri'),
        _MarketSource(
            name: 'Lisanslı ilan/partner API',
            citation: '[Partner API-MLS-024]',
            status: 'Sözleşmeli ve izinli kullanım'),
        _MarketSource(
            name: 'TÜİK bölgesel endeks placeholder',
            citation: '[Kamu Endeksi-2026-Q1]',
            status: 'Toplulaştırılmış gösterge'),
      ],
    );
  }
}

class _ComparableListing {
  const _ComparableListing(
      {required this.title,
      required this.distance,
      required this.pricePerSquareMeter,
      required this.source,
      required this.freshness,
      required this.confidence});

  final String title;
  final String distance;
  final double pricePerSquareMeter;
  final String source;
  final String freshness;
  final double confidence;
}

class _MarketSource {
  const _MarketSource(
      {required this.name, required this.citation, required this.status});

  final String name;
  final String citation;
  final String status;
}

class _HeroSummary extends StatelessWidget {
  const _HeroSummary({required this.model});

  final _AiValuationViewModel model;

  @override
  Widget build(BuildContext context) => DecoratedBox(
        decoration: BoxDecoration(
            gradient: AppGradients.premium,
            borderRadius: BorderRadius.circular(AppRadius.xl),
            boxShadow: AppShadows.glow(AppColors.emerald)),
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              const Icon(Icons.auto_awesome_rounded, color: Colors.white),
              const SizedBox(width: AppSpacing.xs),
              Text('Premium AI piyasa zekâsı',
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                      color: Colors.white.withValues(alpha: .86),
                      fontWeight: FontWeight.w800))
            ]),
            const SizedBox(height: AppSpacing.md),
            Text(model.parcelLabel,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    color: Colors.white, fontWeight: FontWeight.w900)),
            Text(
                '${model.parcel.district} / ${model.parcel.city} • ${model.parcel.zoningStatus}',
                style: Theme.of(context)
                    .textTheme
                    .bodyMedium
                    ?.copyWith(color: Colors.white.withValues(alpha: .82))),
            const SizedBox(height: AppSpacing.lg),
            Wrap(spacing: AppSpacing.sm, runSpacing: AppSpacing.sm, children: [
              _DarkMetric(
                  label: 'Tahmini m²',
                  value: _formatCurrency(model.pricePerSquareMeter)),
              _DarkMetric(
                  label: 'Güven', value: _formatPercent(model.confidence)),
              _DarkMetric(
                  label: 'Parsel alanı',
                  value: '${model.parcelArea.toStringAsFixed(0)} m²'),
            ]),
          ]),
        ),
      );
}

class _DarkMetric extends StatelessWidget {
  const _DarkMetric({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Container(
        width: 148,
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: .12),
            borderRadius: BorderRadius.circular(AppRadius.lg),
            border: Border.all(color: Colors.white.withValues(alpha: .18))),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label,
              style: Theme.of(context)
                  .textTheme
                  .labelMedium
                  ?.copyWith(color: Colors.white70)),
          const SizedBox(height: 6),
          Text(value,
              style: Theme.of(context)
                  .textTheme
                  .titleMedium
                  ?.copyWith(color: Colors.white, fontWeight: FontWeight.w900))
        ]),
      );
}

class _ConsentGuardrailCard extends StatelessWidget {
  const _ConsentGuardrailCard();

  @override
  Widget build(BuildContext context) => GlassCard(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          _SectionTitle(
              icon: Icons.verified_user_rounded, title: 'AI onayı ve sınırlar'),
          const SizedBox(height: AppSpacing.sm),
          Text(
              'Bu ekran yalnızca bilgilendirme amaçlıdır; resmi değerleme, ekspertiz raporu veya tapu/imar kararı yerine geçmez. Devam ederek parsel kimliği, imar özeti ve bölgesel piyasa göstergelerinin AI değerlendirmesi için işlenmesini kabul edersiniz.',
              style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: AppSpacing.sm),
          const _Bullet(
              'Kişisel veri, kimlik bilgisi veya ilan sahibi verisi kullanılmaz.'),
          const _Bullet(
              'Çıktılar danışman niteliğindedir; yatırım kararı için lisanslı uzman görüşü alınmalıdır.'),
          const _Bullet(
              'Piyasa kanıtları sadece izinli partner API’leri ve açık veri kaynaklarından gösterilir.'),
        ]),
      );
}

class _ValuationRangeCard extends StatelessWidget {
  const _ValuationRangeCard({required this.model});

  final _AiValuationViewModel model;

  @override
  Widget build(BuildContext context) => Card(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            _SectionTitle(
                icon: Icons.payments_rounded, title: 'Tahmini değer aralığı'),
            const SizedBox(height: AppSpacing.md),
            Row(children: [
              Expanded(
                  child: MetricCard(
                      title: 'm² düşük',
                      value: _formatCurrency(model.lowPricePerSquareMeter),
                      subtitle: 'Muhafazakâr senaryo',
                      icon: Icons.south_west_rounded)),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                  child: MetricCard(
                      title: 'm² yüksek',
                      value: _formatCurrency(model.highPricePerSquareMeter),
                      subtitle: 'Piyasa üst bandı',
                      icon: Icons.north_east_rounded)),
            ]),
            const SizedBox(height: AppSpacing.sm),
            MetricCard(
                title: 'Parsel toplam değer aralığı',
                value:
                    '${_formatCurrency(model.lowParcelValue)} - ${_formatCurrency(model.highParcelValue)}',
                subtitle:
                    'Alan varsayımı: ${model.parcelArea.toStringAsFixed(0)} m² • Resmi değerleme değildir',
                icon: Icons.real_estate_agent_rounded),
            const SizedBox(height: AppSpacing.md),
            _ConfidenceBar(value: model.confidence, label: 'Model güven skoru'),
          ]),
        ),
      );
}

class _InsightSection extends StatelessWidget {
  const _InsightSection({required this.insights});

  final List<AiParcelInsight> insights;

  @override
  Widget build(BuildContext context) =>
      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        _SectionTitle(icon: Icons.psychology_rounded, title: 'AI içgörüleri'),
        const SizedBox(height: AppSpacing.sm),
        for (final insight in insights) ...[
          GlassCard(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                Text(insight.title,
                    style: Theme.of(context)
                        .textTheme
                        .titleMedium
                        ?.copyWith(fontWeight: FontWeight.w900)),
                const SizedBox(height: 6),
                Text(insight.summary),
                const SizedBox(height: AppSpacing.sm),
                _ConfidenceBar(
                    value: insight.confidence, label: 'İçgörü güveni')
              ])),
          const SizedBox(height: AppSpacing.sm),
        ],
      ]);
}

class _ComparableListingsCard extends StatelessWidget {
  const _ComparableListingsCard({required this.listings});

  final List<_ComparableListing> listings;

  @override
  Widget build(BuildContext context) => Card(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            _SectionTitle(
                icon: Icons.compare_arrows_rounded,
                title: 'Emsal ilan özetleri'),
            const SizedBox(height: AppSpacing.xs),
            Text(
                'Temsili kayıtlar scraping içermez; üretimde yalnızca sözleşmeli partner API’leri ve açık veri setleriyle beslenecek alanlardır.',
                style: Theme.of(context)
                    .textTheme
                    .bodySmall
                    ?.copyWith(color: AppColors.slate)),
            const SizedBox(height: AppSpacing.md),
            for (final listing in listings)
              Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                child: _ComparableTile(listing: listing),
              ),
          ]),
        ),
      );
}

class _ComparableTile extends StatelessWidget {
  const _ComparableTile({required this.listing});

  final _ComparableListing listing;

  @override
  Widget build(BuildContext context) => DecoratedBox(
        decoration: BoxDecoration(
            color: AppColors.emerald.withValues(alpha: .07),
            borderRadius: BorderRadius.circular(AppRadius.lg),
            border:
                Border.all(color: AppColors.emerald.withValues(alpha: .14))),
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Expanded(
                  child: Text(listing.title,
                      style: Theme.of(context)
                          .textTheme
                          .titleSmall
                          ?.copyWith(fontWeight: FontWeight.w900))),
              Text(_formatCurrency(listing.pricePerSquareMeter),
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w900, color: AppColors.forest))
            ]),
            const SizedBox(height: 6),
            Text(
                '${listing.distance} • ${listing.freshness} • ${listing.source}',
                style: Theme.of(context)
                    .textTheme
                    .bodySmall
                    ?.copyWith(color: AppColors.slate)),
            const SizedBox(height: AppSpacing.sm),
            _ConfidenceBar(value: listing.confidence, label: 'Emsal güveni'),
          ]),
        ),
      );
}

class _SourcePlaceholdersCard extends StatelessWidget {
  const _SourcePlaceholdersCard({required this.sources});

  final List<_MarketSource> sources;

  @override
  Widget build(BuildContext context) => GlassCard(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          _SectionTitle(
              icon: Icons.source_rounded,
              title: 'Kaynak ve atıf yer tutucuları'),
          const SizedBox(height: AppSpacing.sm),
          for (final source in sources)
            ListTile(
                contentPadding: EdgeInsets.zero,
                leading:
                    const Icon(Icons.link_rounded, color: AppColors.emerald),
                title: Text(source.name),
                subtitle: Text('${source.citation} • ${source.status}')),
        ]),
      );
}

class _GovernanceCard extends StatelessWidget {
  const _GovernanceCard();

  @override
  Widget build(BuildContext context) => Card(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            _SectionTitle(
                icon: Icons.policy_rounded,
                title: 'Denetim, limit ve gizlilik'),
            const SizedBox(height: AppSpacing.sm),
            const _Bullet(
                'Her AI talebi zaman damgası, parsel referansı ve model sürümüyle denetim günlüğüne yazılacak şekilde tasarlanır.'),
            const _Bullet(
                'Kötüye kullanımı önlemek için hesap ve cihaz bazlı oran limiti uygulanır; yoğun kullanımda bekleme süresi gösterilir.'),
            const _Bullet(
                'Ham ilan metni saklanmaz; yalnızca izinli, toplulaştırılmış ve kaynak atıflı piyasa göstergeleri gösterilir.'),
            const _Bullet(
                'Bu mock ekranda dış API çağrısı, scraping veya gizli anahtar yoktur.'),
          ]),
        ),
      );
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.icon, required this.title});

  final IconData icon;
  final String title;

  @override
  Widget build(BuildContext context) => Row(children: [
        Icon(icon, color: AppColors.emerald),
        const SizedBox(width: AppSpacing.xs),
        Expanded(
            child: Text(title,
                style: Theme.of(context)
                    .textTheme
                    .titleMedium
                    ?.copyWith(fontWeight: FontWeight.w900)))
      ]);
}

class _Bullet extends StatelessWidget {
  const _Bullet(this.text);

  final String text;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(top: 6),
        child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [const Text('• '), Expanded(child: Text(text))]),
      );
}

class _ConfidenceBar extends StatelessWidget {
  const _ConfidenceBar({required this.value, required this.label});

  final double value;
  final String label;

  @override
  Widget build(BuildContext context) =>
      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(
              child: Text(label,
                  style: Theme.of(context)
                      .textTheme
                      .labelMedium
                      ?.copyWith(color: AppColors.slate))),
          Text(_formatPercent(value),
              style: Theme.of(context)
                  .textTheme
                  .labelLarge
                  ?.copyWith(fontWeight: FontWeight.w900))
        ]),
        const SizedBox(height: 6),
        ClipRRect(
            borderRadius: BorderRadius.circular(AppRadius.pill),
            child: LinearProgressIndicator(
                value: value.clamp(0, 1).toDouble(),
                minHeight: 8,
                backgroundColor: AppColors.slate.withValues(alpha: .14),
                color: AppColors.emerald)),
      ]);
}

String _formatCurrency(double value) {
  final rounded = value.round().toString();
  final buffer = StringBuffer();
  for (var i = 0; i < rounded.length; i++) {
    final remaining = rounded.length - i;
    buffer.write(rounded[i]);
    if (remaining > 1 && remaining % 3 == 1) buffer.write('.');
  }
  return '₺$buffer';
}

String _formatPercent(double value) => '%${(value * 100).round()}';
