import 'package:flutter/material.dart';

import 'app_colors.dart';
import 'app_dimens.dart';

/// Light and dark themes from one builder, so both stay in step.
abstract final class AppTheme {
  static final light = _build(
    ColorScheme.fromSeed(
      seedColor: AppColors.crimson,
      primary: AppColors.crimson,
      onPrimary: Colors.white,
      secondary: AppColors.teal,
      onSecondary: Colors.white,
      error: AppColors.severe,
      surface: AppColors.surface,
      onSurface: AppColors.ink,
      onSurfaceVariant: AppColors.slate,
      outlineVariant: AppColors.mist,
    ),
    scaffold: AppColors.snow,
  );

  static final dark = _build(
    ColorScheme.fromSeed(
      seedColor: AppColors.crimson,
      brightness: Brightness.dark,
      primary: const Color(0xFFFF6B7F),
      onPrimary: AppColors.navy,
      secondary: AppColors.glacier,
      onSecondary: AppColors.navy,
      error: const Color(0xFFFF8A80),
      surface: AppColors.surfaceDark,
      onSurface: AppColors.inkDark,
      onSurfaceVariant: AppColors.slateDark,
      outlineVariant: AppColors.mistDark,
    ),
    scaffold: AppColors.snowDark,
  );

  static ThemeData _build(ColorScheme scheme, {required Color scaffold}) {
    final shape = RoundedRectangleBorder(borderRadius: Radii.card);
    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      fontFamily: 'Mukta',
      scaffoldBackgroundColor: scaffold,
      appBarTheme: AppBarTheme(
        backgroundColor: scaffold,
        foregroundColor: scheme.onSurface,
        surfaceTintColor: Colors.transparent,
        centerTitle: false,
        titleTextStyle: TextStyle(
          fontFamily: 'Mukta',
          fontSize: 22,
          fontWeight: FontWeight.w700,
          color: scheme.onSurface,
        ),
      ),
      cardTheme: CardThemeData(
        color: scheme.surface,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: shape.copyWith(side: BorderSide(color: scheme.outlineVariant)),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: scheme.surface,
        indicatorColor: scheme.primary.withValues(alpha: 0.14),
        labelTextStyle: const WidgetStatePropertyAll(
          TextStyle(fontFamily: 'Mukta', fontWeight: FontWeight.w600),
        ),
      ),
      chipTheme: ChipThemeData(
        shape: const StadiumBorder(),
        side: BorderSide(color: scheme.outlineVariant),
      ),
      expansionTileTheme: const ExpansionTileThemeData(
        shape: Border(),
        collapsedShape: Border(),
      ),
      dividerTheme: DividerThemeData(color: scheme.outlineVariant, space: 1),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(Radii.sm),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(Radii.sm),
          ),
        ),
      ),
    );
  }
}
