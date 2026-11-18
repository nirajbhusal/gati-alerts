import '../entities/district.dart';

abstract interface class DistrictRepository {
  Future<List<District>> getDistricts();
}
