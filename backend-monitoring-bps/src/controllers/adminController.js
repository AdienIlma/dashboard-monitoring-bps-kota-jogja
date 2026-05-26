const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const XLSX = require('xlsx');
const multer = require('multer');

// Multer: simpan file sementara di memory
const upload = multer({ storage: multer.memoryStorage() });

const syncWilayahPplId = async (pool, userId, wilayahIds) => {
  // 1. Reset semua wilayah yang sebelumnya milik user ini
  await pool.query(`UPDATE wilayah SET ppl_id = NULL WHERE ppl_id = $1`, [userId]);
 
  // 2. Hapus semua relasi lama di user_sls
  await pool.query(`DELETE FROM user_sls WHERE user_id = $1`, [userId]);
 
  // 3. Insert relasi baru + set ppl_id di tabel wilayah
  for (const wilayahId of wilayahIds) {
    await pool.query(
      `INSERT INTO user_sls (user_id, wilayah_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, wilayah_id) DO NOTHING`,
      [userId, wilayahId]
    );
    await pool.query(
      `UPDATE wilayah SET ppl_id = $1 WHERE id = $2`,
      [userId, wilayahId]
    );
  }
};
 
// ────────────────────────────────────────────────────────────────────
// CREATE user (manual form)
// ────────────────────────────────────────────────────────────────────
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
 
  // Validasi wajib
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
    // Cek duplikat email
    const cek = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (cek.rows.length > 0) {
      return res.status(400).json({ message: 'Email sudah dipakai' });
    }
 
    const hashed = await bcrypt.hash(password, 10);
 
    // Insert user (tanpa kolom target — diambil dari wilayah.target)
    const result = await pool.query(
      `INSERT INTO users (nama, email, password, role, pml_id, nomor_whatsapp)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, nama, email, role, pml_id, nomor_whatsapp, created_at`,
      [
        nama,
        email,
        hashed,
        role,
        role === 'ppl' ? pml_id : null,
        nomor_whatsapp || null
      ]
    );
 
    const user = result.rows[0];
 
    // Jika PPL, sync wilayah
    if (role === 'ppl' && Array.isArray(wilayah_ids) && wilayah_ids.length > 0) {
      await syncWilayahPplId(pool, user.id, wilayah_ids.map(Number));
    }
 
    res.status(201).json({ message: 'User berhasil dibuat', user });
  } catch (err) {
    res.status(500).json({ message: 'Gagal buat user', error: err.message });
  }
};
 
// ────────────────────────────────────────────────────────────────────
// UPDATE user
// ────────────────────────────────────────────────────────────────────
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
    // Cek duplikat email (exclude id sendiri)
    const cek = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, id]
    );
    if (cek.rows.length > 0) {
      return res.status(400).json({ message: 'Email sudah digunakan' });
    }
 
    // Update dengan atau tanpa password
    if (password && password.trim() !== '') {
      const hashed = await bcrypt.hash(password, 10);
      await pool.query(
        `UPDATE users
         SET nama = $1, email = $2, role = $3, pml_id = $4,
             nomor_whatsapp = $5, password = $6
         WHERE id = $7`,
        [nama, email, role, role === 'ppl' ? pml_id : null, nomor_whatsapp || null, hashed, id]
      );
    } else {
      await pool.query(
        `UPDATE users
         SET nama = $1, email = $2, role = $3, pml_id = $4, nomor_whatsapp = $5
         WHERE id = $6`,
        [nama, email, role, role === 'ppl' ? pml_id : null, nomor_whatsapp || null, id]
      );
    }
 
    // Sync wilayah: PPL → update, selain PPL → bersihkan semua relasinya
    if (role === 'ppl') {
      await syncWilayahPplId(pool, Number(id), wilayah_ids.map(Number));
    } else {
      // Jika role bukan PPL lagi, bersihkan relasi lama
      await pool.query(`UPDATE wilayah SET ppl_id = NULL WHERE ppl_id = $1`, [id]);
      await pool.query(`DELETE FROM user_sls WHERE user_id = $1`, [id]);
    }
 
    res.json({ message: 'User berhasil diupdate' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal update user', error: err.message });
  }
};
 
