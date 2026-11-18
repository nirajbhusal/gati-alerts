import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/l10n/app_strings.dart';
import '../../../../core/widgets/async_list_view.dart';
import '../../../../core/widgets/section_card.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../districts/presentation/providers/district_providers.dart';
import '../../../districts/presentation/widgets/district_picker.dart';
import '../providers/contact_providers.dart';
import '../widgets/contact_tile.dart';

class ContactsPage extends ConsumerWidget {
  const ContactsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final district = ref.watch(myDistrictProvider);
    return AsyncListView(
      value: ref.watch(contactsProvider),
      onRefresh: () => ref.refresh(contactsProvider.future),
      builder: (context, directory) {
        final local = district == null
            ? null
            : directory.byDistrict[district.slug] ?? const [];
        return [
          SectionCard.list(
            title: s.nationalNumbers,
            children: [
              for (final c in directory.national) ContactTile(contact: c),
            ],
          ),
          const Align(
            alignment: Alignment.centerLeft,
            child: MyDistrictButton(),
          ),
          if (local == null)
            EmptyView(message: s.chooseDistrict, icon: Icons.place_outlined)
          else if (local.isEmpty)
            EmptyView(message: s.noDistrictNumbers)
          else
            SectionCard.list(
              title: s.districtNumbers,
              children: [for (final c in local) ContactTile(contact: c)],
            ),
        ];
      },
    );
  }
}
