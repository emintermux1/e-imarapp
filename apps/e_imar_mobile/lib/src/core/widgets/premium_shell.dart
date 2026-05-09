import 'package:flutter/material.dart';

import '../../features/map/domain/parcel.dart';
import '../../features/coverage/coverage_screen.dart';
import '../../features/home/home_screen.dart';
import '../../features/map/map_screen.dart';
import '../../features/watchlist/watchlist_screen.dart';

class PremiumShell extends StatefulWidget {
  const PremiumShell({super.key});

  @override
  State<PremiumShell> createState() => _PremiumShellState();
}

class _PremiumShellState extends State<PremiumShell> {
  int _index = 0;

  late final _pages = <Widget>[
    HomeSearchScreen(onOpenMap: _selectMap, onOpenCoverage: _selectCoverage),
    MapWorkspaceScreen(onOpenParcel: _openParcel),
    const CoverageScreen(),
    const WatchlistScreen(),
  ];

  void _selectMap() => setState(() => _index = 1);
  void _selectCoverage() => setState(() => _index = 2);
  void _openParcel(ParcelDetail parcel) {
    Navigator.of(context).pushNamed('/parcel-detail', arguments: parcel);
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      extendBody: true,
      body: IndexedStack(index: _index, children: _pages),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (index) => setState(() => _index = index),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.search_rounded),
            label: 'Ara',
          ),
          NavigationDestination(
            icon: Icon(Icons.map_rounded),
            label: 'Harita',
          ),
          NavigationDestination(
            icon: Icon(Icons.shield_rounded),
            label: 'Kapsam',
          ),
          NavigationDestination(
            icon: Icon(Icons.notifications_active_rounded),
            label: 'Takip',
          ),
        ],
      ),
      floatingActionButton: _index == 1
          ? FloatingActionButton.extended(
              onPressed: _selectCoverage,
              backgroundColor: scheme.primary,
              foregroundColor: scheme.onPrimary,
              icon: const Icon(Icons.layers_rounded),
              label: const Text('Katmanlar'),
            )
          : null,
    );
  }
}
