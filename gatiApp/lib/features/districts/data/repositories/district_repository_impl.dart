import '../../domain/entities/district.dart';
import '../../domain/repositories/district_repository.dart';
import '../datasources/district_remote_datasource.dart';

class DistrictRepositoryImpl implements DistrictRepository {
  const DistrictRepositoryImpl(this._remote);

  final DistrictRemoteDatasource _remote;

  @override
  Future<List<District>> getDistricts() async =>
      (await _remote.getDistricts()).where((d) => d.code.isNotEmpty).toList()
        ..sort((a, b) => a.name.en.compareTo(b.name.en));
}
