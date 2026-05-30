const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  console.log('=== LOGIN REQUEST ===');
  console.log('Body:', req.body);

  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({
      message: 'Username dan password wajib diisi',
    });
  }

  try {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    const user = rows[0];

    if (!user) {
      return res.status(401).json({
        message: 'Username tidak ditemukan',
      });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({
        message: 'Password salah',
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        nama: user.nama,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '8h',
      }
    );

    console.log('=== SEBELUM UPDATE ===');
    const [sebelumRows] = await pool.query(
      'SELECT id, nama, username, is_logged_in FROM users WHERE id = ?',
      [user.id]
    );
    console.log(sebelumRows[0]);

    await pool.query(
      'UPDATE users SET is_logged_in = TRUE WHERE id = ?',
      [user.id]
    );

    console.log('=== SETELAH UPDATE ===');
    const [sesudahRows] = await pool.query(
      'SELECT id, nama, username, is_logged_in FROM users WHERE id = ?',
      [user.id]
    );
    console.log(sesudahRows[0]);

    console.log('LOGIN BERHASIL:', {
      id: user.id,
      nama: user.nama,
      username: user.username,
      role: user.role,
    });

    res.json({
      token,
      role: user.role,
      nama: user.nama,
    });

  } catch (err) {
    console.error('=== LOGIN ERROR ===');
    console.error(err);

    res.status(500).json({
      message: 'Server error',
      error: err.message,
    });
  }
};

const logout = async (req, res) => {
  try {
    console.log('=== LOGOUT ===');
    console.log('User ID:', req.user.id);

    await pool.query(
      'UPDATE users SET is_logged_in = FALSE WHERE id = ?',
      [req.user.id]
    );

    const [cekRows] = await pool.query(
      'SELECT id, nama, username, is_logged_in FROM users WHERE id = ?',
      [req.user.id]
    );

    console.log('SETELAH LOGOUT:', cekRows[0]);

    res.json({
      message: 'Logout berhasil',
    });

  } catch (err) {
    console.error('LOGOUT ERROR:', err);

    res.status(500).json({
      message: 'Gagal logout',
      error: err.message,
    });
  }
};

module.exports = {
  login,
  logout,
};