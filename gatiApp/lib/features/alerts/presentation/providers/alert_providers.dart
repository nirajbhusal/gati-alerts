import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/network/network_providers.dart';
import '../../../../core/preferences/app_preferences.dart';
import '../../data/datasources/alert_remote_datasource.dart';
import '../../data/repositories/alert_repository_impl.dart';
import '../../domain/entities/alert.dart';
import '../../domain/entities/alert_enums.dart';
import '../../domain/repositories/alert_repository.dart';

final alertRepositoryProvider = Provider<AlertRepository>(
  (ref) =>
      AlertRepositoryImpl(AlertRemoteDatasource(ref.watch(apiClientProvider))),
);

final alertsProvider = FutureProvider<List<Alert>>(
  (ref) => ref.watch(alertRepositoryProvider).getAlerts(),
);

final alertByIdProvider = FutureProvider.family<Alert?, String>((
  ref,
  id,
) async {
  final alerts = await ref.watch(alertsProvider.future);
  return alerts.where((a) => a.id == id).firstOrNull;
});

// ---------------------------------------------------------------------------
// Filter
// ---------------------------------------------------------------------------

/// What the list shows. District comes from the user's saved district.
class AlertFilter {
  const AlertFilter({this.activeOnly = true, this.hazard});

  final bool activeOnly;

  /// Null means every hazard.
  final Hazard? hazard;
}

final alertFilterProvider = NotifierProvider<AlertFilterNotifier, AlertFilter>(
  AlertFilterNotifier.new,
);

class AlertFilterNotifier extends Notifier<AlertFilter> {
  @override
  AlertFilter build() => const AlertFilter();

  void setActiveOnly(bool value) =>
      state = AlertFilter(activeOnly: value, hazard: state.hazard);

  void setHazard(Hazard? hazard) =>
      state = AlertFilter(activeOnly: state.activeOnly, hazard: hazard);
}

/// The list after filtering, most severe first among active alerts.
final filteredAlertsProvider = Provider<AsyncValue<List<Alert>>>((ref) {
  final filter = ref.watch(alertFilterProvider);
  final district = ref.watch(preferencesProvider.select((p) => p.districtId));
  return ref.watch(alertsProvider).whenData((alerts) {
    final now = DateTime.now();
    final list = alerts
        .where((a) => !filter.activeOnly || a.isActive(now))
        .where((a) => filter.hazard == null || a.hazard == filter.hazard)
        .where((a) => district == null || a.concerns(district))
        .toList();
    if (filter.activeOnly) {
      list.sort((a, b) => b.severity.rank.compareTo(a.severity.rank));
    }
    return list;
  });
});

/// Counts for the summary strip (active alerts in the chosen area).
typedef AlertSummary = ({int active, int severe});

final alertSummaryProvider = Provider<AlertSummary?>((ref) {
  final district = ref.watch(preferencesProvider.select((p) => p.districtId));
  final alerts = ref.watch(alertsProvider).value;
  if (alerts == null) return null;
  final now = DateTime.now();
  final active = alerts
      .where((a) => a.isActive(now))
      .where((a) => district == null || a.concerns(district));
  return (
    active: active.length,
    severe: active.where((a) => a.severity.rank >= Severity.severe.rank).length,
  );
});
