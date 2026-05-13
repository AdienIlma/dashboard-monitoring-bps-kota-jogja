const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const pool = require('../config/db');

// GET semua wilayah (bisa diakses semua role)
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM wilayah ORDER BY kecamatan, kelurahan'
    );
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