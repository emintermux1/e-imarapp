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
    final gridPaint = Paint()..color = Colors.white.withOpacity(.055)..style = PaintingStyle.stroke..strokeWidth = 1;
    for (var i = -size.height; i < size.width; i += 48) {
      canvas.drawLine(Offset(i.toDouble(), 0), Offset(i + size.height, size.height), gridPaint);
    }
    final roadPaint = Paint()..color = const Color(0xFFB6D7C1).withOpacity(.34)..style = PaintingStyle.stroke..strokeWidth = 13..strokeCap = StrokeCap.round;
    final road = Path()..moveTo(size.width * .05, size.height * .32)..cubicTo(size.width * .35, size.height * .18, size.width * .52, size.height * .52, size.width * .92, size.height * .42);
    canvas.drawPath(road, roadPaint);
    final parcelPaint = Paint()..color = AppColors.emerald.withOpacity(.20)..style = PaintingStyle.fill;
    final parcelStroke = Paint()..color = AppColors.mint.withOpacity(.80)..style = PaintingStyle.stroke..strokeWidth = 1.6;
    for (var row = 0; row < 7; row++) {
      for (var col = 0; col < 5; col++) {
        final cx = size.width * (.16 + col * .18) + math.sin(row + col) * 10;
        final cy = size.height * (.20 + row * .10);
        final path = Path()
          ..moveTo(cx - 42, cy - 18)
          ..lineTo(cx + 34, cy - 28)
          ..lineTo(cx + 44, cy + 22)
          ..lineTo(cx - 30, cy + 28)
          ..close();
        canvas.drawPath(path, parcelPaint);
        canvas.drawPath(path, parcelStroke);
      }
    }
    final pinPaint = Paint()..color = AppColors.lime;
    canvas.drawCircle(Offset(size.width * .54, size.height * .48), 9, pinPaint);
    canvas.drawCircle(Offset(size.width * .54, size.height * .48), 18, Paint()..color = AppColors.lime.withOpacity(.18));
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
