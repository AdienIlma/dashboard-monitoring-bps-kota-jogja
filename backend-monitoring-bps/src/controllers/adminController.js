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

// POST buat user baru
const createUser = async (req, res) => {
  const { nama, username, password, role, pml_id } = req.body;

  if (!nama || !username || !password || !role) {
    return res.status(400).json({
      message: 'nama, username, password, role wajib diisi'
    });
  }

  if (!['admin', 'pml', 'ppl'].includes(role)) {
    return res.status(400).json({ message: 'Role tidak valid' });
  }

  if (role === 'ppl' && !pml_id) {
    return res.status(400).json({ message: 'PPL harus punya PML' });
  }

  try {
    const cek = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (cek.rows.length > 0) {
      return res.status(400).json({
        message: 'Username sudah dipakai'
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users
       (nama, username, password, role, pml_id)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, nama, username, role, pml_id`,
      [nama, username, hashed, role, pml_id || null]
    );

    res.status(201).json({
      message: 'User berhasil dibuat',
      user: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({
      message: 'Gagal buat user',
      error: err.message
    });
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
    res.status(500).json({
      message: 'Gagal ambil data PML',
      error: err.message
    });
  }
};

// GET PPL berdasarkan PML
const getPPLByPML = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT id, nama, username
       FROM users
       WHERE role = $1 AND pml_id = $2
       ORDER BY nama`,
      ['ppl', id]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({
      message: 'Gagal ambil data PPL',
      error: err.message
    });
  }
};

// GET progress keseluruhan
const getDashboardProgress = async (req, res) => {
  try {
    const lapangan = await pool.query(
      'SELECT COALESCE(SUM(ke_lapangan), 0) AS total FROM input_harian'
    );
    const submit = await pool.query(
      'SELECT COALESCE(SUM(submit), 0) AS total FROM input_harian'
    );
    const approve = await pool.query(
      'SELECT COALESCE(SUM(approve), 0) AS total FROM input_harian'
    );

    const totalTarget = 97000;
    const lapanganVal = parseInt(lapangan.rows[0].total);
    const submitVal = parseInt(submit.rows[0].total);
    const approveVal = parseInt(approve.rows[0].total);

    res.json({
      sudahKeLapangan: lapanganVal,
      sudahKeLapanganPersen: Math.round((lapanganVal / totalTarget) * 100),
      submit: submitVal,
      submitPersen: Math.round((submitVal / totalTarget) * 100),
      approve: approveVal,
      approvePersen: Math.round((approveVal / totalTarget) * 100),
      target: totalTarget,
      belumPersen: Math.max(
        0,
        100 - Math.round((lapanganVal / totalTarget) * 100)
      ),
      submitChartPersen: Math.round((submitVal / totalTarget) * 100),
      approvePersen2:
        Math.round((approveVal / totalTarget) * 10) / 10,
      sudahKeLapanganChartPersen:
        Math.round((lapanganVal / totalTarget) * 100)
    });
  } catch (err) {
    res.status(500).json({
      message: 'Gagal ambil progress',
      error: err.message
    });
  }
};

// GET ringkasan petugas
const getDashboardPetugas = async (req, res) => {
  try {
    const totalPetugas = await pool.query(
      "SELECT COUNT(*) FROM users WHERE role IN ('pml','ppl')"
    );

    const totalPML = await pool.query(
      "SELECT COUNT(*) FROM users WHERE role = 'pml'"
    );

    const totalPPL = await pool.query(
      "SELECT COUNT(*) FROM users WHERE role = 'ppl'"
    );

    const aktif = await pool.query(
      "SELECT COUNT(*) FROM users WHERE role IN ('pml','ppl') AND is_logged_in = TRUE"
    );

    const totalP = parseInt(totalPetugas.rows[0].count);
    const aktifCount = parseInt(aktif.rows[0].count);

    res.json({
      totalPetugas: totalP,
      totalPML: parseInt(totalPML.rows[0].count),
      totalPPL: parseInt(totalPPL.rows[0].count),
      petugasAktif: aktifCount,
      petugasAktifPersen:
        totalP > 0 ? Math.round((aktifCount / totalP) * 100) : 0,
      lastUpdate: new Date().toLocaleString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    });
  } catch (err) {
    res.status(500).json({
      message: 'Gagal ambil data petugas',
      error: err.message
    });
  }
};

// GET data per kecamatan
const getDashboardKecamatan = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        w.kecamatan,
        w.kelurahan,
        w.id AS wilayah_id,
        COALESCE(SUM(i.ke_lapangan), 0) AS sudah_ke_lapangan,
        COALESCE(SUM(i.submit), 0) AS submit,
        COALESCE(SUM(i.approve), 0) AS approve
      FROM wilayah w
      LEFT JOIN input_harian i
        ON i.wilayah_id = w.id
      GROUP BY w.kecamatan, w.kelurahan, w.id
      ORDER BY w.kecamatan, w.kelurahan
    `);

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
          kelurahan: []
        };
      }

      const kec = kecamatanMap[row.kecamatan];

      kec.sudahKeLapangan += parseInt(row.sudah_ke_lapangan);
      kec.submit += parseInt(row.submit);
      kec.approve += parseInt(row.approve);

      kec.kelurahan.push({
        id: idx + 1,
        nama: row.kelurahan,
        sudahKeLapangan: parseInt(row.sudah_ke_lapangan),
        submit: parseInt(row.submit),
        approve: parseInt(row.approve),
        target: 0
      });
    });

    res.json(Object.values(kecamatanMap));
  } catch (err) {
    res.status(500).json({
      message: 'Gagal ambil data kecamatan',
      error: err.message
    });
  }
};

// GET detail petugas
const getDashboardPetugasDetail = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.id,
        u.nama,
        u.role AS tipe,
        u.pml_id,
        COALESCE(SUM(i.ke_lapangan), 0) AS sudah_ke_lapangan,
        COALESCE(SUM(i.submit), 0) AS submit,
        COALESCE(SUM(i.approve), 0) AS approve
      FROM users u
      LEFT JOIN input_harian i
        ON i.ppl_id = u.id
      WHERE u.role IN ('pml','ppl')
      GROUP BY u.id, u.nama, u.role, u.pml_id
      ORDER BY u.role, u.nama
    `);

    res.json(
      result.rows.map((r) => ({
        id: r.id,
        nama: r.nama,
        tipe: r.tipe.toUpperCase(),
        pml_id: r.pml_id,
        sudahKeLapangan: parseInt(r.sudah_ke_lapangan),
        submit: parseInt(r.submit),
        approve: parseInt(r.approve),
        target: 0
      }))
    );
  } catch (err) {
    res.status(500).json({
      message: 'Gagal ambil detail petugas',
      error: err.message
    });
  }
};

