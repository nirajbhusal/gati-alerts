import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/config/app_config.dart';
import '../../../../core/l10n/app_language.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../../../core/preferences/app_preferences.dart';
import '../../../../core/theme/app_dimens.dart';
import '../../../../core/utils/launcher.dart';
import '../../../../core/widgets/section_card.dart';
import '../../../districts/presentation/providers/district_providers.dart';
import '../../../districts/presentation/widgets/district_picker.dart';

/// Language, theme and district. Stored on the device by
/// [PreferencesNotifier]; this feature has no data layer of its own.
class SettingsPage extends ConsumerWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final lang = ref.watch(languageProvider);
    final prefs = ref.watch(preferencesProvider);
    final notifier = ref.read(preferencesProvider.notifier);
    final district = ref.watch(myDistrictProvider);
    final text = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(title: Text(s.settings)),
      body: ListView(
        padding: Gap.page,
        children: [
          SectionCard.list(
            title: s.language,
            children: [
              for (final l in AppLanguage.values)
                _OptionTile(
                  label: l.label,
                  selected: prefs.language == l,
                  onTap: () => notifier.setLanguage(l),
                ),
            ],
          ),
          const SizedBox(height: Gap.xl),
          SectionCard.list(
            title: s.theme,
            children: [
              for (final (mode, label) in [
                (ThemeMode.system, s.themeSystem),
                (ThemeMode.light, s.themeLight),
                (ThemeMode.dark, s.themeDark),
              ])
                _OptionTile(
                  label: label,
                  selected: prefs.themeMode == mode,
                  onTap: () => notifier.setThemeMode(mode),
                ),
            ],
          ),
          const SizedBox(height: Gap.xl),
          SectionCard.list(
            title: s.myDistrict,
            children: [
              ListTile(
                leading: const Icon(Icons.place_outlined),
                title: Text(district?.name.of(lang) ?? s.allNepal),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => pickMyDistrict(context, ref),
              ),
            ],
          ),
          const SizedBox(height: Gap.xl),
          SectionCard.list(
            title: s.about,
            children: [
              Padding(
                padding: const EdgeInsets.all(Gap.lg),
                child: Text(s.disclaimer, style: text.bodyMedium),
              ),
              ListTile(
                leading: const Icon(Icons.language),
                title: Text(s.website),
                trailing: const Icon(Icons.north_east, size: 18),
                onTap: () => Launcher.openUrl(AppConfig.baseUrl),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _OptionTile extends StatelessWidget {
  const _OptionTile({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => ListTile(
    title: Text(label),
    trailing: selected
        ? Icon(Icons.check, color: Theme.of(context).colorScheme.primary)
        : null,
    onTap: onTap,
  );
}
