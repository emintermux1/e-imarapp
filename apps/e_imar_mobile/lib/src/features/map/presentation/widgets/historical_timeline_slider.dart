import 'package:flutter/material.dart';

import '../../../../core/theme/tokens.dart';
import '../../../../core/widgets/widgets.dart';
import '../../domain/parcel.dart';

class HistoricalTimelineSlider extends StatefulWidget {
  const HistoricalTimelineSlider({super.key, this.onYearChanged});
  final ValueChanged<HistoricalTimelineState>? onYearChanged;

  @override
  State<HistoricalTimelineSlider> createState() => _HistoricalTimelineSliderState();
}

class _HistoricalTimelineSliderState extends State<HistoricalTimelineSlider> {
  late int _selectedYear;
  late HistoricalTimelineState _currentState;

  @override
  void initState() {
    super.initState();
    _selectedYear = 2025;
    _currentState = HistoricalTimelineState.fromYear(_selectedYear);
  }

  void _onYearChanged(int year) {
    setState(() {
      _selectedYear = year;
      _currentState = HistoricalTimelineState.fromYear(year);
    });
    widget.onYearChanged?.call(_currentState);
  }

  @override
  Widget build(BuildContext context) => RepaintBoundary(
        child: GlassCard(
          padding: const EdgeInsets.fromLTRB(14, 16, 14, 14),
          variant: GlassVariant.elevated,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Container(
                  width: 10,
                  height: 10,
                  decoration: BoxDecoration(
                    gradient: AppGradients.premium,
                    shape: BoxShape.circle,
                    boxShadow: AppShadows.glow(AppColors.emerald),
                  ),
                ),
                const SizedBox(width: 8),
                Text('Zaman Tüneli', style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w900)),
                const Spacer(),
                StatusBadge(label: 'Mock', tone: BadgeTone.neutral, icon: Icons.hub_rounded),
              ]),
              const SizedBox(height: 12),
              _TimelineTrack(
                years: HistoricalTimelineState.defaultYears,
                selected: _selectedYear,
                onChanged: _onYearChanged,
              ),
              const SizedBox(height: 12),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                _YearLabel(year: _selectedYear, color: _currentState.color),
                const Spacer(),
                Icon(Icons.satellite_alt_rounded, size: 16, color: AppColors.emerald.withOpacity(.7)),
                const SizedBox(width: 6),
                Icon(_currentState.year == 2026 ? Icons.query_stats_rounded : Icons.image_rounded, size: 16, color: AppColors.slate.withOpacity(.6)),
              ]),
              const SizedBox(height: 10),
              Text(_currentState.description, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.slate, height: 1.45)),
            ],
          ),
        ),
      );
}

class _YearLabel extends StatelessWidget {
  const _YearLabel({required this.year, required this.color});
  final int year;
  final Color color;
  @override
  Widget build(BuildContext context) => Row(mainAxisSize: MainAxisSize.min, children: [
        Text('$year', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w900, color: color)),
        const SizedBox(width: 6),
        Container(width: 5, height: 5, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
      ]);
}

class _TimelineTrack extends StatelessWidget {
  const _TimelineTrack({required this.years, required this.selected, required this.onChanged});
  final List<int> years;
  final int selected;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    final barHeight = 40.0;
    return SizedBox(
      height: barHeight + 24,
      child: LayoutBuilder(builder: (context, constraints) {
        final total = constraints.maxWidth;
        final step = total / (years.length - 1);
        return Stack(children: [
          Positioned(
            left: 0,
            right: 0,
            top: barHeight / 2 - 1.5,
            child: Container(height: 3, decoration: BoxDecoration(color: Colors.white.withOpacity(.12), borderRadius: BorderRadius.circular(4))),
          ),
          Positioned(
            left: 0,
            right: 0,
            top: barHeight / 2 - 1.5,
            child: RepaintBoundary(
              child: CustomPaint(
                size: Size(total, 3),
                painter: _TimelineProgressPainter(progress: yearProgress(selected), color: HistoricalTimelineState.fromYear(selected).color),
              ),
            ),
          ),
          for (var i = 0; i < years.length; i++)
            Positioned(
              left: (i * step) - 16,
              top: 0,
              child: _TimelineDot(year: years[i], isSelected: years[i] == selected, onTap: () => onChanged(years[i])),
            ),
          for (var i = 0; i < years.length; i++)
            Positioned(
              left: (i * step) - 14,
              top: barHeight + 2,
              child: SizedBox(
                width: 28,
                child: Text(
                  '${years[i]}',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        fontWeight: years[i] == selected ? FontWeight.w900 : FontWeight.w500,
                        color: years[i] == selected ? HistoricalTimelineState.fromYear(selected).color : AppColors.slate.withOpacity(.55),
                        fontSize: 9,
                        height: 1.2,
                      ),
                ),
              ),
            ),
        ]);
      }),
    );
  }

  double yearProgress(int year) {
    final idx = years.indexOf(year);
    if (idx < 0) return .5;
    return idx / (years.length - 1);
  }
}

class _TimelineProgressPainter extends CustomPainter {
  const _TimelineProgressPainter({required this.progress, required this.color});
  final double progress;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width * progress;
    final rect = RRect.fromRectAndRadius(Rect.fromLTWH(0, 0, w.clamp(0, size.width), size.height), const Radius.circular(2));
    canvas.drawRRect(rect, Paint()..color = color);
  }

  @override
  bool shouldRepaint(covariant _TimelineProgressPainter old) => old.progress != progress || old.color != color;
}

class _TimelineDot extends StatelessWidget {
  const _TimelineDot({required this.year, required this.isSelected, required this.onTap});
  final int year;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final state = HistoricalTimelineState.fromYear(year);
    final outer = isSelected ? 32.0 : 26.0;
    final inner = isSelected ? 12.0 : 8.0;
    return GestureDetector(
      onTap: onTap,
      child: SizedBox(width: 32, height: 40, child: Center(
        child: Stack(alignment: Alignment.center, children: [
          if (isSelected) Container(width: outer, height: outer, decoration: BoxDecoration(color: state.color.withOpacity(.14), shape: BoxShape.circle)),
          Container(width: inner, height: inner, decoration: BoxDecoration(color: isSelected ? state.color : AppColors.slate.withOpacity(.28), shape: BoxShape.circle, border: isSelected ? Border.all(color: Colors.white.withOpacity(.4), width: 1.5) : null, boxShadow: isSelected ? [BoxShadow(color: state.color.withOpacity(.35), blurRadius: 6)] : null)),
        ]),
      )),
    );
  }
}
