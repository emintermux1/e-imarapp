import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router/app_router.dart';
import '../../../core/config/app_config.dart';
import '../../../core/theme/tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../data/mock_auth_repository.dart';
import '../domain/auth_repository.dart';

final authStateProvider = StreamProvider<AuthUser?>((ref) {
  return ref.watch(authRepositoryProvider).authStateChanges();
});

class AuthScreen extends ConsumerStatefulWidget {
  const AuthScreen({super.key});

  @override
  ConsumerState<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends ConsumerState<AuthScreen> {
  bool loading = false;
  bool otpSent = false;
  bool consent = true;
  String? verificationId;
  String? helper;
  final phone = TextEditingController(text: '+90 ');
  final otp = TextEditingController();

  @override
  void dispose() {
    phone.dispose();
    otp.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(authStateProvider, (_, next) {
      if (next.valueOrNull != null && mounted) context.go(HomeRoute.path);
    });

    final config = ref.watch(appConfigProvider);
    final firebaseReady = Firebase.apps.isNotEmpty;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: DecoratedBox(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: isDark
                ? const [Color(0xFF070809), Color(0xFF1A070A), Color(0xFF08090B)]
                : const [Color(0xFFFFFBFA), Color(0xFFFFF2F2), Color(0xFFF8FAFC)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(22, 18, 22, 28),
            children: [
              const _InstitutionalHeader(),
              const SizedBox(height: 22),
              if (!firebaseReady)
                _ConfigurationUnavailable(config: config)
              else
                _PhoneAuthCard(
                  phone: phone,
                  otp: otp,
                  otpSent: otpSent,
                  loading: loading,
                  consent: consent,
                  helper: helper,
                  onConsentChanged: (value) => setState(() => consent = value),
                  onPrimary: _phoneAction,
                ),
              const SizedBox(height: 14),
              const _TrustRail(),
              const SizedBox(height: 14),
              const _PrivacyLinks(),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _phoneAction() async {
    if (!consent) {
      setState(() => helper = 'Devam etmek için KVKK aydınlatma metni ve açık rıza durumunu onaylayın.');
      return;
    }
    final repo = ref.read(authRepositoryProvider);
    setState(() {
      loading = true;
      helper = null;
    });
    try {
      if (!otpSent) {
        verificationId = await repo.sendPhoneOtp(_normalizePhone(phone.text));
        if (!mounted) return;
        setState(() {
          otpSent = true;
          helper = 'Tek kullanımlık doğrulama kodu Firebase Phone Auth üzerinden gönderildi.';
        });
      } else {
        final id = verificationId;
        if (id == null || id.isEmpty) throw const AuthException('Önce doğrulama kodu isteyin.');
        await repo.verifyPhoneOtp(verificationId: id, smsCode: otp.text.trim());
      }
    } on AuthException catch (error) {
      if (mounted) setState(() => helper = error.message);
    } catch (_) {
      if (mounted) setState(() => helper = 'Kimlik doğrulama tamamlanamadı. Lütfen tekrar deneyin.');
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }
}

String _normalizePhone(String value) {
  final compact = value.replaceAll(RegExp(r'\s+'), '');
  if (compact.startsWith('0')) return '+90${compact.substring(1)}';
  if (compact.startsWith('5')) return '+90$compact';
  return compact;
}

class _InstitutionalHeader extends StatelessWidget {
  const _InstitutionalHeader();

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 58,
                height: 58,
                decoration: BoxDecoration(
                  gradient: AppGradients.civicRed,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: AppShadows.glow(AppColors.civicRed),
                ),
                child: const Icon(Icons.account_balance_rounded, color: Colors.white, size: 30),
              ),
              const Spacer(),
              const StatusBadge(label: 'Güvenli giriş', tone: BadgeTone.danger, icon: Icons.verified_user_rounded),
            ],
          ),
          const SizedBox(height: 24),
          Text(
            'E-İmar hesabınıza güvenli giriş',
            style: Theme.of(context).textTheme.displaySmall?.copyWith(fontWeight: FontWeight.w900, height: .98),
          ),
          const SizedBox(height: 10),
          Text(
            'Türkiye geneli parsel keşfi, resmi kaynak etiketleri ve kişisel çalışma alanınız için Firebase telefon doğrulaması kullanılır.',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(color: AppColors.slate, height: 1.35, fontWeight: FontWeight.w600),
          ),
        ],
      );
}

class _PhoneAuthCard extends StatelessWidget {
  const _PhoneAuthCard({
    required this.phone,
    required this.otp,
    required this.otpSent,
    required this.loading,
    required this.consent,
    required this.onConsentChanged,
    required this.onPrimary,
    this.helper,
  });

  final TextEditingController phone;
  final TextEditingController otp;
  final bool otpSent;
  final bool loading;
  final bool consent;
  final ValueChanged<bool> onConsentChanged;
  final VoidCallback onPrimary;
  final String? helper;

