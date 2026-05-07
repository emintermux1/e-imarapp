import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/services/gis_connector.dart';
import '../../../core/services/gis_layers.dart';
import '../../../core/widgets/widgets.dart';

class AnalysisScreen extends ConsumerWidget {
  const AnalysisScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final layers = ref.watch(gisOfficialLayersProvider);
    final repo = ref.watch(gisLayerRepositoryProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Analiz')),
      body: layers.isEmpty
          ? const AppStateView(
              title: 'Yıllık analiz heatmapleri hazırlanıyor',
              message:
                  'Deprem, fay hattı, heyelan, sel, zemin tipi, tarım ve sit '
                  'katmanları Faz 2 canlı GIS bağlantılarıyla açılacak.',
              icon: Icons.heat_pump_rounded,
            )
          : _LayerList(layers: layers, repo: repo),
    );
  }
}

class _LayerList extends ConsumerWidget {
  const _LayerList({required this.layers, required this.repo});

  final List<GisLayerDescriptor> layers;
  final GisLayerRepository repo;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final live = repo is LiveGisLayerRepository;

    return Column(
      children: [
        if (!live)
          Padding(
            padding: const EdgeInsets.all(14),
            child: AppStateView(
              title: 'Mock GIS katmanları aktif',
              message:
                  'Ağ bağlantısı yok — canlı depo yerine mock katmanlar kullanılıyor.',
              icon: Icons.cloud_off_rounded,
            ),
          ),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(14),
            itemCount: layers.length,
            itemBuilder: (context, index) {
              final layer = layers[index];
              return _LayerCard(layer: layer, repo: repo);
            },
          ),
        ),
      ],
    );
  }
}

class _LayerCard extends ConsumerStatefulWidget {
  const _LayerCard({required this.layer, required this.repo});

  final GisLayerDescriptor layer;
  final GisLayerRepository repo;

  @override
  ConsumerState<_LayerCard> createState() => _LayerCardState();
}

class _LayerCardState extends ConsumerState<_LayerCard> {
  GisFeatureCollection? _features;
  bool _loading = false;
  String? _error;

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final query = GisLayerQuery(
        bbox: GisBoundingBox.turkeyBounds,
        srs: 'EPSG:4326',
        format: widget.layer.defaultFormat,
        maxFeatures: 100,
      );

      final result = await widget.repo.fetchFeatures(widget.layer, query);
      if (mounted) {
        setState(() {
          _features = result;
          if (result.hasError) _error = result.errorMessage;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final layer = widget.layer;
    final kindLabel = switch (layer.kind) {
      GisLayerKind.wms => 'WMS 1.3.0',
      GisLayerKind.wfs => 'WFS 2.0.0',
      GisLayerKind.geoJson => 'GeoJSON',
    };

    final categoryLabel = layer.category.name;
    final featureCount = _features?.features.length ?? 0;

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        layer.name,
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(fontWeight: FontWeight.w800),
                      ),
                      Text(
                        '$kindLabel • $categoryLabel • TTL: ${layer.cacheTtl.inMinutes}dk',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
                if (!_loading && _features == null)
                  IconButton(
                    onPressed: _load,
                    icon: const Icon(Icons.cloud_download_rounded),
                    tooltip: 'Katmanı yükle',
                  )
                else if (_loading)
                  const Padding(
                    padding: EdgeInsets.all(8.0),
                    child: SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(strokeWidth: 2)),
                  ),
              ],
            ),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  '⚠ $_error',
                  style: Theme.of(context)
                      .textTheme
                      .bodySmall
                      ?.copyWith(color: Colors.orange),
                ),
              ),
            if (_features != null && !_features!.hasError)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text('$featureCount özellik yüklendi'),
              ),
          ],
        ),
      ),
    );
  }
}
