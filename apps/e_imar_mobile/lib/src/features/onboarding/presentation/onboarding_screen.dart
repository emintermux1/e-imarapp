import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router/app_router.dart';
import '../../../core/theme/tokens.dart';
import '../../../core/widgets/widgets.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final controller = PageController();
  int index = 0;

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final slides = [
      (
        'Parseli haritada keşfet',
        'Uydu, 3D, risk ve imar katmanlarını premium bir harita deneyiminde incele.',
        Icons.travel_explore_rounded
      ),
      (
        'Emsali saniyeler içinde hesapla',
        'TAKS, KAKS, kat sınırı ve piyasa varsayımları ile proje potansiyelini gör.',
        Icons.calculate_rounded
      ),
      (
        'Rapor ve analiz hazır',
        'AI içgörüleri, PDF çıktıları ve çalışma talepleri için ölçeklenebilir altyapı.',
        Icons.auto_awesome_rounded
      ),
    ];
    return Scaffold(
      body: DecoratedBox(
        decoration: const BoxDecoration(gradient: AppGradients.heroMap),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(children: [
              Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                      onPressed: () => context.go(AuthRoute.path),
                      child: const Text('Atla',
                          style: TextStyle(color: Colors.white)))),
              Expanded(
                child: PageView.builder(
                  controller: controller,
                  itemCount: slides.length + 1,
                  onPageChanged: (value) => setState(() => index = value),
                  itemBuilder: (context, i) {
                    if (i == slides.length) return const _ProfileStep();
                    final slide = slides[i];
                    return Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          _CinematicParcelArt(icon: slide.$3, index: i),
                          const SizedBox(height: 38),
                          Text(slide.$1,
                              textAlign: TextAlign.center,
                              style: Theme.of(context)
                                  .textTheme
                                  .headlineMedium
                                  ?.copyWith(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w900,
                                      height: 1.05)),
                          const SizedBox(height: 14),
                          Text(slide.$2,
                              textAlign: TextAlign.center,
                              style: Theme.of(context)
                                  .textTheme
                                  .titleMedium
                                  ?.copyWith(
                                      color:
                                          Colors.white.withValues(alpha: .72),
                                      height: 1.35)),
                        ]);
                  },
                ),
              ),
              Row(children: [
                for (var i = 0; i < slides.length + 1; i++)
                  AnimatedContainer(
                      duration: const Duration(milliseconds: 160),
                      margin: const EdgeInsets.only(right: 7),
                      width: index == i ? 28 : 8,
                      height: 8,
                      decoration: BoxDecoration(
                          color: index == i
                              ? AppColors.lime
                              : Colors.white.withValues(alpha: .25),
                          borderRadius: BorderRadius.circular(99))),
                const Spacer(),
                GradientButton(
                    label: index == slides.length ? 'Devam Et' : 'İleri',
                    icon: Icons.arrow_forward_rounded,
                    onPressed: () {
                      if (index == slides.length) {
                        context.go(AuthRoute.path);
                      } else {
                        controller.nextPage(
                            duration: const Duration(milliseconds: 220),
                            curve: Curves.easeOutCubic);
                      }
                    }),
              ]),
            ]),
          ),
        ),
      ),
    );
  }
}

class _CinematicParcelArt extends StatelessWidget {
  const _CinematicParcelArt({required this.icon, required this.index});
  final IconData icon;
  final int index;
  @override
  Widget build(BuildContext context) => RepaintBoundary(
        child: Container(
          width: 230,
          height: 230,
          decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(64),
              gradient: const LinearGradient(
                  colors: [Color(0x6616C784), Color(0x22C6F66F)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight),
              border: Border.all(color: Colors.white.withValues(alpha: .18)),
              boxShadow: AppShadows.glow(AppColors.emerald)),
          child: Stack(children: [
            for (var i = 0; i < 5; i++)
              Positioned(
                  left: 28 + i * 30,
                  top: 42 + (i.isEven ? 18 : 0),
                  child: Transform.rotate(
                      angle: -.25,
                      child: Container(
                          width: 76,
                          height: 38,
                          decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: .08),
                              border: Border.all(
                                  color: AppColors.mint.withValues(alpha: .35)),
                              borderRadius: BorderRadius.circular(12))))),
            Positioned(
                right: 26,
                bottom: 28,
                child: Container(
                    width: 78,
                    height: 78,
                    decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppColors.lime.withValues(alpha: .12),
                        border: Border.all(
                            color: AppColors.lime.withValues(alpha: .35))),
                    child: Icon(icon, color: Colors.white, size: 40))),
            Positioned(
                left: 28,
                bottom: 34,
                child: StatusBadge(
                    label: index == 0
                        ? 'Harita'
                        : index == 1
                            ? 'Emsal'
                            : 'AI',
                    tone: BadgeTone.success)),
          ]),
        ),
      );
}

class _ProfileStep extends StatelessWidget {
  const _ProfileStep();
  @override
  Widget build(BuildContext context) =>
      Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        const _CinematicParcelArt(
            icon: Icons.person_add_alt_1_rounded, index: 2),
        const SizedBox(height: 24),
        Text('Profilini kişiselleştir',
            style: Theme.of(context)
                .textTheme
                .headlineMedium
                ?.copyWith(color: Colors.white, fontWeight: FontWeight.w900),
            textAlign: TextAlign.center),
        const SizedBox(height: 16),
        const GlassCard(
            variant: GlassVariant.dark,
            child: TextField(
                style: TextStyle(color: Colors.white),
                decoration: InputDecoration(
                    labelText: 'Ad Soyad',
                    prefixIcon: Icon(Icons.badge_rounded)))),
        const SizedBox(height: 12),
        Text(
            'Avatar ve ilgi alanları sonraki fazda Firebase profiline kaydedilecek.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.white.withValues(alpha: .72))),
      ]);
}
