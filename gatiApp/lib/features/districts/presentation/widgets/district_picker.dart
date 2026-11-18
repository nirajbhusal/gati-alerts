import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/l10n/app_strings.dart';
import '../../../../core/preferences/app_preferences.dart';
import '../../../../core/theme/app_dimens.dart';
import '../../../../core/widgets/state_views.dart';
import '../../domain/entities/district.dart';
import '../providers/district_providers.dart';

/// Button that shows the saved district and opens the picker.
/// The choice is saved as "my district" for the whole app.
class MyDistrictButton extends ConsumerWidget {
  const MyDistrictButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final lang = ref.watch(languageProvider);
    final district = ref.watch(myDistrictProvider);
    return ActionChip(
      avatar: const Icon(Icons.place_outlined, size: 18),
      label: Text(district?.name.of(lang) ?? s.allNepal),
      onPressed: () async {
        final picked = await showDistrictPicker(context);
        if (picked != null) {
          ref
              .read(preferencesProvider.notifier)
              .setDistrict(picked.district?.code);
        }
      },
    );
  }
}

/// What the picker returns: a district, or null district for all of Nepal.
typedef DistrictChoice = ({District? district});

/// Opens the district list. Returns null when dismissed.
Future<DistrictChoice?> showDistrictPicker(BuildContext context) =>
    showModalBottomSheet<DistrictChoice>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => const _DistrictPickerSheet(),
    );

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
    final districts = ref.watch(districtsProvider);
    return SizedBox(
      height: MediaQuery.sizeOf(context).height * 0.75,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: Gap.lg),
            child: TextField(
              decoration: InputDecoration(
                prefixIcon: const Icon(Icons.search),
                hintText: s.searchDistrict,
                border: const OutlineInputBorder(),
              ),
              onChanged: (v) => setState(() => _query = v),
            ),
          ),
          const SizedBox(height: Gap.sm),
          Expanded(
            child: districts.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => ErrorView(
                error: e,
                onRetry: () => ref.invalidate(districtsProvider),
              ),
              data: (all) {
                final items = all.where((d) => d.matches(_query)).toList();
                return ListView(
                  children: [
                    if (_query.isEmpty)
                      ListTile(
                        leading: const Icon(Icons.public),
                        title: Text(s.allNepal),
                        onTap: () => Navigator.pop(context, (district: null)),
                      ),
                    for (final d in items)
                      ListTile(
                        title: Text(d.name.of(lang)),
                        onTap: () => Navigator.pop(context, (district: d)),
                      ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
