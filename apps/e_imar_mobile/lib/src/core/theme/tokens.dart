import 'package:flutter/material.dart';

abstract final class AppColors {
  static const ink = Color(0xFF071410);
  static const deepGreen = Color(0xFF08271F);
  static const forest = Color(0xFF0F3D2F);
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

  static const surfaceLight = Color(0xFFFFFFFF);
  static const surfaceWarm = Color(0xFFFBF7EF);
  static const surfaceDark = Color(0xFF0C1713);
  static const surfaceAmoled = Color(0xFF000000);
  static const glassLight = Color(0xDDFDFBF6);
  static const glassDark = Color(0xB30D1D17);
  static const outlineLight = Color(0xFFE4E0D4);
  static const outlineDark = Color(0xFF254239);
  static const overlayScrim = Color(0x66040A08);

  static const mapDeep = Color(0xFF061713);
  static const mapCanopy = Color(0xFF123B31);
  static const mapOlive = Color(0xFF52694B);
  static const mapRoad = Color(0xFFE0D0A4);
  static const mapParcel = Color(0xFF9FF3C9);
  static const mapContour = Color(0xFFB4C6A4);
  static const riskLow = Color(0xFF16C784);
  static const riskMedium = Color(0xFFF6B84B);
  static const riskHigh = Color(0xFFFF6B5F);
  static const info = Color(0xFF5EB8FF);
  static const success = Color(0xFF38D996);
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
  static const double xxl = 42;
  static const double pill = 999;
}

abstract final class AppGradients {
  static const premium = LinearGradient(colors: [AppColors.deepGreen, AppColors.forest, AppColors.emerald], begin: Alignment.topLeft, end: Alignment.bottomRight);
  static const emeraldGlow = RadialGradient(colors: [Color(0x6616C784), Color(0x0016C784)], radius: .95);
  static const darkGlass = LinearGradient(colors: [Color(0xD912261E), Color(0x9912211C)], begin: Alignment.topLeft, end: Alignment.bottomRight);
  static const amoledGlass = LinearGradient(colors: [Color(0xE6000000), Color(0xB3081713)], begin: Alignment.topLeft, end: Alignment.bottomRight);
  static const sandSurface = LinearGradient(colors: [Color(0xFFFDF8EF), Color(0xFFF4EFE5), Color(0xFFEAF5EE)], begin: Alignment.topLeft, end: Alignment.bottomRight);
  static const heroMap = LinearGradient(colors: [Color(0xFF020806), Color(0xFF082019), Color(0xFF153E32), Color(0xFF806C45)], stops: [0, .34, .7, 1], begin: Alignment.topLeft, end: Alignment.bottomRight);
  static const mapMock = LinearGradient(colors: [Color(0xFF061511), Color(0xFF0D2D25), Color(0xFF1B503F), Color(0xFF756944)], stops: [0, .42, .78, 1], begin: Alignment.topLeft, end: Alignment.bottomRight);
  static const score = LinearGradient(colors: [Color(0xFF132F27), Color(0xFF16C784), Color(0xFFC6F66F)], begin: Alignment.topLeft, end: Alignment.bottomRight);
}

abstract final class AppShadows {
  static List<BoxShadow> soft(Color color) => [BoxShadow(color: color.withOpacity(.10), blurRadius: 28, offset: const Offset(0, 14))];
  static List<BoxShadow> medium(Color color) => [BoxShadow(color: color.withOpacity(.14), blurRadius: 36, offset: const Offset(0, 18))];
  static List<BoxShadow> elevated(Color color) => [BoxShadow(color: color.withOpacity(.18), blurRadius: 46, offset: const Offset(0, 24))];
  static List<BoxShadow> glow(Color color) => [BoxShadow(color: color.withOpacity(.28), blurRadius: 34, offset: const Offset(0, 12))];
}