// ────────────────────────────────────────────────────────────────────
// DELETE user (single)
// ON DELETE CASCADE di user_sls & ON DELETE SET NULL di wilayah sudah
// handle otomatis oleh PostgreSQL
// ────────────────────────────────────────────────────────────────────
const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal hapus user', error: err.message });
  }
};
 
// ────────────────────────────────────────────────────────────────────
// DELETE bulk (banyak sekaligus)
// ────────────────────────────────────────────────────────────────────
const deleteUsersBulk = async (req, res) => {
  const { ids } = req.body; // array of integer id
 
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'IDs tidak boleh kosong' });
  }
 
  try {
    // user_sls → ON DELETE CASCADE (otomatis), tapi wilayah.ppl_id → SET NULL
    // PostgreSQL handle keduanya otomatis karena constraint ON DELETE
    await pool.query(
      `DELETE FROM users WHERE id = ANY($1::int[])`,
      [ids]
    );
 
    res.json({ message: `${ids.length} user berhasil dihapus` });
  } catch (err) {
    res.status(500).json({ message: 'Gagal hapus bulk', error: err.message });
  }
};
 
// ────────────────────────────────────────────────────────────────────
// IMPORT dari Excel (.xlsx / .xls)
// Format kolom Excel yang didukung:
//   nama | email | password | role | nomor_whatsapp | pml_email | kode_sls
//
// kode_sls  → string dipisah koma, contoh: "001A,001B,002A"
// pml_email → email PML atasan (untuk PPL), di-resolve ke pml_id
//
// STRATEGI 2 PASS:
//   Pass 1 → insert semua admin & PML dulu
//   Pass 2 → insert semua PPL (PML sudah pasti ada di DB)
//   Urutan baris di Excel tidak perlu diperhatikan
// ────────────────────────────────────────────────────────────────────
const importUsers = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'File Excel tidak ditemukan' });
  }
 
  try {
    // 1. Parse file Excel dari buffer memory
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
 
    if (rows.length === 0) {
      return res.status(400).json({ message: 'File Excel kosong' });
    }
 
    const results = { berhasil: 0, gagal: [], total: rows.length };
 
    // 2. Normalisasi semua baris sekaligus
    const normalized = rows.map((row) => ({
      nama:           String(row['nama']           || row['Nama']           || '').trim(),
      email:          String(row['email']          || row['Email']          || '').trim().toLowerCase(),
      password:       String(row['password']       || row['Password']       || '').trim(),
      role:           String(row['role']           || row['Role']           || 'ppl').trim().toLowerCase(),
      nomor_whatsapp: String(row['nomor_whatsapp'] || row['NoWA'] || row['no_wa'] || '').trim(),
      pml_email:      String(row['pml_email']      || row['PML Email']      || '').trim().toLowerCase(),
      kode_sls_raw:   String(row['kode_sls']       || row['Kode SLS']       || '').trim(),
    }));
 
    // ── Helper: proses satu baris ────────────────────────────────────
    const processRow = async (row, allowedRoles) => {
      const { nama, email, password, role, nomor_whatsapp, pml_email, kode_sls_raw } = row;
 
      // Skip baris yang bukan giliran pass ini
      if (!allowedRoles.includes(role)) return;
 
      // Validasi dasar
      if (!nama || !email || !password) {
        results.gagal.push({ email: email || '(kosong)', alasan: 'nama, email, password wajib diisi' });
        return;
      }
      if (!['admin', 'pml', 'ppl'].includes(role)) {
        results.gagal.push({ email, alasan: `Role "${role}" tidak valid` });
        return;
      }
 
      try {
        // Cek duplikat email
        const cek = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (cek.rows.length > 0) {
          results.gagal.push({ email, alasan: 'Email sudah dipakai' });
          return;
        }
 
        // Resolve pml_id dari pml_email (hanya PPL)
        let pml_id = null;
        if (role === 'ppl') {
          if (!pml_email) {
            results.gagal.push({ email, alasan: 'PPL harus mengisi kolom pml_email' });
            return;
          }
          const pmlRow = await pool.query(
            `SELECT id FROM users WHERE email = $1 AND role = 'pml'`,
            [pml_email]
          );
          if (pmlRow.rows.length === 0) {
            results.gagal.push({ email, alasan: `PML dengan email "${pml_email}" tidak ditemukan` });
            return;
          }
          pml_id = pmlRow.rows[0].id;
        }
 
        // Resolve wilayah_ids dari kode_sls 
        const wilayah_ids = [];
        if (role === 'ppl') {
          if (!kode_sls_raw) {
            results.gagal.push({ email, alasan: 'PPL harus mengisi kolom kode_sls' });
            return;
          }

          const kodeSls = kode_sls_raw.split(',').map((k) => k.trim()).filter(Boolean);
          for (const kode of kodeSls) {
            const w = await pool.query('SELECT id FROM wilayah WHERE kode_sls = $1', [kode]);
            if (w.rows.length === 0) {
              results.gagal.push({ email, alasan: `Kode SLS "${kode}" tidak ditemukan` });
              return;
            }
            wilayah_ids.push(w.rows[0].id);
          }
        }
        
        // Insert user
        const hashed = await bcrypt.hash(password, 10);
        const inserted = await pool.query(
          `INSERT INTO users (nama, email, password, role, pml_id, nomor_whatsapp)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
          [nama, email, hashed, role, pml_id, nomor_whatsapp || null]
        );
 
        // Sync wilayah jika PPL
        if (role === 'ppl' && wilayah_ids.length > 0) {
          await syncWilayahPplId(pool, inserted.rows[0].id, wilayah_ids);
        }
 
        results.berhasil++;
      } catch (rowErr) {
        results.gagal.push({ email, alasan: rowErr.message });
      }
    };
 
    // ── PASS 1: admin & PML dulu ─────────────────────────────────────
    for (const row of normalized) {
      await processRow(row, ['admin', 'pml']);
    }
 
    // ── PASS 2: PPL (PML sudah pasti ada di DB sekarang) ────────────
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
    res.status(500).json({ message: 'Gagal proses file Excel', error: err.message });
  }
};
 
// ────────────────────────────────────────────────────────────────────
// GET all users (lengkap dengan wilayah_ids dari user_sls)
// ────────────────────────────────────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.id, u.nama, u.email, u.role, u.pml_id,
        u.nomor_whatsapp, u.is_logged_in, u.created_at,
        COALESCE(
          ARRAY_AGG(us.wilayah_id) FILTER (WHERE us.wilayah_id IS NOT NULL),
          '{}'
        ) AS wilayah_ids,
        COALESCE(SUM(w.target), 0) AS target
      FROM users u
      LEFT JOIN user_sls us ON us.user_id = u.id
      LEFT JOIN wilayah w   ON w.id = us.wilayah_id
      GROUP BY u.id
      ORDER BY u.created_at ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Gagal ambil users', error: err.message });
  }
};

// GET semua PML
const getPMLList = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, nama, email FROM users WHERE role = $1 ORDER BY nama",
      ["pml"],
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({
      message: "Gagal ambil data PML",
      error: err.message,
    });
  }
};

// GET PPL berdasarkan PML
const getPPLByPML = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT id, nama, email
       FROM users
       WHERE role = $1 AND pml_id = $2
       ORDER BY nama`,
      ["ppl", id],
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({
      message: "Gagal ambil data PPL",
      error: err.message,
    });
  }
};

// GET progress keseluruhan
const getDashboardProgress = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COALESCE(SUM(ke_lapangan), 0)::int AS lapangan,
        COALESCE(SUM(submit), 0)::int      AS submit,
        COALESCE(SUM(approve), 0)::int     AS approve
      FROM input_harian
    `);

    const totalTarget = 20000;
    const lapanganVal = result.rows[0].lapangan;
    const submitVal = result.rows[0].submit;
    const approveVal = result.rows[0].approve;

    const pct = (val) => parseFloat(((val / totalTarget) * 100).toFixed(2));

    res.json({
      sudahKeLapangan: lapanganVal,
      sudahKeLapanganPersen: pct(lapanganVal),
      sudahKeLapanganChartPersen: pct(lapanganVal),
      submit: submitVal,
      submitPersen: pct(submitVal),
      submitChartPersen: pct(submitVal),
      approve: approveVal,
      approvePersen: pct(approveVal),
      approvePersen2: pct(approveVal),
      target: totalTarget,
      belumPersen: parseFloat((100 - pct(approveVal)).toFixed(2)),
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Gagal ambil progress", error: err.message });
  }
};

// GET ringkasan petugas
const getDashboardPetugas = async (req, res) => {
  try {
    const totalPetugas = await pool.query(
      "SELECT COUNT(*) FROM users WHERE role IN ('pml','ppl')",
    );

    const totalPML = await pool.query(
      "SELECT COUNT(*) FROM users WHERE role = 'pml'",
    );

    const totalPPL = await pool.query(
      "SELECT COUNT(*) FROM users WHERE role = 'ppl'",
    );

    const aktif = await pool.query(
      "SELECT COUNT(*) FROM users WHERE role IN ('pml','ppl') AND is_logged_in = TRUE",
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
      lastUpdate: new Date().toLocaleString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    });
  } catch (err) {
    res.status(500).json({
      message: "Gagal ambil data petugas",
      error: err.message,
    });
  }
};

// helper shared
function buildKecamatanMap(rows) {
  const kecamatanMap = {};

  rows.forEach((row, idx) => {
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
    const target = parseInt(row.target || 0);

    kec.sudahKeLapangan += parseInt(row.sudah_ke_lapangan);
    kec.submit += parseInt(row.submit);
    kec.approve += parseInt(row.approve);

    // total target kecamatan
    kec.target += target;

    kec.kelurahan.push({
      id: idx + 1,
      nama: row.kelurahan,
      sudahKeLapangan: parseInt(row.sudah_ke_lapangan),
      submit: parseInt(row.submit),
      approve: parseInt(row.approve),
      target: target,
    });
  });

  return Object.values(kecamatanMap);
}

// GET data per kecamatan (total)
const getDashboardKecamatan = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        w.kecamatan,
        w.kelurahan,
        w.id AS wilayah_id,
        w.target,

        COALESCE(SUM(i.ke_lapangan), 0) AS sudah_ke_lapangan,
        COALESCE(SUM(i.submit), 0) AS submit,
        COALESCE(SUM(i.approve), 0) AS approve

      FROM wilayah w

      LEFT JOIN input_harian i
        ON i.wilayah_id = w.id

      GROUP BY
        w.kecamatan,
        w.kelurahan,
        w.id,
        w.target

      ORDER BY w.kecamatan, w.kelurahan
`);
    res.json(buildKecamatanMap(result.rows));
  } catch (err) {
    res
      .status(500)
      .json({ message: "Gagal ambil data kecamatan", error: err.message });
  }
};

