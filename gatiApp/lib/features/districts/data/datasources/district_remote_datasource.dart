import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_endpoints.dart';
import '../models/district_model.dart';

class DistrictRemoteDatasource {
  const DistrictRemoteDatasource(this._api);

  final ApiClient _api;

  /// GET data/districts.json — a plain array of 77 districts.
  Future<List<DistrictModel>> getDistricts() async => (await _api.getList(
    ApiEndpoints.districts,
  )).map(DistrictModel.fromJson).toList();
}