// GET sebaran petugas untuk peta
const getDashboardSebaranPetugas = async (req, res) => {
  try {
    // Ambil semua PML dan PPL beserta status login
    const users = await pool.query(`
      SELECT id, nama, role, pml_id, is_logged_in
      FROM users
      WHERE role IN ('pml','ppl')
      ORDER BY role, nama
    `);

    // Ambil lokasi terakhir setiap user
    const lokasi = await pool.query(`
      SELECT DISTINCT ON (user_id)
        user_id,
        latitude AS lat,
        longitude AS lng,
        recorded_at
      FROM lokasi
      ORDER BY user_id, recorded_at DESC
    `);

    // Buat mapping lokasi
    const lokasiMap = {};
    lokasi.rows.forEach((l) => {
      lokasiMap[l.user_id] = l;
    });

    // Gabungkan data user + lokasi
    const result = users.rows.map((u) => ({
      id: u.id,
      nama: u.nama,
      role: u.role,
      pml_id: u.pml_id,
      lat: lokasiMap[u.id]
        ? parseFloat(lokasiMap[u.id].lat)
        : null,
      lng: lokasiMap[u.id]
        ? parseFloat(lokasiMap[u.id].lng)
        : null,
      recorded_at: lokasiMap[u.id]?.recorded_at || null,
      online: u.is_logged_in, // langsung berdasarkan status login
      punya_lokasi: !!lokasiMap[u.id]
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({
      message: 'Gagal ambil sebaran petugas',
      error: err.message
    });
  }
};

// GET progress 15 hari terakhir
const getDashboardProgress15Hari = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        tanggal,
        COALESCE(SUM(ke_lapangan), 0) AS sudah_ke_lapangan,
        COALESCE(SUM(submit), 0) AS submit,
        COALESCE(SUM(approve), 0) AS approve
      FROM input_harian
      WHERE tanggal >= CURRENT_DATE - INTERVAL '15 days'
      GROUP BY tanggal
      ORDER BY tanggal ASC
    `);

    res.json(
      result.rows.map((r) => ({
        tanggal: new Date(r.tanggal).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short'
        }),
        sudahKeLapangan: parseInt(r.sudah_ke_lapangan),
        submit: parseInt(r.submit),
        approve: parseInt(r.approve)
      }))
    );
  } catch (err) {
    res.status(500).json({
      message: 'Gagal ambil progress 15 hari',
      error: err.message
    });
  }
};

// UPDATE user
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { nama, username, role, pml_id, password } = req.body;

  try {
    const cek = await pool.query(
      'SELECT id FROM users WHERE username = $1 AND id != $2',
      [username, id]
    );

    if (cek.rows.length > 0) {
      return res.status(400).json({
        message: 'Username sudah digunakan'
      });
    }

    if (password && password.trim() !== '') {
      const hashed = await bcrypt.hash(password, 10);

      await pool.query(
        `UPDATE users
         SET nama = $1,
             username = $2,
             role = $3,
             pml_id = $4,
             password = $5
         WHERE id = $6`,
        [
          nama,
          username,
          role,
          role === 'ppl' ? pml_id : null,
          hashed,
          id
        ]
      );
    } else {
      await pool.query(
        `UPDATE users
         SET nama = $1,
             username = $2,
             role = $3,
             pml_id = $4
         WHERE id = $5`,
        [
          nama,
          username,
          role,
          role === 'ppl' ? pml_id : null,
          id
        ]
      );
    }

    res.json({ message: 'User berhasil diupdate' });
  } catch (err) {
    res.status(500).json({
      message: 'Gagal update user',
      error: err.message
    });
  }
};

// DELETE user
const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);

    res.json({
      message: 'User berhasil dihapus'
    });
  } catch (err) {
    res.status(500).json({
      message: 'Gagal hapus user',
      error: err.message
    });
  }
};

// GET wilayah
const getWilayah = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        w.*,
        pml.nama AS nama_pml,
        ppl.nama AS nama_ppl
      FROM wilayah w
      LEFT JOIN users pml ON w.pml_id = pml.id
      LEFT JOIN users ppl ON w.ppl_id = ppl.id
      ORDER BY w.kecamatan, w.kelurahan
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({
      message: 'Gagal ambil wilayah',
      error: err.message
    });
  }
};

// CREATE wilayah
const createWilayah = async (req, res) => {
  const { kecamatan, kelurahan, pml_id, ppl_id } = req.body;

  try {
    await pool.query(
      `INSERT INTO wilayah
       (kecamatan, kelurahan, pml_id, ppl_id)
       VALUES ($1,$2,$3,$4)`,
      [
        kecamatan,
        kelurahan,
        pml_id || null,
        ppl_id || null
      ]
    );

    res.json({
      message: 'Wilayah berhasil ditambahkan'
    });
  } catch (err) {
    res.status(500).json({
      message: 'Gagal tambah wilayah',
      error: err.message
    });
  }
};

// UPDATE wilayah
const updateWilayah = async (req, res) => {
  const { id } = req.params;
  const { kecamatan, kelurahan, pml_id, ppl_id } = req.body;

  try {
    await pool.query(
      `UPDATE wilayah
       SET kecamatan = $1,
           kelurahan = $2,
           pml_id = $3,
           ppl_id = $4
       WHERE id = $5`,
      [
        kecamatan,
        kelurahan,
        pml_id || null,
        ppl_id || null,
        id
      ]
    );

    res.json({
      message: 'Wilayah berhasil diupdate'
    });
  } catch (err) {
    res.status(500).json({
      message: 'Gagal update wilayah',
      error: err.message
    });
  }
};

// DELETE wilayah
const deleteWilayah = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(
      'DELETE FROM wilayah WHERE id = $1',
      [id]
    );

    res.json({
      message: 'Wilayah berhasil dihapus'
    });
  } catch (err) {
    res.status(500).json({
      message: 'Gagal hapus wilayah',
      error: err.message
    });
  }
};

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getPMLList,
  getPPLByPML,
  getDashboardProgress,
  getDashboardPetugas,
  getDashboardKecamatan,
  getDashboardPetugasDetail,
  getDashboardSebaranPetugas,
  getDashboardProgress15Hari,
  getWilayah,
  createWilayah,
  updateWilayah,
  deleteWilayah
};