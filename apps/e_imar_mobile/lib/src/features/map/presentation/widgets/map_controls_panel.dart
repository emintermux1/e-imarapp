import 'package:flutter/material.dart';

import '../../domain/parcel.dart';
import 'historical_timeline_slider.dart';
import 'mock_3d_parcel_preview.dart';
import 'risk_layer_toggles.dart';

enum MapControlMode { timeline, riskLayers, threeD }

class MapControlsPanel extends StatefulWidget {
  const MapControlsPanel(
      {required this.parcel,
      super.key,
      this.activeMode,
      this.onModeChanged,
      this.onYearChanged,
      this.onRiskToggled});
  final ParcelDetail parcel;
  final MapControlMode? activeMode;
  final ValueChanged<MapControlMode>? onModeChanged;
  final ValueChanged<int>? onYearChanged;
  final ValueChanged<Map<String, bool>>? onRiskToggled;

  @override
  State<MapControlsPanel> createState() => _MapControlsPanelState();
}

class _MapControlsPanelState extends State<MapControlsPanel> {
  MapControlMode _mode = MapControlMode.timeline;

  @override
  void initState() {
    super.initState();
    if (widget.activeMode != null) _mode = widget.activeMode!;
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 220),
      switchInCurve: Curves.easeOutCubic,
      switchOutCurve: Curves.easeInCubic,
      child: _buildBody(),
    );
  }

  Widget _buildBody() {
    switch (_mode) {
      case MapControlMode.timeline:
        return HistoricalTimelineSlider(
            key: const ValueKey('timeline'),
            onYearChanged: widget.onYearChanged);
      case MapControlMode.riskLayers:
        return RiskLayerToggles(
            key: const ValueKey('risk'), onToggled: widget.onRiskToggled);
      case MapControlMode.threeD:
        return Mock3dParcelPreview(
            key: const ValueKey('3d'), parcel: widget.parcel);
    }
  }

  void setMode(MapControlMode mode) {
    setState(() => _mode = mode);
    widget.onModeChanged?.call(mode);
  }

  MapControlMode get mode => _mode;
}
