import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/l10n/app_strings.dart';
import '../../../../core/theme/app_dimens.dart';
import '../../../../core/widgets/async_list_view.dart';
import '../../../../core/widgets/section_card.dart';
import '../../../districts/presentation/providers/district_providers.dart';
import '../../../districts/presentation/widgets/district_picker.dart';
import '../../domain/entities/emergency_contact.dart';
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
            ? const <EmergencyContact>[]
            : directory.byDistrict[district.slug] ?? const [];
        return [
          _ContactGroup(title: s.nationalNumbers, contacts: directory.national),
          const Align(
            alignment: Alignment.centerLeft,
            child: MyDistrictButton(),
          ),
          if (district == null)
            Text(s.chooseDistrict)
          else if (local.isEmpty)
            Text(s.noDistrictNumbers)
          else
            _ContactGroup(title: s.districtNumbers, contacts: local),
        ];
      },
    );
  }
}

class _ContactGroup extends StatelessWidget {
  const _ContactGroup({required this.title, required this.contacts});

  final String title;
  final List<EmergencyContact> contacts;

  @override
  Widget build(BuildContext context) => SectionCard(
    title: title,
    child: Column(
      children: [
        for (final (i, c) in contacts.indexed) ...[
          if (i > 0) const Divider(height: Gap.sm),
          ContactTile(contact: c),
        ],
      ],
    ),
  );
}
