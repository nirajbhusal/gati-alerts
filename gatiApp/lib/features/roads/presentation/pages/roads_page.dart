import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/l10n/app_strings.dart';
import '../../../../core/preferences/app_preferences.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/async_list_view.dart';
import '../../../../core/widgets/choice_row.dart';
import '../../../../core/widgets/section_card.dart';
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
        String count(int n) => Fmt.number(n, lang);
        return [
          ChoiceRow<RoadStatus?>(
            choices: [
              (value: null, label: '${s.all} ${count(report.routes.length)}'),
              for (final st in RoadStatus.values)
                (
                  value: st,
                  label: '${st.label.of(lang)} ${count(report.count(st))}',
                ),
            ],
            selected: selected,
            onSelected: ref.read(roadStatusFilterProvider.notifier).select,
          ),
          if (routes.isEmpty)
            EmptyView(message: s.nothingHere)
          else
            SectionCard.list(
              title: report.asOf.of(lang),
              children: [for (final r in routes) RoadRouteTile(route: r)],
            ),
          SourceNote(text: report.rule.of(lang), url: report.sourceUrl),
        ];
      },
    );
  }
}
