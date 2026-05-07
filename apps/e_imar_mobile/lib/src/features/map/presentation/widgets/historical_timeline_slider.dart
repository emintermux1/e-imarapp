import 'package:flutter/material.dart';

import '../../../../core/theme/tokens.dart';
import '../../../../core/widgets/widgets.dart';
import '../../domain/parcel.dart';

class _TimelineEntry {
  const _TimelineEntry(this.year, this.title, this.body);
  final int year;
  final String title;
  final String body;
}

const _timelineEntries = <_TimelineEntry>[
  _TimelineEntry(2019, 'İlk imar planı onaylandı',
      'Bölgeye ilişkin 1/1000 ölçekli uygulama imar planı belediye meclisinde kabul edildi. TAKS: 0.25, KAKS: 1.25 değerleriyle düşük yoğunluklu konut alanı olarak tanımlandı.'),
  _TimelineEntry(2020, 'Risk haritaları güncellendi',
      'AFAD ve MTA iş birliğiyle deprem tehlike haritası revize edildi. Parselin bulunduğu bölge 2. derece deprem kuşağından 1. dereceye yükseltildi. Zemin etüt raporu talep edilmeye başlandı.'),
  _TimelineEntry(2021, 'Kentsel dönüşüm kapsamına alındı',
      'Bakanlık genelgesiyle bölge riskli alan ilan edildi. Emsal artışı gündeme geldi. Mevcut yapı stoku için güçlendirme veya yeniden yapım seçenekleri değerlendirildi.'),
  _TimelineEntry(2022, 'Plan revizyonu ile yoğunluk arttı',
      'İlçe belediyesi plan notu değişikliği ile TAKS: 0.35, KAKS: 1.75 değerlerine yükseltildi. Kat adedi 5’ten 8’e çıkarıldı. Ticari kullanım hakkı tanındı.'),
  _TimelineEntry(2023, 'Altyapı yatırımları tamamlandı',
      'Kanalizasyon, yağmur suyu ve fiber altyapı projeleri ihale edilerek tamamlandı. Yol genişletme çalışmalarıyla cephe avantajı oluştu. Bölge genelinde emlak fiyatlarında %40 artış kaydedildi.'),
  _TimelineEntry(2024, 'Güncel imar durumu geçerli',
      'Kadıköy Belediyesi tarafından onaylanan son imar durumu belgesi ile parsel mevcut haklarını kazandı. Yapı ruhsatı başvurusu için ön şartlar sağlandı. Proje değerleme raporları pozitif görünümde.'),
  _TimelineEntry(2025, 'Çevre projeleri devrede',
      'Yakın çevrede tamamlanan metro hattı ve sahil düzenlemesiyle ulaşım skoru yükseldi. Bölgede butik konut projeleri için talep arttı. İnşaat maliyet endeksinde yatay seyir izleniyor.'),
  _TimelineEntry(2026, 'Mevcut durum ve projeksiyon',
      '2026 itibarıyla parsel imar haklarını koruyor. Finansman koşullarının iyileşmesiyle yatırım zamanlaması elverişli görülüyor. Yakın vadede bölgede arz kısıtı fiyatları destekleyecektir.'),
];

class HistoricalTimelineSlider extends StatefulWidget {
  const HistoricalTimelineSlider({super.key, this.onYearChanged});
  final ValueChanged<int>? onYearChanged;

  @override
  State<HistoricalTimelineSlider> createState() =>
      _HistoricalTimelineSliderState();
}

class _HistoricalTimelineSliderState extends State<HistoricalTimelineSlider> {
  late int _selectedIndex;
  late int _selectedYear;

  @override
  void initState() {
    super.initState();
    _selectedYear = ParcelDetail.sample.yearApproved;
    _selectedIndex =
        _timelineEntries.indexWhere((e) => e.year == _selectedYear);
    if (_selectedIndex < 0) _selectedIndex = _timelineEntries.length - 1;
  }

  @override
  Widget build(BuildContext context) {
    final entry = _timelineEntries[_selectedIndex];
    return GlassCard(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
      variant: GlassVariant.elevated,
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                  gradient: AppGradients.premium,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: AppShadows.glow(AppColors.emerald)),
              child: const Icon(Icons.timeline_rounded,
                  color: Colors.white, size: 20)),
          const SizedBox(width: 10),
          Text('Zaman Tüneli',
              style: Theme.of(context)
                  .textTheme
                  .titleSmall
                  ?.copyWith(fontWeight: FontWeight.w900)),
          const Spacer(),
          StatusBadge(
              label: '${entry.year}',
              tone: BadgeTone.info,
              icon: Icons.calendar_today_rounded),
        ]),
        const SizedBox(height: 14),
        SizedBox(
          height: 48,
          child: Row(children: [
            for (var i = 0; i < _timelineEntries.length; i++) ...[
              if (i > 0)
                Expanded(
                    child: Container(
                        height: 2,
                        color: i <= _selectedIndex
                            ? AppColors.emerald.withValues(alpha: .7)
                            : AppColors.slate.withValues(alpha: .25))),
              GestureDetector(
                onTap: () => _selectIndex(i),
                child: Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: i <= _selectedIndex
                        ? AppColors.emerald
                        : Colors.transparent,
                    border: Border.all(
                        color: i <= _selectedIndex
                            ? AppColors.emerald
                            : AppColors.slate.withValues(alpha: .4),
                        width: 2),
                    boxShadow: i == _selectedIndex
                        ? AppShadows.glow(AppColors.emerald)
                        : null,
                  ),
                  child: Center(
                      child: Text(
                          _timelineEntries[i].year.toString().substring(2),
                          style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              color: i <= _selectedIndex
                                  ? Colors.white
                                  : AppColors.slate.withValues(alpha: .6)))),
                ),
              ),
            ],
          ]),
        ),
        const SizedBox(height: 10),
        Row(children: [
          Text('${_timelineEntries.first.year}',
              style: Theme.of(context)
                  .textTheme
                  .labelSmall
                  ?.copyWith(color: AppColors.slate)),
          const Spacer(),
          Text('${_timelineEntries.last.year}',
              style: Theme.of(context)
                  .textTheme
                  .labelSmall
                  ?.copyWith(color: AppColors.slate)),
        ]),
        const SizedBox(height: 12),
        AnimatedSize(
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOutCubic,
          child: GlassCard(
            padding: const EdgeInsets.all(14),
            variant: GlassVariant.subtle,
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Icon(Icons.auto_awesome_rounded,
                    size: 18, color: AppColors.lime),
                const SizedBox(width: 8),
                Expanded(
                    child: Text(entry.title,
                        style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w800,
                            color: AppColors.lime))),
              ]),
              const SizedBox(height: 8),
              Text(entry.body,
                  style: Theme.of(context)
                      .textTheme
                      .bodySmall
                      ?.copyWith(color: AppColors.slate, height: 1.55)),
            ]),
          ),
        ),
      ]),
    );
  }

  void _selectIndex(int i) {
    if (i == _selectedIndex) return;
    setState(() {
      _selectedIndex = i;
      _selectedYear = _timelineEntries[i].year;
    });
    widget.onYearChanged?.call(_selectedYear);
  }
}
