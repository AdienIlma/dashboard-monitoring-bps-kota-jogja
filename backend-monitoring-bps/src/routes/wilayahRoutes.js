const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const pool = require('../config/db');

// GET semua wilayah
router.get('/', authenticate, async (req, res) => {
  try {

    if (req.user.role === 'ppl') {

      const [rows] = await pool.query(
        `
        SELECT
          w.*,
          us.user_id AS ppl_id,
          COALESCE(SUM(i.ke_lapangan),0) AS total_lapangan,
          COALESCE(SUM(i.submit),0) AS total_submit,
          COALESCE(SUM(i.approve),0) AS total_approve
        FROM wilayah w
        JOIN user_sls us
          ON us.wilayah_id = w.id
        LEFT JOIN input_harian i
          ON i.wilayah_id = w.id
        WHERE us.user_id = ?
        GROUP BY w.id, us.user_id
        ORDER BY w.kecamatan, w.kelurahan
        `,
        [req.user.id]
      );

      return res.json(rows);
    }

    const [rows] = await pool.query(`
      SELECT
        w.*,
        us.user_id AS ppl_id
      FROM wilayah w
      LEFT JOIN user_sls us
        ON us.wilayah_id = w.id
      ORDER BY w.kecamatan, w.kelurahan
    `);

    res.json(rows);

  } catch (err) {
    console.error('❌ GET WILAYAH ERROR:', err.message);

    res.status(500).json({
      message: 'Gagal ambil wilayah',
      error: err.message
    });
  }
});

// POST tambah wilayah (admin only)
router.post('/', authenticate, async (req, res) => {
  const { kecamatan, kelurahan } = req.body;

  if (!kecamatan || !kelurahan) {
    return res.status(400).json({
      message: 'kecamatan dan kelurahan wajib diisi'
    });
  }

  try {

    const [result] = await pool.query(
      'INSERT INTO wilayah (kecamatan, kelurahan) VALUES (?, ?)',
      [kecamatan, kelurahan]
    );

    const [rows] = await pool.query(
      'SELECT * FROM wilayah WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(rows[0]);

  } catch (err) {
    console.error('❌ TAMBAH WILAYAH ERROR:', err.message);

    res.status(500).json({
      message: 'Gagal tambah wilayah',
      error: err.message
    });
  }
});

// DELETE wilayah (admin only)
router.delete('/:id', authenticate, async (req, res) => {
  try {

    await pool.query(
      'DELETE FROM wilayah WHERE id = ?',
      [req.params.id]
    );

    res.json({
      message: 'Wilayah dihapus'
    });

  } catch (err) {
    console.error('❌ HAPUS WILAYAH ERROR:', err.message);

    res.status(500).json({
      message: 'Gagal hapus wilayah',
      error: err.message
    });
  }
});

module.exports = router;