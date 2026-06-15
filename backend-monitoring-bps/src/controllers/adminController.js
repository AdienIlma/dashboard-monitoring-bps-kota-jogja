const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const XLSX = require('xlsx');
const multer = require('multer');

// Multer: simpan file sementara di memory
const upload = multer({ storage: multer.memoryStorage() });

const syncWilayahPplId = async (pool, userId, wilayahIds) => {
  // 1. Reset semua wilayah yang sebelumnya milik user ini
  await pool.query(`UPDATE wilayah SET ppl_id = NULL WHERE ppl_id = ?`, [userId]);

  // 2. Hapus semua relasi lama di user_sls
  await pool.query(`DELETE FROM user_sls WHERE user_id = ?`, [userId]);

  // 3. Insert relasi baru + set ppl_id di tabel wilayah
  for (const wilayahId of wilayahIds) {
    await pool.query(
      `INSERT INTO user_sls (user_id, wilayah_id)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE user_id = user_id`,
      [userId, wilayahId]
    );
    await pool.query(
      `UPDATE wilayah SET ppl_id = ? WHERE id = ?`,
      [userId, wilayahId]
    );
  }
};

// CREATE user (manual form)

const createUser = async (req, res) => {
  const {
    nama,
    email,
    password,
    role,
    pml_id,
    nomor_whatsapp,
    wilayah_ids = []
  } = req.body;

  if (!nama || !email || !password || !role) {
    return res.status(400).json({ message: 'nama, email, password, role wajib diisi' });
  }
  if (!['admin', 'pml', 'ppl'].includes(role)) {
    return res.status(400).json({ message: 'Role tidak valid' });
  }
  if (role === 'ppl' && !pml_id) {
    return res.status(400).json({ message: 'PPL harus punya PML' });
  }

  try {
    const [cekRows] = await pool.query('SELECT id FROM users WHERE username = ?', [email]);
    if (cekRows.length > 0) {
      return res.status(400).json({ message: 'Email sudah dipakai' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO users (nama, username, password, role, pml_id, nomor_whatsapp)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nama,
        email,
        hashed,
        role,
        role === 'ppl' ? pml_id : null,
        nomor_whatsapp || null
      ]
    );

    const userId = result.insertId;

    const [userRows] = await pool.query(
      `SELECT id, nama, username AS email, role, pml_id, nomor_whatsapp, created_at
       FROM users WHERE id = ?`,
      [userId]
    );
    const user = userRows[0];

    if (role === 'ppl' && Array.isArray(wilayah_ids) && wilayah_ids.length > 0) {
      await syncWilayahPplId(pool, userId, wilayah_ids.map(Number));
    }

    res.status(201).json({ message: 'User berhasil dibuat', user });
  } catch (err) {
    console.error('❌ createUser ERROR:', err.message);
    res.status(500).json({ message: 'Gagal buat user', error: err.message });
  }
};

// UPDATE user

const updateUser = async (req, res) => {
  const { id } = req.params;
  const {
    nama,
    email,
    role,
    pml_id,
    password,
    nomor_whatsapp,
    wilayah_ids = []
  } = req.body;

  try {
    const [cekRows] = await pool.query(
      'SELECT id FROM users WHERE username = ? AND id != ?',
      [email, id]
    );
    if (cekRows.length > 0) {
      return res.status(400).json({ message: 'Email sudah digunakan' });
    }

    if (password && password.trim() !== '') {
      const hashed = await bcrypt.hash(password, 10);
      await pool.query(
        `UPDATE users
         SET nama = ?, username = ?, role = ?, pml_id = ?,
             nomor_whatsapp = ?, password = ?
         WHERE id = ?`,
        [nama, email, role, role === 'ppl' ? pml_id : null, nomor_whatsapp || null, hashed, id]
      );
    } else {
      await pool.query(
        `UPDATE users
         SET nama = ?, username = ?, role = ?, pml_id = ?, nomor_whatsapp = ?
         WHERE id = ?`,
        [nama, email, role, role === 'ppl' ? pml_id : null, nomor_whatsapp || null, id]
      );
    }

    if (role === 'ppl') {
      await syncWilayahPplId(pool, Number(id), wilayah_ids.map(Number));
    } else {
      await pool.query(`UPDATE wilayah SET ppl_id = NULL WHERE ppl_id = ?`, [id]);
      await pool.query(`DELETE FROM user_sls WHERE user_id = ?`, [id]);
    }

    res.json({ message: 'User berhasil diupdate' });
  } catch (err) {
    console.error('❌ updateUser ERROR:', err.message);
    res.status(500).json({ message: 'Gagal update user', error: err.message });
  }
};

// DELETE user (single)

const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'User berhasil dihapus' });
  } catch (err) {
    console.error('❌ deleteUser ERROR:', err.message);
    res.status(500).json({ message: 'Gagal hapus user', error: err.message });
  }
};

