import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/l10n/app_strings.dart';
import '../../../../core/preferences/app_preferences.dart';
import '../../../../core/theme/app_dimens.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/async_list_view.dart';
import '../../../../core/widgets/source_note.dart';
import '../../../../core/widgets/state_views.dart';
import '../../domain/entities/road_report.dart';
import '../providers/road_providers.dart';
import '../widgets/road_route_tile.dart';
import '../widgets/road_style.dart';

class RoadsPage extends ConsumerWidget {
  const RoadsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final lang = ref.watch(languageProvider);
    final selected = ref.watch(roadStatusFilterProvider);

    return AsyncListView(
      value: ref.watch(roadsProvider),
      onRefresh: () => ref.refresh(roadsProvider.future),
      builder: (context, report) {
        final routes = report.routes
            .where((r) => selected == null || r.status == selected)
            .toList();
        return [
          Wrap(
            spacing: Gap.sm,
            runSpacing: Gap.sm,
            children: [
              for (final status in RoadStatus.values)
                FilterChip(
                  avatar: Icon(status.icon, size: 18, color: status.color),
                  label: Text(
                    '${status.label.of(lang)} '
                    '${Fmt.number(report.count(status), lang)}',
                  ),
                  selected: selected == status,
                  showCheckmark: false,
                  onSelected: (_) => ref
                      .read(roadStatusFilterProvider.notifier)
                      .toggle(status),
                ),
            ],
          ),
          if (routes.isEmpty)
            EmptyView(message: s.nothingHere)
          else
            for (final r in routes) RoadRouteTile(route: r),
          SourceNote(
            text: '${report.rule.of(lang)} (${report.asOf.of(lang)})',
            url: report.sourceUrl,
          ),
        ];
      },
    );
  }
}
