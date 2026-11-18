import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/preferences/app_preferences.dart';
import '../../../../core/theme/app_dimens.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/utils/launcher.dart';
import '../../../../core/widgets/icon_tile.dart';
import '../../domain/entities/emergency_contact.dart';

/// Name, agency and number. The whole row calls.
class ContactTile extends ConsumerWidget {
  const ContactTile({super.key, required this.contact});

  final EmergencyContact contact;

  static IconData _icon(String category) => switch (category) {
    'police' => Icons.local_police_outlined,
    'fire' => Icons.local_fire_department_outlined,
    'ambulance' || 'hospital' => Icons.local_hospital_outlined,
    'army' || 'apf' => Icons.shield_outlined,
    'dao' => Icons.account_balance_outlined,
    _ => Icons.support_agent_outlined,
  };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(languageProvider);
    final theme = Theme.of(context);
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(
        horizontal: Gap.lg,
        vertical: Gap.xs,
      ),
      leading: IconTile(_icon(contact.category)),
      title: Text(contact.name.of(lang)),
      subtitle: contact.agency.isEmpty ? null : Text(contact.agency.of(lang)),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            Fmt.digits(contact.number, lang),
            style: theme.textTheme.titleSmall,
          ),
          const SizedBox(width: Gap.sm),
          Icon(Icons.call_outlined, size: 20, color: theme.colorScheme.primary),
        ],
      ),
      onTap: () => Launcher.call(contact.dial),
    );
  }
}
