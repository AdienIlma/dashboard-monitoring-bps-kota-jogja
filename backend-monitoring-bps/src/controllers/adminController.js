const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// GET semua user
const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nama, username, role, pml_id, created_at FROM users ORDER BY role, nama'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Gagal ambil data user', error: err.message });
  }
};

// POST buat user baru (PML atau PPL)
const createUser = async (req, res) => {
  const { nama, username, password, role, pml_id } = req.body;

  if (!nama || !username || !password || !role) {
    return res.status(400).json({ message: 'nama, username, password, role wajib diisi' });
  }

  if (!['admin', 'pml', 'ppl'].includes(role)) {
    return res.status(400).json({ message: 'Role tidak valid, pilih: admin, pml, ppl' });
  }

  if (role === 'ppl' && !pml_id) {
    return res.status(400).json({ message: 'PPL harus punya PML, isi pml_id' });
  }

  try {
    // cek username sudah ada
    const cek = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (cek.rows.length > 0) {
      return res.status(400).json({ message: 'Username sudah dipakai' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (nama, username, password, role, pml_id) VALUES ($1,$2,$3,$4,$5) RETURNING id, nama, username, role, pml_id',
      [nama, username, hashed, role, pml_id || null]
    );
    res.status(201).json({ message: 'User berhasil dibuat', user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Gagal buat user', error: err.message });
  }
};

// GET semua PML
const getPMLList = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nama, username FROM users WHERE role = $1 ORDER BY nama',
      ['pml']
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Gagal ambil data PML', error: err.message });
  }
};

// GET PPL berdasarkan PML
const getPPLByPML = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT id, nama, username FROM users WHERE role = $1 AND pml_id = $2 ORDER BY nama',
      ['ppl', id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Gagal ambil data PPL', error: err.message });
  }
};

// GET semua responden
const getResponden = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, u.nama as nama_ppl 
      FROM responden r
      LEFT JOIN users u ON r.ppl_id = u.id
      ORDER BY r.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Gagal ambil data responden', error: err.message });
  }
};

