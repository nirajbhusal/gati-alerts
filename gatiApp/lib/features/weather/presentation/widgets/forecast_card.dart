import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/l10n/app_strings.dart';
import '../../../../core/l10n/localized_text.dart';
import '../../../../core/preferences/app_preferences.dart';
import '../../../../core/theme/app_dimens.dart';
import '../../../../core/widgets/icon_tile.dart';
import '../../../../core/widgets/section_card.dart';
import '../../domain/entities/weather_report.dart';

/// DHM's 24-hour forecast for one place (Nepal or Kathmandu).
class ForecastCard extends ConsumerWidget {
  const ForecastCard({super.key, required this.forecast});

  final Forecast24 forecast;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final lang = ref.watch(languageProvider);
    final text = Theme.of(context).textTheme;

    Widget period(IconData icon, String label, LocalizedText value) => Padding(
      padding: const EdgeInsets.all(Gap.lg),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          IconTile(icon),
          const SizedBox(width: Gap.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: text.labelMedium),
                Text(value.of(lang), style: text.bodyMedium),
              ],
            ),
          ),
        ],
      ),
    );

    return SectionCard.list(
      title: '${s.forecast24} · ${forecast.place.of(lang)}',
      children: [
        if (!forecast.analysis.isEmpty)
          Padding(
            padding: const EdgeInsets.all(Gap.lg),
            child: Text(forecast.analysis.of(lang), style: text.bodyMedium),
          ),
        if (!forecast.day.isEmpty)
          period(Icons.wb_sunny_outlined, s.day, forecast.day),
        if (!forecast.night.isEmpty)
          period(Icons.bedtime_outlined, s.night, forecast.night),
      ],
    );
  }
}
