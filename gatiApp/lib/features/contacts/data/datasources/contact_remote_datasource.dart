import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_endpoints.dart';
import '../models/contact_models.dart';

class ContactRemoteDatasource {
  const ContactRemoteDatasource(this._api);

  final ApiClient _api;

  /// GET data/contacts.json
  Future<ContactDirectoryModel> getContacts() async =>
      ContactDirectoryModel.fromJson(await _api.getMap(ApiEndpoints.contacts));
}
