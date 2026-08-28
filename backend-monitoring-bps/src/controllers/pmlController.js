const pool = require("../config/db");

const isDev = process.env.NODE_ENV !== "production";

const formatJakartaDate = (date = new Date()) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  return `${year}-${month}-${day}`;
};

const normalizeDateInput = (dateValue) => {
  if (!dateValue) return formatJakartaDate();
  if (typeof dateValue === "string") {
    const plain = dateValue.split("T")[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(plain)) return plain;
  }
  return formatJakartaDate(new Date(dateValue));
};

// ─── Helper ────────────────────────────────────────────────────────────────

const cekKepemilikanPPL = async (ppl_id, pml_id) => {
  const [rows] = await pool.query(
    "SELECT id FROM users WHERE id = ? AND pml_id = ? LIMIT 1",
    [ppl_id, pml_id],
  );
  return rows.length > 0;
};

const handleError = (res, err, message = "Terjadi kesalahan server") => {
  console.error(message, ":", err.message);
  res.status(500).json({
    message,
    ...(isDev && { error: err.message }),
  });
};

// ─── 1. DATA RINGKASAN SEMUA PPL MILIK PML ─────────────────────────────────

const getMyPPL = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         u.id, u.nama, u.username AS email,
         COALESCE(SUM(i.ke_lapangan), 0) AS total_ke_lapangan,
         COALESCE(SUM(i.submit),      0) AS total_submit,
         COALESCE(SUM(i.approve),     0) AS total_approve,
         COUNT(i.id)                     AS total_input
       FROM users u
       LEFT JOIN input_harian i ON i.ppl_id = u.id
       WHERE u.pml_id = ?
       GROUP BY u.id, u.nama, u.username
       ORDER BY u.nama`,
      [req.user.id],
    );

    return res.json(rows);
  } catch (err) {
    return handleError(res, err, "Gagal mengambil data PPL");
  }
};

// ─── 2. INPUT HARIAN MILIK 1 PPL ───────────────────────────────────────────

const getInputsByPPL = async (req, res) => {
  const ppl_id = parseInt(req.params.ppl_id);

  if (!ppl_id || isNaN(ppl_id)) {
    return res.status(400).json({ message: "ppl_id tidak valid" });
  }

  try {
    const boleh = await cekKepemilikanPPL(ppl_id, req.user.id);
    if (!boleh) {
      return res.status(403).json({ message: "PPL tidak di bawah anda" });
    }

    const [rows] = await pool.query(
      `SELECT
         i.id, i.wilayah_id, i.ke_lapangan, i.submit, i.approve,
         i.catatan, DATE_FORMAT(i.tanggal, '%Y-%m-%d') AS tanggal, i.pml_hadir,
         DATE_FORMAT(i.created_at, '%Y-%m-%dT%H:%i:%s') AS created_at,
         w.kecamatan, w.kelurahan
       FROM input_harian i
       JOIN wilayah w ON i.wilayah_id = w.id
       WHERE i.ppl_id = ?
       ORDER BY i.created_at DESC`,
      [ppl_id],
    );

    return res.json(rows);
  } catch (err) {
    return handleError(res, err, "Gagal mengambil data input");
  }
};

// ─── 3. WILAYAH + PROGRES MILIK 1 PPL ──────────────────────────────────────

const getWilayahByPPL = async (req, res) => {
  const ppl_id = parseInt(req.params.ppl_id);

  if (!ppl_id || isNaN(ppl_id)) {
    return res.status(400).json({ message: "ppl_id tidak valid" });
  }

  try {
    const boleh = await cekKepemilikanPPL(ppl_id, req.user.id);
    if (!boleh) {
      return res.status(403).json({ message: "PPL tidak di bawah anda" });
    }

    const [rows] = await pool.query(
      `SELECT
     w.id, w.kode_sls, w.kelurahan, w.kecamatan, w.target,
     COALESCE(SUM(CASE WHEN i.ke_lapangan > 0 THEN i.ke_lapangan ELSE 0 END), 0) AS total_lapangan,
     COALESCE(SUM(CASE WHEN i.submit > 0 THEN i.submit ELSE 0 END), 0) AS total_submit,
     COALESCE(SUM(CASE WHEN i.approve > 0 THEN i.approve ELSE 0 END), 0) AS total_approve
   FROM wilayah w
   LEFT JOIN user_sls us    ON us.wilayah_id = w.id AND us.user_id = ?
   LEFT JOIN input_harian i ON i.wilayah_id  = w.id AND i.ppl_id   = ?
   WHERE w.ppl_id = ? OR us.user_id = ?
   GROUP BY w.id, w.kode_sls, w.kelurahan, w.kecamatan, w.target
   ORDER BY w.kelurahan`,
      [ppl_id, ppl_id, ppl_id, ppl_id],
    );

    return res.json(rows);
  } catch (err) {
    return handleError(res, err, "Gagal mengambil data wilayah");
  }
};

// ─── 4. SIMPAN APPROVE ─────────────────────────────────────────────────────

const simpanApprove = async (req, res) => {
  const ppl_id = parseInt(req.body.ppl_id);
  const wilayah_id = parseInt(req.body.wilayah_id);
  const approve = parseInt(req.body.approve);
  const tanggal = req.body.tanggal || null;
  const catatan = req.body.catatan
    ? req.body.catatan.trim().slice(0, 500)
    : null;

  if (!ppl_id || isNaN(ppl_id)) {
    return res.status(400).json({ message: "ppl_id tidak valid" });
  }
  if (!wilayah_id || isNaN(wilayah_id)) {
    return res.status(400).json({ message: "wilayah_id tidak valid" });
  }
  if (
    !approve ||
    isNaN(approve) ||
    approve <= 0 ||
    !Number.isInteger(approve)
  ) {
    return res
      .status(400)
      .json({ message: "Jumlah approve harus bilangan bulat positif" });
  }

  try {
    const boleh = await cekKepemilikanPPL(ppl_id, req.user.id);
    if (!boleh) {
      return res.status(403).json({ message: "PPL tidak di bawah anda" });
    }

    // Cek apakah sudah ada approve di tanggal + wilayah yang sama
    const tglTarget = normalizeDateInput(tanggal);
    const [existing] = await pool.query(
      `SELECT id, approve AS approve_lama
       FROM input_harian
       WHERE ppl_id = ? AND wilayah_id = ? AND tanggal = ?
         AND ke_lapangan = 0 AND submit = 0
       LIMIT 1`,
      [ppl_id, wilayah_id, tglTarget],
    );

    if (existing.length > 0) {
      // Upsert: cek sisa dengan kecualikan baris lama
      const approveLama = parseInt(existing[0].approve_lama);
      const [progresRows] = await pool.query(
        `SELECT
           COALESCE(SUM(submit),  0) AS total_submit,
           COALESCE(SUM(approve), 0) AS total_approve
         FROM input_harian
         WHERE ppl_id = ? AND wilayah_id = ? AND id != ?`,
        [ppl_id, wilayah_id, existing[0].id],
      );

      await pool.query(
        `UPDATE input_harian SET approve = ?, catatan = ? WHERE id = ?`,
        [approve, catatan, existing[0].id],
      );

      return res.json({
        message: "Approve berhasil diperbarui",
        action: "update",
      });
    } else {
      // Insert baru — cek sisa normal
      const [progresRows] = await pool.query(
        `SELECT
           COALESCE(SUM(submit),  0) AS total_submit,
           COALESCE(SUM(approve), 0) AS total_approve
         FROM input_harian
         WHERE ppl_id = ? AND wilayah_id = ?`,
        [ppl_id, wilayah_id],
      );

      await pool.query(
        `INSERT INTO input_harian
           (ppl_id, wilayah_id, ke_lapangan, submit, approve, catatan, tanggal)
         VALUES (?, ?, 0, 0, ?, ?, ?)`,
        [ppl_id, wilayah_id, approve, catatan, tglTarget],
      );

      return res.json({
        message: "Approve berhasil disimpan",
        action: "insert",
      });
    }
  } catch (err) {
    return handleError(res, err, "Gagal menyimpan approve");
  }
};

// ─── 5. KIRIM LOKASI GEOLOCATION ───────────────────────────────────────────

const kirimLokasi = async (req, res) => {
  const { latitude, longitude } = req.body;

  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    isNaN(latitude) ||
    isNaN(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return res
      .status(400)
      .json({ message: "Koordinat latitude/longitude tidak valid" });
  }

  try {
    const [cekRows] = await pool.query(
      "SELECT id FROM lokasi WHERE user_id = ? LIMIT 1",
      [req.user.id],
    );

    if (cekRows.length > 0) {
      await pool.query(
        `UPDATE lokasi
         SET latitude = ?, longitude = ?, recorded_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [latitude, longitude, req.user.id],
      );
    } else {
      await pool.query(
        `INSERT INTO lokasi (user_id, latitude, longitude, recorded_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        [req.user.id, latitude, longitude],
      );
    }

    return res.json({ message: "Lokasi berhasil disimpan" });
  } catch (err) {
    return handleError(res, err, "Gagal menyimpan lokasi");
  }
};

// ─── 6. EDIT APPROVE ───────────────────────────────────────────────────────

const editApprove = async (req, res) => {
  const input_id = parseInt(req.params.input_id);
  const approve = parseInt(req.body.approve);
  const catatan = req.body.catatan
    ? req.body.catatan.trim().slice(0, 500)
    : null;

  if (!input_id || isNaN(input_id)) {
    return res.status(400).json({ message: "input_id tidak valid" });
  }
  if (
    !approve ||
    isNaN(approve) ||
    approve <= 0 ||
    !Number.isInteger(approve)
  ) {
    return res
      .status(400)
      .json({ message: "Jumlah approve harus bilangan bulat positif" });
  }

  try {
    // Ambil data input, pastikan milik PPL di bawah PML ini
    const [rows] = await pool.query(
      `SELECT i.id, i.ppl_id, i.wilayah_id, i.approve AS approve_lama
       FROM input_harian i
       JOIN users u ON u.id = i.ppl_id
       WHERE i.id = ? AND u.pml_id = ? AND i.ke_lapangan = 0 AND i.submit = 0
       LIMIT 1`,
      [input_id, req.user.id],
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Data tidak ditemukan atau bukan milik Anda" });
    }

    const { ppl_id, wilayah_id, approve_lama } = rows[0];

    // Cek sisa: total submit - total approve (kecuali baris ini sendiri)
    const [progresRows] = await pool.query(
      `SELECT
         COALESCE(SUM(submit),  0) AS total_submit,
         COALESCE(SUM(approve), 0) AS total_approve
       FROM input_harian
       WHERE ppl_id = ? AND wilayah_id = ? AND id != ?`,
      [ppl_id, wilayah_id, input_id],
    );

    const totalSubmit = parseInt(progresRows[0].total_submit);
    const totalApprove = parseInt(progresRows[0].total_approve);
    const sisa = totalSubmit - totalApprove;

    await pool.query(
      `UPDATE input_harian SET approve = ?, catatan = ? WHERE id = ?`,
      [approve, catatan, input_id],
    );

    return res.json({ message: "Approve berhasil diperbarui" });
  } catch (err) {
    return handleError(res, err, "Gagal memperbarui approve");
  }
};

// ─── 7. HAPUS APPROVE ──────────────────────────────────────────────────────

const hapusApprove = async (req, res) => {
  const input_id = parseInt(req.params.input_id);

  if (!input_id || isNaN(input_id)) {
    return res.status(400).json({ message: "input_id tidak valid" });
  }

  try {
    // Pastikan baris ini adalah approve PML (ke_lapangan=0, submit=0) dan PPL di bawah PML ini
    const [rows] = await pool.query(
      `SELECT i.id FROM input_harian i
       JOIN users u ON u.id = i.ppl_id
       WHERE i.id = ? AND u.pml_id = ? AND i.ke_lapangan = 0 AND i.submit = 0
       LIMIT 1`,
      [input_id, req.user.id],
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Data tidak ditemukan atau bukan milik Anda" });
    }

    await pool.query("DELETE FROM input_harian WHERE id = ?", [input_id]);

    return res.json({ message: "Approve berhasil dihapus" });
  } catch (err) {
    return handleError(res, err, "Gagal menghapus approve");
  }
};

module.exports = {
  getMyPPL,
  getInputsByPPL,
  getWilayahByPPL,
  simpanApprove,
  editApprove,
  hapusApprove,
  kirimLokasi,
};
