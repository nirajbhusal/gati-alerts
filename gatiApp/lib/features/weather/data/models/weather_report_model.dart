import '../../../../core/l10n/localized_text.dart';
import '../../../../core/utils/json.dart';
import '../../domain/entities/weather_report.dart';

/// Reads `data/weather.json`.
class WeatherReportModel extends WeatherReport {
  const WeatherReportModel({
    required super.checked,
    required super.agency,
    required super.agencyUrl,
    required super.bulletin,
    required super.forecasts,
  });

  static const _nepal = LocalizedText(ne: 'नेपाल', en: 'Nepal');

  factory WeatherReportModel.fromJson(Map<String, dynamic> json) {
    final official = Json.map(json['official']);
    final forecast24 = Json.map(json['forecast24']);
    return WeatherReportModel(
      checked: Json.date(json['checked']),
      agency: Json.text(official, 'name'),
      agencyUrl: Json.strOrNull(official['url']),
      bulletin: _bulletin(Json.map(json['bulletin5'])),
      forecasts: [
        for (final MapEntry(:key, :value) in forecast24.entries)
          _forecast(Json.map(value), key == 'country' ? _nepal : null),
      ],
    );
  }

  static FiveDayBulletin? _bulletin(Map<String, dynamic> json) {
    if (json.isEmpty) return null;
    return FiveDayBulletin(
      issued: Json.date(json['issued']),
      url: Json.strOrNull(json['url']),
      advisory: Json.text(json, 'advisory'),
      days: Json.list(json['days'])
          .map(
            (d) => DayOutlook(
              bsDate: Json.str(d['bs']),
              date: Json.date(d['ad']),
              level: WarningLevel.parse(Json.str(d['level'])),
              text: Json.text(d),
            ),
          )
          .toList(),
    );
  }

  static Forecast24 _forecast(
    Map<String, dynamic> json,
    LocalizedText? place,
  ) => Forecast24(
    place: place ?? Json.text(json, 'name'),
    issued: Json.date(json['issued']),
    url: Json.strOrNull(json['url']),
    analysis: Json.text(json, 'analysis'),
    day: Json.text(json, 'day'),
    night: Json.text(json, 'night'),
  );
}
