import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/preferences/app_preferences.dart';
import '../../../../core/theme/app_dimens.dart';
import '../../../../core/widgets/status_label.dart';
import '../../domain/entities/road_report.dart';
import 'road_style.dart';

/// One route. Expands to show the official note behind its status.
class RoadRouteTile extends ConsumerWidget {
  const RoadRouteTile({super.key, required this.route});

  final RoadRoute route;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(languageProvider);
    final text = Theme.of(context).textTheme;
    final status = route.status;
    return ExpansionTile(
      title: Text(route.name.of(lang), style: text.titleSmall),
      subtitle: Padding(
        padding: const EdgeInsets.only(top: Gap.xs),
        child: Align(
          alignment: Alignment.centerLeft,
          child: StatusLabel(label: status.label.of(lang), color: status.color),
        ),
      ),
      childrenPadding: const EdgeInsets.fromLTRB(Gap.lg, 0, Gap.lg, Gap.lg),
      expandedCrossAxisAlignment: CrossAxisAlignment.start,
      children: [Text(route.note.of(lang), style: text.bodyMedium)],
    );
  }
}
