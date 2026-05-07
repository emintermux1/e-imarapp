import 'package:flutter/material.dart';

import 'tokens.dart';

abstract final class AppTheme {
  static ThemeData light() => _theme(Brightness.light, const ColorScheme.light(primary: AppColors.deepGreen, secondary: AppColors.emerald, surface: AppColors.porcelain, onSurface: AppColors.ink));
  static ThemeData dark() => _theme(Brightness.dark, const ColorScheme.dark(primary: AppColors.emerald, secondary: AppColors.mint, surface: Color(0xFF101A16), onSurface: Color(0xFFF2F8F4)));
  static ThemeData amoled() => _theme(Brightness.dark, const ColorScheme.dark(primary: AppColors.emerald, secondary: AppColors.mint, surface: Colors.black, onSurface: Color(0xFFF2F8F4)));

  static ThemeData _theme(Brightness brightness, ColorScheme scheme) {
    final isDark = brightness == Brightness.dark;
    final textTheme = Typography.material2021(platform: TargetPlatform.iOS).black.apply(fontFamily: 'SF Pro Display', bodyColor: scheme.onSurface, displayColor: scheme.onSurface);
    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: scheme,
      scaffoldBackgroundColor: isDark ? scheme.surface : AppColors.porcelain,
      textTheme: textTheme,
      appBarTheme: AppBarTheme(centerTitle: false, elevation: 0, backgroundColor: Colors.transparent, foregroundColor: scheme.onSurface),
      cardTheme: CardThemeData(elevation: 0, color: isDark ? const Color(0xFF14211B) : Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.lg))),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: isDark ? const Color(0xFF14211B) : Colors.white,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(AppRadius.md), borderSide: BorderSide.none),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(AppRadius.md), borderSide: const BorderSide(color: AppColors.emerald, width: 1.4)),
      ),
      navigationBarTheme: NavigationBarThemeData(
        height: 66,
        elevation: 0,
        backgroundColor: isDark ? const Color(0xEE08110E) : const Color(0xEEFFFFFF),
        indicatorColor: AppColors.emerald.withOpacity(.18),
      ),
    );
  }
}
