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
  Widget build(BuildContext context) {
    final slides = [
      ('Parseli haritada keşfet', 'Uydu, 3D, risk ve imar katmanlarını premium bir harita deneyiminde incele.', Icons.travel_explore_rounded),
      ('Emsali saniyeler içinde hesapla', 'TAKS, KAKS, kat sınırı ve piyasa varsayımları ile proje potansiyelini gör.', Icons.calculate_rounded),
      ('Rapor ve analiz hazır', 'AI içgörüleri, PDF çıktıları ve çalışma talepleri için ölçeklenebilir altyapı.', Icons.auto_awesome_rounded),
    ];
    return Scaffold(
      body: DecoratedBox(
        decoration: BoxDecoration(color: Theme.of(context).scaffoldBackgroundColor),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(children: [
              Align(alignment: Alignment.centerRight, child: TextButton(onPressed: () => context.go(AuthRoute.path), child: const Text('Atla'))),
              Expanded(
                child: PageView.builder(
                  controller: controller,
                  itemCount: slides.length + 1,
                  onPageChanged: (value) => setState(() => index = value),
                  itemBuilder: (context, i) {
                    if (i == slides.length) return const _ProfileStep();
                    final slide = slides[i];
                    return Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                      Container(width: 190, height: 190, decoration: BoxDecoration(gradient: AppGradients.premium, borderRadius: BorderRadius.circular(54), boxShadow: AppShadows.glow(AppColors.emerald)), child: Icon(slide.$3, color: Colors.white, size: 86)),
                      const SizedBox(height: 38),
                      Text(slide.$1, textAlign: TextAlign.center, style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w900)),
                      const SizedBox(height: 14),
                      Text(slide.$2, textAlign: TextAlign.center, style: Theme.of(context).textTheme.titleMedium?.copyWith(color: AppColors.slate)),
                    ]);
                  },
                ),
              ),
              Row(children: [
                for (var i = 0; i < slides.length + 1; i++) AnimatedContainer(duration: const Duration(milliseconds: 160), margin: const EdgeInsets.only(right: 7), width: index == i ? 28 : 8, height: 8, decoration: BoxDecoration(color: index == i ? AppColors.emerald : AppColors.slate.withOpacity(.25), borderRadius: BorderRadius.circular(99))),
                const Spacer(),
                GradientButton(label: index == slides.length ? 'Devam Et' : 'İleri', icon: Icons.arrow_forward_rounded, onPressed: () { if (index == slides.length) { context.go(AuthRoute.path); } else { controller.nextPage(duration: const Duration(milliseconds: 220), curve: Curves.easeOutCubic); } }),
              ]),
            ]),
          ),
        ),
      ),
    );
  }
}

class _ProfileStep extends StatelessWidget {
  const _ProfileStep();
  @override
  Widget build(BuildContext context) => Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        CircleAvatar(radius: 54, backgroundColor: AppColors.emerald.withOpacity(.16), child: const Icon(Icons.person_add_alt_1_rounded, size: 54, color: AppColors.emerald)),
        const SizedBox(height: 24),
        Text('Profilini kişiselleştir', style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w900), textAlign: TextAlign.center),
        const SizedBox(height: 16),
        const TextField(decoration: InputDecoration(labelText: 'Ad Soyad', prefixIcon: Icon(Icons.badge_rounded))),
        const SizedBox(height: 12),
        const Text('Avatar ve ilgi alanları sonraki fazda Firebase profiline kaydedilecek.', textAlign: TextAlign.center),
      ]);
}
