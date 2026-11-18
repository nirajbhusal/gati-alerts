import '../../domain/entities/river_report.dart';
import '../../domain/repositories/river_repository.dart';
import '../datasources/river_remote_datasource.dart';

class RiverRepositoryImpl implements RiverRepository {
  const RiverRepositoryImpl(this._remote);

  final RiverRemoteDatasource _remote;

  @override
  Future<RiverReport> getRivers() async {
    final report = await _remote.getRivers();
    final gauges = [...report.gauges]
      ..sort((a, b) {
        final byStatus = b.status.index.compareTo(a.status.index);
        return byStatus != 0 ? byStatus : b.fill.compareTo(a.fill);
      });
    return RiverReport(
      asOf: report.asOf,
      source: report.source,
      url: report.url,
      gauges: gauges,
    );
  }
}
