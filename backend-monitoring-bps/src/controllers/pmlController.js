const pool = require('../config/db');

const getMyPPL = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id, u.nama, u.email,
        COALESCE(SUM(i.ke_lapangan), 0) as total_ke_lapangan,
        COALESCE(SUM(i.submit), 0) as total_submit,
        COALESCE(SUM(i.approve), 0) as total_approve,
        COUNT(i.id) as total_input
      FROM users u
      LEFT JOIN input_harian i ON i.ppl_id = u.id
      WHERE u.pml_id = $1
      GROUP BY u.id, u.nama, u.email
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
    // validasi PPL di bawah PML ini
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

const kirimLokasi = async (req, res) => {
  const { latitude, longitude } = req.body;
  try {
    await pool.query(
      'INSERT INTO lokasi (user_id, latitude, longitude) VALUES ($1,$2,$3)',
      [req.user.id, latitude, longitude]
    );
    res.json({ message: 'Lokasi tersimpan' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal simpan lokasi', error: err.message });
  }
};

module.exports = { getMyPPL, getInputsByPPL, kirimLokasi };