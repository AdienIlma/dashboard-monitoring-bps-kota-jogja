import 'dart:async';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';
import '../services/location_service.dart';
import '../models/user_model.dart';
import 'login_page.dart';

class DashboardPPLPage extends StatefulWidget {
  const DashboardPPLPage({Key? key}) : super(key: key);

  @override
  State<DashboardPPLPage> createState() => _DashboardPPLPageState();
}

class _DashboardPPLPageState extends State<DashboardPPLPage> {
  UserModel? _user;
  List<dynamic> _inputs = [];
  List<dynamic> _wilayahList = [];
  bool _isLoading = true;
  bool _isTrackingActive = false;
  String _trackingSummary = 'Belum ada update';
  Timer? _trackingStatusTimer;

  final _dateController = TextEditingController();
  final _keLapanganController = TextEditingController();
  final _submitController = TextEditingController();
  final _catatanController = TextEditingController();
  int? _selectedWilayahId;
  bool _pmlHadir = false;
  bool _isSubmitting = false;

  int _pageSize = 5;
  int _currentPage = 0;
  String? _selectedDateFilter;
  int? _selectedSlsFilter;
  bool _historyExpanded = true;

  @override
  void initState() {
    super.initState();
    _dateController.text = DateFormat('dd/MM/yyyy').format(DateTime.now());
    _loadData();
    _checkTrackingStatus();
    _trackingStatusTimer = Timer.periodic(const Duration(seconds: 10), (_) {
      if (mounted) {
        _checkTrackingStatus();
      }
    });
  }

  @override
  void dispose() {
    _trackingStatusTimer?.cancel();
    _dateController.dispose();
    _keLapanganController.dispose();
    _submitController.dispose();
    _catatanController.dispose();
    super.dispose();
  }

  Future<void> _checkTrackingStatus() async {
    final status = await LocationService.isTrackingRunning();
    final debugStatus = await LocationService.getDebugStatus();
    if (!mounted) return;

    setState(() {
      _isTrackingActive = status;
      final lastSuccessful = debugStatus['lastSuccessfulSendAt'];
      final lastError = debugStatus['lastErrorMessage'];
      _trackingSummary = lastSuccessful != null
          ? 'Terakhir dikirim: $lastSuccessful'
          : (lastError ?? 'Belum ada update lokasi');
    });
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    final user = await ApiService.getUserSession();
    final inputs = await ApiService.getMyInputsPPL();
    final wilayah = await ApiService.getWilayahPPL();

    setState(() {
      _user = user;
      _inputs = inputs;
      _wilayahList = wilayah;
      if (_wilayahList.isNotEmpty && _selectedWilayahId == null) {
        _selectedWilayahId = _wilayahList.first['id'];
      }
      _isLoading = false;
      _currentPage = 0;
    });
  }

  int get _totalKeLapangan => _inputs.fold<int>(0, (sum, item) {
    final value = int.tryParse('${item['ke_lapangan'] ?? 0}') ?? 0;
    return sum + value;
  });

  int get _totalSubmit => _inputs.fold<int>(0, (sum, item) {
    final value = int.tryParse('${item['submit'] ?? 0}') ?? 0;
    return sum + value;
  });

  String _normalizeDateInputValue(Object? value) {
    if (value == null) return '';
    final raw = value.toString().trim();
    if (raw.isEmpty) return '';
    if (raw.contains('T')) return raw.split('T').first;
    if (raw.contains(' ')) return raw.split(' ').first;
    return raw;
  }

  List<dynamic> get _filteredInputs {
    List<dynamic> result = List.from(_inputs);

    if (_selectedDateFilter != null && _selectedDateFilter!.isNotEmpty) {
      result = result.where((item) {
        final itemDate = _normalizeDateInputValue(item['tanggal']);
        return itemDate == _selectedDateFilter;
      }).toList();
    }

    if (_selectedSlsFilter != null) {
      result = result.where((item) => (item['wilayah_id'] ?? 0) == _selectedSlsFilter).toList();
    }

    return result;
  }

  void _resetFilters() {
    setState(() {
      _selectedDateFilter = null;
      _selectedSlsFilter = null;
      _currentPage = 0;
    });
  }

