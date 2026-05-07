import 'package:flutter/material.dart';

import '../../../../core/theme/tokens.dart';
import '../../../../core/widgets/widgets.dart';
import '../../domain/parcel.dart';

class Mock3dParcelPreview extends StatefulWidget {
  const Mock3dParcelPreview({super.key, required this.parcel});
  final ParcelDetail parcel;

  @override
  State<Mock3dParcelPreview> createState() => _Mock3dParcelPreviewState();
}

class _Mock3dParcelPreviewState extends State<Mock3dParcelPreview> {
  late int _selectedFloor;
  bool _expanded = false;

  static const _maxFloor = 30;
  static const _minFloor = 1;

  @override
  void initState() {
    super.initState();
    _selectedFloor = widget.parcel.floorLimit.clamp(_minFloor, _maxFloor);
  }

  @override
  Widget build(BuildContext context) => RepaintBoundary(
        child: AnimatedSize(
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOutCubic,
          alignment: Alignment.topCenter,
          child: GlassCard(
            padding: const EdgeInsets.all(14),
            variant: GlassVariant.elevated,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                GestureDetector(
                  onTap: () => setState(() => _expanded = !_expanded),
                  behavior: HitTestBehavior.opaque,
                  child: Row(children: [
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
                    Expanded(
                      child: Text(
                        '${_selectedFloor} kat olursa nasıl görünür?',
                        style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w900),
                      ),
                    ),
                    const StatusBadge(label: '3D Mock', tone: BadgeTone.neutral, icon: Icons.view_in_ar_rounded),
                    const SizedBox(width: 8),
                    AnimatedRotation(
                      turns: _expanded ? .5 : 0,
                      duration: const Duration(milliseconds: 250),
                      child: Icon(Icons.keyboard_arrow_down_rounded, color: AppColors.slate, size: 22),
                    ),
                  ]),
                ),
                if (_expanded) ...[const SizedBox(height: 14), _MassingCanvas(floors: _selectedFloor, taks: widget.parcel.taks, kaks: widget.parcel.kaks, maxLegalFloors: widget.parcel.floorLimit) ,const SizedBox(height: 14), _FloorSlider(floors: _selectedFloor, onChanged: _onFloorChanged, maxFloors: _maxFloor, legalFloors: widget.parcel.floorLimit), const SizedBox(height: 12), _FloorInfo(floors: _selectedFloor, legalFloors: widget.parcel.floorLimit, taks: widget.parcel.taks)],
              ],
            ),
          ),
        ),
      );

  void _onFloorChanged(int floors) => setState(() => _selectedFloor = floors.clamp(_minFloor, _maxFloor));
}

class _MassingCanvas extends StatelessWidget {
  const _MassingCanvas({required this.floors, required this.taks, required this.kaks, required this.maxLegalFloors});
  final int floors;
  final double taks;
  final double kaks;
  final int maxLegalFloors;

  @override
  Widget build(BuildContext context) => RepaintBoundary(
        child: SizedBox(
          height: 220,
          child: CustomPaint(
            size: const Size(double.infinity, 220),
            painter: _MassingPainter(floors: floors, taks: taks, maxLegalFloors: maxLegalFloors),
          ),
        ),
      );
}

class _MassingPainter extends CustomPainter {
  const _MassingPainter({required this.floors, required this.taks, required this.maxLegalFloors});
  final int floors;
  final double taks;
  final int maxLegalFloors;

  @override
  void paint(Canvas canvas, Size size) {
    _drawGroundPlane(canvas, size);
    _drawGroundGrid(canvas, size);
    final overLegal = floors > maxLegalFloors;
    final totalHeightFrac = ((floors / 30) * .6).clamp(.12, .6);
    _drawBuilding(canvas, size, totalHeightFrac, overLegal);
    if (overLegal) _drawExcessIndicator(canvas, size, totalHeightFrac);
    _drawShadow(canvas, size, totalHeightFrac);
  }

