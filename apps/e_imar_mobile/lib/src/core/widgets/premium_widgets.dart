import 'dart:ui';

import 'package:flutter/material.dart';

import '../performance/motion.dart';
import '../theme/tokens.dart';

enum GlassVariant { subtle, elevated, dark, light }

enum BadgeTone { neutral, success, warning, danger, info }

class GlassCard extends StatelessWidget {
  const GlassCard({required this.child, this.padding = const EdgeInsets.all(AppSpacing.md), this.onTap, this.variant = GlassVariant.subtle, this.borderRadius = AppRadius.lg, this.clipChild = false, super.key});
  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;
  final GlassVariant variant;
  final double borderRadius;
  final bool clipChild;

  @override
  Widget build(BuildContext context) {
    final radius = BorderRadius.circular(borderRadius);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final color = switch (variant) {
      GlassVariant.dark => AppColors.glassDark,
      GlassVariant.light => AppColors.glassLight,
      GlassVariant.elevated => (isDark ? Colors.white : AppColors.deepGreen).withValues(alpha: isDark ? .12 : .08),
      GlassVariant.subtle => (isDark ? Colors.white : AppColors.deepGreen).withValues(alpha: isDark ? .075 : .055),
    };
    final borderColor = isDark ? Colors.white.withValues(alpha: .13) : Colors.white.withValues(alpha: .72);
    final content = Material(
      color: color,
      shape: RoundedRectangleBorder(borderRadius: radius, side: BorderSide(color: borderColor)),
      child: InkWell(onTap: onTap, borderRadius: radius, child: Padding(padding: padding, child: clipChild ? ClipRRect(borderRadius: radius, child: child) : child)),
    );
    return DecoratedBox(
      decoration: BoxDecoration(borderRadius: radius, boxShadow: variant == GlassVariant.elevated ? AppShadows.medium(Colors.black) : null),
      child: ClipRRect(borderRadius: radius, child: BackdropFilter(filter: ImageFilter.blur(sigmaX: variant == GlassVariant.elevated ? 22 : 16, sigmaY: variant == GlassVariant.elevated ? 22 : 16), child: content)),
    );
  }
}

class PremiumHeader extends StatelessWidget {
  const PremiumHeader({required this.title, required this.subtitle, this.icon, this.badge, super.key});
  final String title;
  final String subtitle;
  final IconData? icon;
  final String? badge;

  @override
  Widget build(BuildContext context) => GlassCard(
        variant: GlassVariant.elevated,
        padding: const EdgeInsets.all(20),
        child: Row(children: [
          if (icon != null) Container(width: 52, height: 52, decoration: BoxDecoration(gradient: AppGradients.premium, borderRadius: BorderRadius.circular(18), boxShadow: AppShadows.glow(AppColors.emerald)), child: Icon(icon, color: Colors.white, size: 27)),
          if (icon != null) const SizedBox(width: 14),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [if (badge != null) StatusBadge(label: badge!, tone: BadgeTone.info), if (badge != null) const SizedBox(height: 8), Text(title, style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w900, height: 1.02)), const SizedBox(height: 6), Text(subtitle, style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.slate, height: 1.35))])),
        ]),
      );
}

class StatusBadge extends StatelessWidget {
  const StatusBadge({required this.label, this.tone = BadgeTone.neutral, this.icon, super.key});
  final String label;
  final BadgeTone tone;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final color = _toneColor(tone);
    return DecoratedBox(
      decoration: BoxDecoration(color: color.withValues(alpha: .13), borderRadius: BorderRadius.circular(AppRadius.pill), border: Border.all(color: color.withValues(alpha: .28))),
      child: Padding(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6), child: Row(mainAxisSize: MainAxisSize.min, children: [if (icon != null) ...[Icon(icon, size: 14, color: color), const SizedBox(width: 5)], Text(label, style: Theme.of(context).textTheme.labelSmall?.copyWith(color: color, fontWeight: FontWeight.w800, letterSpacing: .15))])),
    );
  }
}

class RiskChip extends StatelessWidget {
  const RiskChip({required this.label, required this.level, super.key});
  final String label;
  final int level;

  @override
  Widget build(BuildContext context) => StatusBadge(label: '$label • %$level', tone: level >= 70 ? BadgeTone.danger : level >= 38 ? BadgeTone.warning : BadgeTone.success, icon: Icons.shield_rounded);
}

