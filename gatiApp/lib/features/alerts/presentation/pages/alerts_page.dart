import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/l10n/app_strings.dart';
import '../../../../core/widgets/async_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../providers/alert_providers.dart';
import '../widgets/alert_card.dart';
import '../widgets/alerts_header.dart';

class AlertsPage extends ConsumerWidget {
  const AlertsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    return AsyncListView(
      value: ref.watch(filteredAlertsProvider),
      onRefresh: () => ref.refresh(alertsProvider.future),
      builder: (context, alerts) => [
        const AlertsHeader(),
        if (alerts.isEmpty)
          EmptyView(message: s.noActiveAlerts, icon: Icons.check_circle_outline)
        else
          for (final alert in alerts) AlertCard(alert: alert),
      ],
    );
  }
}
