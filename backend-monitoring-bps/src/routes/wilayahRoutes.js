const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const pool = require('../config/db');

// GET semua wilayah
router.get('/', authenticate, async (req, res) => {
  try {
    let result;

    if (req.user.role === 'ppl') {
      // PPL: hanya SLS milik mereka via user_sls
      result = await pool.query(
        `SELECT
          w.*,
          us.user_id                          AS ppl_id,
          COALESCE(SUM(i.ke_lapangan), 0)     AS total_lapangan,
          COALESCE(SUM(i.submit), 0)          AS total_submit,
          COALESCE(SUM(i.approve), 0)         AS total_approve
        FROM wilayah w
        JOIN user_sls us ON us.wilayah_id = w.id
        LEFT JOIN input_harian i ON i.wilayah_id = w.id
        WHERE us.user_id = $1
        GROUP BY w.id, us.user_id
        ORDER BY w.kecamatan, w.kelurahan`,
        [req.user.id]
      );
    } else {
      // Admin & PML: semua wilayah + ppl_id dari user_sls
      result = await pool.query(
        `SELECT
          w.*,
          us.user_id AS ppl_id
        FROM wilayah w
        LEFT JOIN user_sls us ON us.wilayah_id = w.id
        ORDER BY w.kecamatan, w.kelurahan`
      );
    }

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Gagal ambil wilayah', error: err.message });
  }
});

// POST tambah wilayah (admin only)
router.post('/', authenticate, async (req, res) => {
  const { kecamatan, kelurahan } = req.body;
  if (!kecamatan || !kelurahan) {
    return res.status(400).json({ message: 'kecamatan dan kelurahan wajib diisi' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO wilayah (kecamatan, kelurahan) VALUES ($1, $2) RETURNING *',
      [kecamatan, kelurahan]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Gagal tambah wilayah', error: err.message });
  }
});

// DELETE wilayah (admin only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await pool.query('DELETE FROM wilayah WHERE id = $1', [req.params.id]);
    res.json({ message: 'Wilayah dihapus' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal hapus wilayah', error: err.message });
  }
});

module.exports = router;