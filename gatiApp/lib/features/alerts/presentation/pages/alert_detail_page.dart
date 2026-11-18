import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/app_routes.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../../../core/l10n/localized_text.dart';
import '../../../../core/network/api_endpoints.dart';
import '../../../../core/preferences/app_preferences.dart';
import '../../../../core/theme/app_dimens.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/utils/launcher.dart';
import '../../../../core/widgets/async_list_view.dart';
import '../../../../core/widgets/section_card.dart';
import '../../../../core/widgets/state_views.dart';
import '../../domain/entities/alert.dart';
import '../providers/alert_providers.dart';
import '../widgets/alert_meta.dart';

class AlertDetailPage extends ConsumerWidget {
  const AlertDetailPage({super.key, required this.id});

  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    return Scaffold(
      appBar: AppBar(),
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
    final text = Theme.of(context).textTheme;
    Widget body(LocalizedText t) =>
        SelectableText(t.of(lang), style: text.bodyLarge);

    return [
      Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AlertMeta(alert: alert),
          const SizedBox(height: Gap.sm),
          Text(alert.headline.of(lang), style: text.headlineSmall),
        ],
      ),
      if (alert.supersededBy != null)
        SectionCard(
          onTap: () =>
              context.pushReplacement(AppRoutes.alert(alert.supersededBy!)),
          child: Row(
            children: [
              const Icon(Icons.history),
              const SizedBox(width: Gap.md),
              Expanded(child: Text(s.laterUpdated, style: text.bodyMedium)),
              Text(s.seeLatest, style: text.titleSmall),
              const Icon(Icons.chevron_right),
            ],
          ),
        ),
      SectionCard.list(
        children: [
          _InfoRow(s.issuedBy, alert.senderName.of(lang)),
          _InfoRow(s.sent, Fmt.dateTime(alert.sent, lang)),
          _InfoRow(s.expires, Fmt.dateTime(alert.expires, lang)),
          for (final area in alert.areas) _InfoRow(s.area, area.of(lang)),
        ],
      ),
      if (!alert.instruction.isEmpty)
        SectionCard(title: s.whatToDo, child: body(alert.instruction)),
      if (!alert.description.isEmpty)
        SectionCard(title: s.details, child: body(alert.description)),
      Column(
        spacing: Gap.sm,
        children: [
          if (alert.sourceUrl != null)
            FilledButton(
              onPressed: () => Launcher.openUrl(alert.sourceUrl!),
              child: Text(s.openSource),
            ),
          OutlinedButton(
            onPressed: () => Launcher.openUrl(ApiEndpoints.alertPage(alert.id)),
            child: Text(s.openOnWeb),
          ),
        ],
      ),
      Text(s.disclaimer, style: text.bodySmall),
    ];
  }
}

/// Label on the left, value on the right, inside a list card.
class _InfoRow extends StatelessWidget {
  const _InfoRow(this.label, this.value);

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: Gap.lg, vertical: Gap.md),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 92, child: Text(label, style: text.bodySmall)),
          Expanded(child: Text(value, style: text.bodyMedium)),
        ],
      ),
    );
  }
}
