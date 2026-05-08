const pool = require('../config/db');

const getMyResponden = async (req, res) => {
  const result = await pool.query('SELECT * FROM responden WHERE ppl_id = $1', [req.user.id]);
  res.json(result.rows);
};

const submitResponden = async (req, res) => {
  const { id } = req.params;
  const { catatan_ppl } = req.body;
  try {
    await pool.query('UPDATE responden SET status = $1 WHERE id = $2', ['submitted', id]);
    const result = await pool.query(
      'INSERT INTO submissions (responden_id, ppl_id, catatan_ppl) VALUES ($1,$2,$3) RETURNING *',
      [id, req.user.id, catatan_ppl || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Gagal submit', error: err.message });
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

module.exports = { getMyResponden, submitResponden, kirimLokasi };
