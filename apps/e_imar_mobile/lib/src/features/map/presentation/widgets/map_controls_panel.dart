import 'package:flutter/material.dart';

import '../../../../core/theme/tokens.dart';
import '../../../../core/widgets/widgets.dart';
import 'historical_timeline_slider.dart';
import 'risk_layer_toggles.dart';

class MapControlsPanel extends StatefulWidget {
  const MapControlsPanel({super.key, this.onLayerChanged, this.onTimelineOpened, this.onRiskPanelOpened});
  final ValueChanged<String>? onLayerChanged;
  final VoidCallback? onTimelineOpened;
  final VoidCallback? onRiskPanelOpened;

  @override
  State<MapControlsPanel> createState() => _MapControlsPanelState();
}

class _MapControlsPanelState extends State<MapControlsPanel> {
  String _activeLayer = 'satellite';

  static const _layers = [
    ('satellite', Icons.satellite_alt_rounded, 'Uydu'),
    ('terrain', Icons.terrain_rounded, 'Arazi'),
  ];

  @override
  Widget build(BuildContext context) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          GlassCard(
            padding: const EdgeInsets.all(6),
            borderRadius: AppRadius.md,
            child: Column(children: [
              for (final (id, icon, label) in _layers)
                _LayerItem(icon: icon, label: label, selected: _activeLayer == id, onTap: () {
                  setState(() => _activeLayer = id);
                  widget.onLayerChanged?.call(id);
                }),
            ]),
          ),
          const SizedBox(height: 8),
          _IconTile(icon: Icons.history_rounded, label: 'Zaman', onTap: widget.onTimelineOpened),
          const SizedBox(height: 8),
          _IconTile(icon: Icons.shield_rounded, label: 'Risk', onTap: widget.onRiskPanelOpened),
        ],
      );
}

class _LayerItem extends StatelessWidget {
  const _LayerItem({required this.icon, required this.label, required this.selected, required this.onTap});
  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Container(
          width: 58,
          padding: const EdgeInsets.symmetric(vertical: 9),
          decoration: BoxDecoration(
            color: selected ? AppColors.emerald.withOpacity(.18) : Colors.transparent,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(children: [
            Icon(icon, size: 20, color: selected ? AppColors.emerald : null),
            const SizedBox(height: 3),
            Text(label, style: Theme.of(context).textTheme.labelSmall?.copyWith(fontWeight: FontWeight.w800)),
          ]),
        ),
      );
}

class _IconTile extends StatelessWidget {
  const _IconTile({required this.icon, required this.label, required this.onTap});
  final IconData icon;
  final String label;
  final VoidCallback? onTap;
  @override
  Widget build(BuildContext context) => GlassCard(
        onTap: onTap,
        padding: const EdgeInsets.all(8),
        borderRadius: AppRadius.md,
        child: SizedBox(
          width: 42,
          height: 42,
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            Icon(icon, size: 20),
            const SizedBox(height: 2),
            Text(label, style: Theme.of(context).textTheme.labelSmall?.copyWith(fontWeight: FontWeight.w700, fontSize: 8)),
          ]),
        ),
      );
}

class FloatingTimelineSheet extends StatelessWidget {
  const FloatingTimelineSheet({super.key, this.onDissmiss, this.onYearChanged});
  final VoidCallback? onDissmiss;
  final ValueChanged<HistoricalTimelineState>? onYearChanged;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14),
        child: HistoricalTimelineSlider(onYearChanged: onYearChanged),
      );
}

class FloatingRiskSheet extends StatelessWidget {
  const FloatingRiskSheet({super.key, this.onDismiss, this.onTogglesChanged});
  final VoidCallback? onDismiss;
  final ValueChanged<List<RiskLayerToggle>>? onTogglesChanged;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14),
        child: RiskLayerToggles(onTogglesChanged: onTogglesChanged),
      );
}
