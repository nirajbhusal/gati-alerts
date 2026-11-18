import '../../../../core/utils/json.dart';
import '../../domain/entities/district.dart';

class DistrictModel extends District {
  const DistrictModel({
    required super.code,
    required super.slug,
    required super.name,
    required super.province,
  });

  factory DistrictModel.fromJson(Map<String, dynamic> json) => DistrictModel(
    code: Json.str(json['code']),
    slug: Json.str(json['id']),
    name: Json.text(json),
    province: Json.str(json['province']),
  );
}
