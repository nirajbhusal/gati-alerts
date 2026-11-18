import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/network/network_providers.dart';
import '../../data/datasources/weather_remote_datasource.dart';
import '../../data/repositories/weather_repository_impl.dart';
import '../../domain/entities/weather_report.dart';
import '../../domain/repositories/weather_repository.dart';

final weatherRepositoryProvider = Provider<WeatherRepository>(
  (ref) => WeatherRepositoryImpl(
    WeatherRemoteDatasource(ref.watch(apiClientProvider)),
  ),
);

final weatherProvider = FutureProvider<WeatherReport>(
  (ref) => ref.watch(weatherRepositoryProvider).getWeather(),
);
