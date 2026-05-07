import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../../../core/theme/tokens.dart';

class MockMapCanvas extends StatelessWidget {
  const MockMapCanvas({super.key});

  @override
  Widget build(BuildContext context) => const RepaintBoundary(child: CustomPaint(painter: _MockMapPainter(), child: SizedBox.expand()));
}

class _MockMapPainter extends CustomPainter {
  const _MockMapPainter();

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    canvas.drawRect(rect, Paint()..shader = AppGradients.mapMock.createShader(rect));
    _drawSatelliteTexture(canvas, size);
    _drawContours(canvas, size);
    _drawRoads(canvas, size);
    _drawHeat(canvas, size);
    _drawParcels(canvas, size);
    _drawSelectedParcel(canvas, size);
    _drawLocation(canvas, size);
    _drawVignette(canvas, rect);
  }

  void _drawSatelliteTexture(Canvas canvas, Size size) {
    final paints = [
      Paint()..color = const Color(0xFF314C2E).withOpacity(.18),
      Paint()..color = const Color(0xFFB39E65).withOpacity(.10),
      Paint()..color = const Color(0xFF102D25).withOpacity(.22),
    ];
    for (var i = 0; i < 26; i++) {
      final x = size.width * ((i * 37) % 100) / 100;
      final y = size.height * ((i * 61) % 100) / 100;
      canvas.drawOval(Rect.fromCenter(center: Offset(x, y), width: 120 + (i % 5) * 34, height: 54 + (i % 4) * 28), paints[i % paints.length]);
    }
  }

  void _drawContours(Canvas canvas, Size size) {
    final paint = Paint()..color = AppColors.mapContour.withOpacity(.09)..style = PaintingStyle.stroke..strokeWidth = 1;
    for (var i = 0; i < 11; i++) {
      final path = Path()..moveTo(-20, size.height * (.12 + i * .075));
      for (var x = 0.0; x <= size.width + 40; x += 44) {
        path.lineTo(x, size.height * (.12 + i * .075) + math.sin(x / 68 + i) * 16);
      }
      canvas.drawPath(path, paint);
    }
  }

  void _drawRoads(Canvas canvas, Size size) {
    final casing = Paint()..color = Colors.black.withOpacity(.22)..style = PaintingStyle.stroke..strokeWidth = 15..strokeCap = StrokeCap.round;
    final road = Paint()..color = AppColors.mapRoad.withOpacity(.52)..style = PaintingStyle.stroke..strokeWidth = 9..strokeCap = StrokeCap.round;
    final lane = Paint()..color = Colors.white.withOpacity(.28)..style = PaintingStyle.stroke..strokeWidth = 1.2..strokeCap = StrokeCap.round;
    final main = Path()..moveTo(size.width * -.04, size.height * .34)..cubicTo(size.width * .28, size.height * .18, size.width * .51, size.height * .53, size.width * 1.05, size.height * .39);
    canvas.drawPath(main, casing);
    canvas.drawPath(main, road);
    canvas.drawPath(main, lane);
    final secondary = Paint()..color = const Color(0xFFB8D1BE).withOpacity(.22)..style = PaintingStyle.stroke..strokeWidth = 5..strokeCap = StrokeCap.round;
    for (var i = 0; i < 4; i++) {
      final path = Path()..moveTo(size.width * (.08 + i * .2), size.height * .08)..cubicTo(size.width * (.18 + i * .12), size.height * .26, size.width * (.1 + i * .22), size.height * .62, size.width * (.3 + i * .14), size.height * .96);
      canvas.drawPath(path, secondary);
    }
  }

  void _drawHeat(Canvas canvas, Size size) {
    final spots = [
      (Offset(size.width * .24, size.height * .62), AppColors.riskMedium, 88.0),
      (Offset(size.width * .75, size.height * .28), AppColors.riskHigh, 72.0),
      (Offset(size.width * .64, size.height * .72), AppColors.info, 94.0),
    ];
    for (final spot in spots) {
      canvas.drawCircle(spot.$1, spot.$3, Paint()..shader = RadialGradient(colors: [spot.$2.withOpacity(.25), spot.$2.withOpacity(0)]).createShader(Rect.fromCircle(center: spot.$1, radius: spot.$3)));
    }
  }

  void _drawParcels(Canvas canvas, Size size) {
    final fill = Paint()..color = AppColors.mapParcel.withOpacity(.075)..style = PaintingStyle.fill;
    final stroke = Paint()..color = AppColors.mapParcel.withOpacity(.38)..style = PaintingStyle.stroke..strokeWidth = .85;
    for (var row = 0; row < 9; row++) {
      for (var col = 0; col < 7; col++) {
        final cx = size.width * (.08 + col * .15) + math.sin(row * 1.7 + col) * 15;
        final cy = size.height * (.17 + row * .085) + math.cos(col + row) * 8;
        final w = 48 + (row + col) % 4 * 8;
        final h = 26 + (row * col) % 3 * 7;
        final path = Path()
          ..moveTo(cx - w * .55, cy - h * .48)
          ..lineTo(cx + w * .48, cy - h * .66)
          ..lineTo(cx + w * .58, cy + h * .46)
          ..lineTo(cx - w * .42, cy + h * .62)
          ..close();
        canvas.drawPath(path, fill);
        canvas.drawPath(path, stroke);
      }
    }
  }

  void _drawSelectedParcel(Canvas canvas, Size size) {
    final path = Path()
      ..moveTo(size.width * .42, size.height * .43)
      ..lineTo(size.width * .61, size.height * .39)
      ..lineTo(size.width * .66, size.height * .51)
      ..lineTo(size.width * .47, size.height * .58)
      ..close();
    canvas.drawPath(path, Paint()..color = AppColors.emerald.withOpacity(.23)..maskFilter = const MaskFilter.blur(BlurStyle.outer, 16));
    canvas.drawPath(path, Paint()..color = AppColors.emerald.withOpacity(.20)..style = PaintingStyle.fill);
    canvas.drawPath(path, Paint()..color = AppColors.lime.withOpacity(.92)..style = PaintingStyle.stroke..strokeWidth = 2.2);
  }

  void _drawLocation(Canvas canvas, Size size) {
    final center = Offset(size.width * .55, size.height * .48);
    for (final r in const [18.0, 32.0, 48.0]) {
      canvas.drawCircle(center, r, Paint()..color = AppColors.lime.withOpacity(.06)..style = PaintingStyle.fill);
      canvas.drawCircle(center, r, Paint()..color = AppColors.lime.withOpacity(.16)..style = PaintingStyle.stroke..strokeWidth = 1);
    }
    canvas.drawCircle(center, 8, Paint()..color = AppColors.lime);
    canvas.drawCircle(center, 3, Paint()..color = Colors.white);
  }

  void _drawVignette(Canvas canvas, Rect rect) {
    canvas.drawRect(rect, Paint()..shader = RadialGradient(colors: [Colors.transparent, Colors.black.withOpacity(.48)], stops: const [.58, 1]).createShader(rect));
    canvas.drawRect(rect, Paint()..shader = const LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Color(0x7A000000), Color(0x00000000), Color(0xA6000000)], stops: [0, .43, 1]).createShader(rect));
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
