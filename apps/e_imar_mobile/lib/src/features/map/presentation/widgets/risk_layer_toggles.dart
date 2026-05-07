import 'package:flutter/material.dart';

import '../../../../core/theme/tokens.dart';
import '../../../../core/widgets/widgets.dart';
import '../../domain/parcel.dart';

class RiskLayerToggles extends StatefulWidget {
  const RiskLayerToggles({super.key, this.onTogglesChanged, this.initialToggles});
  final ValueChanged<List<RiskLayerToggle>>? onTogglesChanged;
  final List<RiskLayerToggle>? initialToggles;

  @override
  State<RiskLayerToggles> createState() => _RiskLayerTogglesState();
}

class _RiskLayerTogglesState extends State<RiskLayerToggles> {
  late List<RiskLayerToggle> _toggles;

  @override
  void initState() {
    super.initState();
    _toggles = List<RiskLayerToggle>.from(widget.initialToggles ?? RiskLayerToggle.defaults);
  }

  void _toggle(String id) {
    setState(() {
      _toggles = _toggles.map((t) => t.id == id ? t.copyWith(isActive: !t.isActive) : t).toList();
    });
    widget.onTogglesChanged?.call(_toggles);
  }

  @override
  Widget build(BuildContext context) => RepaintBoundary(
        child: GlassCard(
          padding: const EdgeInsets.all(14),
          variant: GlassVariant.elevated,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Container(
                  width: 10,
                  height: 10,
                  decoration: BoxDecoration(
                    gradient: AppGradients.premium,
                    shape: BoxShape.circle,
                    boxShadow: AppShadows.glow(AppColors.emerald),
                  ),
                ),
                const SizedBox(width: 8),
                Text('Risk Katmanları', style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w900)),
                const Spacer(),
                Text(
                  '${_toggles.where((t) => t.isActive).length}/${_toggles.length}',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(color: AppColors.emerald, fontWeight: FontWeight.w800),
                ),
              ]),
              const SizedBox(height: 12),
              Wrap(spacing: 8, runSpacing: 8, children: [
                for (final toggle in _toggles) _LayerChip(toggle: toggle, onToggle: _toggle),
              ]),
              const SizedBox(height: 10),
              Row(children: [
                Icon(Icons.info_outline_rounded, size: 14, color: AppColors.slate.withOpacity(.5)),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    'Veriler Phase 2B GIS meta verisinden alınmıştır. Entegrasyon mock durumundadır.',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(color: AppColors.slate.withOpacity(.5), height: 1.3),
                  ),
                ),
              ]),
            ],
          ),
        ),
      );
}

class _LayerChip extends StatelessWidget {
  const _LayerChip({required this.toggle, required this.onToggle});
  final RiskLayerToggle toggle;
  final void Function(String id) onToggle;

  @override
  Widget build(BuildContext context) {
    final active = toggle.isActive;
    return GestureDetector(
      onTap: () => onToggle(toggle.id),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: active ? AppColors.emerald.withOpacity(.13) : (Theme.of(context).brightness == Brightness.dark ? Colors.white.withOpacity(.06) : AppColors.deepGreen.withOpacity(.04)),
          borderRadius: BorderRadius.circular(AppRadius.pill),
          border: Border.all(color: active ? AppColors.emerald.withOpacity(.35) : AppColors.outlineDark.withOpacity(.25)),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(toggle.icon, size: 16, color: active ? AppColors.emerald : AppColors.slate.withOpacity(.45)),
          const SizedBox(width: 6),
          Text(toggle.label, style: Theme.of(context).textTheme.labelMedium?.copyWith(fontWeight: active ? FontWeight.w800 : FontWeight.w500, color: active ? AppColors.emerald : AppColors.slate)),
          if (active) const SizedBox(width: 5),
          if (active)
            Container(
              width: 7,
              height: 7,
              decoration: BoxDecoration(color: AppColors.emerald, shape: BoxShape.circle, boxShadow: AppShadows.glow(AppColors.emerald)),
            ),
        ]),
      ),
    );
  }
}
