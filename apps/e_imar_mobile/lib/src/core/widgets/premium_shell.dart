import 'package:flutter/material.dart';

import '../../features/map/domain/parcel.dart';
import '../../features/source_coverage/source_coverage_screen.dart';
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
    MapWorkspaceScreen(onOpenParcel: _openParcel),
    const SourceCoverageScreen(),
    const WatchlistScreen(),
    HomeSearchScreen(
      onOpenMap: _selectMap,
      onOpenCoverage: _selectCoverage,
      onOpenWatchlist: _selectWatchlist,
    ),
  ];

  void _selectMap() => setState(() => _index = 0);
  void _selectCoverage() => setState(() => _index = 1);
  void _selectWatchlist() => setState(() => _index = 2);
  void _openParcel(ParcelDetail parcel) {
    Navigator.of(context).pushNamed('/parcel-detail', arguments: parcel);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: true,
      body: IndexedStack(index: _index, children: _pages),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (index) => setState(() => _index = index),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.map_outlined),
            selectedIcon: Icon(Icons.map_rounded),
            label: 'Harita',
          ),
          NavigationDestination(
            icon: Icon(Icons.analytics_outlined),
            selectedIcon: Icon(Icons.analytics_rounded),
            label: 'Analiz',
          ),
          NavigationDestination(
            icon: Icon(Icons.bookmark_border_rounded),
            selectedIcon: Icon(Icons.bookmark_rounded),
            label: 'Favoriler',
          ),
          NavigationDestination(
            icon: Icon(Icons.search_rounded),
            selectedIcon: Icon(Icons.manage_search_rounded),
            label: 'Ara',
          ),
        ],
      ),
    );
  }
}
