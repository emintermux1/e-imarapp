import 'package:flutter/material.dart';

import 'tokens.dart';

abstract final class AppTheme {
  static ThemeData light() => _theme(Brightness.light, const ColorScheme.light(primary: AppColors.deepGreen, secondary: AppColors.emerald, surface: AppColors.porcelain, onSurface: AppColors.ink, tertiary: AppColors.sand, error: AppColors.danger));
  static ThemeData dark() => _theme(Brightness.dark, const ColorScheme.dark(primary: AppColors.emerald, secondary: AppColors.mint, surface: AppColors.surfaceDark, onSurface: Color(0xFFF2F8F4), tertiary: AppColors.sand, error: AppColors.danger));
  static ThemeData amoled() => _theme(Brightness.dark, const ColorScheme.dark(primary: AppColors.emerald, secondary: AppColors.mint, surface: AppColors.surfaceAmoled, onSurface: Color(0xFFF2F8F4), tertiary: AppColors.sand, error: AppColors.danger));

  static ThemeData _theme(Brightness brightness, ColorScheme scheme) {
    final isDark = brightness == Brightness.dark;
    final fieldFill = isDark ? const Color(0xFF101F19) : AppColors.surfaceLight;
    final outline = isDark ? AppColors.outlineDark : AppColors.outlineLight;
    final textTheme = Typography.material2021(platform: TargetPlatform.iOS).black.apply(fontFamily: 'SF Pro Display', bodyColor: scheme.onSurface, displayColor: scheme.onSurface);
    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: scheme,
      scaffoldBackgroundColor: isDark ? scheme.surface : AppColors.porcelain,
      textTheme: textTheme,
      visualDensity: VisualDensity.standard,
      splashFactory: InkSparkle.splashFactory,
      appBarTheme: AppBarTheme(centerTitle: false, elevation: 0, scrolledUnderElevation: 0, backgroundColor: Colors.transparent, foregroundColor: scheme.onSurface, titleTextStyle: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800, color: scheme.onSurface)),
      cardTheme: CardThemeData(elevation: 0, color: isDark ? const Color(0xFF12211B) : Colors.white, surfaceTintColor: Colors.transparent, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.lg), side: BorderSide(color: outline.withValues(alpha: .7)))),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: fieldFill,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        labelStyle: TextStyle(color: isDark ? AppColors.mint.withValues(alpha: .76) : AppColors.slate),
        hintStyle: TextStyle(color: AppColors.slate.withValues(alpha: .72)),
        prefixIconColor: isDark ? AppColors.mint : AppColors.forest,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(AppRadius.md), borderSide: BorderSide(color: outline)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(AppRadius.md), borderSide: BorderSide(color: outline.withValues(alpha: .75))),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(AppRadius.md), borderSide: const BorderSide(color: AppColors.emerald, width: 1.5)),
        errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(AppRadius.md), borderSide: const BorderSide(color: AppColors.danger)),
        disabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(AppRadius.md), borderSide: BorderSide(color: outline.withValues(alpha: .36))),
      ),
      filledButtonTheme: FilledButtonThemeData(style: FilledButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.pill)), padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 15), disabledBackgroundColor: AppColors.slate.withValues(alpha: .18))),
      outlinedButtonTheme: OutlinedButtonThemeData(style: OutlinedButton.styleFrom(foregroundColor: scheme.onSurface, side: BorderSide(color: outline), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.pill)), padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14))),
      chipTheme: ChipThemeData(backgroundColor: isDark ? const Color(0xFF13241E) : Colors.white, selectedColor: AppColors.emerald.withValues(alpha: .16), side: BorderSide(color: outline.withValues(alpha: .85)), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.pill)), labelStyle: textTheme.labelLarge),
      navigationBarTheme: NavigationBarThemeData(
        height: 68,
        elevation: 0,
        shadowColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        backgroundColor: isDark ? const Color(0xE607100D) : const Color(0xEFFFFFFB),
        indicatorColor: AppColors.emerald.withValues(alpha: isDark ? .22 : .16),
        labelTextStyle: WidgetStateProperty.resolveWith((states) => textTheme.labelSmall?.copyWith(fontWeight: states.contains(WidgetState.selected) ? FontWeight.w800 : FontWeight.w600, color: states.contains(WidgetState.selected) ? scheme.onSurface : AppColors.slate)),
        iconTheme: WidgetStateProperty.resolveWith((states) => IconThemeData(color: states.contains(WidgetState.selected) ? AppColors.emerald : AppColors.slate)),
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(backgroundColor: isDark ? AppColors.glassDark : Colors.white, foregroundColor: isDark ? Colors.white : AppColors.deepGreen, elevation: 0, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.pill))),
    );
  }
}