  void _drawGroundPlane(Canvas canvas, Size size) {
    final centerX = size.width / 2;
    final centerY = size.height * .78;
    final w = size.width * .65;
    final h = w * .48;
    final path = Path()
      ..moveTo(centerX - w / 2, centerY)
      ..lineTo(centerX, centerY - h)
      ..lineTo(centerX + w / 2, centerY)
      ..lineTo(centerX, centerY + h)
      ..close();
    final groundPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [const Color(0xFF1B503F).withOpacity(.45), const Color(0xFF0D2D25).withOpacity(.25)],
      ).createShader(Rect.fromLTRB(centerX - w / 2, centerY - h, centerX + w / 2, centerY + h));
    canvas.drawPath(path, groundPaint);
    canvas.drawPath(path, Paint()..color = AppColors.emerald.withOpacity(.28)..style = PaintingStyle.stroke..strokeWidth = 1.2);
  }

  void _drawGroundGrid(Canvas canvas, Size size) {
    final centerX = size.width / 2;
    final centerY = size.height * .78;
    final w = size.width * .65;
    final gridPaint = Paint()
      ..color = AppColors.emerald.withOpacity(.15)
      ..style = PaintingStyle.stroke
      ..strokeWidth = .6;
    for (var i = 1; i <= 4; i++) {
      final t = i / 5;
      final topX = centerX + (1 - t) * (-w / 2) + t * (w / 2);
      final topY = centerY + (1 - t) * 0 + t * (-(w * .48));
      final botX = centerX + (1 - t) * (-w / 2) + t * (w / 2);
      final botY = centerY + (1 - t) * 0 + t * ((w * .48));
      canvas.drawLine(Offset(topX, topY), Offset(botX, botY), gridPaint);
      final leftX = centerX + (1 - t) * (-w / 2) + t * 0;
      final leftY = centerY + (1 - t) * 0 + t * (-(w * .48));
      final rightX = centerX + (1 - t) * (-w / 2) + t * (w / 2);
      final rightY = centerY + (1 - t) * 0 + t * ((w * .48));
      canvas.drawLine(Offset(leftX, leftY), Offset(rightX, rightY), gridPaint);
    }
  }

  void _drawBuilding(Canvas canvas, Size size, double heightFrac, bool overLegal) {
    final centerX = size.width / 2;
    final groundY = size.height * .78;
    final groundPlaneH = size.width * .65 * .48;
    final baseW = size.width * .28;
    final buildingHeight = size.height * .35 * (heightFrac / .6);

    final topCenter = Offset(centerX, groundY - buildingHeight);
    final frontLeft = Offset(centerX - baseW / 2, groundY);
    final frontRight = Offset(centerX + baseW / 2, groundY);
    final backTop = Offset(centerX, groundY - groundPlaneH - buildingHeight);
    final backLeft = Offset(centerX - baseW / 2, groundY - groundPlaneH);

    final faceLeftPath = Path()..moveTo(frontLeft.dx, frontLeft.dy)..lineTo(topCenter.dx, topCenter.dy)..lineTo(backTop.dx, backTop.dy)..lineTo(backLeft.dx, backLeft.dy)..close();
    canvas.drawPath(faceLeftPath, Paint()..color = overLegal ? const Color(0xFF7a3b2e) : const Color(0xFF1a3a2e));

    final faceRightPath = Path()..moveTo(frontRight.dx, frontRight.dy)..lineTo(topCenter.dx, topCenter.dy)..lineTo(backTop.dx, backTop.dy)..lineTo(backLeft.dx, backLeft.dy)..close();
    canvas.drawPath(faceRightPath, Paint()..color = overLegal ? const Color(0xFFb85c3e) : const Color(0xFF2a4a3e));

    canvas.drawPath(frontLeftPath, Paint()..color = overLegal ? AppColors.danger.withOpacity(.35) : AppColors.emerald.withOpacity(.18)..style = PaintingStyle.stroke..strokeWidth = 1);
    canvas.drawPath(frontRightPath, Paint()..color = overLegal ? AppColors.danger.withOpacity(.25) : AppColors.mint.withOpacity(.18)..style = PaintingStyle.stroke..strokeWidth = 1);

    final roofPath = Path()..moveTo(topCenter.dx, topCenter.dy)..lineTo(centerX + baseW * .42, groundY - buildingHeight * .9)..lineTo(centerX, groundY - buildingHeight * .82)..lineTo(centerX - baseW * .42, groundY - buildingHeight * .9)..close();
    canvas.drawPath(roofPath, Paint()..color = overLegal ? AppColors.danger.withOpacity(.45) : AppColors.emerald.withOpacity(.28));

    final n = floors.clamp(1, 30);
    final floorH = buildingHeight / n;
    final linePaint = Paint()..color = Colors.white.withOpacity(.12)..style = PaintingStyle.stroke..strokeWidth = .6;
    final legalLinePaint = Paint()..color = AppColors.warning.withOpacity(.6)..style = PaintingStyle.stroke..strokeWidth = 1.2..strokeCap = StrokeCap.round;
    for (var i = 1; i <= n; i++) {
      final y = groundY - i * floorH;
      final linePath = Path()..moveTo(centerX - baseW / 2 + (baseW * .06), y)..lineTo(centerX + baseW / 2 - (baseW * .06), y);
      if (overLegal && i == maxLegalFloors) {
        canvas.drawPath(linePath, legalLinePaint);
      } else {
        canvas.drawPath(linePath, linePaint);
      }
    }
  }

  void _drawExcessIndicator(Canvas canvas, Size size, double heightFrac) {
    final centerX = size.width / 2;
    final groundY = size.height * .78;
    final baseW = size.width * .28;
    final buildingHeight = size.height * .35 * (heightFrac / .6);
    final n = floors.clamp(1, 30);
    final floorH = buildingHeight / n;
    final legalY = groundY - maxLegalFloors * floorH;

    final excess = floors - maxLegalFloors;
    final label = 'İmar sınırı: $maxLegalFloors kat';
    final tp = TextPainter(text: TextSpan(text: label, style: const TextStyle(color: AppColors.warning, fontSize: 10, fontWeight: FontWeight.w800)), textDirection: TextDirection.ltr)..layout();
    final labelX = centerX + baseW / 2 + 8;
    final labelY = legalY - tp.height / 2;
    canvas.drawRRect(
        RRect.fromRectAndRadius(Rect.fromLTWH(labelX - 4, labelY - 3, tp.width + 8, tp.height + 6), const Radius.circular(4)),
        Paint()..color = AppColors.warning.withOpacity(.12),
    );
    tp.paint(canvas, Offset(labelX, labelY));
    canvas.drawLine(Offset(centerX + baseW / 2 - 2, legalY), Offset(labelX - 4, legalY), Paint()..color = AppColors.warning..strokeWidth = 1..strokeCap = StrokeCap.round);
  }

  void _drawShadow(Canvas canvas, Size size, double heightFrac) {
    final centerX = size.width / 2;
    final groundY = size.height * .78;
    final buildingHeight = size.height * .35 * (heightFrac / .6);
    final shadowLen = buildingHeight * 1.2;
    final shadowPath = Path()
      ..moveTo(centerX - size.width * .14, groundY + 4)
      ..lineTo(centerX - size.width * .14 + shadowLen * .7, groundY + 4 + shadowLen * .5)
      ..lineTo(centerX + size.width * .14 + shadowLen * .7, groundY + 4 + shadowLen * .5)
      ..lineTo(centerX + size.width * .14, groundY + 4)
      ..close();
    canvas.drawPath(shadowPath, Paint()..color = Colors.black.withOpacity(.22)..maskFilter = const MaskFilter.blur(BlurStyle.normal, 18));
  }

  @override
  bool shouldRepaint(covariant _MassingPainter old) => old.floors != floors || old.taks != taks || old.maxLegalFloors != maxLegalFloors;
}