// DELETE bulk

const deleteUsersBulk = async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'IDs tidak boleh kosong' });
  }

  try {
    const placeholders = ids.map(() => '?').join(',');
    await pool.query(
      `DELETE FROM users WHERE id IN (${placeholders})`,
      ids
    );
    res.json({ message: `${ids.length} user berhasil dihapus` });
  } catch (err) {
    console.error('❌ deleteUsersBulk ERROR:', err.message);
    res.status(500).json({ message: 'Gagal hapus bulk', error: err.message });
  }
};
// IMPORT dari Excel

const importUsers = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'File Excel tidak ditemukan' });
  }

  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (rows.length === 0) {
      return res.status(400).json({ message: 'File Excel kosong' });
    }

    const results = { berhasil: 0, gagal: [], total: rows.length };

    const normalized = rows.map((row) => ({
      nama:           String(row['nama']           || row['Nama']           || '').trim(),
      email:          String(row['email']          || row['Email']          || '').trim().toLowerCase(),
      password:       String(row['password']       || row['Password']       || '').trim(),
      role:           String(row['role']           || row['Role']           || 'ppl').trim().toLowerCase(),
      nomor_whatsapp: String(row['nomor_whatsapp'] || row['NoWA'] || row['no_wa'] || '').trim(),
      pml_email:      String(row['pml_email']      || row['PML Email']      || '').trim().toLowerCase(),
      kode_sls_raw:   String(row['kode_sls']       || row['Kode SLS']       || '').trim(),
    }));

    const processRow = async (row, allowedRoles) => {
      const { nama, email, password, role, nomor_whatsapp, pml_email, kode_sls_raw } = row;

      if (!allowedRoles.includes(role)) return;

      if (!nama || !email || !password) {
        results.gagal.push({ email: email || '(kosong)', alasan: 'nama, email, password wajib diisi' });
        return;
      }
      if (!['admin', 'pml', 'ppl'].includes(role)) {
        results.gagal.push({ email, alasan: `Role "${role}" tidak valid` });
        return;
      }

      try {
        const [cekRows] = await pool.query('SELECT id FROM users WHERE username = ?', [email]);
        if (cekRows.length > 0) {
          results.gagal.push({ email, alasan: 'Email sudah dipakai' });
          return;
        }

        let pml_id = null;
        if (role === 'ppl') {
          if (!pml_email) {
            results.gagal.push({ email, alasan: 'PPL harus mengisi kolom pml_email' });
            return;
          }
          const [pmlRows] = await pool.query(
            `SELECT id FROM users WHERE username = ? AND role = 'pml'`,
            [pml_email]
          );
          if (pmlRows.length === 0) {
            results.gagal.push({ email, alasan: `PML dengan email "${pml_email}" tidak ditemukan` });
            return;
          }
          pml_id = pmlRows[0].id;
        }

        const wilayah_ids = [];
        if (role === 'ppl') {
          if (!kode_sls_raw) {
            results.gagal.push({ email, alasan: 'PPL harus mengisi kolom kode_sls' });
            return;
          }

          const kodeSls = kode_sls_raw.split(',').map((k) => k.trim()).filter(Boolean);
          for (const kode of kodeSls) {
            const [wRows] = await pool.query('SELECT id FROM wilayah WHERE kode_sls = ?', [kode]);
            if (wRows.length === 0) {
              results.gagal.push({ email, alasan: `Kode SLS "${kode}" tidak ditemukan` });
              return;
            }
            wilayah_ids.push(wRows[0].id);
          }
        }

        const hashed = await bcrypt.hash(password, 10);
        const [inserted] = await pool.query(
          `INSERT INTO users (nama, username, password, role, pml_id, nomor_whatsapp)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [nama, email, hashed, role, pml_id, nomor_whatsapp || null]
        );

        if (role === 'ppl' && wilayah_ids.length > 0) {
          await syncWilayahPplId(pool, inserted.insertId, wilayah_ids);
        }

        results.berhasil++;
      } catch (rowErr) {
        results.gagal.push({ email, alasan: rowErr.message });
      }
    };

    // PASS 1: admin & PML dulu
    for (const row of normalized) {
      await processRow(row, ['admin', 'pml']);
    }

    // PASS 2: PPL
    for (const row of normalized) {
      await processRow(row, ['ppl']);
    }

    res.status(201).json({
      message: `Import selesai: ${results.berhasil} berhasil, ${results.gagal.length} gagal dari ${results.total} baris`,
      berhasil: results.berhasil,
      gagal:    results.gagal,
      total:    results.total
    });
  } catch (err) {
    console.error('❌ importUsers ERROR:', err.message);
    res.status(500).json({ message: 'Gagal proses file Excel', error: err.message });
  }
};

// ────────────────────────────────────────────────────────────────────
// GET all users
// ────────────────────────────────────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        u.id,
        u.nama,
        u.username AS email,
        u.role,
        u.pml_id,
        u.nomor_whatsapp,
        u.is_logged_in,
        u.created_at,

        COALESCE(
          GROUP_CONCAT(us.wilayah_id),
          ''
        ) AS wilayah_ids,

        COALESCE(
          SUM(w.target),
          0
        ) AS target

      FROM users u
      LEFT JOIN user_sls us
        ON us.user_id = u.id
      LEFT JOIN wilayah w
        ON w.id = us.wilayah_id

      GROUP BY
        u.id,
        u.nama,
        u.username,
        u.role,
        u.pml_id,
        u.nomor_whatsapp,
        u.is_logged_in,
        u.created_at

      ORDER BY u.created_at ASC
    `);

    const formatted = rows.map(user => ({
      ...user,
      wilayah_ids:
        user.wilayah_ids
          ? user.wilayah_ids.split(',').map(Number)
          : []
    }));

    res.json(formatted);

  } catch (err) {
    console.error('❌ getAllUsers ERROR:', err.message);

    res.status(500).json({
      message: 'Gagal ambil users',
      error: err.message
    });
  }
};

