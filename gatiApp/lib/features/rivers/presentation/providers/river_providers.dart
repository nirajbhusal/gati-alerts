import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/network/network_providers.dart';
import '../../data/datasources/river_remote_datasource.dart';
import '../../data/repositories/river_repository_impl.dart';
import '../../domain/entities/river_report.dart';
import '../../domain/repositories/river_repository.dart';

final riverRepositoryProvider = Provider<RiverRepository>(
  (ref) =>
      RiverRepositoryImpl(RiverRemoteDatasource(ref.watch(apiClientProvider))),
);

final riversProvider = FutureProvider<RiverReport>(
  (ref) => ref.watch(riverRepositoryProvider).getRivers(),
);
