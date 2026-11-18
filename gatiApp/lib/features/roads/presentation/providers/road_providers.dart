import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/network/network_providers.dart';
import '../../data/datasources/road_remote_datasource.dart';
import '../../data/repositories/road_repository_impl.dart';
import '../../domain/entities/road_report.dart';
import '../../domain/repositories/road_repository.dart';

final roadRepositoryProvider = Provider<RoadRepository>(
  (ref) =>
      RoadRepositoryImpl(RoadRemoteDatasource(ref.watch(apiClientProvider))),
);

final roadsProvider = FutureProvider<RoadReport>(
  (ref) => ref.watch(roadRepositoryProvider).getRoads(),
);

/// Status chip selected on the Roads screen. Null shows every route.
final roadStatusFilterProvider =
    NotifierProvider<RoadStatusFilter, RoadStatus?>(RoadStatusFilter.new);

class RoadStatusFilter extends Notifier<RoadStatus?> {
  @override
  RoadStatus? build() => null;

  void toggle(RoadStatus status) => state = state == status ? null : status;
}
