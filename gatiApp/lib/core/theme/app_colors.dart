import 'package:flutter/material.dart';

/// Gati colours. Brand and severity values match the website
/// (`assets/css/gati.css`); neutrals are tuned for the app.
abstract final class AppColors {
  // Brand
  static const gatiRed = Color(0xFFE2362B);
  static const crimson = Color(0xFFDC143C);
  static const navy = Color(0xFF0B1424);
  static const teal = Color(0xFF0F7C86);
  static const glacier = Color(0xFF7FD1D8);

  // Neutrals, light
  static const canvas = Color(0xFFF5F6F8);
  static const surface = Color(0xFFFFFFFF);
  static const surfaceMuted = Color(0xFFF0F2F5);
  static const line = Color(0xFFE5E8EC);
  static const ink = Color(0xFF14202B);
  static const inkMuted = Color(0xFF5C6B7A);

  // Neutrals, dark
  static const canvasDark = Color(0xFF0A0F15);
  static const surfaceDark = Color(0xFF121A23);
  static const surfaceMutedDark = Color(0xFF1A2430);
  static const lineDark = Color(0xFF223040);
  static const inkDark = Color(0xFFE8EDF2);
  static const inkMutedDark = Color(0xFF97A6B5);

  // CAP severity (only for severity)
  static const extreme = Color(0xFF8E1B14);
  static const severe = Color(0xFFD93025);
  static const moderate = Color(0xFFE8820C);
  static const minor = Color(0xFFE0B500);
  static const info = Color(0xFF8F9BB3);

  // Status (roads, rivers, weather levels)
  static const ok = Color(0xFF2E8B57);
  static const caution = Color(0xFFD97706);
  static const blocked = Color(0xFFC62828);
  static const oneWay = Color(0xFF2563EB);
  static const corrected = Color(0xFF7C4DBA);
}
