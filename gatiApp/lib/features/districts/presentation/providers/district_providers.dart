import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/network/network_providers.dart';
import '../../../../core/preferences/app_preferences.dart';
import '../../data/datasources/district_remote_datasource.dart';
import '../../data/repositories/district_repository_impl.dart';
import '../../domain/entities/district.dart';
import '../../domain/repositories/district_repository.dart';

final districtRepositoryProvider = Provider<DistrictRepository>(
  (ref) => DistrictRepositoryImpl(
    DistrictRemoteDatasource(ref.watch(apiClientProvider)),
  ),
);

final districtsProvider = FutureProvider<List<District>>(
  (ref) => ref.watch(districtRepositoryProvider).getDistricts(),
);

/// Districts by NP-DISTRICT code. Empty until loaded.
final districtsByCodeProvider = Provider<Map<String, District>>(
  (ref) => {
    for (final d in ref.watch(districtsProvider).value ?? const <District>[])
      d.code: d,
  },
);

/// The user's saved district, or null for all of Nepal.
final myDistrictProvider = Provider<District?>((ref) {
  final code = ref.watch(preferencesProvider.select((p) => p.districtId));
  return code == null ? null : ref.watch(districtsByCodeProvider)[code];
});
