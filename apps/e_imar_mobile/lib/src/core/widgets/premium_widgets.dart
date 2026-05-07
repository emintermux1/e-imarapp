import 'dart:ui';

import 'package:flutter/material.dart';

import '../performance/motion.dart';
import '../theme/tokens.dart';

class GlassCard extends StatelessWidget {
  const GlassCard({required this.child, this.padding = const EdgeInsets.all(AppSpacing.md), this.onTap, super.key});
  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final borderRadius = BorderRadius.circular(AppRadius.lg);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return ClipRRect(
      borderRadius: borderRadius,
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
        child: Material(
          color: (isDark ? Colors.white : AppColors.deepGreen).withOpacity(isDark ? .08 : .06),
          shape: RoundedRectangleBorder(borderRadius: borderRadius, side: BorderSide(color: Colors.white.withOpacity(.14))),
          child: InkWell(onTap: onTap, borderRadius: borderRadius, child: Padding(padding: padding, child: child)),
        ),
      ),
    );
  }
}

class GradientButton extends StatelessWidget {
  const GradientButton({required this.label, required this.onPressed, this.icon, super.key});
  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(gradient: AppGradients.premium, borderRadius: BorderRadius.circular(AppRadius.pill), boxShadow: AppShadows.glow(AppColors.emerald)),
      child: FilledButton.icon(
        style: FilledButton.styleFrom(backgroundColor: Colors.transparent, disabledBackgroundColor: Colors.transparent, shadowColor: Colors.transparent, padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 15)),
        onPressed: onPressed,
        icon: Icon(icon ?? Icons.arrow_forward_rounded),
        label: Text(label),
      ),
    );
  }
}

class FloatingActionPill extends StatelessWidget {
  const FloatingActionPill({required this.label, required this.icon, required this.onTap, super.key});
  final String label;
  final IconData icon;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => GlassCard(onTap: onTap, padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10), child: Row(mainAxisSize: MainAxisSize.min, children: [Icon(icon, size: 18), const SizedBox(width: 8), Text(label, style: Theme.of(context).textTheme.labelLarge)]));
}

class IconActionChip extends StatelessWidget {
  const IconActionChip({required this.label, required this.icon, this.onTap, super.key});
  final String label;
  final IconData icon;
  final VoidCallback? onTap;
  @override
  Widget build(BuildContext context) => ActionChip(avatar: Icon(icon, size: 18), label: Text(label), onPressed: onTap, side: BorderSide.none, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.pill)));
}

class PremiumBottomSheetShell extends StatelessWidget {
  const PremiumBottomSheetShell({required this.child, super.key});
  final Widget child;
  @override
  Widget build(BuildContext context) => AnimatedPadding(duration: MotionDurations.fast, curve: MotionCurves.standard, padding: MediaQuery.viewInsetsOf(context), child: DecoratedBox(decoration: BoxDecoration(color: Theme.of(context).colorScheme.surface, borderRadius: const BorderRadius.vertical(top: Radius.circular(AppRadius.xl)), boxShadow: AppShadows.soft(Colors.black)), child: SafeArea(top: false, child: child)));
}

class MetricCard extends StatelessWidget {
  const MetricCard({required this.title, required this.value, this.subtitle, this.icon, super.key});
  final String title;
  final String value;
  final String? subtitle;
  final IconData? icon;
  @override
  Widget build(BuildContext context) => Card(child: Padding(padding: const EdgeInsets.all(AppSpacing.md), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [if (icon != null) Icon(icon, color: AppColors.emerald), Text(title, style: Theme.of(context).textTheme.labelMedium?.copyWith(color: AppColors.slate)), const SizedBox(height: 6), Text(value, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)), if (subtitle != null) Text(subtitle!, style: Theme.of(context).textTheme.bodySmall)])));
}

class AppSegmentedControl<T> extends StatelessWidget {
  const AppSegmentedControl({required this.values, required this.selected, required this.labelBuilder, required this.onChanged, super.key});
  final List<T> values;
  final T selected;
  final String Function(T value) labelBuilder;
  final ValueChanged<T> onChanged;
  @override
  Widget build(BuildContext context) => SegmentedButton<T>(segments: [for (final value in values) ButtonSegment(value: value, label: Text(labelBuilder(value)))], selected: {selected}, onSelectionChanged: (set) => onChanged(set.first), showSelectedIcon: false);
}

class AppStateView extends StatelessWidget {
  const AppStateView({required this.title, required this.message, required this.icon, this.action, super.key});
  final String title;
  final String message;
  final IconData icon;
  final Widget? action;
  @override
  Widget build(BuildContext context) => Center(child: Padding(padding: const EdgeInsets.all(AppSpacing.xl), child: Column(mainAxisSize: MainAxisSize.min, children: [Icon(icon, size: 48, color: AppColors.emerald), const SizedBox(height: 12), Text(title, style: Theme.of(context).textTheme.titleLarge, textAlign: TextAlign.center), const SizedBox(height: 8), Text(message, textAlign: TextAlign.center), if (action != null) ...[const SizedBox(height: 16), action!]])));
}
