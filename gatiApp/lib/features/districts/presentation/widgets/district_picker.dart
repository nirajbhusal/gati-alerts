import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/l10n/app_strings.dart';
import '../../../../core/preferences/app_preferences.dart';
import '../../../../core/theme/app_dimens.dart';
import '../../../../core/widgets/state_views.dart';
import '../providers/district_providers.dart';

/// Opens the district list and saves the choice as "my district".
Future<void> pickMyDistrict(BuildContext context, WidgetRef ref) async {
  final choice = await showModalBottomSheet<({String? code})>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (_) => const _DistrictPickerSheet(),
  );
  if (choice != null) {
    ref.read(preferencesProvider.notifier).setDistrict(choice.code);
  }
}

/// Inline "All Nepal ⌄" selector used above lists.
class MyDistrictButton extends ConsumerWidget {
  const MyDistrictButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final lang = ref.watch(languageProvider);
    final name = ref.watch(myDistrictProvider)?.name.of(lang) ?? s.allNepal;
    final theme = Theme.of(context);
    return InkWell(
      borderRadius: BorderRadius.circular(Radii.sm),
      onTap: () => pickMyDistrict(context, ref),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: Gap.xs),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.place_outlined, size: 18, color: theme.iconTheme.color),
            const SizedBox(width: Gap.xs),
            Text(name, style: theme.textTheme.titleSmall),
            Icon(Icons.expand_more, size: 20, color: theme.iconTheme.color),
          ],
        ),
      ),
    );
  }
}

class _DistrictPickerSheet extends ConsumerStatefulWidget {
  const _DistrictPickerSheet();

  @override
  ConsumerState<_DistrictPickerSheet> createState() => _State();
}

class _State extends ConsumerState<_DistrictPickerSheet> {
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    final lang = ref.watch(languageProvider);
    final current = ref.watch(preferencesProvider.select((p) => p.districtId));
    final districts = ref.watch(districtsProvider);

    Widget tile(String label, String? code) => ListTile(
      title: Text(label),
      trailing: current == code ? const Icon(Icons.check, size: 20) : null,
      onTap: () => Navigator.pop(context, (code: code)),
    );

    return SizedBox(
      height: MediaQuery.sizeOf(context).height * 0.8,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(Gap.lg, 0, Gap.lg, Gap.sm),
            child: TextField(
              decoration: InputDecoration(
                prefixIcon: const Icon(Icons.search),
                hintText: s.searchDistrict,
              ),
              onChanged: (v) => setState(() => _query = v),
            ),
          ),
          Expanded(
            child: districts.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => ErrorView(
                error: e,
                onRetry: () => ref.invalidate(districtsProvider),
              ),
              data: (all) => ListView(
                children: [
                  if (_query.isEmpty) tile(s.allNepal, null),
                  for (final d in all.where((d) => d.matches(_query)))
                    tile(d.name.of(lang), d.code),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
