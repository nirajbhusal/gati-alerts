import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/l10n/app_strings.dart';
import '../../../../core/preferences/app_preferences.dart';
import '../../../../core/widgets/async_list_view.dart';
import '../../../../core/widgets/section_card.dart';
import '../../../../core/widgets/source_note.dart';
import '../../../../core/widgets/state_views.dart';
import '../providers/river_providers.dart';
import '../widgets/river_gauge_row.dart';

class RiversPage extends ConsumerWidget {
  const RiversPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final lang = ref.watch(languageProvider);
    return AsyncListView(
      value: ref.watch(riversProvider),
      onRefresh: () => ref.refresh(riversProvider.future),
      builder: (context, report) => [
        if (report.gauges.isEmpty)
          EmptyView(message: s.nothingHere)
        else
          SectionCard.list(
            title: report.asOf.of(lang),
            children: [for (final g in report.gauges) RiverGaugeRow(gauge: g)],
          ),
        SourceNote(text: report.source.of(lang), url: report.url),
      ],
    );
  }
}
