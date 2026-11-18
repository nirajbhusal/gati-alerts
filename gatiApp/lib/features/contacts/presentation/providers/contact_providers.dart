import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/network/network_providers.dart';
import '../../data/datasources/contact_remote_datasource.dart';
import '../../data/repositories/contact_repository_impl.dart';
import '../../domain/entities/emergency_contact.dart';
import '../../domain/repositories/contact_repository.dart';

final contactRepositoryProvider = Provider<ContactRepository>(
  (ref) => ContactRepositoryImpl(
    ContactRemoteDatasource(ref.watch(apiClientProvider)),
  ),
);

final contactsProvider = FutureProvider<ContactDirectory>(
  (ref) => ref.watch(contactRepositoryProvider).getContacts(),
);