// GET data per kecamatan (harian = kemarin)
const getDashboardKecamatanHarian = async (req, res) => {
  try {
    const { tanggal } = req.query;
    const targetDate =
      tanggal || new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const result = await pool.query(    `
        SELECT
          w.kecamatan,
          w.kelurahan,
          w.id AS wilayah_id,
          w.target,

          COALESCE(SUM(i.ke_lapangan), 0) AS sudah_ke_lapangan,
          COALESCE(SUM(i.submit), 0) AS submit,
          COALESCE(SUM(i.approve), 0) AS approve

        FROM wilayah w

        LEFT JOIN input_harian i
          ON i.wilayah_id = w.id
          AND i.tanggal = $1

        GROUP BY
          w.kecamatan,
          w.kelurahan,
          w.id,
          w.target

        ORDER BY w.kecamatan, w.kelurahan
      `,
      [targetDate],
    );

    res.json(buildKecamatanMap(result.rows));
  } catch (err) {
    res
      .status(500)
      .json({ message: "Gagal ambil data harian", error: err.message });
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

        -- Target dari SLS yang di-assign ke PPL via user_sls
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
          WHERE ppl.pml_id = u.id
            AND ih.pml_hadir = TRUE
        ) AS jumlah_hadir_pml

      FROM users u
      LEFT JOIN input_harian i ON i.ppl_id = u.id
      WHERE u.role IN ('pml', 'ppl')
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
        target: parseInt(r.target || 0),
        jumlahHadir:
          r.tipe === "pml"
            ? parseInt(r.jumlah_hadir_pml || 0)
            : parseInt(r.jumlah_hadir || 0),
      })),
    );
  } catch (err) {
    res.status(500).json({ message: "Gagal ambil detail petugas", error: err.message });
  }
};