class InsightCard extends StatelessWidget {
  const InsightCard({required this.title, required this.message, required this.icon, this.color = AppColors.emerald, super.key});
  final String title;
  final String message;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) => GlassCard(
        padding: const EdgeInsets.all(14),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(width: 38, height: 38, decoration: BoxDecoration(color: color.withValues(alpha: .14), borderRadius: BorderRadius.circular(14)), child: Icon(icon, color: color, size: 21)),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(title, style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w900)), const SizedBox(height: 4), Text(message, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.slate, height: 1.35))])),
        ]),
      );
}

class ValueScoreCard extends StatelessWidget {
  const ValueScoreCard({required this.score, required this.title, required this.subtitle, this.trailing, super.key});
  final int score;
  final String title;
  final String subtitle;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) => DecoratedBox(
        decoration: BoxDecoration(gradient: AppGradients.score, borderRadius: BorderRadius.circular(AppRadius.xl), boxShadow: AppShadows.glow(AppColors.emerald)),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Row(children: [
            Container(width: 76, height: 76, decoration: BoxDecoration(color: Colors.black.withValues(alpha: .18), shape: BoxShape.circle, border: Border.all(color: Colors.white.withValues(alpha: .35))), child: Center(child: Text('$score', style: Theme.of(context).textTheme.headlineMedium?.copyWith(color: Colors.white, fontWeight: FontWeight.w900)))),
            const SizedBox(width: 16),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(title, style: Theme.of(context).textTheme.titleLarge?.copyWith(color: Colors.white, fontWeight: FontWeight.w900)), const SizedBox(height: 5), Text(subtitle, style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.white.withValues(alpha: .78), height: 1.35))])),
            if (trailing != null) trailing!,
          ]),
        ),
      );
}

class GradientButton extends StatelessWidget {
  const GradientButton({required this.label, required this.onPressed, this.icon, super.key});
  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final enabled = onPressed != null;
    return DecoratedBox(
      decoration: BoxDecoration(gradient: enabled ? AppGradients.premium : null, color: enabled ? null : AppColors.slate.withValues(alpha: .18), borderRadius: BorderRadius.circular(AppRadius.pill), boxShadow: enabled ? AppShadows.glow(AppColors.emerald) : null),
      child: FilledButton.icon(
        style: FilledButton.styleFrom(backgroundColor: Colors.transparent, disabledBackgroundColor: Colors.transparent, shadowColor: Colors.transparent, padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 15)),
        onPressed: onPressed,
        icon: Icon(icon ?? Icons.arrow_forward_rounded),
        label: Text(label, style: const TextStyle(fontWeight: FontWeight.w800)),
      ),
    );
  }
}

class FloatingActionPill extends StatelessWidget {
  const FloatingActionPill({required this.label, required this.icon, required this.onTap, this.subtitle, super.key});
  final String label;
  final IconData icon;
  final VoidCallback onTap;
  final String? subtitle;
  @override
  Widget build(BuildContext context) => GlassCard(onTap: onTap, padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 10), child: Row(mainAxisSize: MainAxisSize.min, children: [Icon(icon, size: 18, color: AppColors.emerald), const SizedBox(width: 8), Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(label, style: Theme.of(context).textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w800)), if (subtitle != null) Text(subtitle!, style: Theme.of(context).textTheme.labelSmall?.copyWith(color: AppColors.slate))]) ]));
}

class IconActionChip extends StatelessWidget {
  const IconActionChip({required this.label, required this.icon, this.onTap, super.key});
  final String label;
  final IconData icon;
  final VoidCallback? onTap;
  @override
  Widget build(BuildContext context) => ActionChip(avatar: Icon(icon, size: 18, color: AppColors.emerald), label: Text(label), onPressed: onTap, side: BorderSide(color: (Theme.of(context).brightness == Brightness.dark ? AppColors.outlineDark : AppColors.outlineLight).withValues(alpha: .8)), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.pill)));
}

