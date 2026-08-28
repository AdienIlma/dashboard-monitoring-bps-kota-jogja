import 'package:flutter/foundation.dart';

class ApiConfig {
  // 10.0.2.2 digunakan untuk Android Emulator mengakses localhost komputer
  // http://localhost:5000/api digunakan untuk Web / Windows Desktop
  static String get baseUrl {
    if (kIsWeb) {
      return 'http://localhost:5000/api';
    }
    return 'http://10.0.2.2:5000/api';
  }

  static String get loginUrl => '$baseUrl/auth/login';

  // PPL Endpoints
  static String get pplInputs => '$baseUrl/ppl/inputs';
  static String get pplInput => '$baseUrl/ppl/input';
  static String pplInputById(int inputId) => '$baseUrl/ppl/input/$inputId';
  static String get pplWilayah => '$baseUrl/ppl/wilayah';
  static String get pplLokasi => '$baseUrl/ppl/lokasi';

  // PML Endpoints
  static String get pmlPpl => '$baseUrl/pml/ppl';
  static String pmlInputsByPpl(int pplId) => '$baseUrl/pml/inputs/$pplId';
  static String pmlWilayahByPpl(int pplId) => '$baseUrl/pml/wilayah/$pplId';
  static String get pmlApprove => '$baseUrl/pml/approve';
  static String pmlApproveById(int inputId) => '$baseUrl/pml/approve/$inputId';
  static String get pmlLokasi => '$baseUrl/pml/lokasi';
}
