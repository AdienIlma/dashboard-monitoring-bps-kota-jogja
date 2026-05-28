const pool = require('../config/db');

const getMyPPL = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id, u.nama, u.username,
        COALESCE(SUM(i.ke_lapangan), 0) as total_ke_lapangan,
        COALESCE(SUM(i.submit), 0) as total_submit,
        COALESCE(SUM(i.approve), 0) as total_approve,
        COUNT(i.id) as total_input
      FROM users u
      LEFT JOIN input_harian i ON i.ppl_id = u.id
      WHERE u.pml_id = $1
      GROUP BY u.id, u.nama, u.username
      ORDER BY u.nama
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Gagal ambil PPL', error: err.message });
  }
};

const getInputsByPPL = async (req, res) => {
  const { ppl_id } = req.params;
  try {
    const cek = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND pml_id = $2',
      [ppl_id, req.user.id]
    );
    if (cek.rows.length === 0) {
      return res.status(403).json({ message: 'PPL tidak di bawah anda' });
    }

    const result = await pool.query(`
      SELECT i.*, w.kecamatan, w.kelurahan
      FROM input_harian i
      JOIN wilayah w ON i.wilayah_id = w.id
      WHERE i.ppl_id = $1
      ORDER BY i.created_at DESC
    `, [ppl_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Gagal ambil data', error: err.message });
  }
};

// Ambil wilayah milik PPL — gabungan dari kolom ppl_id di wilayah
// dan tabel user_sls (keduanya dipakai supaya tidak ada yang terlewat)
const getWilayahByPPL = async (req, res) => {
  const { ppl_id } = req.params;
  try {
    const cek = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND pml_id = $2',
      [ppl_id, req.user.id]
    );
    if (cek.rows.length === 0) {
      return res.status(403).json({ message: 'PPL tidak di bawah anda' });
    }

    const result = await pool.query(`
      SELECT
        w.id,
        w.kode_sls,
        w.kelurahan,
        w.kecamatan,
        w.target,
        COALESCE(SUM(i.submit),  0) AS total_submit,
        COALESCE(SUM(i.approve), 0) AS total_approve
      FROM wilayah w
      LEFT JOIN user_sls us ON us.wilayah_id = w.id AND us.user_id = $1
      LEFT JOIN input_harian i ON i.wilayah_id = w.id AND i.ppl_id = $1
      WHERE w.ppl_id = $1 OR us.user_id = $1
      GROUP BY w.id, w.kode_sls, w.kelurahan, w.kecamatan, w.target
      ORDER BY w.kelurahan
    `, [ppl_id]);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Gagal ambil wilayah', error: err.message });
  }
};

const simpanApprove = async (req, res) => {
  const { ppl_id, wilayah_id, approve, catatan } = req.body;
  try {
    const cek = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND pml_id = $2',
      [ppl_id, req.user.id]
    );
    if (cek.rows.length === 0) {
      return res.status(403).json({ message: 'PPL tidak di bawah anda' });
    }

    const progres = await pool.query(`
      SELECT
        COALESCE(SUM(submit),  0) AS total_submit,
        COALESCE(SUM(approve), 0) AS total_approve
      FROM input_harian
      WHERE ppl_id = $1 AND wilayah_id = $2
    `, [ppl_id, wilayah_id]);

    const sisa = parseInt(progres.rows[0].total_submit) - parseInt(progres.rows[0].total_approve);
    if (approve > sisa) {
      return res.status(400).json({
        message: `Jumlah melebihi sisa yang bisa di-approve! Sisa: ${sisa}`
      });
    }

    await pool.query(`
      INSERT INTO input_harian (ppl_id, wilayah_id, ke_lapangan, submit, approve, catatan, tanggal)
      VALUES ($1, $2, 0, 0, $3, $4, CURRENT_DATE)
    `, [ppl_id, wilayah_id, approve, catatan || null]);

    res.json({ message: 'Approve berhasil disimpan' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal simpan approve', error: err.message });
  }
};

const kirimLokasi = async (req, res) => {
  const { latitude, longitude } = req.body;

  try {
    // cek apakah user sudah punya lokasi
    const cek = await pool.query(
      'SELECT id FROM lokasi WHERE user_id = $1',
      [req.user.id]
    );

    if (cek.rows.length > 0) {
      // update lokasi lama
      await pool.query(
        `
        UPDATE lokasi
        SET latitude = $1,
            longitude = $2,
            recorded_at = CURRENT_TIMESTAMP
        WHERE user_id = $3
        `,
        [latitude, longitude, req.user.id]
      );
    } else {
      // insert pertama kali
      await pool.query(
        `
        INSERT INTO lokasi (
          user_id,
          latitude,
          longitude,
          recorded_at
        )
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        `,
        [req.user.id, latitude, longitude]
      );
    }

    res.json({
      message: 'Lokasi berhasil disimpan'
    });

  } catch (err) {
    console.error('ERROR LOKASI:', err);

    res.status(500).json({
      message: 'Gagal simpan lokasi',
      error: err.message
    });
  }
};

module.exports = { getMyPPL, getInputsByPPL, getWilayahByPPL, simpanApprove, kirimLokasi };