const getDashboardPetugasDetailHarian = async (req, res) => {
  try {
    const { tanggal } = req.query;

    const result = await pool.query(
      `
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

        -- Untuk PPL: apakah pml_hadir = true di tanggal ini
        BOOL_OR(i.pml_hadir) AS pml_hadir_hari_ini,

        -- Untuk PML: apakah minimal 1 PPL bawahannya mencatat pml_hadir=true
        (
          SELECT BOOL_OR(ih.pml_hadir)
          FROM input_harian ih
          JOIN users ppl ON ppl.id = ih.ppl_id
          WHERE ppl.pml_id = u.id
            AND ih.tanggal = $1
        ) AS pml_hadir_sebagai_pml

      FROM users u
      LEFT JOIN input_harian i
        ON i.ppl_id = u.id
        AND i.tanggal = $1
      WHERE u.role IN ('pml', 'ppl')
      GROUP BY u.id, u.nama, u.role, u.pml_id, u.target
      ORDER BY u.role, u.nama
    `,
      [tanggal],
    );

    res.json(
      result.rows.map((r) => ({
        id: r.id,
        nama: r.nama,
        tipe: r.tipe.toUpperCase(),
        pml_id: r.pml_id,
        sudahKeLapangan: parseInt(r.sudah_ke_lapangan),
        submit: parseInt(r.submit),
        approve: parseInt(r.approve),
        target: parseInt(r.target || 0),
        // PPL: apakah PML hadir mendampingi mereka hari ini
        hadirHariIni: r.pml_hadir_hari_ini ? 1 : 0,
        // PML: apakah hadir di minimal 1 PPL bawahannya hari ini
        pmlHadirSebagaiPml: r.pml_hadir_sebagai_pml ? 1 : 0,
      })),
    );
  } catch (err) {
    res.status(500).json({
      message: "Gagal ambil detail petugas harian",
      error: err.message,
    });
  }
};

