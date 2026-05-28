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
    const result = await pool.query(`
      SELECT DISTINCT ON (u.id)
        u.id,
        u.nama,
        u.role,
        u.pml_id,
        u.nomor_whatsapp,

        l.latitude AS lat,
        l.longitude AS lng,
        l.recorded_at,

        w.kecamatan,
        w.kelurahan,


        CASE
          WHEN l.recorded_at >= NOW() - INTERVAL '15 minutes'
            AND u.is_logged_in = TRUE
          THEN true
          ELSE false
        END AS online,

        CASE
          WHEN l.latitude IS NOT NULL
          AND l.longitude IS NOT NULL
          THEN true
          ELSE false
        END AS punya_lokasi

      FROM users u

      LEFT JOIN lokasi l
        ON l.user_id = u.id

      LEFT JOIN wilayah w
        ON w.ppl_id = u.id

      ORDER BY
        u.id,
        l.recorded_at DESC
    `);

    res.json(result.rows);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Gagal ambil sebaran petugas',
      error: err.message
    });
  }
};

// UPDATE user
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { nama, username, password, role, pml_id, nomor_whatsapp, target, wilayah_ids = [] } = req.body;

  try {
    let query, params;

    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      query = `UPDATE users SET nama=$1, username=$2, password=$3, role=$4, pml_id=$5, nomor_whatsapp=$6, target=$7 WHERE id=$8 RETURNING *`;
      params = [nama, username, hashed, role, role === 'ppl' ? pml_id : null, nomor_whatsapp || null, Number(target) || 0, id];
    } else {
      query = `UPDATE users SET nama=$1, username=$2, role=$3, pml_id=$4, nomor_whatsapp=$5, target=$6 WHERE id=$7 RETURNING *`;
      params = [nama, username, role, role === 'ppl' ? pml_id : null, nomor_whatsapp || null, Number(target) || 0, id];
    }

    const result = await pool.query(query, params);
    if (result.rows.length === 0) return res.status(404).json({ message: 'User tidak ditemukan' });

    // Update wilayah_ids kalau PPL
    if (role === 'ppl') {
      await pool.query('DELETE FROM user_sls WHERE user_id = $1', [id]);
      for (const wilayahId of wilayah_ids) {
        await pool.query(
          'INSERT INTO user_sls (user_id, wilayah_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [id, wilayahId]
        );
      }
    }

    res.json({ message: 'User berhasil diupdate', user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Gagal update user', error: err.message });
  }
};

// DELETE user
const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM user_sls WHERE user_id = $1', [id]);
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'User tidak ditemukan' });
    res.json({ message: 'User berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal hapus user', error: err.message });
  }
};

// GET wilayah
const getWilayah = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM wilayah ORDER BY kecamatan, kelurahan');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Gagal ambil wilayah', error: err.message });
  }
};

// POST wilayah
const createWilayah = async (req, res) => {
  const { kode_sls, kecamatan, kelurahan, target, ppl_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO wilayah (kode_sls, kecamatan, kelurahan, target, ppl_id) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [kode_sls, kecamatan, kelurahan, Number(target) || 0, ppl_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Gagal buat wilayah', error: err.message });
  }
};

// PUT wilayah
const updateWilayah = async (req, res) => {
  const { id } = req.params;
  const { kode_sls, kecamatan, kelurahan, target, ppl_id } = req.body;
  try {
    const result = await pool.query(
      'UPDATE wilayah SET kode_sls=$1, kecamatan=$2, kelurahan=$3, target=$4, ppl_id=$5 WHERE id=$6 RETURNING *',
      [kode_sls, kecamatan, kelurahan, Number(target) || 0, ppl_id || null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Wilayah tidak ditemukan' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Gagal update wilayah', error: err.message });
  }
};

// DELETE wilayah
const deleteWilayah = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM wilayah WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Wilayah tidak ditemukan' });
    res.json({ message: 'Wilayah berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal hapus wilayah', error: err.message });
  }
};

// GET progress 15 hari
const getDashboardProgress15Hari = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        tanggal::date AS tanggal,
        COALESCE(SUM(ke_lapangan), 0)::int AS ke_lapangan,
        COALESCE(SUM(submit), 0)::int AS submit,
        COALESCE(SUM(approve), 0)::int AS approve
      FROM input_harian
      WHERE tanggal >= CURRENT_DATE - INTERVAL '14 days'
      GROUP BY tanggal::date
      ORDER BY tanggal::date ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Gagal ambil progress 15 hari', error: err.message });
  }
};

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getPMLList,
  getPPLByPML,
  getWilayah,
  createWilayah,
  updateWilayah,
  deleteWilayah,
  getDashboardProgress,
  getDashboardPetugas,
  getDashboardKecamatan,
  getDashboardKecamatanHarian,
  getDashboardPetugasDetail,
  getDashboardPetugasDetailHarian,
  getDashboardSebaranPetugas,
  getDashboardProgress15Hari,
};