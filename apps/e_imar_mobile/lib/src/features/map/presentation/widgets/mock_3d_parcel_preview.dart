import 'package:flutter/material.dart';

import '../../../../core/theme/tokens.dart';
import '../../../../core/widgets/widgets.dart';
import '../../domain/parcel.dart';

class Mock3dParcelPreview extends StatefulWidget {
  const Mock3dParcelPreview({required this.parcel, super.key});
  final ParcelDetail parcel;

  @override
  State<Mock3dParcelPreview> createState() => _Mock3dParcelPreviewState();
}

class _Mock3dParcelPreviewState extends State<Mock3dParcelPreview> {
  int _floorCount = 5;
  static const _maxFloor = 30;
  static const _minFloor = 1;

  @override
  Widget build(BuildContext context) {
    final buildingHeight = (_floorCount / _maxFloor) * 180.0;
    final baseArea = 200.0;
    final volumeLabel = '${(_floorCount * baseArea).toStringAsFixed(0)} m² (brüt)';
    return GlassCard(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
      variant: GlassVariant.elevated,
      child: Column(children: [
        Row(children: [
          Container(width: 36, height: 36, decoration: BoxDecoration(gradient: AppGradients.premium, borderRadius: BorderRadius.circular(12), boxShadow: AppShadows.glow(AppColors.emerald)), child: const Icon(Icons.view_in_ar_rounded, color: Colors.white, size: 20)),
          const SizedBox(width: 10),
          Text('3D Kütle Ön İzleme', style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w900)),
          const Spacer(),
          StatusBadge(label: volumeLabel, tone: BadgeTone.info, icon: Icons.square_foot_rounded),
        ]),
        const SizedBox(height: 14),
        Text('$_floorCount kat olursa nasıl görünür?', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w700, color: AppColors.slate)),
        const SizedBox(height: 12),
        SizedBox(
          height: 210,
          child: Center(
            child: RepaintBoundary(
              child: CustomPaint(
                size: const Size(280, 210),
                painter: _MockMassingPainter(floorCount: _floorCount, baseArea: baseArea, maxHeight: buildingHeight),
              ),
            ),
          ),
        ),
        const SizedBox(height: 10),
        Row(children: [
          _FloorButton(icon: Icons.remove_rounded, onTap: _floorCount > _minFloor ? () => setState(() => _floorCount--) : null),
          Expanded(
            child: SliderTheme(
              data: SliderThemeData(
                activeTrackColor: AppColors.emerald,
                inactiveTrackColor: AppColors.slate.withValues(alpha: .18),
                thumbColor: AppColors.emerald,
                overlayColor: AppColors.emerald.withValues(alpha: .16),
                trackHeight: 5,
                thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 10),
              ),
              child: Slider(value: _floorCount.toDouble(), min: _minFloor.toDouble(), max: _maxFloor.toDouble(), onChanged: (v) => setState(() => _floorCount = v.round())),
            ),
          ),
          _FloorButton(icon: Icons.add_rounded, onTap: _floorCount < _maxFloor ? () => setState(() => _floorCount++) : null),
        ]),
        const SizedBox(height: 4),
        Row(children: [
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text('TAKS alanı', style: Theme.of(context).textTheme.labelSmall?.copyWith(color: AppColors.slate, fontWeight: FontWeight.w700)), Text('${(widget.parcel.taks * 100).toStringAsFixed(0)}% • ~${baseArea.toStringAsFixed(0)} m²', style: Theme.of(context).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w800))])),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.end, children: [Text('Kat sayısı', style: Theme.of(context).textTheme.labelSmall?.copyWith(color: AppColors.slate, fontWeight: FontWeight.w700)), Text('$_floorCount / $_maxFloor', style: Theme.of(context).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w800))])),
        ]),
      ]),
    );
  }
}

class _FloorButton extends StatelessWidget {
  const _FloorButton({required this.icon, required this.onTap});
  final IconData icon;
  final VoidCallback? onTap;
  @override
  Widget build(BuildContext context) {
    final enabled = onTap != null;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 36,
        height: 36,
        margin: const EdgeInsets.symmetric(horizontal: 4),
        decoration: BoxDecoration(
          color: enabled ? AppColors.emerald.withValues(alpha: .16) : AppColors.slate.withValues(alpha: .08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: enabled ? AppColors.emerald.withValues(alpha: .4) : AppColors.slate.withValues(alpha: .15)),
        ),
        child: Icon(icon, size: 22, color: enabled ? AppColors.emerald : AppColors.slate.withValues(alpha: .3)),
      ),
    );
  }
}

class _MockMassingPainter extends CustomPainter {
  const _MockMassingPainter({required this.floorCount, required this.baseArea, required this.maxHeight});
  final int floorCount;
  final double baseArea;
  final double maxHeight;

  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width / 2;
    final baseY = size.height - 20;
    final plotW = size.width * 0.55;
    final plotH = size.height * 0.65;
    final origin = Offset(cx, baseY);

