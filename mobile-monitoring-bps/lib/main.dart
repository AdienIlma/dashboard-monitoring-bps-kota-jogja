import 'package:flutter/material.dart';
import 'services/api_service.dart';
import 'services/location_service.dart';
import 'pages/login_page.dart';
import 'pages/dashboard_pml_page.dart';
import 'pages/dashboard_ppl_page.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Inisialisasi background location service
  try {
    await LocationService.initializeService();
  } catch (e) {
    print('Gagal inisialisasi LocationService: $e');
  }

  runApp(const BpsMonitoringApp());
}

class BpsMonitoringApp extends StatelessWidget {
  const BpsMonitoringApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'BPS Monitoring Mobile',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primarySwatch: Colors.blue,
        useMaterial3: true,
      ),
      home: const SplashScreen(),
    );
  }
}

class SplashScreen extends StatefulWidget {
  const SplashScreen({Key? key}) : super(key: key);

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  void _checkAuth() async {
    final user = await ApiService.getUserSession();
    final token = await ApiService.getToken();

    if (!mounted) return;

    if (user != null && token != null) {
      if (user.role == 'pml') {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const DashboardPMLPage()),
        );
      } else {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const DashboardPPLPage()),
        );
      }
    } else {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const LoginPage()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: CircularProgressIndicator(),
      ),
    );
  }
}
