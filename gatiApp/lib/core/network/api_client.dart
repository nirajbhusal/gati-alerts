import 'dart:convert';

import 'package:dio/dio.dart';

import '../error/failure.dart';
import '../utils/json.dart';

/// Thin wrapper over Dio: one place for decoding and error mapping.
class ApiClient {
  const ApiClient(this._dio);

  final Dio _dio;

  Future<Map<String, dynamic>> getMap(String path) async =>
      Json.map(await _get(path));

  Future<List<Map<String, dynamic>>> getList(String path) async =>
      Json.list(await _get(path));

  Future<dynamic> _get(String path) async {
    try {
      final response = await _dio.get<dynamic>(path);
      final data = response.data;
      if (data == null) throw ServerFailure(response.statusCode, 'Empty body');
      return data is String ? jsonDecode(data) : data;
    } catch (e) {
      throw Failure.from(e);
    }
  }
}
