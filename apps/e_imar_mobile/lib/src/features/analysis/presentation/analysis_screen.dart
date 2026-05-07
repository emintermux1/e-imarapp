import 'package:flutter/material.dart';

import '../../../core/widgets/widgets.dart';

class AnalysisScreen extends StatelessWidget {
  const AnalysisScreen({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(appBar: AppBar(title: const Text('Analiz')), body: const AppStateView(title: 'Yıllık analiz heatmapleri hazırlanıyor', message: 'Deprem, fay hattı, heyelan, sel, zemin tipi, tarım ve sit katmanları Faz 2 canlı GIS bağlantılarıyla açılacak.', icon: Icons.heat_pump_rounded));
}
