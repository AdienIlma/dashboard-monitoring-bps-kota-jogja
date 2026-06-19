const pool = require('../config/db');

const isDev = process.env.NODE_ENV !== 'production';

// ─── Helper ────────────────────────────────────────────────────────────────

const handleError = (res, err, message = 'Terjadi kesalahan server') => {
  console.error(message, ':', err.message);
  res.status(500).json({
    message,
    ...(isDev && { error: err.message }),
  });
};

// ─── 1. AMBIL DATA INPUT HARIAN PETUGAS ────────────────────────────────────

const getMyInputs = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         i.id, i.wilayah_id, i.ke_lapangan, i.submit, i.approve,
         i.catatan, i.tanggal, i.pml_hadir, i.created_at,
         w.kecamatan, w.kelurahan, w.kode_sls
       FROM input_harian i
       JOIN wilayah w ON i.wilayah_id = w.id
       WHERE i.ppl_id = ?
       ORDER BY i.created_at DESC`,
      [req.user.id]
    );

    return res.json(rows);
  } catch (err) {
    return handleError(res, err, 'Gagal ambil data input');
  }
};

// ─── 2. SIMPAN / UPDATE INPUT HARIAN ───────────────────────────────────────

const inputHarian = async (req, res) => {
  const { wilayah_id, ke_lapangan, submit, catatan, tanggal, pml_hadir } = req.body;

  if (!wilayah_id) {
    return res.status(400).json({ message: 'Wilayah wajib dipilih' });
  }

  const nilaiKeLapangan = parseInt(ke_lapangan) || 0;
  const nilaiSubmit     = parseInt(submit)       || 0;

  if (nilaiKeLapangan === 0 && nilaiSubmit === 0) {
    return res.status(400).json({ message: 'Minimal satu data harus diisi' });
  }

  const tgl        = tanggal || new Date().toISOString().split('T')[0];
  const isPmlHadir = pml_hadir === true || pml_hadir === 'true';

  try {
    const [cekRows] = await pool.query(
      `SELECT id, ke_lapangan, submit
       FROM input_harian
       WHERE ppl_id = ? AND wilayah_id = ? AND tanggal = ?
       LIMIT 1`,
      [req.user.id, wilayah_id, tgl]
    );

    if (cekRows.length > 0) {
      const dataLama     = cekRows[0];
      const baruLapangan = nilaiKeLapangan > 0 ? nilaiKeLapangan : dataLama.ke_lapangan;
      const baruSubmit = nilaiSubmit > 0 ? nilaiSubmit : dataLama.submit;

      await pool.query(
        `UPDATE input_harian
         SET ke_lapangan = ?, submit = ?, catatan = ?, pml_hadir = ?
         WHERE id = ?`,
        [baruLapangan, baruSubmit, catatan || null, isPmlHadir, dataLama.id]
      );
    } else {
      await pool.query(
        `INSERT INTO input_harian
           (ppl_id, wilayah_id, ke_lapangan, submit, approve, catatan, tanggal, pml_hadir)
         VALUES (?, ?, ?, ?, 0, ?, ?, ?)`,
        [req.user.id, wilayah_id, nilaiKeLapangan, nilaiSubmit, catatan || null, tgl, isPmlHadir]
      );
    }

    return res.status(201).json({ message: 'Input berhasil disimpan' });
  } catch (err) {
    return handleError(res, err, 'Gagal input data');
  }
};

// ─── 3. KIRIM LOKASI GEOLOCATION ───────────────────────────────────────────

const kirimLokasi = async (req, res) => {
  const { latitude, longitude } = req.body;

  if (
    typeof latitude  !== 'number' || typeof longitude !== 'number' ||
    isNaN(latitude)  || isNaN(longitude) ||
    latitude  < -90  || latitude  > 90   ||
    longitude < -180 || longitude > 180
  ) {
    return res.status(400).json({ message: 'Koordinat latitude/longitude tidak valid' });
  }

  try {
    const [cekRows] = await pool.query(
      'SELECT id FROM lokasi WHERE user_id = ? LIMIT 1',
      [req.user.id]
    );

    if (cekRows.length > 0) {
      await pool.query(
        `UPDATE lokasi
         SET latitude = ?, longitude = ?, recorded_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [latitude, longitude, req.user.id]
      );
    } else {
      await pool.query(
        `INSERT INTO lokasi (user_id, latitude, longitude, recorded_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        [req.user.id, latitude, longitude]
      );
    }

    return res.json({ message: 'Lokasi berhasil disimpan' });
  } catch (err) {
    return handleError(res, err, 'Gagal simpan lokasi');
  }
};

// ─── 4. EDIT INPUT HARIAN ──────────────────────────────────────────────────

const editInput = async (req, res) => {
  const input_id    = parseInt(req.params.input_id);
  const ke_lapangan = parseInt(req.body.ke_lapangan) || 0;
  const submit      = parseInt(req.body.submit)      || 0;
  const catatan     = req.body.catatan ? req.body.catatan.trim().slice(0, 500) : null;

  if (!input_id || isNaN(input_id)) {
    return res.status(400).json({ message: 'input_id tidak valid' });
  }
  if (ke_lapangan === 0 && submit === 0) {
    return res.status(400).json({ message: 'Minimal satu nilai harus lebih dari 0' });
  }

  try {
    // Pastikan baris ini milik PPL yang login, dan belum di-approve
    const [rows] = await pool.query(
      `SELECT id, approve FROM input_harian
       WHERE id = ? AND ppl_id = ? LIMIT 1`,
      [input_id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Data tidak ditemukan' });
    }
    if (parseInt(rows[0].approve) > 0) {
      return res.status(403).json({ message: 'Data yang sudah di-approve tidak bisa diedit' });
    }

    await pool.query(
      `UPDATE input_harian
       SET ke_lapangan = ?, submit = ?, catatan = ?
       WHERE id = ?`,
      [ke_lapangan, submit, catatan, input_id]
    );

    return res.json({ message: 'Input berhasil diperbarui' });
  } catch (err) {
    return handleError(res, err, 'Gagal memperbarui input');
  }
};

// ─── 5. HAPUS INPUT HARIAN ─────────────────────────────────────────────────

const hapusInput = async (req, res) => {
  const input_id = parseInt(req.params.input_id);

  if (!input_id || isNaN(input_id)) {
    return res.status(400).json({ message: 'input_id tidak valid' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT id, approve FROM input_harian
       WHERE id = ? AND ppl_id = ? LIMIT 1`,
      [input_id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Data tidak ditemukan' });
    }
    if (parseInt(rows[0].approve) > 0) {
      return res.status(403).json({ message: 'Data yang sudah di-approve tidak bisa dihapus' });
    }

    await pool.query('DELETE FROM input_harian WHERE id = ?', [input_id]);

    return res.json({ message: 'Input berhasil dihapus' });
  } catch (err) {
    return handleError(res, err, 'Gagal menghapus input');
  }
};

// ─── 6. AMBIL WILAYAH MILIK PPL (dengan total progress) ───────────────────

const getWilayahPPL = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         w.*,
         COALESCE(SUM(i.ke_lapangan), 0) AS total_lapangan,
         COALESCE(SUM(i.submit),      0) AS total_submit
       FROM wilayah w
       JOIN user_sls us ON us.wilayah_id = w.id
       LEFT JOIN input_harian i ON i.wilayah_id = w.id
       WHERE us.user_id = ?
       GROUP BY w.id
       ORDER BY w.kecamatan, w.kelurahan`,
      [req.user.id]
    );
    return res.json(rows);
  } catch (err) {
    return handleError(res, err, 'Gagal ambil wilayah PPL');
  }
};

module.exports = { getMyInputs, inputHarian, kirimLokasi, editInput, hapusInput, getWilayahPPL };
