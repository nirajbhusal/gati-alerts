import '../../../../core/l10n/localized_text.dart';

/// DHM's colour for a day on the 5-day warning map.
enum WarningLevel {
  green,
  yellow,
  orange,
  red,
  unknown;

  static WarningLevel parse(String v) => values.firstWhere(
    (l) => l.name == v.toLowerCase(),
    orElse: () => WarningLevel.unknown,
  );
}

class DayOutlook {
  const DayOutlook({
    required this.bsDate,
    required this.date,
    required this.level,
    required this.text,
  });

  /// Bikram Sambat label as DHM writes it, e.g. "मंसिर २".
  final String bsDate;
  final DateTime? date;
  final WarningLevel level;
  final LocalizedText text;
}

class FiveDayBulletin {
  const FiveDayBulletin({
    required this.issued,
    required this.url,
    required this.advisory,
    required this.days,
  });

  final DateTime? issued;
  final String? url;
  final LocalizedText advisory;
  final List<DayOutlook> days;
}

class Forecast24 {
  const Forecast24({
    required this.place,
    required this.issued,
    required this.url,
    required this.analysis,
    required this.day,
    required this.night,
  });

  final LocalizedText place;
  final DateTime? issued;
  final String? url;
  final LocalizedText analysis;
  final LocalizedText day;
  final LocalizedText night;
}

class WeatherReport {
  const WeatherReport({
    required this.checked,
    required this.agency,
    required this.agencyUrl,
    required this.bulletin,
    required this.forecasts,
  });

  final DateTime? checked;
  final LocalizedText agency;
  final String? agencyUrl;
  final FiveDayBulletin? bulletin;
  final List<Forecast24> forecasts;
}
