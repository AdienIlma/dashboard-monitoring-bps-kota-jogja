const pool = require("../config/db");
const bcrypt = require("bcryptjs");

// GET semua user
const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.id,
        u.nama,
        u.username,
        u.role,
        u.pml_id,
        u.nomor_whatsapp,
        u.target,
        u.created_at,
        COALESCE(
          ARRAY_AGG(us.wilayah_id)
          FILTER (WHERE us.wilayah_id IS NOT NULL),
          '{}'
        ) AS wilayah_ids
      FROM users u
      LEFT JOIN user_sls us ON us.user_id = u.id
      GROUP BY
        u.id,
        u.nama,
        u.username,
        u.role,
        u.pml_id,
        u.nomor_whatsapp,
        u.target,
        u.created_at
      ORDER BY u.role, u.nama
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error getAllUsers:', error);
    res.status(500).json({
      message: 'Gagal mengambil data user'
    });
  }
};

// POST buat user baru
const createUser = async (req, res) => {
  const {
    nama,
    username,
    password,
    role,
    pml_id,
    nomor_whatsapp,
    target,
    wilayah_ids = []
  } = req.body;

  if (!nama || !username || !password || !role) {
    return res.status(400).json({
      message: "nama, username, password, role wajib diisi",
    });
  }

  if (!["admin", "pml", "ppl"].includes(role)) {
    return res.status(400).json({ message: "Role tidak valid" });
  }

  if (role === "ppl" && !pml_id) {
    return res.status(400).json({ message: "PPL harus punya PML" });
  }

  try {
    const cek = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username]
    );

    if (cek.rows.length > 0) {
      return res.status(400).json({
        message: "Username sudah dipakai",
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users
       (nama, username, password, role, pml_id, nomor_whatsapp, target)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, nama, username, role, pml_id, nomor_whatsapp, target`,
      [
        nama,
        username,
        hashed,
        role,
        role === "ppl" ? pml_id : null,
        nomor_whatsapp || null,
        Number(target) || 0
      ]
    );

    const user = result.rows[0];

  if (role === "ppl" && Array.isArray(wilayah_ids)) {
    for (const wilayahId of wilayah_ids) {
      await pool.query(
        `INSERT INTO user_sls (user_id, wilayah_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, wilayah_id) DO NOTHING`,
        [user.id, wilayahId]
      );
   }
  }

    res.status(201).json({
      message: "User berhasil dibuat",
      result,
    });
  } catch (err) {
    res.status(500).json({
      message: "Gagal buat user",
      error: err.message,
    });
  }
};

// GET semua PML
const getPMLList = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, nama, username FROM users WHERE role = $1 ORDER BY nama",
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
      `SELECT id, nama, username
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

    const totalTarget = 10;
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

// UPDATE user
const updateUser = async (req, res) => {
  const { id } = req.params;
  const {
    nama,
    username,
    role,
    pml_id,
    password,
    nomor_whatsapp,
    target,
    wilayah_ids = []
  } = req.body;

  try {
    const cek = await pool.query(
      "SELECT id FROM users WHERE username = $1 AND id != $2",
      [username, id]
    );

    if (cek.rows.length > 0) {
      return res.status(400).json({
        message: "Username sudah digunakan",
      });
    }

    const params = [
      nama,
      username,
      role,
      role === "ppl" ? pml_id : null,
      nomor_whatsapp || null,
      Number(target) || 0
    ];

    if (password && password.trim() !== "") {
      const hashed = await bcrypt.hash(password, 10);

      await pool.query(
        `UPDATE users
         SET nama = $1,
             username = $2,
             role = $3,
             pml_id = $4,
             nomor_whatsapp = $5,
             target = $6,
             password = $7
         WHERE id = $8`,
        [...params, hashed, id]
      );
    } else {
      await pool.query(
        `UPDATE users
         SET nama = $1,
             username = $2,
             role = $3,
             pml_id = $4,
             nomor_whatsapp = $5,
             target = $6
         WHERE id = $7`,
        [...params, id]
      );
    }
await pool.query(
  "DELETE FROM user_sls WHERE user_id = $1",
  [id]
);

  if (role === "ppl" && Array.isArray(wilayah_ids)) {
    for (const wilayahId of wilayah_ids) {
      await pool.query(
        `INSERT INTO user_sls (user_id, wilayah_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, wilayah_id) DO NOTHING`,
        [id, wilayahId]
      );
    }
  }
  
    res.json({ message: "User berhasil diupdate" });
  } catch (err) {
    res.status(500).json({
      message: "Gagal update user",
      error: err.message,
    });
  }
};

// DELETE user
const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM users WHERE id = $1", [id]);

    res.json({
      message: "User berhasil dihapus",
    });
  } catch (err) {
    res.status(500).json({
      message: "Gagal hapus user",
      error: err.message,
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
        ppl.nama AS nama_ppl,
        us.user_id AS ppl_id_sls
      FROM wilayah w
      LEFT JOIN users pml ON w.pml_id = pml.id
      LEFT JOIN user_sls us ON us.wilayah_id = w.id
      LEFT JOIN users ppl ON us.user_id = ppl.id
      ORDER BY w.kecamatan, w.kelurahan
    `);

    // Kalau 1 wilayah punya beberapa PPL (user_sls), akan ada duplikat row.
    // Kita return as-is, ProgressPetugas sudah filter by ppl_id
    res.json(result.rows.map(r => ({
      ...r,
      ppl_id: r.ppl_id_sls ?? r.ppl_id, // prioritaskan user_sls
    })));
  } catch (err) {
    res.status(500).json({ message: "Gagal ambil wilayah", error: err.message });
  }
};

// CREATE wilayah
const createWilayah = async (req, res) => {
  const {
    kode_sls,
    kecamatan,
    kelurahan,
    pml_id,
    ppl_id,
    target
  } = req.body;

  try {
    await pool.query(
      `INSERT INTO wilayah
       (kode_sls, kecamatan, kelurahan, pml_id, ppl_id, target)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        kode_sls || null,
        kecamatan,
        kelurahan,
        pml_id || null,
        ppl_id || null,
        Number(target) || 0
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
  const {
    kode_sls,
    kecamatan,
    kelurahan,
    pml_id,
    ppl_id,
    target
  } = req.body;

  try {
    await pool.query(
      `UPDATE wilayah
       SET kode_sls = $1,
           kecamatan = $2,
           kelurahan = $3,
           pml_id = $4,
           ppl_id = $5,
           target = $6
       WHERE id = $7`,
      [
        kode_sls || null,
        kecamatan,
        kelurahan,
        pml_id || null,
        ppl_id || null,
        Number(target) || 0,
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
    await pool.query("DELETE FROM wilayah WHERE id = $1", [id]);

    res.json({
      message: "Wilayah berhasil dihapus",
    });
  } catch (err) {
    res.status(500).json({
      message: "Gagal hapus wilayah",
      error: err.message,
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
  getDashboardKecamatanHarian,
  getDashboardPetugasDetail,
  getDashboardPetugasDetailHarian,
  getDashboardSebaranPetugas,
  getDashboardProgress15Hari,
  getWilayah,
  createWilayah,
  updateWilayah,
  deleteWilayah,
};
