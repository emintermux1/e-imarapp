import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

abstract final class MotionDurations {
  static const micro = Duration(milliseconds: 90);
  static const fast = Duration(milliseconds: 140);
  static const sheet = Duration(milliseconds: 220);
  static const route = Duration(milliseconds: 180);
  static const routeReverse = Duration(milliseconds: 130);
}

abstract final class MotionCurves {
  static const standard = Cubic(0.2, 0.0, 0.0, 1.0);
  static const emphasized = Cubic(0.16, 1.0, 0.3, 1.0);
  static const exit = Cubic(0.4, 0.0, 1.0, 1.0);
}

class Debouncer {
  Debouncer(this.duration);
  final Duration duration;
  Timer? _timer;
  void call(VoidCallback callback) { _timer?.cancel(); _timer = Timer(duration, callback); }
  void dispose() => _timer?.cancel();
}

class Throttler {
  Throttler(this.duration);
  final Duration duration;
  DateTime _last = DateTime.fromMillisecondsSinceEpoch(0);
  void call(VoidCallback callback) {
    final now = DateTime.now();
    if (now.difference(_last) >= duration) { _last = now; callback(); }
  }
}

class SmoothAnimatedSwitcher extends StatelessWidget {
  const SmoothAnimatedSwitcher({required this.child, this.duration = MotionDurations.fast, super.key});
  final Widget child;
  final Duration duration;

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: duration,
      reverseDuration: MotionDurations.micro,
      switchInCurve: MotionCurves.emphasized,
      switchOutCurve: MotionCurves.exit,
      transitionBuilder: (child, animation) => FadeTransition(opacity: animation, child: ScaleTransition(scale: Tween(begin: .985, end: 1.0).animate(animation), child: child)),
      child: child,
    );
  }
}

class PerformanceOverlayGate extends StatelessWidget {
  const PerformanceOverlayGate({required this.child, this.enabled = false, super.key});
  final Widget child;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    if (!kDebugMode || !enabled) return child;
    return Stack(children: [child, const Positioned(top: 0, left: 0, right: 0, child: PerformanceOverlay.allEnabled())]);
  }
}

abstract final class CacheHints {
  static const int mapMockRasterCacheWidth = 1080;
  static const int avatarCacheWidth = 160;
  static const int thumbnailCacheWidth = 480;
}
