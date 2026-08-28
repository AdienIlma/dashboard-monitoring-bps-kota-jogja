import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';
import '../models/user_model.dart';

class ApiService {
  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  static Future<String?> getSessionToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('session_token');
  }

  static Future<void> saveSession(String token, String sessionToken, UserModel user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
    await prefs.setString('session_token', sessionToken);
    await prefs.setString('user_data', jsonEncode(user.toJson()));
  }

  static Future<UserModel?> getUserSession() async {
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString('user_data');
    if (userStr != null) {
      return UserModel.fromJson(jsonDecode(userStr));
    }
    return null;
  }

  static Future<void> clearSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('session_token');
    await prefs.remove('user_data');
  }

  static Future<Map<String, String>> _getHeaders() async {
    final token = await getToken();
    final sessionToken = await getSessionToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
      if (sessionToken != null) 'x-session-token': sessionToken,
    };
  }

  // ─── LOGIN ─────────────────────────────────────────────────────────────
  static Future<Map<String, dynamic>> login(String username, String password) async {
    try {
      final response = await http.post(
        Uri.parse(ApiConfig.loginUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'username': username, 'password': password}),
      );

      final body = jsonDecode(response.body);

      if (response.statusCode == 200) {
        final token = body['token'];
        final sessionToken = body['sessionToken'] ?? '';
        final Map<String, dynamic> userData = (body['user'] is Map<String, dynamic>)
            ? Map<String, dynamic>.from(body['user'])
            : {
                'id': body['id'] ?? 0,
                'nama': body['nama'] ?? '',
                'username': username,
                'role': body['role'] ?? '',
              };
        final user = UserModel.fromJson(userData);
        await saveSession(token, sessionToken, user);
        return {'success': true, 'user': user, 'token': token};
      } else {
        return {'success': false, 'message': body['message'] ?? 'Login gagal'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Koneksi ke server gagal: $e'};
    }
  }

  // ─── KIRIM LOKASI (PML / PPL) ─────────────────────────────────────────
  static Future<bool> kirimLokasi({
    required double latitude,
    required double longitude,
    required String role,
  }) async {
    try {
      final headers = await _getHeaders();
      final url = role.toLowerCase() == 'pml' ? ApiConfig.pmlLokasi : ApiConfig.pplLokasi;

      final response = await http.post(
        Uri.parse(url),
        headers: headers,
        body: jsonEncode({
          'latitude': latitude,
          'longitude': longitude,
        }),
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Gagal kirim lokasi: $e');
      return false;
    }
  }

  // ─── PPL APIs ──────────────────────────────────────────────────────────
  static Future<List<dynamic>> getMyInputsPPL() async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(Uri.parse(ApiConfig.pplInputs), headers: headers);
      if (response.statusCode == 200) {
        return jsonDecode(response.body) as List<dynamic>;
      }
    } catch (e) {
      print('Error getMyInputsPPL: $e');
    }
    return [];
  }

  static Future<Map<String, dynamic>> simpanInputPPL({
    required int wilayahId,
    required int keLapangan,
    required int submit,
    String? catatan,
    String? tanggal,
    bool pmlHadir = false,
  }) async {
    try {
      final headers = await _getHeaders();
      final response = await http.post(
        Uri.parse(ApiConfig.pplInput),
        headers: headers,
        body: jsonEncode({
          'wilayah_id': wilayahId,
          'ke_lapangan': keLapangan,
          'submit': submit,
          'catatan': catatan,
          'tanggal': tanggal,
          'pml_hadir': pmlHadir,
        }),
      );
      final body = jsonDecode(response.body);
      return {'success': response.statusCode == 201 || response.statusCode == 200, 'message': body['message']};
    } catch (e) {
      return {'success': false, 'message': 'Gagal simpan input: $e'};
    }
  }

  static Future<Map<String, dynamic>> editInputPPL({
    required int inputId,
    required int keLapangan,
    required int submit,
    String? catatan,
  }) async {
    try {
      final headers = await _getHeaders();
      final response = await http.put(
        Uri.parse(ApiConfig.pplInputById(inputId)),
        headers: headers,
        body: jsonEncode({
          'ke_lapangan': keLapangan,
          'submit': submit,
          'catatan': catatan,
        }),
      );
      final body = jsonDecode(response.body);
      return {'success': response.statusCode == 200, 'message': body['message'] ?? 'Berhasil diperbarui'};
    } catch (e) {
      return {'success': false, 'message': 'Gagal edit input: $e'};
    }
  }

  static Future<Map<String, dynamic>> deleteInputPPL({
    required int inputId,
  }) async {
    try {
      final headers = await _getHeaders();
      final response = await http.delete(
        Uri.parse(ApiConfig.pplInputById(inputId)),
        headers: headers,
      );
      final body = jsonDecode(response.body);
      return {'success': response.statusCode == 200, 'message': body['message'] ?? 'Berhasil dihapus'};
    } catch (e) {
      return {'success': false, 'message': 'Gagal hapus input: $e'};
    }
  }

  static Future<List<dynamic>> getWilayahPPL() async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(Uri.parse(ApiConfig.pplWilayah), headers: headers);
      if (response.statusCode == 200) {
        return jsonDecode(response.body) as List<dynamic>;
      }
    } catch (e) {
      print('Error getWilayahPPL: $e');
    }
    return [];
  }

  // ─── PML APIs ──────────────────────────────────────────────────────────
  static Future<List<dynamic>> getMyPPL() async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(Uri.parse(ApiConfig.pmlPpl), headers: headers);
      if (response.statusCode == 200) {
        return jsonDecode(response.body) as List<dynamic>;
      }
    } catch (e) {
      print('Error getMyPPL: $e');
    }
    return [];
  }

  static Future<List<dynamic>> getInputsByPPL(int pplId) async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(Uri.parse(ApiConfig.pmlInputsByPpl(pplId)), headers: headers);
      if (response.statusCode == 200) {
        return jsonDecode(response.body) as List<dynamic>;
      }
    } catch (e) {
      print('Error getInputsByPPL: $e');
    }
    return [];
  }

  static Future<List<dynamic>> getWilayahByPPL(int pplId) async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(Uri.parse(ApiConfig.pmlWilayahByPpl(pplId)), headers: headers);
      if (response.statusCode == 200) {
        return jsonDecode(response.body) as List<dynamic>;
      }
    } catch (e) {
      print('Error getWilayahByPPL: $e');
    }
    return [];
  }

  static Future<Map<String, dynamic>> simpanApprovePML({
    required int pplId,
    required int wilayahId,
    required int approve,
    String? tanggal,
    String? catatan,
  }) async {
    try {
      final headers = await _getHeaders();
      final response = await http.post(
        Uri.parse(ApiConfig.pmlApprove),
        headers: headers,
        body: jsonEncode({
          'ppl_id': pplId,
          'wilayah_id': wilayahId,
          'approve': approve,
          'tanggal': tanggal,
          'catatan': catatan,
        }),
      );
      final body = jsonDecode(response.body);
      return {'success': response.statusCode == 200, 'message': body['message']};
    } catch (e) {
      return {'success': false, 'message': 'Gagal simpan approve: $e'};
    }
  }

  static Future<Map<String, dynamic>> editApprovePML({
    required int inputId,
    required int approve,
    String? catatan,
  }) async {
    try {
      final headers = await _getHeaders();
      final response = await http.put(
        Uri.parse(ApiConfig.pmlApproveById(inputId)),
        headers: headers,
        body: jsonEncode({
          'approve': approve,
          'catatan': catatan,
        }),
      );
      final body = jsonDecode(response.body);
      return {'success': response.statusCode == 200, 'message': body['message']};
    } catch (e) {
      return {'success': false, 'message': 'Gagal ubah approve: $e'};
    }
  }

  static Future<Map<String, dynamic>> deleteApprovePML({
    required int inputId,
  }) async {
    try {
      final headers = await _getHeaders();
      final response = await http.delete(
        Uri.parse(ApiConfig.pmlApproveById(inputId)),
        headers: headers,
      );
      final body = jsonDecode(response.body);
      return {'success': response.statusCode == 200, 'message': body['message']};
    } catch (e) {
      return {'success': false, 'message': 'Gagal hapus approve: $e'};
    }
  }
}
