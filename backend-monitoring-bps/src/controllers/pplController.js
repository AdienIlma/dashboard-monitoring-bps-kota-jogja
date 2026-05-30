const pool = require("../config/db");

const getMyInputs = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT i.*, w.kecamatan, w.kelurahan, w.kode_sls
      FROM input_harian i
      JOIN wilayah w ON i.wilayah_id = w.id
      WHERE i.ppl_id = ?
      ORDER BY i.created_at DESC
    `,
      [req.user.id],
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Gagal ambil data", error: err.message });
  }
};

const inputHarian = async (req, res) => {
  const { wilayah_id, ke_lapangan, submit, approve, catatan, tanggal, pml_hadir } = req.body;

  if (!wilayah_id) {
    return res.status(400).json({ message: "Wilayah wajib dipilih" });
  }
  if (!ke_lapangan && !submit && !approve) {
    return res.status(400).json({ message: "Minimal satu data harus diisi" });
  }

  const tgl = tanggal || new Date().toISOString().split("T")[0];

  try {
    // ke_lapangan: UPDATE baris hari ini kalau sudah ada, INSERT kalau belum
    if (ke_lapangan) {
      const [cekRows] = await pool.query(
        `SELECT id FROM input_harian 
         WHERE ppl_id = ? AND wilayah_id = ? AND tanggal = ? AND ke_lapangan > 0`,
        [req.user.id, wilayah_id, tgl]
      );

      if (cekRows.length > 0) {
        // UPDATE — timpa nilai ke_lapangan hari ini
        await pool.query(
          `UPDATE input_harian 
           SET ke_lapangan = ?, catatan = ?, pml_hadir = ?
           WHERE id = ?`,
          [ke_lapangan, catatan || null, pml_hadir === true || pml_hadir === 'true', cekRows[0].id]
        );
      } else {
        // INSERT baru
        await pool.query(
          `INSERT INTO input_harian (ppl_id, wilayah_id, ke_lapangan, submit, approve, catatan, tanggal, pml_hadir)
           VALUES (?, ?, ?, 0, 0, ?, ?, ?)`,
          [req.user.id, wilayah_id, ke_lapangan, catatan || null, tgl, pml_hadir === true || pml_hadir === 'true']
        );
      }
    }

    // ── submit: selalu INSERT baris baru (akumulasi)
    if (submit && parseInt(submit) > 0) {
      await pool.query(
        `INSERT INTO input_harian (ppl_id, wilayah_id, ke_lapangan, submit, approve, catatan, tanggal, pml_hadir)
         VALUES (?, ?, 0, ?, 0, ?, ?, ?)`,
        [req.user.id, wilayah_id, submit, catatan || null, tgl, pml_hadir === true || pml_hadir === 'true']
      );
    }

    res.status(201).json({ message: 'Input berhasil disimpan' });
  } catch (err) {
    console.error('❌ inputHarian ERROR:', err.message);
    res.status(500).json({ message: "Gagal input data", error: err.message });
  }
};

const kirimLokasi = async (req, res) => {
  const { latitude, longitude } = req.body;

  try {
    const [cekRows] = await pool.query(
      'SELECT id FROM lokasi WHERE user_id = ?',
      [req.user.id]
    );

    if (cekRows.length > 0) {
      // update lokasi lama
      await pool.query(
        `UPDATE lokasi
         SET latitude    = ?,
             longitude   = ?,
             recorded_at = CURRENT_TIMESTAMP
         WHERE user_id   = ?`,
        [latitude, longitude, req.user.id]
      );
    } else {
      // insert pertama kali
      await pool.query(
        `INSERT INTO lokasi (user_id, latitude, longitude, recorded_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        [req.user.id, latitude, longitude]
      );
    }

    res.json({ message: 'Lokasi berhasil disimpan' });

  } catch (err) {
    console.error('ERROR LOKASI:', err);

    res.status(500).json({
      message: 'Gagal simpan lokasi',
      error: err.message
    });
  }
};

module.exports = { getMyInputs, inputHarian, kirimLokasi };