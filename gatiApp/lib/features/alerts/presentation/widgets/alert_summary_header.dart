import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/l10n/app_strings.dart';
import '../../../../core/preferences/app_preferences.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimens.dart';
import '../../../../core/utils/formatters.dart';
import '../providers/alert_providers.dart';

/// Brand header with active and severe counts for the chosen area.
class AlertSummaryHeader extends ConsumerWidget {
  const AlertSummaryHeader({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final lang = ref.watch(languageProvider);
    final summary = ref.watch(alertSummaryProvider);
    String count(int? n) => n == null ? '–' : Fmt.number(n, lang);

    return Container(
      padding: const EdgeInsets.all(Gap.lg),
      decoration: BoxDecoration(
        borderRadius: Radii.card,
        gradient: const LinearGradient(
          colors: [AppColors.navy, Color(0xFF1B2B45)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            s.tagline,
            style: const TextStyle(color: AppColors.glacier, fontSize: 14),
          ),
          const SizedBox(height: Gap.md),
          Row(
            children: [
              _Stat(value: count(summary?.active), label: s.activeAlerts),
              const SizedBox(width: Gap.xl),
              _Stat(
                value: count(summary?.severe),
                label: s.severeAlerts,
                color: (summary?.severe ?? 0) > 0
                    ? const Color(0xFFFF8A80)
                    : Colors.white,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({
    required this.value,
    required this.label,
    this.color = Colors.white,
  });

  final String value;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(
        value,
        style: TextStyle(
          color: color,
          fontSize: 32,
          fontWeight: FontWeight.w700,
          height: 1.1,
        ),
      ),
      Text(label, style: const TextStyle(color: Colors.white70)),
    ],
  );
}