class _FloorSlider extends StatelessWidget {
  const _FloorSlider({required this.floors, required this.onChanged, required this.maxFloors, required this.legalFloors});
  final int floors;
  final ValueChanged<int> onChanged;
  final int maxFloors;
  final int legalFloors;

  @override
  Widget build(BuildContext context) => Row(children: [
        Text('$_minFloor kat', style: Theme.of(context).textTheme.labelSmall?.copyWith(color: AppColors.slate)),
        Expanded(
          child: SliderTheme(
            data: SliderTheme.of(context).copyWith(
              activeTrackColor: floors > legalFloors ? AppColors.danger : AppColors.emerald,
              inactiveTrackColor: Colors.white.withOpacity(.08),
              thumbColor: floors > legalFloors ? AppColors.danger : AppColors.emerald,
              overlayColor: (floors > legalFloors ? AppColors.danger : AppColors.emerald).withOpacity(.14),
              trackHeight: 5,
              thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 9),
            ),
            child: Slider(
              value: floors.toDouble(),
              min: _minFloor.toDouble(),
              max: maxFloors.toDouble(),
              divisions: maxFloors - _minFloor,
              label: '$floors kat',
              onChanged: (v) => onChanged(v.round()),
            ),
          ),
        ),
        Text('$maxFloors kat', style: Theme.of(context).textTheme.labelSmall?.copyWith(color: AppColors.slate)),
      ]);

  static const _minFloor = 1;
}

class _FloorInfo extends StatelessWidget {
  const _FloorInfo({required this.floors, required this.legalFloors, required this.taks});
  final int floors;
  final int legalFloors;
  final double taks;

  @override
  Widget build(BuildContext context) {
    final overLegal = floors > legalFloors;
    final color = overLegal ? AppColors.danger : AppColors.emerald;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(.08),
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: color.withOpacity(.22)),
      ),
      child: Row(children: [
        Icon(overLegal ? Icons.warning_amber_rounded : Icons.check_circle_rounded, size: 20, color: color),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            overLegal
                ? '$floors kat imar sınırını aşıyor (yasal sınır: $legalFloors kat). Gerçek proje için belediye onayı gerekir.'
                : '${calculateFootprintM2(taks)} m² taban alanı × $floors kat → ${calculateGrossM2(taks, floors)} m² brüt inşaat alanı.',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(color: color.withOpacity(.85), height: 1.4),
          ),
        ),
      ]),
    );
  }

  static double calculateFootprintM2(double taks) => (taks * 1000).roundToDouble();
  static double calculateGrossM2(double taks, int floors) => (taks * 1000 * floors).roundToDouble();
}
