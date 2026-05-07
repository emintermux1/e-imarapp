import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router/app_router.dart';
import '../../../core/theme/tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../data/mock_auth_repository.dart';
import '../domain/auth_repository.dart';

class AuthScreen extends ConsumerStatefulWidget {
  const AuthScreen({super.key});

  @override
  ConsumerState<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends ConsumerState<AuthScreen> {
  bool loading = false;
  final phone = TextEditingController();
  final otp = TextEditingController();
  String? verificationId;

  @override
  void dispose() {
    phone.dispose();
    otp.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: ListView(padding: const EdgeInsets.all(AppSpacing.lg), children: [
          const SizedBox(height: 32),
          Text('E-İmar', style: Theme.of(context).textTheme.displaySmall?.copyWith(fontWeight: FontWeight.w900)),
          Text('İmar ve Emsal Sorgu', style: Theme.of(context).textTheme.titleLarge?.copyWith(color: AppColors.slate)),
          const SizedBox(height: 36),
          GlassCard(child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            Text('Giriş yap', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800)),
            const SizedBox(height: 16),
            _AuthButton(icon: Icons.g_mobiledata_rounded, label: 'Google ile devam et', onTap: () => _signIn((repo) => repo.signInWithGoogle())),
            const SizedBox(height: 10),
            _AuthButton(icon: Icons.apple_rounded, label: 'Apple ile devam et', onTap: () => _signIn((repo) => repo.signInWithApple())),
            const SizedBox(height: 18),
            TextField(controller: phone, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'Telefon', hintText: '+90 5xx xxx xx xx', prefixIcon: Icon(Icons.phone_rounded))),
            const SizedBox(height: 10),
            if (verificationId != null) TextField(controller: otp, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'OTP', hintText: '123456', prefixIcon: Icon(Icons.sms_rounded))),
            const SizedBox(height: 12),
            GradientButton(label: verificationId == null ? 'Kod Gönder' : 'Telefonla Giriş Yap', icon: Icons.lock_open_rounded, onPressed: loading ? null : _phoneAction),
          ])),
          const SizedBox(height: 18),
          const AppStateView(title: 'Güvenli geliştirme modu', message: 'Gerçek Firebase anahtarları yoksa giriş akışları mock kullanıcı ile fail-soft çalışır.', icon: Icons.verified_user_rounded),
        ]),
      ),
    );
  }

  Future<void> _signIn(Future<AuthUser> Function(AuthRepository repo) action) async {
    setState(() => loading = true);
    try {
      await action(ref.read(authRepositoryProvider));
      if (mounted) context.go(HomeRoute.path);
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> _phoneAction() async {
    final repo = ref.read(authRepositoryProvider);
    setState(() => loading = true);
    try {
      if (verificationId == null) {
        verificationId = await repo.sendPhoneOtp(phone.text.trim());
      } else {
        await repo.verifyPhoneOtp(verificationId: verificationId!, smsCode: otp.text.trim());
        if (mounted) context.go(HomeRoute.path);
      }
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }
}

class _AuthButton extends StatelessWidget {
  const _AuthButton({required this.icon, required this.label, required this.onTap});
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => OutlinedButton.icon(onPressed: onTap, icon: Icon(icon), label: Text(label), style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 15), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.pill))));
}