// GET semua PML
const getPMLList = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, nama, username AS email FROM users WHERE role = ? ORDER BY nama",
      ["pml"],
    );
    res.json(rows);
  } catch (err) {
    console.error('❌ getPMLList ERROR:', err.message);
    res.status(500).json({ message: "Gagal ambil data PML", error: err.message });
  }
};

// GET PPL berdasarkan PML
const getPPLByPML = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT id, nama, username AS email
       FROM users
       WHERE role = ? AND pml_id = ?
       ORDER BY nama`,
      ["ppl", id],
    );
    res.json(rows);
  } catch (err) {
    console.error('❌ getPPLByPML ERROR:', err.message);
    res.status(500).json({ message: "Gagal ambil data PPL", error: err.message });
  }
};

// GET progress keseluruhan
const getDashboardProgress = async (req, res) => {
  try {
    const [progressRows] = await pool.query(`
      SELECT
        COALESCE(SUM(ke_lapangan), 0) AS lapangan,
        COALESCE(SUM(submit), 0)      AS submit,
        COALESCE(SUM(approve), 0)     AS approve
      FROM input_harian
    `);

    const [targetRows] = await pool.query(`
      SELECT COALESCE(SUM(target), 0) AS total_target
      FROM wilayah
      WHERE kode_sls IS NOT NULL
        AND kode_sls <> ''
    `);

    const totalTarget  = parseInt(targetRows[0].total_target || 0);
    const lapanganVal  = parseInt(progressRows[0].lapangan || 0);
    const submitVal    = parseInt(progressRows[0].submit || 0);
    const approveVal   = parseInt(progressRows[0].approve || 0);

    const pct = (val) =>
      totalTarget > 0
        ? parseFloat(((val / totalTarget) * 100).toFixed(2))
        : 0;

    res.json({
      sudahKeLapangan:          lapanganVal,
      sudahKeLapanganPersen:    pct(lapanganVal),
      sudahKeLapanganChartPersen: pct(lapanganVal),
      submit:                   submitVal,
      submitPersen:             pct(submitVal),
      submitChartPersen:        pct(submitVal),
      approve:                  approveVal,
      approvePersen:            pct(approveVal),
      approvePersen2:           pct(approveVal),
      target:                   totalTarget,
      belumPersen:              parseFloat((100 - pct(approveVal)).toFixed(2)),
    });
  } catch (err) {
    console.error('❌ getDashboardProgress ERROR:', err.message);
    res.status(500).json({ message: 'Gagal ambil progress', error: err.message });
  }
};

// GET ringkasan petugas
const getDashboardPetugas = async (req, res) => {
  try {
    const [[totalPetugasRow]] = await pool.query(
      "SELECT COUNT(*) AS count FROM users WHERE role IN ('pml','ppl')",
    );
    const [[totalPMLRow]] = await pool.query(
      "SELECT COUNT(*) AS count FROM users WHERE role = 'pml'",
    );
    const [[totalPPLRow]] = await pool.query(
      "SELECT COUNT(*) AS count FROM users WHERE role = 'ppl'",
    );
    const [[aktifRow]] = await pool.query(
      "SELECT COUNT(*) AS count FROM users WHERE role IN ('pml','ppl') AND is_logged_in = TRUE",
    );

    const totalP     = parseInt(totalPetugasRow.count);
    const aktifCount = parseInt(aktifRow.count);

    res.json({
      totalPetugas:       totalP,
      totalPML:           parseInt(totalPMLRow.count),
      totalPPL:           parseInt(totalPPLRow.count),
      petugasAktif:       aktifCount,
      petugasAktifPersen: totalP > 0 ? Math.round((aktifCount / totalP) * 100) : 0,
      lastUpdate:         new Date().toLocaleString("id-ID", {
        day: "numeric", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      }),
    });
  } catch (err) {
    console.error('❌ getDashboardPetugas ERROR:', err.message);
    res.status(500).json({ message: "Gagal ambil data petugas", error: err.message });
  }
};

// helper shared
function buildKecamatanMap(rows) {
  const kecamatanMap = {};

  rows.forEach((row, idx) => {
    if (!kecamatanMap[row.kecamatan]) {
      kecamatanMap[row.kecamatan] = {
        id:              Object.keys(kecamatanMap).length + 1,
        nama:            row.kecamatan,
        sudahKeLapangan: 0,
        submit:          0,
        approve:         0,
        target:          0,
        kelurahan:       [],
      };
    }

    const kec    = kecamatanMap[row.kecamatan];
    const target = parseInt(row.target || 0);

    kec.sudahKeLapangan += parseInt(row.sudah_ke_lapangan);
    kec.submit          += parseInt(row.submit);
    kec.approve         += parseInt(row.approve);
    kec.target          += target;

    kec.kelurahan.push({
      id:              idx + 1,
      nama:            row.kelurahan,
      sudahKeLapangan: parseInt(row.sudah_ke_lapangan),
      submit:          parseInt(row.submit),
      approve:         parseInt(row.approve),
      target:          target,
    });
  });

  return Object.values(kecamatanMap);
}

// GET data per kecamatan (total)
const getDashboardKecamatan = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        w.kecamatan,
        w.kelurahan,
        SUM(w.target) AS target,
        COALESCE(SUM(i.ke_lapangan), 0) AS sudah_ke_lapangan,
        COALESCE(SUM(i.submit), 0)      AS submit,
        COALESCE(SUM(i.approve), 0)     AS approve
      FROM wilayah w
      LEFT JOIN input_harian i ON i.wilayah_id = w.id
      GROUP BY w.kecamatan, w.kelurahan
      ORDER BY w.kecamatan, w.kelurahan
    `);
    res.json(buildKecamatanMap(rows));
  } catch (err) {
    console.error('❌ getDashboardKecamatan ERROR:', err.message);
    res.status(500).json({ message: "Gagal ambil data kecamatan", error: err.message });
  }
};

