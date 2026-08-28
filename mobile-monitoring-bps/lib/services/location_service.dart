import 'dart:async';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:flutter/foundation.dart';
import 'api_service.dart';

class LocationService {
  static bool _webTrackingActive = false;
  static Timer? _webTimer;
  static DateTime? _lastSuccessfulSendAt;
  static String? _lastErrorMessage;
  static const Duration _webTrackingInterval = Duration(seconds: 45);

  static void _debugLog(String message) {
    print('[LocationService] $message');
  }

  static Future<Map<String, dynamic>> getDebugStatus() async {
    if (kIsWeb) {
      return {
        'active': _webTrackingActive,
        'lastSuccessfulSendAt': _lastSuccessfulSendAt?.toIso8601String(),
        'lastErrorMessage': _lastErrorMessage,
      };
    }

    final isRunning = await FlutterBackgroundService().isRunning();
    return {
      'active': isRunning,
      'lastSuccessfulSendAt': _lastSuccessfulSendAt?.toIso8601String(),
      'lastErrorMessage': _lastErrorMessage,
    };
  }

  static Future<void> _sendCurrentLocation({required String role}) async {
    try {
      final user = await ApiService.getUserSession();
      if (user == null) {
        _lastErrorMessage = 'Sesi user tidak ditemukan';
        _debugLog(_lastErrorMessage!);
        return;
      }

      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      final success = await ApiService.kirimLokasi(
        latitude: position.latitude,
        longitude: position.longitude,
        role: role,
      );

      if (success) {
        _lastSuccessfulSendAt = DateTime.now();
        _lastErrorMessage = null;
        _debugLog('Lokasi terkirim: ${position.latitude}, ${position.longitude} pada ${_lastSuccessfulSendAt!.toIso8601String()}');
      } else {
        _lastErrorMessage = 'Gagal mengirim lokasi ke server';
        _debugLog(_lastErrorMessage!);
      }
    } catch (e) {
      _lastErrorMessage = 'Error mengambil lokasi: $e';
      _debugLog(_lastErrorMessage!);
    }
  }

  static Future<bool> requestPermissions() async {
    if (kIsWeb) return true;
    // 1. Minta izin lokasi foreground (saat aplikasi dibuka)
    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        return false;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      return false;
    }

    // 2. Minta izin lokasi background (Always Allow) jika di Android 10+
    final statusBg = await Permission.locationAlways.request();
    return statusBg.isGranted || permission == LocationPermission.always;
  }

  static Future<void> initializeService() async {
    if (kIsWeb) return; // Background service hanya didukung di Android & iOS
    final service = FlutterBackgroundService();

    await service.configure(
      androidConfiguration: AndroidConfiguration(
        onStart: onStart,
        autoStart: false,
        isForegroundMode: true,
        initialNotificationTitle: 'BPS Location Tracker',
        initialNotificationContent: 'Pelacakan lokasi latar belakang aktif untuk monitoring petugas.',
        foregroundServiceNotificationId: 888,
      ),
      iosConfiguration: IosConfiguration(
        autoStart: false,
        onForeground: onStart,
        onBackground: onIosBackground,
      ),
    );
  }

  static Future<bool> startTracking() async {
    if (kIsWeb) {
      _webTrackingActive = true;
      _startWebTimer();
      return true;
    }
    final hasPermission = await requestPermissions();
    if (!hasPermission) return false;

    final service = FlutterBackgroundService();
    final isRunning = await service.isRunning();
    if (!isRunning) {
      return await service.startService();
    }
    return true;
  }

  static Future<void> stopTracking() async {
    if (kIsWeb) {
      _webTrackingActive = false;
      _webTimer?.cancel();
      _webTimer = null;
      _debugLog('Tracking web dihentikan');
      return;
    }
    final service = FlutterBackgroundService();
    final isRunning = await service.isRunning();
    if (isRunning) {
      service.invoke("stopService");
    }
  }

  static Future<bool> isTrackingRunning() async {
    if (kIsWeb) return _webTrackingActive;
    return await FlutterBackgroundService().isRunning();
  }

  static void _startWebTimer() {
    _webTimer?.cancel();
    _webTrackingActive = true;
    _debugLog('Timer tracking web dimulai (interval ${_webTrackingInterval.inSeconds} detik)');

    Future.microtask(() async {
      if (!_webTrackingActive) return;
      final user = await ApiService.getUserSession();
      if (user != null) {
        await _sendCurrentLocation(role: user.role);
      }
    });

    _webTimer = Timer.periodic(_webTrackingInterval, (timer) async {
      if (!_webTrackingActive) {
        timer.cancel();
        return;
      }

      final user = await ApiService.getUserSession();
      if (user != null) {
        await _sendCurrentLocation(role: user.role);
      }
    });
  }
}

@pragma('vm:entry-point')
Future<bool> onIosBackground(ServiceInstance service) async {
  WidgetsFlutterBinding.ensureInitialized();
  DartPluginRegistrant.ensureInitialized();
  return true;
}

@pragma('vm:entry-point')
void onStart(ServiceInstance service) async {
  DartPluginRegistrant.ensureInitialized();

  if (service is AndroidServiceInstance) {
    service.on('setAsForeground').listen((event) {
      service.setAsForegroundService();
    });

    service.on('setAsBackground').listen((event) {
      service.setAsBackgroundService();
    });
  }

  service.on('stopService').listen((event) {
    service.stopSelf();
  });

  // Timer interval kirim koordinat lokasi ke backend (misal setiap 3 menit)
  Timer.periodic(const Duration(minutes: 3), (timer) async {
    if (service is AndroidServiceInstance) {
      if (await (service as AndroidServiceInstance).isForegroundService()) {
        service.setForegroundNotificationInfo(
          title: "BPS Location Tracker",
          content: "Mengirim pembaruan posisi ke server: ${DateTime.now().hour}:${DateTime.now().minute}",
        );
      }
    }

    try {
      final user = await ApiService.getUserSession();
      if (user != null) {
        Position position = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high,
        );

        await ApiService.kirimLokasi(
          latitude: position.latitude,
          longitude: position.longitude,
          role: user.role,
        );

        print('Background location sent: ${position.latitude}, ${position.longitude}');
      }
    } catch (e) {
      print('Error getting background position: $e');
    }
  });
}
