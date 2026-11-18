import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/preferences/app_preferences.dart';
import '../../../../core/theme/app_dimens.dart';
import '../../../../core/widgets/status_pill.dart';
import '../../domain/entities/road_report.dart';
import 'road_style.dart';

/// One route. Expands to show the official note behind its status.
class RoadRouteTile extends ConsumerWidget {
  const RoadRouteTile({super.key, required this.route});

  final RoadRoute route;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(languageProvider);
    final theme = Theme.of(context);
    final status = route.status;
    return Card(
      clipBehavior: Clip.antiAlias,
      child: ExpansionTile(
        leading: Icon(status.icon, color: status.color),
        title: Text(route.name.of(lang), style: theme.textTheme.titleSmall),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: Gap.xs),
          child: Align(
            alignment: Alignment.centerLeft,
            child: StatusPill(
              label: status.label.of(lang),
              color: status.color,
            ),
          ),
        ),
        childrenPadding: const EdgeInsets.fromLTRB(Gap.lg, 0, Gap.lg, Gap.lg),
        expandedCrossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            route.note.of(lang),
            style: theme.textTheme.bodyMedium?.copyWith(height: 1.5),
          ),
        ],
      ),
    );
  }
}
