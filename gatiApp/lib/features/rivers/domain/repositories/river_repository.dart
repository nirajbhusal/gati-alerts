import '../entities/river_report.dart';

abstract interface class RiverRepository {
  /// Gauges ordered from most to least critical.
  Future<RiverReport> getRivers();
}