  int get _pageCount {
    if (_filteredInputs.isEmpty) return 1;
    return ((_filteredInputs.length - 1) ~/ _pageSize) + 1;
  }

  List<dynamic> get _paginatedInputs {
    if (_filteredInputs.isEmpty) return [];
    final start = _currentPage * _pageSize;
    final end = (start + _pageSize > _filteredInputs.length) ? _filteredInputs.length : start + _pageSize;
    return _filteredInputs.sublist(start, end);
  }

  DateTime? _parseDate(String value) {
    try {
      return DateFormat('dd/MM/yyyy').parseStrict(value);
    } catch (_) {
      return null;
    }
  }

  String _formatApiDate(DateTime date) => DateFormat('yyyy-MM-dd').format(date);

  void _toggleTracking(bool value) async {
    if (value) {
      final success = await LocationService.startTracking();
      if (!success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Izin lokasi latar belakang belum diberikan')),
        );
      }
    } else {
      await LocationService.stopTracking();
    }
    _checkTrackingStatus();
  }

  void _submitInput() async {
    if (_selectedWilayahId == null) return;

    final keLapangan = int.tryParse(_keLapanganController.text.trim()) ?? 0;
    final submitVal = int.tryParse(_submitController.text.trim()) ?? 0;
    final tanggal = _parseDate(_dateController.text.trim());

    if (tanggal == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Format tanggal tidak valid, gunakan dd/MM/yyyy')),
      );
      return;
    }

    if (keLapangan <= 0 && submitVal <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Isi minimal Ke Lapangan atau Submit (> 0)')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    final res = await ApiService.simpanInputPPL(
      wilayahId: _selectedWilayahId!,
      keLapangan: keLapangan,
      submit: submitVal,
      catatan: _catatanController.text.trim(),
      tanggal: _formatApiDate(tanggal),
      pmlHadir: _pmlHadir,
    );

    setState(() => _isSubmitting = false);

    if (res['success'] == true) {
      _keLapanganController.clear();
      _submitController.clear();
      _catatanController.clear();
      setState(() => _pmlHadir = false);
      _loadData();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(res['message'] ?? 'Input berhasil disimpan')),
        );
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(res['message'] ?? 'Gagal menyimpan input')),
        );
      }
    }
  }

  Future<void> _showEditDialog(Map<String, dynamic> item) async {
    final keLapanganController = TextEditingController(text: '${item['ke_lapangan'] ?? 0}');
    final submitController = TextEditingController(text: '${item['submit'] ?? 0}');
    final catatanController = TextEditingController(text: '${item['catatan'] ?? ''}');

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Edit Input'),
          content: SizedBox(
            width: 420,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: keLapanganController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Ke Lapangan', border: OutlineInputBorder()),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: submitController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Submit', border: OutlineInputBorder()),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: catatanController,
                  minLines: 3,
                  maxLines: 5,
                  decoration: const InputDecoration(labelText: 'Catatan', border: OutlineInputBorder()),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Batal')),
            FilledButton(
              onPressed: () async {
                final keLap = int.tryParse(keLapanganController.text.trim()) ?? 0;
                final submit = int.tryParse(submitController.text.trim()) ?? 0;

                if (keLap <= 0 && submit <= 0) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Minimal satu nilai harus lebih dari 0')),
                  );
                  return;
                }

                final result = await ApiService.editInputPPL(
                  inputId: item['id'],
                  keLapangan: keLap,
                  submit: submit,
                  catatan: catatanController.text.trim(),
                );

                if (!mounted) return;
                if (result['success'] == true) {
                  Navigator.pop(context, true);
                  _loadData();
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(result['message'] ?? 'Berhasil diubah')),
                  );
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(result['message'] ?? 'Gagal mengubah data')),
                  );
                }
              },
              child: const Text('Simpan'),
            ),
          ],
        );
      },
    );

    if (confirmed == true) {
      _loadData();
    }
  }

  Future<void> _deleteInput(Map<String, dynamic> item) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Hapus Input'),
          content: const Text('Apakah Anda yakin ingin menghapus data ini?'),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Batal')),
            TextButton(
              onPressed: () => Navigator.pop(context, true),
              style: TextButton.styleFrom(foregroundColor: Colors.red),
              child: const Text('Hapus'),
            ),
          ],
        );
      },
    );

    if (confirmed != true) return;

    final result = await ApiService.deleteInputPPL(inputId: item['id']);
    if (!mounted) return;
    if (result['success'] == true) {
      _loadData();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result['message'] ?? 'Data berhasil dihapus')),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result['message'] ?? 'Gagal menghapus data')),
      );
    }
  }

  void _logout() async {
    await ApiService.clearSession();
    await LocationService.stopTracking();
    if (!mounted) return;
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => const LoginPage()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF2F4F7),
      appBar: AppBar(
        automaticallyImplyLeading: false,
        backgroundColor: const Color(0xFF0D3A63),
        elevation: 0,
        toolbarHeight: 72,
        title: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: const BoxDecoration(
                    color: Color(0xFFF57C00),
                    shape: BoxShape.circle,
                  ),
                  child: const Center(
                    child: Text(
                      'i',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 28),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Text(
                  _user?.nama ?? 'Petugas PPL',
                  style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600),
                ),
              ],
            ),
            Row(
              children: [
                TextButton.icon(
                  onPressed: () async {
                    final granted = await LocationService.startTracking();
                    if (!granted && mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Izin lokasi latar belakang belum diberikan')),
                      );
                    }
                    _checkTrackingStatus();
                  },
                  style: TextButton.styleFrom(foregroundColor: Colors.white),
                  icon: const Icon(Icons.location_on_outlined),
                  label: const Text('Kirim Lokasi'),
                ),
                const SizedBox(width: 8),
                OutlinedButton(
                  onPressed: _logout,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: const BorderSide(color: Colors.white70),
                  ),
                  child: const Text('Keluar'),
                ),
              ],
            ),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: _isTrackingActive ? const Color(0xFFE8F5E9) : const Color(0xFFFDECEC),
                        border: Border.all(
                          color: _isTrackingActive ? const Color(0xFF4CAF50) : const Color(0xFFE57373),
                        ),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            Icons.location_on,
                            size: 30,
                            color: _isTrackingActive ? const Color(0xFF4CAF50) : const Color(0xFFE53935),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  _isTrackingActive ? 'Pelacakan Background Aktif' : 'Pelacakan Background Tidak Aktif',
                                  style: TextStyle(
                                    color: _isTrackingActive ? const Color(0xFF1B5E20) : const Color(0xFFB71C1C),
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                const SizedBox(height: 3),
                                Text(
                                  _isTrackingActive
                                      ? 'Posisi PPL dikirim ke server secara periodik di background.'
                                      : 'Aktifkan pelacakan untuk mengirim posisi PPL ke server.',
                                  style: const TextStyle(color: Color(0xFF424242), fontSize: 12),
                                ),
                                const SizedBox(height: 3),
                                Text(
                                  _trackingSummary,
                                  style: const TextStyle(color: Color(0xFF616161), fontSize: 11),
                                ),
                              ],
                            ),
                          ),
                          Switch(
                            value: _isTrackingActive,
                            onChanged: _toggleTracking,
                            activeThumbColor: const Color(0xFF4CAF50),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: _buildSummaryCard('Ke Lapangan', _totalKeLapangan.toString()),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildSummaryCard('Submit', _totalSubmit.toString(), accent: true),
                        ),
                      ],
                    ),
                    const SizedBox(height: 18),
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildFieldRow(
                            label: 'Tanggal',
                            child: TextField(
                              controller: _dateController,
                              readOnly: true,
                              onTap: () async {
                                final picked = await showDatePicker(
                                  context: context,
                                  initialDate: _parseDate(_dateController.text) ?? DateTime.now(),
                                  firstDate: DateTime(2020),
                                  lastDate: DateTime(2100),
                                );
                                if (picked != null) {
                                  _dateController.text = DateFormat('dd/MM/yyyy').format(picked);
                                }
                              },
                              decoration: InputDecoration(
                                hintText: '08 / 20 / 2026',
                                filled: true,
                                fillColor: const Color(0xFFF3F4F6),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(10),
                                  borderSide: BorderSide.none,
                                ),
                                suffixIcon: const Icon(Icons.calendar_today_outlined, color: Color(0xFF0D3A63)),
                              ),
                            ),
                          ),
                          const SizedBox(height: 14),
                          _buildFieldRow(
                            label: 'Kunjungan PML',
                            child: Container(
                              padding: const EdgeInsets.only(left: 10),
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(10),
                                color: const Color(0xFFF3F4F6),
                              ),
                              child: CheckboxListTile(
                                value: _pmlHadir,
                                onChanged: (val) => setState(() => _pmlHadir = val ?? false),
                                title: const Text('PML datang berkunjung hari ini?'),
                                controlAffinity: ListTileControlAffinity.leading,
                                contentPadding: EdgeInsets.zero,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 18),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Input Ke Lapangan',
                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF0D3A63)),
                          ),
                          const SizedBox(height: 16),
                          DropdownButtonFormField<int>(
                            value: _selectedWilayahId,
                            decoration: InputDecoration(
                              labelText: 'SLS',
                              filled: true,
                              fillColor: const Color(0xFFF3F4F6),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(10),
                                borderSide: BorderSide.none,
                              ),
                            ),
                            items: _wilayahList.map((w) {
                              return DropdownMenuItem<int>(
                                value: w['id'],
                                child: Text('${w['kode_sls']} - ${w['kelurahan']}'),
                              );
                            }).toList(),
                            onChanged: (val) => setState(() => _selectedWilayahId = val),
                          ),
                          const SizedBox(height: 14),
                          Row(
                            children: [
                              Expanded(
                                child: TextField(
                                  controller: _keLapanganController,
                                  keyboardType: TextInputType.number,
                                  decoration: InputDecoration(
                                    labelText: 'Ke Lapangan',
                                    filled: true,
                                    fillColor: const Color(0xFFF3F4F6),
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(10),
                                      borderSide: BorderSide.none,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: TextField(
                                  controller: _submitController,
                                  keyboardType: TextInputType.number,
                                  decoration: InputDecoration(
                                    labelText: 'Submit',
                                    filled: true,
                                    fillColor: const Color(0xFFF3F4F6),
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(10),
                                      borderSide: BorderSide.none,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 14),
                          TextField(
                            controller: _catatanController,
                            minLines: 3,
                            maxLines: 5,
                            decoration: InputDecoration(
                              hintText: 'Catatan tambahan...',
                              filled: true,
                              fillColor: const Color(0xFFF3F4F6),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(10),
                                borderSide: BorderSide.none,
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton(
                              onPressed: _isSubmitting ? null : _submitInput,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF0D3A63),
                                foregroundColor: Colors.white,
                                minimumSize: const Size.fromHeight(52),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                              child: _isSubmitting
                                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                  : const Text('Simpan Ke Lapangan', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 18),
                    GestureDetector(
                      onTap: () => setState(() => _historyExpanded = !_historyExpanded),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Text(
                                'Riwayat - Ke Lapangan (${_filteredInputs.length})',
                                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0D3A63)),
                              ),
                            ),
                            const Icon(Icons.keyboard_arrow_down, color: Color(0xFF0D3A63)),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    if (_historyExpanded) ...[
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF7F8FA),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Column(
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: GestureDetector(
                                    onTap: () async {
                                      final picked = await showDatePicker(
                                        context: context,
                                        initialDate: DateTime.now(),
                                        firstDate: DateTime(2020),
                                        lastDate: DateTime(2100),
                                      );
                                      if (picked != null) {
                                        setState(() {
                                          _selectedDateFilter = DateFormat('yyyy-MM-dd').format(picked);
                                          _currentPage = 0;
                                        });
                                      }
                                    },
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                                      decoration: BoxDecoration(
                                        color: Colors.white,
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(
                                            _selectedDateFilter == null ? 'Filter Tanggal' : _selectedDateFilter!,
                                            style: const TextStyle(color: Colors.black87),
                                          ),
                                          const Icon(Icons.calendar_today_outlined, size: 18),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: DropdownButtonFormField<int>(
                                    value: _selectedSlsFilter,
                                    decoration: InputDecoration(
                                      hintText: 'Filter SLS',
                                      filled: true,
                                      fillColor: Colors.white,
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(10),
                                        borderSide: BorderSide.none,
                                      ),
                                    ),
                                    items: [
                                      const DropdownMenuItem<int>(value: -1, child: Text('Semua SLS')),
                                      ..._wilayahList.map((w) => DropdownMenuItem<int>(value: w['id'], child: Text(w['kode_sls'] ?? 'SLS'))),
                                    ],
                                    onChanged: (value) {
                                      setState(() {
                                        _selectedSlsFilter = value == -1 ? null : value;
                                        _currentPage = 0;
                                      });
                                    },
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: DropdownButton<int>(
                                    value: _pageSize,
                                    underline: const SizedBox(),
                                    items: const [5, 10, 15, 20]
                                        .map((e) => DropdownMenuItem<int>(value: e, child: Text(e.toString())))
                                        .toList(),
                                    onChanged: (value) {
                                      if (value == null) return;
                                      setState(() {
                                        _pageSize = value;
                                        _currentPage = 0;
                                      });
                                    },
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            if (_selectedDateFilter != null || _selectedSlsFilter != null)
                              Align(
                                alignment: Alignment.centerRight,
                                child: TextButton.icon(
                                  onPressed: _resetFilters,
                                  icon: const Icon(Icons.refresh),
                                  label: const Text('Reset Filter'),
                                ),
                              ),
                            if (_filteredInputs.isEmpty)
                              const Center(child: Padding(
                                padding: EdgeInsets.symmetric(vertical: 24),
                                child: Text('Belum ada data input.'),
                              ))
                            else ...[
                              ListView.separated(
                                itemCount: _paginatedInputs.length,
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                separatorBuilder: (_, __) => const SizedBox(height: 8),
                                itemBuilder: (context, index) {
                                  final item = _paginatedInputs[index];
                                  final isLocked = (item['approve'] ?? 0) > 0;

                                  return Container(
                                    padding: const EdgeInsets.all(14),
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Row(
                                      crossAxisAlignment: CrossAxisAlignment.center,
                                      children: [
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                '${item['kelurahan'] ?? '-'} • ${item['kode_sls'] ?? '-'}',
                                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                              ),
                                              const SizedBox(height: 5),
                                              Text(
                                                'Tanggal: ${_normalizeDateInputValue(item['tanggal'])} • Ke Lapangan: ${item['ke_lapangan'] ?? 0} • Submit: ${item['submit'] ?? 0}',
                                                style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
                                              ),
                                              if ((item['catatan'] ?? '').toString().isNotEmpty)
                                                Padding(
                                                  padding: const EdgeInsets.only(top: 6),
                                                  child: Text(
                                                    'Catatan: ${item['catatan']}',
                                                    style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
                                                  ),
                                                ),
                                            ],
                                          ),
                                        ),
                                        Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            IconButton(
                                              icon: const Icon(Icons.edit_outlined, color: Color(0xFF0D3A63)),
                                              onPressed: isLocked ? null : () => _showEditDialog(item),
                                            ),
                                            IconButton(
                                              icon: const Icon(Icons.delete_outline, color: Colors.red),
                                              onPressed: isLocked ? null : () => _deleteInput(item),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  );
                                },
                              ),
                              const SizedBox(height: 10),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.end,
                                children: [
                                  TextButton(
                                    onPressed: _currentPage == 0 ? null : () => setState(() => _currentPage--),
                                    child: const Text('Sebelumnya'),
                                  ),
                                  Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: 12),
                                    child: Text('${_currentPage + 1} / $_pageCount'),
                                  ),
                                  TextButton(
                                    onPressed: _currentPage >= _pageCount - 1 ? null : () => setState(() => _currentPage++),
                                    child: const Text('Selanjutnya'),
                                  ),
                                ],
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildSummaryCard(String label, String value, {bool accent = false}) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 22, horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            value,
            style: TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.bold,
              color: accent ? const Color(0xFFF57C00) : const Color(0xFF0D3A63),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            label.toUpperCase(),
            style: const TextStyle(
              letterSpacing: 0.5,
              fontSize: 12,
              color: Colors.grey,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFieldRow({required String label, required Widget child}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: Color(0xFF0D3A63)),
        ),
        const SizedBox(height: 8),
        child,
      ],
    );
  }
}
