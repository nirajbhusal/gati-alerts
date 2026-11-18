import '../entities/emergency_contact.dart';

abstract interface class ContactRepository {
  Future<ContactDirectory> getContacts();
}
