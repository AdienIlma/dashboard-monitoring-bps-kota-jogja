const pool = require('../config/db');

const getMyPPL = async (req, res) => {
  const result = await pool.query('SELECT id, nama, username FROM users WHERE pml_id = $1', [req.user.id]);
  res.json(result.rows);
};

const getSubmissions = async (req, res) => {
  const result = await pool.query(`
    SELECT s.*, r.nama_kepala_keluarga, r.alamat, u.nama as nama_ppl
    FROM submissions s
    JOIN responden r ON s.responden_id = r.id
    JOIN users u ON s.ppl_id = u.id
    WHERE u.pml_id = $1
    ORDER BY s.submitted_at DESC
  `, [req.user.id]);
  res.json(result.rows);
};

const reviewSubmission = async (req, res) => {
  const { id } = req.params;
  const { status, catatan_pml } = req.body; // status: 'approved' atau 'ditolak'
  try {
    const result = await pool.query(`
      UPDATE submissions 
      SET status = $1, catatan_pml = $2, reviewed_by = $3, reviewed_at = NOW()
      WHERE id = $4 RETURNING *
    `, [status, catatan_pml || null, req.user.id, id]);

    // update status responden juga
    await pool.query('UPDATE responden SET status = $1 WHERE id = $2',
      [status, result.rows[0].responden_id]);

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Gagal review', error: err.message });
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

module.exports = { getMyPPL, getSubmissions, reviewSubmission, kirimLokasi };