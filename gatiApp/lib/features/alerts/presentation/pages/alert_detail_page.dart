import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/app_routes.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../../../core/l10n/localized_text.dart';
import '../../../../core/network/api_endpoints.dart';
import '../../../../core/preferences/app_preferences.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimens.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/utils/launcher.dart';
import '../../../../core/widgets/async_list_view.dart';
import '../../../../core/widgets/section_card.dart';
import '../../../../core/widgets/state_views.dart';
import '../../domain/entities/alert.dart';
import '../providers/alert_providers.dart';
import '../widgets/alert_pills.dart';

class AlertDetailPage extends ConsumerWidget {
  const AlertDetailPage({super.key, required this.id});

  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    return Scaffold(
      appBar: AppBar(title: Text(s.details)),
      body: AsyncListView<Alert?>(
        value: ref.watch(alertByIdProvider(id)),
        onRefresh: () => ref.refresh(alertsProvider.future),
        builder: (context, alert) => alert == null
            ? [EmptyView(message: s.nothingHere, icon: Icons.search_off)]
            : _sections(context, ref, alert),
      ),
    );
  }

  List<Widget> _sections(BuildContext context, WidgetRef ref, Alert alert) {
    final s = ref.watch(stringsProvider);
    final lang = ref.watch(languageProvider);
    final theme = Theme.of(context);
    Widget body(LocalizedText t) => SelectableText(
      t.of(lang),
      style: theme.textTheme.bodyLarge?.copyWith(height: 1.5),
    );

    return [
      AlertPills(alert: alert),
      Text(
        alert.headline.of(lang),
        style: theme.textTheme.headlineSmall?.copyWith(
          fontWeight: FontWeight.w700,
          height: 1.3,
        ),
      ),
      if (alert.supersededBy != null)
        Card(
          color: AppColors.corrected.withValues(alpha: 0.1),
          child: ListTile(
            leading: const Icon(Icons.update, color: AppColors.corrected),
            title: Text(s.laterUpdated),
            trailing: TextButton(
              onPressed: () =>
                  context.pushReplacement(AppRoutes.alert(alert.supersededBy!)),
              child: Text(s.seeLatest),
            ),
          ),
        ),
      SectionCard(
        child: Column(
          children: [
            _InfoRow(s.issuedBy, alert.senderName.of(lang)),
            _InfoRow(s.sent, Fmt.dateTime(alert.sent, lang)),
            _InfoRow(s.expires, Fmt.dateTime(alert.expires, lang)),
            for (final area in alert.areas) _InfoRow(s.area, area.of(lang)),
          ],
        ),
      ),
      if (!alert.instruction.isEmpty)
        SectionCard(
          title: s.whatToDo,
          accent: AppColors.teal,
          child: body(alert.instruction),
        ),
      if (!alert.description.isEmpty)
        SectionCard(title: s.details, child: body(alert.description)),
      Text(s.disclaimer, style: theme.textTheme.bodySmall),
      Wrap(
        spacing: Gap.sm,
        runSpacing: Gap.sm,
        children: [
          if (alert.sourceUrl != null)
            FilledButton.icon(
              onPressed: () => Launcher.openUrl(alert.sourceUrl!),
              icon: const Icon(Icons.open_in_new),
              label: Text(s.openSource),
            ),
          OutlinedButton.icon(
            onPressed: () => Launcher.openUrl(ApiEndpoints.alertPage(alert.id)),
            icon: const Icon(Icons.public),
            label: Text(s.openOnWeb),
          ),
        ],
      ),
    ];
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow(this.label, this.value);

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: Gap.xs),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 96,
            child: Text(
              label,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ),
          Expanded(child: Text(value, style: theme.textTheme.bodyMedium)),
        ],
      ),
    );
  }
}
