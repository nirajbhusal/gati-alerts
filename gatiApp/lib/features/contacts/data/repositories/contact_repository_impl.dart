import '../../domain/entities/emergency_contact.dart';
import '../../domain/repositories/contact_repository.dart';
import '../datasources/contact_remote_datasource.dart';

class ContactRepositoryImpl implements ContactRepository {
  const ContactRepositoryImpl(this._remote);

  final ContactRemoteDatasource _remote;

  @override
  Future<ContactDirectory> getContacts() => _remote.getContacts();
}