class PremiumBottomSheetShell extends StatelessWidget {
  const PremiumBottomSheetShell({required this.child, super.key});
  final Widget child;
  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return AnimatedPadding(duration: MotionDurations.fast, curve: MotionCurves.standard, padding: MediaQuery.viewInsetsOf(context), child: DecoratedBox(decoration: BoxDecoration(color: isDark ? AppColors.surfaceDark : AppColors.porcelain, borderRadius: const BorderRadius.vertical(top: Radius.circular(AppRadius.xl)), boxShadow: AppShadows.elevated(Colors.black)), child: SafeArea(top: false, child: child)));
  }
}

class MetricCard extends StatelessWidget {
  const MetricCard({required this.title, required this.value, this.subtitle, this.icon, super.key});
  final String title;
  final String value;
  final String? subtitle;
  final IconData? icon;
  @override
  Widget build(BuildContext context) => Card(child: Padding(padding: const EdgeInsets.all(AppSpacing.md), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [if (icon != null) Container(width: 34, height: 34, decoration: BoxDecoration(color: AppColors.emerald.withValues(alpha: .12), borderRadius: BorderRadius.circular(12)), child: Icon(icon, color: AppColors.emerald, size: 20)), if (icon != null) const SizedBox(height: 9), Text(title, style: Theme.of(context).textTheme.labelMedium?.copyWith(color: AppColors.slate, fontWeight: FontWeight.w700)), const SizedBox(height: 5), Text(value, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900)), if (subtitle != null) Padding(padding: const EdgeInsets.only(top: 3), child: Text(subtitle!, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.slate)))])));
}

class MetricTile extends StatelessWidget {
  const MetricTile({required this.label, required this.value, required this.icon, super.key});
  final String label;
  final String value;
  final IconData icon;
  @override
  Widget build(BuildContext context) => GlassCard(padding: const EdgeInsets.all(12), child: Row(children: [Icon(icon, color: AppColors.emerald, size: 20), const SizedBox(width: 10), Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(label, style: Theme.of(context).textTheme.labelSmall?.copyWith(color: AppColors.slate, fontWeight: FontWeight.w700)), Text(value, style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w900))]))]));
}

class AppSegmentedControl<T> extends StatelessWidget {
  const AppSegmentedControl({required this.values, required this.selected, required this.labelBuilder, required this.onChanged, super.key});
  final List<T> values;
  final T selected;
  final String Function(T value) labelBuilder;
  final ValueChanged<T> onChanged;
  @override
  Widget build(BuildContext context) => GlassCard(
        padding: const EdgeInsets.all(4),
        borderRadius: AppRadius.pill,
        child: Row(children: [
          for (final value in values)
            Expanded(
              child: InkWell(
                borderRadius: BorderRadius.circular(AppRadius.pill),
                onTap: () => onChanged(value),
                child: DecoratedBox(
                  decoration: BoxDecoration(gradient: value == selected ? AppGradients.premium : null, borderRadius: BorderRadius.circular(AppRadius.pill)),
                  child: Padding(padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10), child: Text(labelBuilder(value), textAlign: TextAlign.center, style: Theme.of(context).textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w900, color: value == selected ? Colors.white : null))),
                ),
              ),
            ),
        ]),
      );
}

class AppStateView extends StatelessWidget {
  const AppStateView({required this.title, required this.message, required this.icon, this.action, super.key});
  final String title;
  final String message;
  final IconData icon;
  final Widget? action;
  @override
  Widget build(BuildContext context) => Center(child: Padding(padding: const EdgeInsets.all(AppSpacing.xl), child: Column(mainAxisSize: MainAxisSize.min, children: [Container(width: 60, height: 60, decoration: BoxDecoration(color: AppColors.emerald.withValues(alpha: .13), borderRadius: BorderRadius.circular(22)), child: Icon(icon, size: 32, color: AppColors.emerald)), const SizedBox(height: 14), Text(title, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900), textAlign: TextAlign.center), const SizedBox(height: 8), Text(message, textAlign: TextAlign.center, style: TextStyle(color: AppColors.slate)), if (action != null) ...[const SizedBox(height: 16), action!]])));
}

Color _toneColor(BadgeTone tone) => switch (tone) {
      BadgeTone.success => AppColors.success,
      BadgeTone.warning => AppColors.warning,
      BadgeTone.danger => AppColors.danger,
      BadgeTone.info => AppColors.info,
      BadgeTone.neutral => AppColors.slate,
    };
