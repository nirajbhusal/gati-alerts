import 'package:flutter/material.dart';

import 'app_colors.dart';
import 'app_dimens.dart';

/// Light and dark themes from one builder, so both stay in step.
abstract final class AppTheme {
  static final light = _build(
    brightness: Brightness.light,
    primary: AppColors.crimson,
    canvas: AppColors.canvas,
    surface: AppColors.surface,
    surfaceMuted: AppColors.surfaceMuted,
    line: AppColors.line,
    ink: AppColors.ink,
    inkMuted: AppColors.inkMuted,
  );

  static final dark = _build(
    brightness: Brightness.dark,
    primary: const Color(0xFFFF5A6E),
    canvas: AppColors.canvasDark,
    surface: AppColors.surfaceDark,
    surfaceMuted: AppColors.surfaceMutedDark,
    line: AppColors.lineDark,
    ink: AppColors.inkDark,
    inkMuted: AppColors.inkMutedDark,
  );

  static ThemeData _build({
    required Brightness brightness,
    required Color primary,
    required Color canvas,
    required Color surface,
    required Color surfaceMuted,
    required Color line,
    required Color ink,
    required Color inkMuted,
  }) {
    final scheme = ColorScheme.fromSeed(
      seedColor: AppColors.crimson,
      brightness: brightness,
      primary: primary,
      onPrimary: Colors.white,
      secondary: AppColors.teal,
      error: AppColors.severe,
      surface: surface,
      onSurface: ink,
      onSurfaceVariant: inkMuted,
      surfaceContainerHighest: surfaceMuted,
      outline: line,
      outlineVariant: line,
    );
    final text = _textTheme(ink, inkMuted);
    final buttonShape = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(Radii.md),
    );
    const buttonSize = Size.fromHeight(50);

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: scheme,
      fontFamily: 'Mukta',
      textTheme: text,
      scaffoldBackgroundColor: canvas,
      splashFactory: InkSparkle.splashFactory,
      appBarTheme: AppBarTheme(
        backgroundColor: canvas,
        foregroundColor: ink,
        surfaceTintColor: Colors.transparent,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleSpacing: Gap.lg,
        titleTextStyle: text.titleLarge,
      ),
      cardTheme: CardThemeData(
        color: surface,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: Radii.card,
          side: BorderSide(color: line),
        ),
      ),
      dividerTheme: DividerThemeData(color: line, space: 1, thickness: 1),
      iconTheme: IconThemeData(color: inkMuted, size: 22),
      listTileTheme: ListTileThemeData(
        contentPadding: const EdgeInsets.symmetric(horizontal: Gap.lg),
        iconColor: inkMuted,
        titleTextStyle: text.titleSmall,
        subtitleTextStyle: text.bodySmall,
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: surface,
        surfaceTintColor: Colors.transparent,
        indicatorColor: Colors.transparent,
        height: 64,
        iconTheme: WidgetStateProperty.resolveWith(
          (s) => IconThemeData(
            color: s.contains(WidgetState.selected) ? ink : inkMuted,
          ),
        ),
        labelTextStyle: WidgetStateProperty.resolveWith(
          (s) => text.labelSmall!.copyWith(
            color: s.contains(WidgetState.selected) ? ink : inkMuted,
            fontWeight: s.contains(WidgetState.selected)
                ? FontWeight.w700
                : FontWeight.w500,
          ),
        ),
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: surface,
        surfaceTintColor: Colors.transparent,
        dragHandleColor: line,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surfaceMuted,
        hintStyle: text.bodyMedium!.copyWith(color: inkMuted),
        prefixIconColor: inkMuted,
        contentPadding: const EdgeInsets.symmetric(vertical: Gap.md),
        border: OutlineInputBorder(
          borderRadius: Radii.card,
          borderSide: BorderSide.none,
        ),
      ),
      expansionTileTheme: ExpansionTileThemeData(
        shape: const Border(),
        collapsedShape: const Border(),
        iconColor: inkMuted,
        collapsedIconColor: inkMuted,
        tilePadding: const EdgeInsets.symmetric(horizontal: Gap.lg),
      ),
      progressIndicatorTheme: ProgressIndicatorThemeData(
        color: ink,
        linearTrackColor: surfaceMuted,
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: ink,
          foregroundColor: surface,
          minimumSize: buttonSize,
          shape: buttonShape,
          textStyle: text.titleSmall,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: ink,
          minimumSize: buttonSize,
          side: BorderSide(color: line),
          shape: buttonShape,
          textStyle: text.titleSmall,
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: ink,
          textStyle: text.titleSmall,
        ),
      ),
    );
  }

  /// Mukta sits tall; line heights are set so Nepali and English align.
  static TextTheme _textTheme(Color ink, Color muted) {
    TextStyle s(
      double size,
      FontWeight weight, {
      Color? color,
      double h = 1.35,
    }) => TextStyle(
      fontFamily: 'Mukta',
      fontSize: size,
      fontWeight: weight,
      height: h,
      color: color ?? ink,
      letterSpacing: 0,
    );
    return TextTheme(
      displaySmall: s(40, FontWeight.w700, h: 1.1),
      headlineSmall: s(24, FontWeight.w700, h: 1.3),
      titleLarge: s(21, FontWeight.w700, h: 1.25),
      titleMedium: s(17, FontWeight.w600),
      titleSmall: s(15, FontWeight.w600),
      bodyLarge: s(16, FontWeight.w400, h: 1.55),
      bodyMedium: s(14.5, FontWeight.w400, h: 1.5),
      bodySmall: s(13, FontWeight.w400, color: muted, h: 1.4),
      labelLarge: s(14, FontWeight.w600),
      labelMedium: s(12.5, FontWeight.w600, color: muted),
      labelSmall: s(11.5, FontWeight.w500, color: muted),
    );
  }
}
