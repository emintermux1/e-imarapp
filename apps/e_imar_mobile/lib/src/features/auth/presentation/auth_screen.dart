import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router/app_router.dart';
import '../../../core/theme/tokens.dart';
import '../../../core/widgets/widgets.dart';

class AuthScreen extends ConsumerStatefulWidget {
  const AuthScreen({super.key});

  @override
  ConsumerState<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends ConsumerState<AuthScreen> {
  static const previewOtp = '246810';
  bool loading = false;
  final phone = TextEditingController(text: '+90 555 000 34 34');
  final otp = TextEditingController();
  bool otpSent = false;
  String? helper;

  @override
  void dispose() {
    phone.dispose();
    otp.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.porcelain,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.lg),
          children: [
            const SizedBox(height: 10),
            const _CivicHeader(),
            const SizedBox(height: 20),
            GlassCard(
              variant: GlassVariant.light,
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Önizleme girişi',
                    style: Theme.of(context)
                        .textTheme
                        .headlineSmall
                        ?.copyWith(fontWeight: FontWeight.w900),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Bu web önizlemede gerçek kimlik doğrulaması kapalıdır. Çalışan demo yolu ile parsel sorgusunu deneyebilirsiniz.',
                    style: Theme.of(context)
                        .textTheme
                        .bodyMedium
                        ?.copyWith(color: AppColors.slate, height: 1.35),
                  ),
                  const SizedBox(height: 16),
                  GradientButton(
                    label: 'Önizleme ile devam et',
                    icon: Icons.login_rounded,
                    onPressed: loading ? null : _continuePreview,
                  ),
                  const SizedBox(height: 16),
                  const _UnavailableAuthButton(
                    icon: Icons.g_mobiledata_rounded,
                    label: 'Google ile giriş',
                  ),
                  const SizedBox(height: 8),
                  const _UnavailableAuthButton(
                    icon: Icons.apple_rounded,
                    label: 'Apple ile giriş',
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'Google ve Apple web önizlemede bağlı değil; bu yüzden devre dışı gösterilir.',
                    style: Theme.of(context)
                        .textTheme
                        .bodySmall
                        ?.copyWith(color: AppColors.slate),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            GlassCard(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.sms_rounded, color: AppColors.emerald),
                      const SizedBox(width: 8),
                      Text(
                        'Telefon OTP önizlemesi',
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(fontWeight: FontWeight.w900),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: phone,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(
                      labelText: 'Telefon',
                      hintText: '+90 5xx xxx xx xx',
                      prefixIcon: Icon(Icons.phone_rounded),
                    ),
                  ),
                  if (otpSent) ...[
                    const SizedBox(height: 10),
                    TextField(
                      controller: otp,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Doğrulama kodu',
                        hintText: previewOtp,
                        helperText: 'Önizleme kodu: $previewOtp',
                        prefixIcon: Icon(Icons.password_rounded),
                      ),
                    ),
                  ],
                  if (helper != null) ...[
                    const SizedBox(height: 10),
                    Text(
                      helper!,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: helper!.contains('hatalı')
                                ? AppColors.danger
                                : AppColors.slate,
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                  ],
                  const SizedBox(height: 12),
                  OutlinedButton.icon(
                    onPressed: loading ? null : _phonePreviewAction,
                    icon: Icon(otpSent
                        ? Icons.verified_user_rounded
                        : Icons.send_rounded),
                    label: Text(otpSent
                        ? 'Telefonla devam et'
                        : 'Önizleme kodu gönder'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            const InsightCard(
              title: 'Önizleme kapsamı',
              message:
                  'Veriler örnektir. Parsel seçimi, imar özeti, analiz ve rapor akışı çalışır; resmi başvuru entegrasyonu bu sürümde yoktur.',
              icon: Icons.info_outline_rounded,
              color: AppColors.info,
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _continuePreview() async {
    setState(() => loading = true);
    await Future<void>.delayed(const Duration(milliseconds: 180));
    if (!mounted) return;
    context.go(HomeRoute.path);
  }

  void _phonePreviewAction() {
    if (!otpSent) {
      setState(() {
        otpSent = true;
        otp.text = previewOtp;
        helper = 'Kod gönderildi gibi gösterildi. Önizleme kodu: $previewOtp';
      });
      return;
    }
    if (otp.text.trim() != previewOtp) {
      setState(
          () => helper = 'Doğrulama kodu hatalı. Önizleme kodu: $previewOtp');
      return;
    }
    context.go(HomeRoute.path);
  }
}

class _CivicHeader extends StatelessWidget {
  const _CivicHeader();

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 58,
            height: 58,
            decoration: BoxDecoration(
              color: AppColors.deepGreen,
              borderRadius: BorderRadius.circular(18),
            ),
            child: const Icon(Icons.account_balance_rounded,
                color: Colors.white, size: 30),
          ),
          const SizedBox(height: 16),
          Text(
            'E-İmar Önizleme',
            style: Theme.of(context)
                .textTheme
                .displaySmall
                ?.copyWith(fontWeight: FontWeight.w900, height: 1.0),
          ),
          const SizedBox(height: 6),
          Text(
            'Ada/parsel sorgu, imar durumu ve rapor akışı',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: AppColors.slate,
                  fontWeight: FontWeight.w700,
                ),
          ),
        ],
      );
}

class _UnavailableAuthButton extends StatelessWidget {
  const _UnavailableAuthButton({required this.icon, required this.label});
  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) => OutlinedButton.icon(
        onPressed: null,
        icon: Icon(icon),
        label: Text('$label — önizlemede kapalı'),
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 15),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.pill),
          ),
        ),
      );
}
