import '../../../../core/utils/json.dart';
import '../../domain/entities/emergency_contact.dart';

/// Reads one entry of `data/contacts.json` (national or district list).
class EmergencyContactModel extends EmergencyContact {
  const EmergencyContactModel({
    required super.number,
    required super.dial,
    required super.name,
    required super.agency,
    required super.category,
  });

  factory EmergencyContactModel.fromJson(Map<String, dynamic> json) {
    final number = Json.str(json['num']);
    return EmergencyContactModel(
      number: number,
      dial: Json.strOrNull(json['tel']) ?? number,
      name: Json.text(json),
      agency: Json.text(json, 'agency'),
      category: Json.str(json['cat']),
    );
  }
}

class ContactDirectoryModel extends ContactDirectory {
  const ContactDirectoryModel({
    required super.national,
    required super.byDistrict,
  });

  factory ContactDirectoryModel.fromJson(Map<String, dynamic> json) {
    List<EmergencyContact> parse(dynamic v) => Json.list(v)
        .map(EmergencyContactModel.fromJson)
        .where((c) => c.number.isNotEmpty)
        .toList();

    return ContactDirectoryModel(
      national: parse(json['national']),
      byDistrict: {
        for (final MapEntry(:key, :value) in Json.map(
          json['districts'],
        ).entries)
          key: parse(value),
      },
    );
  }
}
