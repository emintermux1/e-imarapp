import 'package:flutter/material.dart';

import '../../../../core/theme/tokens.dart';
import '../../../../core/widgets/widgets.dart';

class _ToggleEntry {
  const _ToggleEntry(this.riskId, this.label, this.icon);
  final String riskId;
  final String label;
  final IconData icon;
}

const _toggleEntries = <_ToggleEntry>[
  _ToggleEntry('deprem', 'Deprem', Icons.waves_rounded),
  _ToggleEntry('fayHatti', 'Fay Hattı', Icons.linear_scale_rounded),
  _ToggleEntry('heyelan', 'Heyelan', Icons.landslide_rounded),
  _ToggleEntry('sel', 'Sel / Taşkın', Icons.water_damage_rounded),
  _ToggleEntry('zeminTipi', 'Zemin Tipi', Icons.terrain_rounded),
  _ToggleEntry('tarimAlani', 'Tarım Alanı', Icons.agriculture_rounded),
  _ToggleEntry('sitAlani', 'Sit Alanı', Icons.fort_rounded),
];

class RiskLayerToggles extends StatefulWidget {
  const RiskLayerToggles({super.key, this.onToggled});
  final ValueChanged<Map<String, bool>>? onToggled;

  @override
  State<RiskLayerToggles> createState() => _RiskLayerTogglesState();
}

class _RiskLayerTogglesState extends State<RiskLayerToggles> {
  final _toggles = <String, bool>{for (final e in _toggleEntries) e.riskId: e.riskId == 'deprem' || e.riskId == 'fayHatti' || e.riskId == 'zeminTipi'};

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: const EdgeInsets.fromLTRB(16, 16, 8, 16),
      variant: GlassVariant.elevated,
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(width: 36, height: 36, decoration: BoxDecoration(gradient: AppGradients.premium, borderRadius: BorderRadius.circular(12), boxShadow: AppShadows.glow(AppColors.emerald)), child: const Icon(Icons.shield_rounded, color: Colors.white, size: 20)),
          const SizedBox(width: 10),
          Text('Risk Katmanları', style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w900)),
          const Spacer(),
          Text('${_activeCount}/${_toggleEntries.length}', style: Theme.of(context).textTheme.labelSmall?.copyWith(color: AppColors.slate, fontWeight: FontWeight.w800)),
        ]),
        const SizedBox(height: 14),
        ..._toggleEntries.map((e) => Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: _ToggleRow(
                icon: e.icon,
                label: e.label,
                value: _toggles[e.riskId] ?? false,
                onChanged: (v) {
                  setState(() => _toggles[e.riskId] = v);
                  widget.onToggled?.call(Map.of(_toggles));
                },
              ),
            )),
      ]),
    );
  }

  int get _activeCount => _toggles.values.where((v) => v).length;
}

class _ToggleRow extends StatelessWidget {
  const _ToggleRow({required this.icon, required this.label, required this.value, required this.onChanged});
  final IconData icon;
  final String label;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      variant: GlassVariant.subtle,
      child: Row(children: [
        Icon(icon, size: 18, color: value ? AppColors.emerald : AppColors.slate.withOpacity(.5)),
        const SizedBox(width: 10),
        Expanded(child: Text(label, style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w700, color: value ? null : AppColors.slate.withOpacity(.6)))),
        SizedBox(
          width: 44,
          height: 28,
          child: Switch(
            value: value,
            onChanged: onChanged,
            activeColor: AppColors.emerald,
            activeTrackColor: AppColors.emerald.withOpacity(.3),
            materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
          ),
        ),
      ]),
    );
  }
}
