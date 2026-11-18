import '../../../../core/l10n/localized_text.dart';

enum RiverStatus { normal, aboveWarning, aboveDanger }

/// One DHM river gauge. Levels are in metres.
class RiverGauge {
  const RiverGauge({
    required this.name,
    required this.districtSlug,
    required this.level,
    required this.warning,
    required this.danger,
  });

  final LocalizedText name;
  final String districtSlug;
  final double? level;
  final double? warning;
  final double? danger;

  RiverStatus get status {
    final l = level;
    if (l == null) return RiverStatus.normal;
    if (danger != null && l >= danger!) return RiverStatus.aboveDanger;
    if (warning != null && l >= warning!) return RiverStatus.aboveWarning;
    return RiverStatus.normal;
  }

  /// 0..1 share of the danger level, for the bar.
  double get fill {
    final l = level, d = danger;
    if (l == null || d == null || d <= 0) return 0;
    return (l / d).clamp(0, 1).toDouble();
  }
}

class RiverReport {
  const RiverReport({
    required this.asOf,
    required this.source,
    required this.url,
    required this.gauges,
  });

  final LocalizedText asOf;
  final LocalizedText source;
  final String? url;
  final List<RiverGauge> gauges;
}
