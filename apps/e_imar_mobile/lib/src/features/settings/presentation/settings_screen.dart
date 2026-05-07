import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/app.dart';
import '../../../app/router/app_router.dart';
import '../../../core/config/app_config.dart';
import '../../../core/theme/tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../../auth/data/mock_auth_repository.dart';
import '../../auth/presentation/auth_screen.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mode = ref.watch(themeModeProvider);
    final amoled = ref.watch(amoledProvider);
    final auth = ref.watch(authStateProvider).valueOrNull;
    final config = ref.watch(appConfigProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Hesap ve güvenlik')),
      body: ListView(padding: const EdgeInsets.all(AppSpacing.lg), children: [
        GlassCard(
          variant: GlassVariant.elevated,
          padding: const EdgeInsets.all(18),
          child: Row(children: [
            Container(width: 58, height: 58, decoration: BoxDecoration(gradient: AppGradients.civicRed, borderRadius: BorderRadius.circular(20)), child: const Icon(Icons.account_circle_rounded, color: Colors.white, size: 32)),
            const SizedBox(width: 14),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(auth?.displayName ?? 'Oturum bekleniyor', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900)),
              const SizedBox(height: 4),
              Text(auth?.phone ?? 'Firebase Phone Auth ile güvenli giriş', style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.slate)),
            ])),
            const StatusBadge(label: 'KVKK', tone: BadgeTone.success, icon: Icons.privacy_tip_rounded),
          ]),
        ),
        const SizedBox(height: 14),
        _SectionCard(children: [
          ListTile(
            leading: const Icon(Icons.security_rounded, color: AppColors.civicRed),
            title: const Text('Güvenlik durumu'),
            subtitle: Text('Firebase: ${config.firebaseEnabled ? 'proje tanımlı' : 'yapılandırma gerekli'} • Gateway: ${config.hasGateway ? 'tanımlı' : 'bekleniyor'}'),
          ),
          const Divider(height: 1),
          const ListTile(
            leading: Icon(Icons.policy_rounded, color: AppColors.civicRed),
            title: Text('KVKK / gizlilik / açık rıza'),
            subtitle: Text('Konum, arama ve kayıtlı parsel verilerinin işlenme durumu'),
          ),
          const Divider(height: 1),
          const ListTile(
            leading: Icon(Icons.route_rounded, color: AppColors.civicRed),
            title: Text('Sağlayıcı erişim modeli'),
            subtitle: Text('TKGM ve kısıtlı kaynaklar yalnızca server-side gateway üzerinden tüketilir'),
          ),
        ]),
        const SizedBox(height: 14),
        _SectionCard(children: [
          DropdownButtonFormField<ThemeMode>(
            value: mode,
            decoration: const InputDecoration(labelText: 'Tema'),
            items: const [
              DropdownMenuItem(value: ThemeMode.system, child: Text('Sistem')),
              DropdownMenuItem(value: ThemeMode.light, child: Text('Açık')),
              DropdownMenuItem(value: ThemeMode.dark, child: Text('Koyu')),
            ],
            onChanged: (value) {
              if (value != null) ref.read(themeModeProvider.notifier).state = value;
            },
          ),
          SwitchListTile(
            value: amoled,
            onChanged: (v) => ref.read(amoledProvider.notifier).state = v,
            title: const Text('AMOLED siyah tema'),
            subtitle: const Text('OLED ekranlarda pil dostu koyu görünüm'),
          ),
        ]),
        const SizedBox(height: 14),
        OutlinedButton.icon(
          onPressed: () async {
            await ref.read(authRepositoryProvider).signOut();
            if (context.mounted) context.go(AuthRoute.path);
          },
          icon: const Icon(Icons.logout_rounded),
          label: const Text('Güvenli çıkış yap'),
        ),
      ]),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.children});
  final List<Widget> children;

  @override
  Widget build(BuildContext context) => GlassCard(
        padding: const EdgeInsets.all(12),
        child: Column(children: children),
      );
}
