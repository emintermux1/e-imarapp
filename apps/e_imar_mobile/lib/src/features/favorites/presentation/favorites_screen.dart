import 'package:flutter/material.dart';

import '../../../core/widgets/widgets.dart';

class FavoritesScreen extends StatelessWidget {
  const FavoritesScreen({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(appBar: AppBar(title: const Text('Favoriler')), body: const AppStateView(title: 'Favori parsellerin burada görünecek', message: 'Firebase kullanıcı koleksiyonları hazır; gerçek senkronizasyon entegrasyonu sonraki fazda.', icon: Icons.favorite_border_rounded));
}
