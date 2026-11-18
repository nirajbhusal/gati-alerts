import 'package:flutter/material.dart';

/// Gati brand and status colours. Same values as the website
/// (`assets/css/gati.css` and the brand kit in the web repo).
abstract final class AppColors {
  // Brand
  static const gatiRed = Color(0xFFE2362B);
  static const navy = Color(0xFF0B1424);
  static const crimson = Color(0xFFDC143C);
  static const crimsonDark = Color(0xFFA50E2D);
  static const teal = Color(0xFF0F7C86);
  static const glacier = Color(0xFF7FD1D8);

  // Neutrals, light
  static const snow = Color(0xFFF7F9FB);
  static const surface = Color(0xFFFFFFFF);
  static const ink = Color(0xFF14202B);
  static const slate = Color(0xFF4A5A6A);
  static const mist = Color(0xFFD5DEE7);

  // Neutrals, dark
  static const snowDark = Color(0xFF0B1622);
  static const surfaceDark = Color(0xFF112233);
  static const inkDark = Color(0xFFE6EDF3);
  static const slateDark = Color(0xFFA9B8C6);
  static const mistDark = Color(0xFF243447);

  // CAP severity (reserved for severity only)
  static const extreme = Color(0xFF8E1B14);
  static const severe = Color(0xFFD93025);
  static const moderate = Color(0xFFF28C1E);
  static const minor = Color(0xFFF2C94C);
  static const info = Color(0xFF8F9BB3);

  // Status (roads, rivers, weather levels)
  static const ok = Color(0xFF2E7D4F);
  static const caution = Color(0xFFB45309);
  static const blocked = Color(0xFFB91C1C);
  static const oneWay = Color(0xFF1D4ED8);
  static const corrected = Color(0xFF6B3FA0);
}
