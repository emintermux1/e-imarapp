import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/app.dart';
import '../../../core/theme/tokens.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mode = ref.watch(themeModeProvider);
    final amoled = ref.watch(amoledProvider);
    return Scaffold(appBar: AppBar(title: const Text('Ayarlar')), body: ListView(padding: const EdgeInsets.all(AppSpacing.lg), children: [
      DropdownButtonFormField<ThemeMode>(value: mode, decoration: const InputDecoration(labelText: 'Tema'), items: const [DropdownMenuItem(value: ThemeMode.system, child: Text('Sistem')), DropdownMenuItem(value: ThemeMode.light, child: Text('Açık')), DropdownMenuItem(value: ThemeMode.dark, child: Text('Koyu'))], onChanged: (value) { if (value != null) ref.read(themeModeProvider.notifier).state = value; }),
      SwitchListTile(value: amoled, onChanged: (v) => ref.read(amoledProvider.notifier).state = v, title: const Text('AMOLED siyah tema'), subtitle: const Text('OLED ekranlarda pil dostu premium koyu görünüm')),
      ListTile(leading: const Icon(Icons.auto_awesome_rounded), title: const Text('AI değerleme ve piyasa zekâsı'), subtitle: const Text('Danışman nitelikli m² fiyatı, emsal özeti ve etik kaynak açıklamaları'), trailing: const Icon(Icons.chevron_right_rounded), onTap: () => context.push('/ai-valuation')),
      const ListTile(leading: Icon(Icons.security_rounded), title: Text('Gizlilik ve güvenlik'), subtitle: Text('Güvenli varsayılan Firebase kuralları hazır')),
    ]));
  }
}