// GET data per kecamatan (harian)
const getDashboardKecamatanHarian = async (req, res) => {
  try {
    const { tanggal } = req.query;
    const targetDate  = tanggal || new Date(Date.now() - 86400000).toISOString().split("T")[0];

    const [rows] = await pool.query(`
      SELECT
        w.kecamatan,
        w.kelurahan,
        SUM(w.target) AS target,
        COALESCE(SUM(i.ke_lapangan), 0) AS sudah_ke_lapangan,
        COALESCE(SUM(i.submit), 0)      AS submit,
        COALESCE(SUM(i.approve), 0)     AS approve
      FROM wilayah w
      LEFT JOIN input_harian i
        ON i.wilayah_id = w.id AND i.tanggal = ?
      GROUP BY w.kecamatan, w.kelurahan
      ORDER BY w.kecamatan, w.kelurahan
    `, [targetDate]);

    res.json(buildKecamatanMap(rows));
  } catch (err) {
    console.error('❌ getDashboardKecamatanHarian ERROR:', err.message);
    res.status(500).json({ message: "Gagal ambil data harian", error: err.message });
  }
};

// GET detail petugas
const getDashboardPetugasDetail = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        u.id,
        u.nama,
        u.role AS tipe,
        u.pml_id,
        COALESCE((
          SELECT SUM(w.target)
          FROM user_sls us
          JOIN wilayah w ON w.id = us.wilayah_id
          WHERE us.user_id = u.id
        ), u.target, 0) AS target,
        COALESCE(SUM(i.ke_lapangan), 0) AS sudah_ke_lapangan,
        COALESCE(SUM(i.submit), 0)       AS submit,
        COALESCE(SUM(i.approve), 0)      AS approve,
        COUNT(DISTINCT CASE WHEN i.pml_hadir = TRUE THEN i.tanggal END) AS jumlah_hadir,
        (
          SELECT COUNT(DISTINCT ih.tanggal)
          FROM input_harian ih
          JOIN users ppl ON ppl.id = ih.ppl_id
          WHERE ppl.pml_id = u.id AND ih.pml_hadir = TRUE
        ) AS jumlah_hadir_pml
      FROM users u
      LEFT JOIN input_harian i ON i.ppl_id = u.id
      WHERE u.role IN ('pml', 'ppl')
      GROUP BY u.id, u.nama, u.role, u.pml_id
      ORDER BY u.role, u.nama
    `);

    res.json(
      rows.map((r) => ({
        id:              r.id,
        nama:            r.nama,
        tipe:            r.tipe.toUpperCase(),
        pml_id:          r.pml_id,
        sudahKeLapangan: parseInt(r.sudah_ke_lapangan),
        submit:          parseInt(r.submit),
        approve:         parseInt(r.approve),
        target:          parseInt(r.target || 0),
        jumlahHadir:     r.tipe === "pml"
          ? parseInt(r.jumlah_hadir_pml || 0)
          : parseInt(r.jumlah_hadir || 0),
      }))
    );
  } catch (err) {
    console.error('❌ getDashboardPetugasDetail ERROR:', err.message);
    res.status(500).json({ message: "Gagal ambil detail petugas", error: err.message });
  }
};

const getDashboardPetugasDetailHarian = async (req, res) => {
  try {
    const { tanggal } = req.query;

    const [rows] = await pool.query(`
      SELECT
        u.id,
        u.nama,
        u.role AS tipe,
        u.pml_id,
        COALESCE((
          SELECT SUM(w.target)
          FROM user_sls us
          JOIN wilayah w ON w.id = us.wilayah_id
          WHERE us.user_id = u.id
        ), u.target, 0) AS target,
        COALESCE(SUM(i.ke_lapangan), 0) AS sudah_ke_lapangan,
        COALESCE(SUM(i.submit), 0)       AS submit,
        COALESCE(SUM(i.approve), 0)      AS approve,
        MAX(IF(i.pml_hadir = TRUE, 1, 0)) AS pml_hadir_hari_ini,
        (
          SELECT MAX(IF(ih.pml_hadir = TRUE, 1, 0))
          FROM input_harian ih
          JOIN users ppl ON ppl.id = ih.ppl_id
          WHERE ppl.pml_id = u.id AND ih.tanggal = ?
        ) AS pml_hadir_sebagai_pml
      FROM users u
      LEFT JOIN input_harian i
        ON i.ppl_id = u.id AND i.tanggal = ?
      WHERE u.role IN ('pml', 'ppl')
      GROUP BY u.id, u.nama, u.role, u.pml_id, u.target
      ORDER BY u.role, u.nama
    `, [tanggal, tanggal]);

    res.json(
      rows.map((r) => ({
        id:                   r.id,
        nama:                 r.nama,
        tipe:                 r.tipe.toUpperCase(),
        pml_id:               r.pml_id,
        sudahKeLapangan:      parseInt(r.sudah_ke_lapangan),
        submit:               parseInt(r.submit),
        approve:              parseInt(r.approve),
        target:               parseInt(r.target || 0),
        hadirHariIni:         r.pml_hadir_hari_ini ? 1 : 0,
        pmlHadirSebagaiPml:   r.pml_hadir_sebagai_pml ? 1 : 0,
      }))
    );
  } catch (err) {
    console.error('❌ getDashboardPetugasDetailHarian ERROR:', err.message);
    res.status(500).json({ message: "Gagal ambil detail petugas harian", error: err.message });
  }
};

// GET sebaran petugas untuk peta
const getDashboardSebaranPetugas = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        u.id,
        u.nama,
        u.role,
        u.pml_id,
        u.nomor_whatsapp,
        l.latitude  AS lat,
        l.longitude AS lng,
        l.recorded_at,
        w.kecamatan,
        w.kelurahan,
        CASE
          WHEN u.is_logged_in = TRUE   
          THEN TRUE
          ELSE FALSE
        END AS online,
        CASE
          WHEN l.latitude IS NOT NULL AND l.longitude IS NOT NULL
          THEN TRUE
          ELSE FALSE
        END AS punya_lokasi
      FROM users u
      LEFT JOIN lokasi l ON l.id = (
        SELECT id FROM lokasi
        WHERE user_id = u.id
        ORDER BY recorded_at DESC
        LIMIT 1
      )
      LEFT JOIN wilayah w ON w.ppl_id = u.id
    `);

    res.json(rows);
  } catch (err) {
    console.error('❌ getDashboardSebaranPetugas ERROR:', err.message);
    res.status(500).json({ message: 'Gagal ambil sebaran petugas', error: err.message });
  }
};

