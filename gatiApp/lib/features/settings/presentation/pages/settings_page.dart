import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/config/app_config.dart';
import '../../../../core/l10n/app_language.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../../../core/preferences/app_preferences.dart';
import '../../../../core/theme/app_dimens.dart';
import '../../../../core/utils/launcher.dart';
import '../../../../core/widgets/section_card.dart';
import '../../../districts/presentation/widgets/district_picker.dart';

/// Language, theme and district. Stored on the device by
/// [PreferencesNotifier]; this feature has no data layer of its own.
class SettingsPage extends ConsumerWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final prefs = ref.watch(preferencesProvider);
    final notifier = ref.read(preferencesProvider.notifier);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: Text(s.settings)),
      body: ListView(
        padding: Gap.page,
        children: [
          SectionCard(
            title: s.language,
            child: SegmentedButton<AppLanguage>(
              showSelectedIcon: false,
              segments: [
                for (final l in AppLanguage.values)
                  ButtonSegment(value: l, label: Text(l.label)),
              ],
              selected: {prefs.language},
              onSelectionChanged: (v) => notifier.setLanguage(v.first),
            ),
          ),
          const SizedBox(height: Gap.md),
          SectionCard(
            title: s.theme,
            child: SegmentedButton<ThemeMode>(
              showSelectedIcon: false,
              segments: [
                ButtonSegment(
                  value: ThemeMode.system,
                  icon: const Icon(Icons.brightness_auto_outlined),
                  label: Text(s.themeSystem),
                ),
                ButtonSegment(
                  value: ThemeMode.light,
                  icon: const Icon(Icons.light_mode_outlined),
                  label: Text(s.themeLight),
                ),
                ButtonSegment(
                  value: ThemeMode.dark,
                  icon: const Icon(Icons.dark_mode_outlined),
                  label: Text(s.themeDark),
                ),
              ],
              selected: {prefs.themeMode},
              onSelectionChanged: (v) => notifier.setThemeMode(v.first),
            ),
          ),
          const SizedBox(height: Gap.md),
          SectionCard(
            title: s.myDistrict,
            child: const Align(
              alignment: Alignment.centerLeft,
              child: MyDistrictButton(),
            ),
          ),
          const SizedBox(height: Gap.md),
          SectionCard(
            title: s.about,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${s.appName} · ${s.tagline}',
                  style: theme.textTheme.titleSmall,
                ),
                const SizedBox(height: Gap.sm),
                Text(s.disclaimer, style: theme.textTheme.bodyMedium),
                const SizedBox(height: Gap.md),
                OutlinedButton.icon(
                  onPressed: () => Launcher.openUrl(AppConfig.baseUrl),
                  icon: const Icon(Icons.public),
                  label: Text(s.website),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
