import '../../domain/entities/road_report.dart';
import '../../domain/repositories/road_repository.dart';
import '../datasources/road_remote_datasource.dart';

class RoadRepositoryImpl implements RoadRepository {
  const RoadRepositoryImpl(this._remote);

  final RoadRemoteDatasource _remote;

  @override
  Future<RoadReport> getRoads() async {
    final report = await _remote.getRoads();
    final routes = [...report.routes]
      ..sort((a, b) {
        final byStatus = a.status.index.compareTo(b.status.index);
        return byStatus != 0 ? byStatus : a.name.en.compareTo(b.name.en);
      });
    return RoadReport(
      asOf: report.asOf,
      rule: report.rule,
      sourceUrl: report.sourceUrl,
      routes: routes,
    );
  }
}