// GET progress harian (semua data, filter dilakukan di frontend)
const getDashboardProgress15Hari = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        DATE(tanggal) AS tanggal,
        COALESCE(SUM(ke_lapangan), 0) AS ke_lapangan,
        COALESCE(SUM(submit), 0)      AS submit,
        COALESCE(SUM(approve), 0)     AS approve
      FROM input_harian
      GROUP BY DATE(tanggal)
      ORDER BY DATE(tanggal) ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error('❌ getDashboardProgress15Hari ERROR:', err.message);
    res.status(500).json({ message: 'Gagal ambil progress harian', error: err.message });
  }
};

// ────────────────────────────────────────────────────────────────────
// WILAYAH
// ────────────────────────────────────────────────────────────────────
const getWilayah = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        w.*,
        pml.nama AS nama_pml,
        us.user_id AS ppl_id_sls
      FROM wilayah w
      LEFT JOIN users pml ON w.pml_id = pml.id
      LEFT JOIN user_sls us ON us.wilayah_id = w.id
      ORDER BY w.kecamatan, w.kelurahan
    `);

    res.json(rows.map(r => ({
      ...r,
      ppl_id: r.ppl_id_sls ?? r.ppl_id,
    })));
  } catch (err) {
    console.error('❌ getWilayah ERROR:', err.message);
    res.status(500).json({ message: 'Gagal ambil wilayah', error: err.message });
  }
};

const createWilayah = async (req, res) => {
  const { kode_sls, kecamatan, kelurahan, pml_id, ppl_id, target } = req.body;
  try {
    await pool.query(
      `INSERT INTO wilayah (kode_sls, kecamatan, kelurahan, pml_id, ppl_id, target)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [kode_sls || null, kecamatan, kelurahan, pml_id || null, ppl_id || null, Number(target) || 0]
    );
    res.json({ message: 'Wilayah berhasil ditambahkan' });
  } catch (err) {
    console.error('❌ createWilayah ERROR:', err.message);
    res.status(500).json({ message: 'Gagal tambah wilayah', error: err.message });
  }
};

