import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/services/gis_connector.dart';
import '../../core/services/gis_layers.dart';
import '../../core/widgets/empty_state_card.dart';
import '../../core/widgets/premium_card.dart';
import '../../core/widgets/section_header.dart';
import '../../core/widgets/status_pill.dart';
import 'domain/parcel.dart';

class MapWorkspaceScreen extends ConsumerWidget {
  const MapWorkspaceScreen({super.key, required this.onOpenParcel});

  final void Function(ParcelDetail parcel) onOpenParcel;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final scheme = Theme.of(context).colorScheme;
    final layers = ref.watch(gisOfficialLayersProvider);
    final sampleParcel = ParcelDetail.sampleMetadataOnly();

    return Scaffold(
      extendBody: true,
      body: Stack(
        children: [
          const Positioned.fill(child: _SatelliteCanvas()),
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withValues(alpha: 0.18),
                    Colors.transparent,
                    Colors.black.withValues(alpha: 0.18),
                  ],
                ),
              ),
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(18, 10, 18, 0),
              child: Column(
                children: [
                  _MapTopBar(onOpenParcel: () => onOpenParcel(sampleParcel)),
                  const SizedBox(height: 14),
                  const _InstructionCard(),
                  const Spacer(),
                  _ParcelPreviewSheet(
                    parcel: sampleParcel,
                    onOpenParcel: () => onOpenParcel(sampleParcel),
                  ),
                  const SizedBox(height: 88),
                ],
              ),
            ),
          ),
          const Positioned(
            right: 18,
            top: 238,
            child: Column(
              children: [
                _MapControl(icon: Icons.add_rounded),
                SizedBox(height: 10),
                _MapControl(icon: Icons.remove_rounded),
                SizedBox(height: 10),
                _MapControl(icon: Icons.my_location_rounded),
                SizedBox(height: 10),
                _MapControl(icon: Icons.layers_rounded),
              ],
            ),
          ),
          const Positioned(
            left: 18,
            top: 238,
            child: Column(
              children: [
                _MapControl(icon: Icons.navigation_rounded, accent: true),
                SizedBox(height: 10),
                _MapControl(icon: Icons.terrain_rounded),
                SizedBox(height: 10),
                _MapControl(icon: Icons.straighten_rounded),
              ],
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        heroTag: 'map-layers',
        onPressed: () => _showLayerSheet(context, layers),
        backgroundColor: scheme.primary,
        foregroundColor: scheme.onPrimary,
        icon: const Icon(Icons.layers_rounded),
        label: const Text('Katmanlar'),
      ),
    );
  }

  void _showLayerSheet(BuildContext context, List<GisLayerDescriptor> layers) {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(18, 0, 18, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SectionHeader(
                title: 'Harita modu ve katmanlar',
                subtitle:
                    'Uydu, sokak ve plan katmanları resmi kaynak durumu ile birlikte gösterilir.',
              ),
              const SizedBox(height: 16),
              const _BasemapStrip(),
              const SizedBox(height: 16),
              for (final layer in layers.take(4)) ...[
                _LayerCard(layer: layer),
                const SizedBox(height: 12),
              ],
              const EmptyStateCard(
                title: 'Canlı katman yoksa boş gösterim',
                body:
                    'Kaynak hazır değilse demo geometri resmi veri gibi sunulmaz; kullanıcıya neden gösterilir.',
                icon: Icons.visibility_off_rounded,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MapTopBar extends StatelessWidget {
  const _MapTopBar({required this.onOpenParcel});

  final VoidCallback onOpenParcel;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _RoundButton(icon: Icons.menu_rounded, onTap: onOpenParcel),
        const SizedBox(width: 12),
        Expanded(
          child: Container(
            height: 52,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.92),
              borderRadius: BorderRadius.circular(28),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.16),
                  blurRadius: 28,
                  offset: const Offset(0, 16),
                ),
              ],
            ),
            child: Row(
              children: [
                Icon(Icons.search_rounded,
                    color: Theme.of(context).colorScheme.primary),
                const SizedBox(width: 10),
                const Expanded(
                  child: Text(
                    'Ada, parsel, mahalle veya koordinat ara',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontWeight: FontWeight.w700),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: 12),
        _RoundButton(icon: Icons.link_rounded, onTap: onOpenParcel),
      ],
    );
  }
}