// GET sebaran petugas untuk peta
const getDashboardSebaranPetugas = async (req, res) => {
  try {
    // Ambil semua PML dan PPL beserta status login + wilayah
    const users = await pool.query(`
      SELECT DISTINCT ON (u.id)
        u.id, u.nama, u.role, u.pml_id, u.is_logged_in,
        w.kecamatan, w.kelurahan
      FROM users u
      LEFT JOIN wilayah w 
        ON (u.role = 'ppl' AND w.ppl_id = u.id)
        OR (u.role = 'pml' AND w.pml_id = u.id)
      WHERE u.role IN ('pml','ppl')
      ORDER BY u.id, u.role, u.nama
`   );

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
      kecamatan: u.kecamatan || null,
      kelurahan: u.kelurahan || null,
      lat: lokasiMap[u.id] ? parseFloat(lokasiMap[u.id].lat) : null,
      lng: lokasiMap[u.id] ? parseFloat(lokasiMap[u.id].lng) : null,
      recorded_at: lokasiMap[u.id]?.recorded_at || null,
      online: u.is_logged_in,
      punya_lokasi: !!lokasiMap[u.id],
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({
      message: "Gagal ambil sebaran petugas",
      error: err.message,
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
        tanggal: new Date(r.tanggal).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
        }),
        sudahKeLapangan: parseInt(r.sudah_ke_lapangan),
        submit: parseInt(r.submit),
        approve: parseInt(r.approve),
      })),
    );
  } catch (err) {
    res.status(500).json({
      message: "Gagal ambil progress 15 hari",
      error: err.message,
    });
  }
};

// ────────────────────────────────────────────────────────────────────
// GET wilayah
// ────────────────────────────────────────────────────────────────────
const getWilayah = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        w.*,
        pml.nama AS nama_pml,
        us.user_id AS ppl_id_sls
      FROM wilayah w
      LEFT JOIN users pml ON w.pml_id = pml.id
      LEFT JOIN user_sls us ON us.wilayah_id = w.id
      ORDER BY w.kecamatan, w.kelurahan
    `);
 
    res.json(result.rows.map(r => ({
      ...r,
      ppl_id: r.ppl_id_sls ?? r.ppl_id,
    })));
  } catch (err) {
    res.status(500).json({ message: 'Gagal ambil wilayah', error: err.message });
  }
};
 
// ────────────────────────────────────────────────────────────────────
// CREATE wilayah (single)
// ────────────────────────────────────────────────────────────────────
const createWilayah = async (req, res) => {
  const { kode_sls, kecamatan, kelurahan, pml_id, ppl_id, target } = req.body;
  try {
    await pool.query(
      `INSERT INTO wilayah (kode_sls, kecamatan, kelurahan, pml_id, ppl_id, target)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [kode_sls || null, kecamatan, kelurahan, pml_id || null, ppl_id || null, Number(target) || 0]
    );
    res.json({ message: 'Wilayah berhasil ditambahkan' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal tambah wilayah', error: err.message });
  }
};
 