const updateWilayah = async (req, res) => {
  const { id } = req.params;
  const { kode_sls, kecamatan, kelurahan, pml_id, ppl_id, target } = req.body;
  try {
    await pool.query(
      `UPDATE wilayah
       SET kode_sls = ?, kecamatan = ?, kelurahan = ?,
           pml_id = ?, ppl_id = ?, target = ?
       WHERE id = ?`,
      [kode_sls || null, kecamatan, kelurahan, pml_id || null, ppl_id || null, Number(target) || 0, id]
    );
    res.json({ message: 'Wilayah berhasil diupdate' });
  } catch (err) {
    console.error('❌ updateWilayah ERROR:', err.message);
    res.status(500).json({ message: 'Gagal update wilayah', error: err.message });
  }
};

const deleteWilayah = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM wilayah WHERE id = ?', [id]);
    res.json({ message: 'Wilayah berhasil dihapus' });
  } catch (err) {
    console.error('❌ deleteWilayah ERROR:', err.message);
    res.status(500).json({ message: 'Gagal hapus wilayah', error: err.message });
  }
};

const deleteWilayahBulk = async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'IDs tidak boleh kosong' });
  }
  try {
    const placeholders = ids.map(() => '?').join(',');
    await pool.query(`DELETE FROM wilayah WHERE id IN (${placeholders})`, ids);
    res.json({ message: `${ids.length} wilayah berhasil dihapus` });
  } catch (err) {
    console.error('❌ deleteWilayahBulk ERROR:', err.message);
    res.status(500).json({ message: 'Gagal hapus bulk wilayah', error: err.message });
  }
};

