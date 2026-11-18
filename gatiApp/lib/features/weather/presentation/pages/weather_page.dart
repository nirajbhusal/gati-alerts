import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/l10n/app_strings.dart';
import '../../../../core/preferences/app_preferences.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/async_list_view.dart';
import '../../../../core/widgets/source_note.dart';
import '../providers/weather_providers.dart';
import '../widgets/five_day_card.dart';
import '../widgets/forecast_card.dart';

class WeatherPage extends ConsumerWidget {
  const WeatherPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final lang = ref.watch(languageProvider);
    return AsyncListView(
      value: ref.watch(weatherProvider),
      onRefresh: () => ref.refresh(weatherProvider.future),
      builder: (context, report) => [
        if (report.bulletin != null) FiveDayCard(bulletin: report.bulletin!),
        for (final f in report.forecasts) ForecastCard(forecast: f),
        SourceNote(
          text: [
            report.agency.of(lang),
            if (report.checked != null)
              '${s.checked} ${Fmt.dateTime(report.checked!, lang)}',
          ].join(' · '),
          url: report.bulletin?.url ?? report.agencyUrl,
        ),
      ],
    );
  }
}
