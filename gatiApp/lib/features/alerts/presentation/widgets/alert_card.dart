import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/app_routes.dart';
import '../../../../core/preferences/app_preferences.dart';
import '../../../../core/theme/app_dimens.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/section_card.dart';
import '../../domain/entities/alert.dart';
import 'alert_pills.dart';
import 'alert_style.dart';

class AlertCard extends ConsumerWidget {
  const AlertCard({super.key, required this.alert});

  final Alert alert;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(languageProvider);
    final theme = Theme.of(context);
    final muted = theme.textTheme.bodySmall?.copyWith(
      color: theme.colorScheme.onSurfaceVariant,
    );
    return SectionCard(
      accent: alert.severity.color,
      onTap: () => context.push(AppRoutes.alert(alert.id)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AlertPills(alert: alert),
          const SizedBox(height: Gap.sm),
          Text(
            alert.headline.of(lang),
            style: theme.textTheme.titleMedium?.copyWith(height: 1.35),
          ),
          if (alert.areas.isNotEmpty) ...[
            const SizedBox(height: Gap.xs),
            Text(
              alert.areas.first.of(lang),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: muted,
            ),
          ],
          const SizedBox(height: Gap.sm),
          Text(
            '${alert.senderName.of(lang).split('·').first.trim()} · '
            '${Fmt.ago(alert.sent, lang)}',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: muted,
          ),
        ],
      ),
    );
  }
}