const importWilayah = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'File Excel tidak ditemukan' });
  }

  try {
    const workbook  = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet     = workbook.Sheets[sheetName];
    const rows      = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (rows.length === 0) {
      return res.status(400).json({ message: 'File Excel kosong' });
    }

    const results = { berhasil: 0, dilewati: 0, gagal: [], total: rows.length };

    const normalized = rows.map((row) => ({
      kecamatan: String(row['kecamatan'] || row['Kecamatan'] || '').trim(),
      kelurahan: String(row['kelurahan'] || row['Kelurahan'] || '').trim(),
      kode_sls:  String(row['kode_sls']  || row['Kode SLS']  || row['kode SLS'] || '').trim(),
      target:    Number(row['target']    || row['Target']    || 0),
    }));

    for (const row of normalized) {
      const { kecamatan, kelurahan, kode_sls, target } = row;

      if (!kecamatan) {
        results.gagal.push({ baris: kelurahan || '?', alasan: 'kolom kecamatan wajib diisi' });
        continue;
      }
      if (!kode_sls) {
        results.gagal.push({ baris: `${kelurahan}/${kecamatan}`, alasan: 'kolom kode_sls wajib diisi' });
        continue;
      }

      try {
        const [cekRows] = await pool.query('SELECT id FROM wilayah WHERE kode_sls = ?', [kode_sls]);
        if (cekRows.length > 0) {
          results.dilewati++;
          continue;
        }

        await pool.query(
          `INSERT INTO wilayah (kecamatan, kelurahan, kode_sls, target)
           VALUES (?, ?, ?, ?)`,
          [kecamatan, kelurahan || '', kode_sls, target]
        );
        results.berhasil++;
      } catch (rowErr) {
        results.gagal.push({ baris: kode_sls, alasan: rowErr.message });
      }
    }

    res.status(201).json({
      message: `Import selesai: ${results.berhasil} berhasil, ${results.dilewati} dilewati (duplikat), ${results.gagal.length} gagal dari ${results.total} baris`,
      berhasil: results.berhasil,
      dilewati: results.dilewati,
      gagal:    results.gagal,
      total:    results.total,
    });
  } catch (err) {
    console.error('❌ importWilayah ERROR:', err.message);
    res.status(500).json({ message: 'Gagal proses file Excel', error: err.message });
  }
};

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  deleteUsersBulk,
  importUsers,
  getPMLList,
  getPPLByPML,
  getWilayah,
  createWilayah,
  updateWilayah,
  deleteWilayah,
  deleteWilayahBulk,
  importWilayah,
  getDashboardProgress,
  getDashboardProgress15Hari,
  getDashboardPetugas,
  getDashboardKecamatan,
  getDashboardKecamatanHarian,
  getDashboardPetugasDetail,
  getDashboardPetugasDetailHarian,
  getDashboardSebaranPetugas,
  upload,
};