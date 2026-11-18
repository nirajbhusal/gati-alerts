import '../../../../core/utils/json.dart';
import '../../domain/entities/road_report.dart';

/// Reads `data/roads.json`. Map geometry (`nodes`, `segs`) is not used here.
class RoadReportModel extends RoadReport {
  const RoadReportModel({
    required super.asOf,
    required super.rule,
    required super.sourceUrl,
    required super.routes,
  });

  factory RoadReportModel.fromJson(Map<String, dynamic> json) =>
      RoadReportModel(
        asOf: Json.text(json, 'as_of'),
        rule: Json.text(json, 'rule'),
        sourceUrl: Json.strOrNull(
          Json.map(Json.map(json['sources'])['pol'])['u'],
        ),
        routes: Json.list(json['routes'])
            .map(
              (r) => RoadRoute(
                id: Json.str(r['id']),
                name: Json.text(r, 'name'),
                status: RoadStatus.parse(Json.str(r['status'])),
                note: Json.text(r, 'note'),
              ),
            )
            .toList(),
      );
}
