import '../entities/road_report.dart';

abstract interface class RoadRepository {
  /// Routes ordered worst status first, then by name.
  Future<RoadReport> getRoads();
}