    final plotPath = Path()
      ..moveTo(origin.dx - plotW * .38, origin.dy)
      ..lineTo(origin.dx + plotW * .32, origin.dy - plotH * .12)
      ..lineTo(origin.dx + plotW * .34, origin.dy - plotH * .94)
      ..lineTo(origin.dx - plotW * .36, origin.dy - plotH * .82)
      ..close();
    canvas.drawPath(plotPath, Paint()..color = AppColors.slate.withValues(alpha: .07)..style = PaintingStyle.fill);
    canvas.drawPath(plotPath, Paint()..color = AppColors.slate.withValues(alpha: .18)..style = PaintingStyle.stroke..strokeWidth = 0.8);

    final bldH = (maxHeight / plotH) * (plotH * 0.78);
    final bldW = plotW * 0.45;
    final bldOrigin = Offset(cx, baseY - plotH * .04);

    for (var f = 0; f < floorCount && f < 30; f++) {
      final yOff = (f / 30) * bldH;
      final bottom = Path()
        ..moveTo(bldOrigin.dx - bldW * .32, bldOrigin.dy - yOff)
        ..lineTo(bldOrigin.dx + bldW * .28, bldOrigin.dy - yOff - bldW * .14)
        ..lineTo(bldOrigin.dx + bldW * .30, bldOrigin.dy - yOff - bldW * .14 - bldH / 30)
        ..lineTo(bldOrigin.dx - bldW * .30, bldOrigin.dy - yOff - bldH / 30)
        ..close();
      final opacity = .55 - (f / 30) * .2;
      canvas.drawPath(bottom, Paint()..color = AppColors.emerald.withValues(alpha: opacity)..style = PaintingStyle.fill);

      final left = Path()
        ..moveTo(bldOrigin.dx - bldW * .32, bldOrigin.dy - yOff)
        ..lineTo(bldOrigin.dx - bldW * .30, bldOrigin.dy - yOff - bldH / 30)
        ..lineTo(bldOrigin.dx - bldW * .30, bldOrigin.dy - yOff - bldH / 30 - bldH / 30)
        ..lineTo(bldOrigin.dx - bldW * .32, bldOrigin.dy - yOff - bldH / 30)
        ..close();
      canvas.drawPath(left, Paint()..color = AppColors.forest.withValues(alpha: opacity * .6)..style = PaintingStyle.fill);

      final right = Path()
        ..moveTo(bldOrigin.dx + bldW * .28, bldOrigin.dy - yOff - bldW * .14)
        ..lineTo(bldOrigin.dx + bldW * .30, bldOrigin.dy - yOff - bldW * .14 - bldH / 30)
        ..lineTo(bldOrigin.dx + bldW * .30, bldOrigin.dy - yOff - bldW * .14 - bldH / 30 - bldH / 30)
        ..lineTo(bldOrigin.dx + bldW * .28, bldOrigin.dy - yOff - bldW * .14 - bldH / 30)
        ..close();
      canvas.drawPath(right, Paint()..color = AppColors.deepGreen.withValues(alpha: opacity * .5)..style = PaintingStyle.fill);
    }

    final roofTop = bldOrigin.dy - bldH;
    final roof = Path()
      ..moveTo(bldOrigin.dx - bldW * .32, roofTop)
      ..lineTo(bldOrigin.dx + bldW * .28, roofTop - bldW * .14)
      ..lineTo(bldOrigin.dx + bldW * .30, roofTop - bldW * .14)
      ..lineTo(bldOrigin.dx - bldW * .30, roofTop)
      ..close();
    canvas.drawPath(roof, Paint()..color = AppColors.lime.withValues(alpha: .7)..style = PaintingStyle.fill);
    canvas.drawPath(roof, Paint()..color = Colors.white.withValues(alpha: .24)..style = PaintingStyle.stroke..strokeWidth = 1.2);

    canvas.drawPath(plotPath, Paint()..color = AppColors.slate.withValues(alpha: .22)..style = PaintingStyle.stroke..strokeWidth = 1.2);

    _drawDot(canvas, Offset(bldOrigin.dx - bldW * .36, bldOrigin.dy), 'Yol', false);
    _drawDot(canvas, Offset(bldOrigin.dx + bldW * .36, bldOrigin.dy - bldW * .18), 'K', true);
  }

  void _drawDot(Canvas canvas, Offset pos, String label, bool rightSide) {
    canvas.drawCircle(pos, 4, Paint()..color = AppColors.sand.withValues(alpha: .6));
    final tp = TextPainter(text: TextSpan(text: label, style: TextStyle(color: AppColors.sand.withValues(alpha: .5), fontSize: 10, fontWeight: FontWeight.w700)), textDirection: TextDirection.ltr);
    tp.layout();
    tp.paint(canvas, Offset(pos.dx - tp.width / 2, pos.dy - 18));
  }

  @override
  bool shouldRepaint(covariant _MockMassingPainter oldDelegate) => oldDelegate.floorCount != floorCount;
}