// POST tambah responden
const createResponden = async (req, res) => {
  const { nama_kepala_keluarga, alamat, kecamatan, kelurahan } = req.body;

  if (!nama_kepala_keluarga || !alamat) {
    return res.status(400).json({ message: 'nama_kepala_keluarga dan alamat wajib diisi' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO responden (nama_kepala_keluarga, alamat, kecamatan, kelurahan) VALUES ($1,$2,$3,$4) RETURNING *',
      [nama_kepala_keluarga, alamat, kecamatan || null, kelurahan || null]
    );
    res.status(201).json({ message: 'Responden berhasil ditambah', responden: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Gagal tambah responden', error: err.message });
  }
};

// PUT assign responden ke PPL
const assignResponden = async (req, res) => {
  const { id } = req.params;
  const { ppl_id } = req.body;

  if (!ppl_id) {
    return res.status(400).json({ message: 'ppl_id wajib diisi' });
  }

  try {
    // cek PPL ada dan rolenya benar
    const cekPPL = await pool.query('SELECT id FROM users WHERE id = $1 AND role = $2', [ppl_id, 'ppl']);
    if (cekPPL.rows.length === 0) {
      return res.status(400).json({ message: 'PPL tidak ditemukan' });
    }

    const result = await pool.query(
      'UPDATE responden SET ppl_id = $1, status = $2 WHERE id = $3 RETURNING *',
      [ppl_id, 'sudah_lapangan', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Responden tidak ditemukan' });
    }

    res.json({ message: 'Responden berhasil di-assign', responden: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Gagal assign', error: err.message });
  }
};

module.exports = { 
  getAllUsers, 
  createUser, 
  getResponden, 
  createResponden, 
  assignResponden,
  getPMLList,
  getPPLByPML
};

// ─── DASHBOARD ───────────────────────────────────────────────

// GET progress keseluruhan
const getDashboardProgress = async (req, res) => {
  try {
    const total = await pool.query('SELECT COUNT(*) FROM responden');
    const lapangan = await pool.query("SELECT COUNT(*) FROM responden WHERE status != 'belum'");
    const submit = await pool.query("SELECT COUNT(*) FROM responden WHERE status IN ('submitted','approved')");
    const approve = await pool.query("SELECT COUNT(*) FROM responden WHERE status = 'approved'");

    const target = parseInt(total.rows[0].count) || 1;
    const sudahKeLapangan = parseInt(lapangan.rows[0].count);
    const submitCount = parseInt(submit.rows[0].count);
    const approveCount = parseInt(approve.rows[0].count);

    res.json({
      sudahKeLapangan,
      sudahKeLapanganPersen: Math.round((sudahKeLapangan / target) * 100),
      submit: submitCount,
      submitPersen: Math.round((submitCount / target) * 100),
      approve: approveCount,
      approvePersen: Math.round((approveCount / target) * 100),
      target,
      belumPersen: Math.round(((target - sudahKeLapangan) / target) * 100),
      submitChartPersen: Math.round((submitCount / target) * 100),
      approvePersen2: Math.round((approveCount / target) * 10) / 10,
      sudahKeLapanganChartPersen: Math.round((sudahKeLapangan / target) * 100),
    });
  } catch (err) {
    res.status(500).json({ message: 'Gagal ambil progress', error: err.message });
  }
};

// GET ringkasan petugas
const getDashboardPetugas = async (req, res) => {
  try {
    const totalPetugas = await pool.query("SELECT COUNT(*) FROM users WHERE role IN ('pml','ppl')");
    const totalPML = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'pml'");
    const totalPPL = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'ppl'");

    // petugas aktif = yang punya lokasi dalam 24 jam terakhir
    const aktif = await pool.query(`
      SELECT COUNT(DISTINCT user_id) FROM lokasi 
      WHERE recorded_at >= NOW() - INTERVAL '24 hours'
    `);

    const totalP = parseInt(totalPetugas.rows[0].count);
    const aktifCount = parseInt(aktif.rows[0].count);

    res.json({
      totalPetugas: totalP,
      totalPML: parseInt(totalPML.rows[0].count),
      totalPPL: parseInt(totalPPL.rows[0].count),
      petugasAktif: aktifCount,
      petugasAktifPersen: totalP > 0 ? Math.round((aktifCount / totalP) * 100) : 0,
      lastUpdate: new Date().toLocaleString('id-ID', { 
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit' 
      }),
    });
  } catch (err) {
    res.status(500).json({ message: 'Gagal ambil data petugas', error: err.message });
  }
};

// GET data per kecamatan
const getDashboardKecamatan = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        kecamatan,
        kelurahan,
        COUNT(*) as target,
        COUNT(CASE WHEN status != 'belum' THEN 1 END) as sudah_ke_lapangan,
        COUNT(CASE WHEN status IN ('submitted','approved') THEN 1 END) as submit,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approve
      FROM responden
      WHERE kecamatan IS NOT NULL
      GROUP BY kecamatan, kelurahan
      ORDER BY kecamatan, kelurahan
    `);

    // group by kecamatan
    const kecamatanMap = {};
    result.rows.forEach((row, idx) => {
      if (!kecamatanMap[row.kecamatan]) {
        kecamatanMap[row.kecamatan] = {
          id: Object.keys(kecamatanMap).length + 1,
          nama: row.kecamatan,
          sudahKeLapangan: 0,
          submit: 0,
          approve: 0,
          target: 0,
          kelurahan: [],
        };
      }
      const kec = kecamatanMap[row.kecamatan];
      kec.sudahKeLapangan += parseInt(row.sudah_ke_lapangan);
      kec.submit += parseInt(row.submit);
      kec.approve += parseInt(row.approve);
      kec.target += parseInt(row.target);
      kec.kelurahan.push({
        id: idx + 1,
        nama: row.kelurahan,
        sudahKeLapangan: parseInt(row.sudah_ke_lapangan),
        submit: parseInt(row.submit),
        approve: parseInt(row.approve),
        target: parseInt(row.target),
      });
    });

    res.json(Object.values(kecamatanMap));
  } catch (err) {
    res.status(500).json({ message: 'Gagal ambil data kecamatan', error: err.message });
  }
};

// GET detail petugas
const getDashboardPetugasDetail = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.nama,
        u.role as tipe,
        u.pml_id,
        COUNT(r.id) as target,
        COUNT(CASE WHEN r.status != 'belum' THEN 1 END) as sudah_ke_lapangan,
        COUNT(CASE WHEN r.status IN ('submitted','approved') THEN 1 END) as submit,
        COUNT(CASE WHEN r.status = 'approved' THEN 1 END) as approve
      FROM users u
      LEFT JOIN responden r ON r.ppl_id = u.id
      WHERE u.role IN ('pml','ppl')
      GROUP BY u.id, u.nama, u.role, u.pml_id
      ORDER BY u.role, u.nama
    `);

    res.json(result.rows.map(r => ({
      id: r.id,
      nama: r.nama,
      tipe: r.tipe.toUpperCase(),
      pml_id: r.pml_id,
      sudahKeLapangan: parseInt(r.sudah_ke_lapangan),
      submit: parseInt(r.submit),
      approve: parseInt(r.approve),
      target: parseInt(r.target),
    })));
  } catch (err) {
    res.status(500).json({ message: 'Gagal ambil detail petugas', error: err.message });
  }
};

// GET sebaran petugas dari tabel lokasi
const getDashboardSebaranPetugas = async (req, res) => {
  try {
    // lokasi terakhir tiap petugas
    const result = await pool.query(`
      SELECT DISTINCT ON (l.user_id)
        l.user_id as id,
        u.nama,
        u.role,
        u.pml_id,
        l.latitude as lat,
        l.longitude as lng,
        l.recorded_at
      FROM lokasi l
      JOIN users u ON l.user_id = u.id
      ORDER BY l.user_id, l.recorded_at DESC
    `);

    res.json(result.rows.map(r => ({
      id: r.id,
      nama: r.nama,
      role: r.role,
      pml_id: r.pml_id,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lng),
      recorded_at: r.recorded_at,
    })));
  } catch (err) {
    res.status(500).json({ message: 'Gagal ambil sebaran petugas', error: err.message });
  }
};

// GET progress 15 hari terakhir
const getDashboardProgress15Hari = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        DATE(submitted_at) as tanggal,
        COUNT(*) as submit,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approve
      FROM submissions
      WHERE submitted_at >= NOW() - INTERVAL '15 days'
      GROUP BY DATE(submitted_at)
      ORDER BY tanggal ASC
    `);

    // ambil data ke lapangan dari responden
    const lapangan = await pool.query(`
      SELECT 
        DATE(created_at) as tanggal,
        COUNT(*) as sudah_ke_lapangan
      FROM responden
      WHERE status != 'belum' AND created_at >= NOW() - INTERVAL '15 days'
      GROUP BY DATE(created_at)
      ORDER BY tanggal ASC
    `);

    const lapanganMap = {};
    lapangan.rows.forEach(r => {
      lapanganMap[r.tanggal] = parseInt(r.sudah_ke_lapangan);
    });

    res.json(result.rows.map(r => ({
      tanggal: new Date(r.tanggal).toLocaleDateString('id-ID', { 
        day: 'numeric', month: 'short', year: 'numeric' 
      }),
      sudahKeLapangan: lapanganMap[r.tanggal] || 0,
      submit: parseInt(r.submit),
      approve: parseInt(r.approve),
    })));
  } catch (err) {
    res.status(500).json({ message: 'Gagal ambil progress 15 hari', error: err.message });
  }
};

module.exports = { 
  getAllUsers, 
  createUser, 
  getResponden, 
  createResponden, 
  assignResponden,
  getPMLList,
  getPPLByPML,
  getDashboardProgress,
  getDashboardPetugas,
  getDashboardKecamatan,
  getDashboardPetugasDetail,
  getDashboardSebaranPetugas,
  getDashboardProgress15Hari,
};