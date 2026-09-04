import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../services/location_service.dart';
import 'dashboard_pml_page.dart';
import 'dashboard_ppl_page.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({Key? key}) : super(key: key);

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;
  bool _obscurePassword = true;

  void _handleLogin() async {
    final username = _usernameController.text.trim();
    final password = _passwordController.text.trim();

    if (username.isEmpty || password.isEmpty) {
      setState(() {
        _errorMessage = 'Username dan password wajib diisi';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final res = await ApiService.login(username, password);

    setState(() {
      _isLoading = false;
    });

    if (res['success'] == true) {
      final user = res['user'];

      // Otimatis nyalakan tracking lokasi di background setelah login
      await LocationService.startTracking();

      if (!mounted) return;

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
      setState(() {
        _errorMessage = res['message'] ?? 'Login gagal';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0B1B33),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 36),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 478),
            child: Container(
              padding: const EdgeInsets.fromLTRB(40, 54, 40, 42),
              decoration: BoxDecoration(
                color: const Color(0xFFF8F9FB),
                borderRadius: BorderRadius.circular(22),
                boxShadow: const [
                  BoxShadow(color: Color(0x55000000), blurRadius: 28, offset: Offset(0, 12)),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Column(
                      children: [
                         Image.asset(
                          'assets/images/logo-sensus.png',
                          width: 60,
                          height: 60,
                          fit: BoxFit.contain,
                          errorBuilder: (context, error, stackTrace) {
                            // Fallback jika gambar tidak ditemukan
                            return Transform.rotate(
                              angle: -0.35,
                              child: Icon(
                                Icons.change_history,
                                size: 52,
                                color: const Color(0xFFF3C978),
                              ),
                            );
                          },
                        ),
                        const SizedBox(height: 18),
                        const Text(
                          'SEMAKI',
                          style: TextStyle(fontSize: 34, letterSpacing: 3, fontWeight: FontWeight.w800, color: Color(0xFF062E68)),
                        ),
                        const SizedBox(height: 2),
                        const Text(
                          'SENSUS EKONOMI  MANAJEMEN AKTIVITAS DAN\nKINERJA',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 12, letterSpacing: 2, height: 1.35, color: Color(0xFF6D8FC1)),
                        ),
                      ],
                    ),
                  ),
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 28),
                    child: Divider(color: Color(0xFFE7EAF0), height: 1),
                  ),
                  if (_errorMessage != null) ...[
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(color: const Color(0xFFFFE8E8), borderRadius: BorderRadius.circular(8)),
                      child: Text(_errorMessage!, style: const TextStyle(color: Color(0xFFB42318))),
                    ),
                    const SizedBox(height: 18),
                  ],
                  const Text('EMAIL', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF355B8C))),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _usernameController,
                    keyboardType: TextInputType.emailAddress,
                    decoration: _inputDecoration('Masukkan Email'),
                  ),
                  const SizedBox(height: 18),
                  const Text('PASSWORD', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF355B8C))),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    decoration: _inputDecoration('Masukkan password').copyWith(
                      suffixIcon: IconButton(
                        tooltip: _obscurePassword ? 'Tampilkan password' : 'Sembunyikan password',
                        icon: Icon(_obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined, color: const Color(0xFF6D8FC1)),
                        onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                      ),
                    ),
                  ),
                  const SizedBox(height: 26),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _handleLogin,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0A2E68),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      child: _isLoading
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Text('Masuk', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    ),
                  ),
                  const SizedBox(height: 24),
                  const Center(
                    child: Text('Badan Pusat Statistik · Kota Yogyakarta', style: TextStyle(fontSize: 12, color: Color(0xFF8CA8D0))),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String hintText) {
    return InputDecoration(
      hintText: hintText,
      hintStyle: const TextStyle(color: Color(0xFF718096), fontSize: 16),
      filled: true,
      fillColor: const Color(0xFFF7FAFE),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFD5E1F0))),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFD5E1F0))),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF416FA8), width: 1.5)),
    );
  }
}
