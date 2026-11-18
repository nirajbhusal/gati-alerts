import '../../../../core/utils/json.dart';
import '../../domain/entities/river_report.dart';

/// Reads `data/rivers.json`.
class RiverReportModel extends RiverReport {
  const RiverReportModel({
    required super.asOf,
    required super.source,
    required super.url,
    required super.gauges,
  });

  factory RiverReportModel.fromJson(Map<String, dynamic> json) =>
      RiverReportModel(
        asOf: Json.text(json, 'as_of'),
        source: Json.text(json, 'source'),
        url: Json.strOrNull(json['url']),
        gauges: Json.list(json['gauges'])
            .map(
              (g) => RiverGauge(
                name: Json.text(g),
                districtSlug: Json.str(g['district']),
                level: Json.dbl(g['level']),
                warning: Json.dbl(g['warning']),
                danger: Json.dbl(g['danger']),
              ),
            )
            .toList(),
      );
}
