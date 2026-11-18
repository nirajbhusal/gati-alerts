import 'package:flutter/widgets.dart';

/// Spacing and radius scale. Use these instead of raw numbers.
abstract final class Gap {
  static const xs = 4.0;
  static const sm = 8.0;
  static const md = 12.0;
  static const lg = 16.0;
  static const xl = 24.0;

  static const page = EdgeInsets.fromLTRB(lg, md, lg, xl);
}

abstract final class Radii {
  static const sm = 8.0;
  static const md = 12.0;
  static const pill = 999.0;

  static final card = BorderRadius.circular(md);
}