class _InstructionCard extends StatelessWidget {
  const _InstructionCard();

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.94),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: scheme.primary.withValues(alpha: 0.34)),
          boxShadow: [
            BoxShadow(
              color: scheme.primary.withValues(alpha: 0.18),
              blurRadius: 30,
              offset: const Offset(0, 18),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              height: 38,
              width: 38,
              decoration: BoxDecoration(
                color: scheme.primary.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.touch_app_rounded, color: scheme.primary),
            ),
            const SizedBox(width: 12),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Parsel sorgulamak için',
                    style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16),
                  ),
                  SizedBox(height: 6),
                  Text('Haritada bir noktaya dokunun'),
                  SizedBox(height: 4),
                  Text('Ya da üstten il / ada / parsel ile arayın'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ParcelPreviewSheet extends StatelessWidget {
  const _ParcelPreviewSheet({required this.parcel, required this.onOpenParcel});

  final ParcelDetail parcel;
  final VoidCallback onOpenParcel;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.fromLTRB(18, 10, 18, 18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(34),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.20),
            blurRadius: 42,
            offset: const Offset(0, 22),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              height: 5,
              width: 46,
              decoration: BoxDecoration(
                color: const Color(0xFFD1D8DE),
                borderRadius: BorderRadius.circular(99),
              ),
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Ada ${parcel.block} / Parsel ${parcel.parcel}',
                      style: Theme.of(context)
                          .textTheme
                          .titleLarge
                          ?.copyWith(fontWeight: FontWeight.w900),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${parcel.city} / ${parcel.district} / ${parcel.neighborhood}',
                      style: Theme.of(context)
                          .textTheme
                          .bodyMedium
                          ?.copyWith(color: scheme.onSurfaceVariant),
                    ),
                  ],
                ),
              ),
              StatusPill(
                label: parcel.trustLabel,
                color: parcel.official ? scheme.primary : scheme.tertiary,
              ),
            ],
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              _SheetAction(
                icon: Icons.bookmark_border_rounded,
                label: 'Favoriye Ekle',
                color: scheme.primary,
              ),
              _SheetAction(
                icon: Icons.share_rounded,
                label: 'Paylaş',
                color: scheme.outline,
              ),
              _SheetAction(
                icon: Icons.analytics_rounded,
                label: 'Analizi Gör',
                color: scheme.primary,
                onTap: onOpenParcel,
              ),
              _SheetAction(
                icon: Icons.picture_as_pdf_rounded,
                label: 'PDF',
                color: scheme.error,
              ),
              _SheetAction(
                icon: Icons.public_rounded,
                label: 'Google Earth',
                color: scheme.secondary,
              ),
              _SheetAction(
                icon: Icons.content_copy_rounded,
                label: 'Koordinat',
                color: scheme.outline,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _SheetAction extends StatelessWidget {
  const _SheetAction({
    required this.icon,
    required this.label,
    required this.color,
    this.onTap,
  });

  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: (MediaQuery.of(context).size.width - 58) / 2,
      child: OutlinedButton.icon(
        onPressed: onTap,
        icon: Icon(icon, color: color),
        label: Text(label),
        style: OutlinedButton.styleFrom(
          foregroundColor: color,
          side: BorderSide(color: color.withValues(alpha: 0.42)),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
        ),
      ),
    );
  }
}

class _BasemapStrip extends StatelessWidget {
  const _BasemapStrip();

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    const modes = ['Uydu', 'Hibrit', 'Sokak', 'Topo'];
    return SizedBox(
      height: 96,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemBuilder: (context, index) {
          final selected = index == 1;
          return Container(
            width: 92,
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: selected
                    ? scheme.primary
                    : scheme.outlineVariant.withValues(alpha: 0.8),
                width: selected ? 2 : 1,
              ),
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  scheme.primary.withValues(alpha: 0.34),
                  scheme.secondary.withValues(alpha: 0.16),
                ],
              ),
            ),
            child: Align(
              alignment: Alignment.bottomLeft,
              child: Text(
                modes[index],
                style: TextStyle(
                  color: selected ? scheme.primary : scheme.onSurface,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
          );
        },
        separatorBuilder: (_, __) => const SizedBox(width: 10),
        itemCount: modes.length,
      ),
    );
  }
}

