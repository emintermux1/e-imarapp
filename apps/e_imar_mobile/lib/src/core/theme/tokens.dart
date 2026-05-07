import 'package:flutter/material.dart';

abstract final class AppColors {
  static const ink = Color(0xFF071410);
  static const deepGreen = Color(0xFF0B2D22);
  static const forest = Color(0xFF124734);
  static const emerald = Color(0xFF16C784);
  static const mint = Color(0xFF8AF2C2);
  static const lime = Color(0xFFC6F66F);
  static const sand = Color(0xFFF3EEE4);
  static const porcelain = Color(0xFFF8FAF7);
  static const graphite = Color(0xFF18211D);
  static const slate = Color(0xFF6C7A73);
  static const danger = Color(0xFFE75D5D);
  static const warning = Color(0xFFF6B84B);
  static const sky = Color(0xFF74C7EC);
}

abstract final class AppSpacing {
  static const double xxs = 4;
  static const double xs = 8;
  static const double sm = 12;
  static const double md = 16;
  static const double lg = 24;
  static const double xl = 32;
  static const double xxl = 48;
}

abstract final class AppRadius {
  static const double sm = 12;
  static const double md = 18;
  static const double lg = 26;
  static const double xl = 34;
  static const double pill = 999;
}

abstract final class AppGradients {
  static const premium = LinearGradient(colors: [AppColors.deepGreen, AppColors.forest, AppColors.emerald], begin: Alignment.topLeft, end: Alignment.bottomRight);
  static const darkGlass = LinearGradient(colors: [Color(0xCC10261E), Color(0x9912211C)], begin: Alignment.topLeft, end: Alignment.bottomRight);
  static const mapMock = LinearGradient(colors: [Color(0xFF09251E), Color(0xFF0F3E2E), Color(0xFF1B5B43)], begin: Alignment.topLeft, end: Alignment.bottomRight);
}

abstract final class AppShadows {
  static List<BoxShadow> soft(Color color) => [BoxShadow(color: color.withOpacity(.10), blurRadius: 28, offset: const Offset(0, 14))];
  static List<BoxShadow> glow(Color color) => [BoxShadow(color: color.withOpacity(.28), blurRadius: 34, offset: const Offset(0, 12))];
}