// ────────────────────────────────────────────────────────────────────
// UPDATE wilayah (single)
// ────────────────────────────────────────────────────────────────────
const updateWilayah = async (req, res) => {
  const { id } = req.params;
  const { kode_sls, kecamatan, kelurahan, pml_id, ppl_id, target } = req.body;
  try {
    await pool.query(
      `UPDATE wilayah
       SET kode_sls = $1, kecamatan = $2, kelurahan = $3,
           pml_id = $4, ppl_id = $5, target = $6
       WHERE id = $7`,
      [kode_sls || null, kecamatan, kelurahan, pml_id || null, ppl_id || null, Number(target) || 0, id]
    );
    res.json({ message: 'Wilayah berhasil diupdate' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal update wilayah', error: err.message });
  }
};
 
// ────────────────────────────────────────────────────────────────────
// DELETE wilayah (single)
// ────────────────────────────────────────────────────────────────────
const deleteWilayah = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM wilayah WHERE id = $1', [id]);
    res.json({ message: 'Wilayah berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal hapus wilayah', error: err.message });
  }
};
 
// ────────────────────────────────────────────────────────────────────
// DELETE BULK wilayah
// Body: { ids: [1, 2, 3, ...] }
// ────────────────────────────────────────────────────────────────────
const deleteWilayahBulk = async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'IDs tidak boleh kosong' });
  }
  try {
    // user_sls → ON DELETE CASCADE, otomatis terhapus
    await pool.query(`DELETE FROM wilayah WHERE id = ANY($1::int[])`, [ids]);
    res.json({ message: `${ids.length} wilayah berhasil dihapus` });
  } catch (err) {
    res.status(500).json({ message: 'Gagal hapus bulk wilayah', error: err.message });
  }
};
 
// ────────────────────────────────────────────────────────────────────
// IMPORT wilayah dari Excel
//
// Format kolom Excel:
//   kecamatan | kelurahan | kode_sls | target
//
// Aturan:
//   - kecamatan & kelurahan  → wajib
//   - kode_sls               → wajib
//   - target                 → opsional, default 0
//
// STRATEGI 2 PASS (sama seperti import users):
//   Pass 1 → insert baris tanpa kode_sls (baris kecamatan/kelurahan induk)
//   Pass 2 → insert baris dengan kode_sls
//   Ini mencegah error jika user menaruh SLS sebelum baris kelurahan induknya
//
// Duplikat kode_sls di-skip (ON CONFLICT).
// ────────────────────────────────────────────────────────────────────
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

      // Validasi field wajib
      if (!kecamatan) {
        results.gagal.push({ baris: kelurahan || '?', alasan: 'kolom kecamatan wajib diisi' });
        continue;
      }
      if (!kode_sls) {
        results.gagal.push({ baris: `${kelurahan}/${kecamatan}`, alasan: 'kolom kode_sls wajib diisi' });
        continue;
      }

      try {
        // Cek duplikat
        const cek = await pool.query(
          'SELECT id FROM wilayah WHERE kode_sls = $1', [kode_sls]
        );
        if (cek.rows.length > 0) {
          results.dilewati++;
          continue;
        }

        await pool.query(
          `INSERT INTO wilayah (kecamatan, kelurahan, kode_sls, target)
           VALUES ($1, $2, $3, $4)`,
          [kecamatan, kelurahan || '', kode_sls, target]
        );
        results.berhasil++;
      } catch (rowErr) {
        results.gagal.push({
          baris: kode_sls,
          alasan: rowErr.message
        });
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
    res.status(500).json({ message: 'Gagal proses file Excel', error: err.message });
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
  getDashboardKecamatanHarian,
  getDashboardPetugasDetail,
  getDashboardPetugasDetailHarian,
  getDashboardSebaranPetugas,
  getDashboardProgress15Hari,
  getWilayah,
  createWilayah,
  updateWilayah,
  deleteWilayah,
  deleteWilayahBulk,
  importWilayah,
   upload,  
   deleteUsersBulk,
  importUsers
};
