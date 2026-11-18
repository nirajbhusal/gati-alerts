import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/l10n/app_strings.dart';
import '../../../../core/l10n/localized_text.dart';
import '../../../../core/preferences/app_preferences.dart';
import '../../../../core/theme/app_dimens.dart';
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
    final theme = Theme.of(context);

    Widget row(IconData icon, String label, LocalizedText text) => Padding(
      padding: const EdgeInsets.only(top: Gap.sm),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: theme.colorScheme.secondary),
          const SizedBox(width: Gap.sm),
          Expanded(
            child: Text.rich(
              TextSpan(
                children: [
                  TextSpan(
                    text: '$label: ',
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                  TextSpan(text: text.of(lang)),
                ],
              ),
              style: theme.textTheme.bodyMedium?.copyWith(height: 1.45),
            ),
          ),
        ],
      ),
    );

    return SectionCard(
      title: '${s.forecast24} · ${forecast.place.of(lang)}',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!forecast.analysis.isEmpty)
            Text(
              forecast.analysis.of(lang),
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          if (!forecast.day.isEmpty)
            row(Icons.wb_sunny_outlined, s.day, forecast.day),
          if (!forecast.night.isEmpty)
            row(Icons.nightlight_outlined, s.night, forecast.night),
        ],
      ),
    );
  }
}
