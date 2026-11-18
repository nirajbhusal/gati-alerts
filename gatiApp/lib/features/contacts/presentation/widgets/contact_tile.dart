import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/preferences/app_preferences.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/utils/launcher.dart';
import '../../domain/entities/emergency_contact.dart';

/// Name, agency and number. Tap to call.
class ContactTile extends ConsumerWidget {
  const ContactTile({super.key, required this.contact});

  final EmergencyContact contact;

  static IconData _icon(String category) => switch (category) {
    'police' => Icons.local_police_rounded,
    'fire' => Icons.local_fire_department_rounded,
    'ambulance' || 'hospital' => Icons.local_hospital_rounded,
    'army' || 'apf' => Icons.shield_rounded,
    _ => Icons.support_agent_rounded,
  };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(languageProvider);
    final scheme = Theme.of(context).colorScheme;
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: CircleAvatar(
        backgroundColor: scheme.primary.withValues(alpha: 0.1),
        foregroundColor: scheme.primary,
        child: Icon(_icon(contact.category)),
      ),
      title: Text(contact.name.of(lang)),
      subtitle: contact.agency.isEmpty ? null : Text(contact.agency.of(lang)),
      trailing: FilledButton.tonalIcon(
        onPressed: () => Launcher.call(contact.dial),
        icon: const Icon(Icons.call_rounded, size: 18),
        label: Text(Fmt.digits(contact.number, lang)),
      ),
      onTap: () => Launcher.call(contact.dial),
    );
  }
}