class _LayerCard extends StatelessWidget {
  const _LayerCard({required this.layer});

  final GisLayerDescriptor layer;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final trustColor = switch (layer.trust) {
      GisLayerTrust.official => scheme.primary,
      GisLayerTrust.publicMetadata => scheme.secondary,
      GisLayerTrust.derived => scheme.tertiary,
      GisLayerTrust.unavailable => scheme.outline,
    };
    return PremiumCard(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Container(
            height: 42,
            width: 42,
            decoration: BoxDecoration(
              color: trustColor.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(Icons.layers_rounded, color: trustColor),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(layer.name,
                    style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 4),
                Text(
                  layer.metadataOnly
                      ? 'Sadece katalog metadatası'
                      : 'Canlı katman isteği hazır',
                  style: Theme.of(context)
                      .textTheme
                      .bodySmall
                      ?.copyWith(color: scheme.onSurfaceVariant),
                ),
              ],
            ),
          ),
          StatusPill(label: layer.trust.name, color: trustColor),
        ],
      ),
    );
  }
}

class _MapControl extends StatelessWidget {
  const _MapControl({required this.icon, this.accent = false});

  final IconData icon;
  final bool accent;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      height: 52,
      width: 52,
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.92),
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.14),
            blurRadius: 22,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Icon(icon, color: accent ? scheme.primary : scheme.onSurface),
    );
  }
}

class _RoundButton extends StatelessWidget {
  const _RoundButton({required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white.withValues(alpha: 0.92),
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: SizedBox(
          height: 52,
          width: 52,
          child: Icon(icon, color: Theme.of(context).colorScheme.primary),
        ),
      ),
    );
  }
}

class _SatelliteCanvas extends StatelessWidget {
  const _SatelliteCanvas();

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _SatellitePainter(Theme.of(context).colorScheme),
      child: const SizedBox.expand(),
    );
  }
}

class _SatellitePainter extends CustomPainter {
  const _SatellitePainter(this.scheme);

  final ColorScheme scheme;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint();
    final rect = Offset.zero & size;
    paint.shader = const LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [Color(0xFF315C3C), Color(0xFF9C8D68), Color(0xFF143726)],
    ).createShader(rect);
    canvas.drawRect(rect, paint);

    final roadPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.54)
      ..strokeWidth = 9
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    final roadThin = Paint()
      ..color = const Color(0xFF263B35).withValues(alpha: 0.55)
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    for (var i = 0; i < 9; i++) {
      final y = size.height * (0.12 + i * 0.095);
      final path = Path()
        ..moveTo(-40, y)
        ..cubicTo(size.width * 0.25, y - 72, size.width * 0.72, y + 70,
            size.width + 40, y - 20);
      canvas.drawPath(path, i.isEven ? roadPaint : roadThin);
    }

    final blockPaint = Paint()..color = Colors.white.withValues(alpha: 0.16);
    for (var i = 0; i < 38; i++) {
      final x = ((i * 47) % size.width).toDouble();
      final y =
          (size.height * 0.10 + ((i * 83) % (size.height * 0.72))).toDouble();
      canvas.save();
      canvas.translate(x, y);
      canvas.rotate((i % 7 - 3) * 0.08);
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH(0, 0, 48 + (i % 4) * 12, 28 + (i % 3) * 8),
          const Radius.circular(6),
        ),
        blockPaint,
      );
      canvas.restore();
    }

    final parcelFill = Paint()
      ..color = scheme.secondary.withValues(alpha: 0.34)
      ..style = PaintingStyle.fill;
    final parcelStroke = Paint()
      ..color = scheme.secondary
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke;
    final baseX = size.width * 0.34;
    final baseY = size.height * 0.32;
    for (final offset in const [0.0, 74.0, 148.0]) {
      final path = Path()
        ..moveTo(baseX + offset * 0.18, baseY + offset)
        ..lineTo(baseX + 96 + offset * 0.12, baseY + 22 + offset)
        ..lineTo(baseX + 80 + offset * 0.10, baseY + 112 + offset)
        ..lineTo(baseX - 18 + offset * 0.15, baseY + 88 + offset)
        ..close();
      canvas.drawPath(path, parcelFill);
      canvas.drawPath(path, parcelStroke);
    }
  }

  @override
  bool shouldRepaint(covariant _SatellitePainter oldDelegate) => false;
}
