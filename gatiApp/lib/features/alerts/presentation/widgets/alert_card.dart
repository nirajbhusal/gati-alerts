import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/app_routes.dart';
import '../../../../core/preferences/app_preferences.dart';
import '../../../../core/theme/app_dimens.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/icon_tile.dart';
import '../../../../core/widgets/section_card.dart';
import '../../domain/entities/alert.dart';
import 'alert_meta.dart';
import 'alert_style.dart';

class AlertCard extends ConsumerWidget {
  const AlertCard({super.key, required this.alert});

  final Alert alert;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(languageProvider);
    final text = Theme.of(context).textTheme;
    final agency = alert.senderName.of(lang).split('·').first.trim();

    return SectionCard(
      onTap: () => context.push(AppRoutes.alert(alert.id)),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          IconTile(alert.hazard.icon, color: alert.severity.color),
          const SizedBox(width: Gap.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                AlertMeta(alert: alert),
                const SizedBox(height: Gap.xs + 2),
                Text(
                  alert.headline.of(lang),
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                  style: text.titleMedium,
                ),
                const SizedBox(height: Gap.xs + 2),
                Text(
                  '$agency  ·  ${Fmt.ago(alert.sent, lang)}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: text.bodySmall,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