  @override
  Widget build(BuildContext context) => GlassCard(
        variant: GlassVariant.elevated,
        padding: const EdgeInsets.all(20),
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Text('Telefon ile doğrula', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w900)),
          const SizedBox(height: 8),
          Text('SMS kodu doğrudan Firebase Phone Auth ile doğrulanır. Uygulama mock oturum üretmez.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.slate, height: 1.35)),
          const SizedBox(height: 16),
          TextField(
            controller: phone,
            keyboardType: TextInputType.phone,
            textInputAction: TextInputAction.next,
            inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9+\s]'))],
            decoration: const InputDecoration(labelText: 'Telefon numarası', hintText: '+90 5xx xxx xx xx', prefixIcon: Icon(Icons.phone_iphone_rounded)),
          ),
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 180),
            child: otpSent
                ? Padding(
                    padding: const EdgeInsets.only(top: 12),
                    child: TextField(
                      key: const ValueKey('otp'),
                      controller: otp,
                      keyboardType: TextInputType.number,
                      textInputAction: TextInputAction.done,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      decoration: const InputDecoration(labelText: 'SMS doğrulama kodu', prefixIcon: Icon(Icons.password_rounded)),
                    ),
                  )
                : const SizedBox.shrink(),
          ),
          const SizedBox(height: 12),
          SwitchListTile.adaptive(
            value: consent,
            contentPadding: EdgeInsets.zero,
            onChanged: onConsentChanged,
            title: const Text('KVKK ve güvenlik bilgilendirmesini okudum'),
            subtitle: const Text('Konum ve parsel verisi yalnızca seçtiğiniz sorgu için işlenir.'),
          ),
          if (helper != null) ...[
            const SizedBox(height: 8),
            Text(helper!, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: helper!.contains('gönderildi') ? AppColors.slate : AppColors.danger, fontWeight: FontWeight.w800)),
          ],
          const SizedBox(height: 14),
          GradientButton(
            label: loading ? 'Güvenli kanal bekleniyor' : (otpSent ? 'Kodu doğrula ve devam et' : 'SMS kodu gönder'),
            icon: otpSent ? Icons.verified_rounded : Icons.sms_rounded,
            onPressed: loading ? null : onPrimary,
          ),
        ]),
      );
}

class _ConfigurationUnavailable extends StatelessWidget {
  const _ConfigurationUnavailable({required this.config});
  final AppConfig config;

  @override
  Widget build(BuildContext context) => GlassCard(
        variant: GlassVariant.elevated,
        padding: const EdgeInsets.all(20),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const StatusBadge(label: 'Yapılandırma gerekli', tone: BadgeTone.warning, icon: Icons.admin_panel_settings_rounded),
          const SizedBox(height: 14),
          Text('Kimlik doğrulama şu anda kullanılamıyor', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w900)),
          const SizedBox(height: 8),
          Text(
            config.firebaseEnabled
                ? 'Firebase projesi tanımlı görünüyor ancak SDK başlatılamadı. Firebase seçeneklerini, platform bundle idlerini ve Phone Auth sağlayıcısını kontrol edin.'
                : 'FIREBASE_PROJECT_ID ve platform Firebase seçenekleri placeholder durumda. Uygulama gerçek oturum yerine mock girişe düşmez.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.slate, height: 1.35),
          ),
        ]),
      );
}

class _TrustRail extends StatelessWidget {
  const _TrustRail();

  @override
  Widget build(BuildContext context) => Row(children: const [
        Expanded(child: _TrustItem(icon: Icons.lock_rounded, label: 'OTP', value: 'Firebase')),
        SizedBox(width: 10),
        Expanded(child: _TrustItem(icon: Icons.public_rounded, label: 'Kapsam', value: 'Türkiye')),
        SizedBox(width: 10),
        Expanded(child: _TrustItem(icon: Icons.route_rounded, label: 'TKGM', value: 'Gateway')),
      ]);
}

class _TrustItem extends StatelessWidget {
  const _TrustItem({required this.icon, required this.label, required this.value});
  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => GlassCard(
        padding: const EdgeInsets.all(12),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Icon(icon, color: AppColors.civicRed, size: 20),
          const SizedBox(height: 8),
          Text(label, style: Theme.of(context).textTheme.labelSmall?.copyWith(color: AppColors.slate, fontWeight: FontWeight.w800)),
          Text(value, style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w900)),
        ]),
      );
}

class _PrivacyLinks extends StatelessWidget {
  const _PrivacyLinks();

  @override
  Widget build(BuildContext context) => GlassCard(
        padding: const EdgeInsets.all(14),
        child: Column(children: const [
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: Icon(Icons.privacy_tip_rounded, color: AppColors.civicRed),
            title: Text('KVKK ve gizlilik'),
            subtitle: Text('Aydınlatma, açık rıza ve veri saklama durumları'),
            trailing: Icon(Icons.chevron_right_rounded),
          ),
          Divider(height: 1),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: Icon(Icons.security_rounded, color: AppColors.civicRed),
            title: Text('Güvenlik durumu'),
            subtitle: Text('Kimlik, cihaz ve sağlayıcı erişim kontrolleri'),
            trailing: Icon(Icons.chevron_right_rounded),
          ),
        ]),
      );
}
