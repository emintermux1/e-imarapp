import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router/app_router.dart';
import '../../../core/theme/tokens.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    Future<void>.delayed(const Duration(milliseconds: 700), () {
      if (mounted) context.go(OnboardingRoute.path);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: DecoratedBox(
        decoration: const BoxDecoration(gradient: AppGradients.premium),
        child: Center(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Container(
                width: 88,
                height: 88,
                decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: .14),
                    borderRadius: BorderRadius.circular(28)),
                child: const Icon(Icons.map_rounded,
                    color: Colors.white, size: 46)),
            const SizedBox(height: 22),
            Text('E-İmar',
                style: Theme.of(context).textTheme.displaySmall?.copyWith(
                    color: Colors.white, fontWeight: FontWeight.w900)),
            Text('İmar ve Emsal Sorgu',
                style: Theme.of(context)
                    .textTheme
                    .titleMedium
                    ?.copyWith(color: Colors.white70)),
          ]),
        ),
      ),
    );
  }
}
