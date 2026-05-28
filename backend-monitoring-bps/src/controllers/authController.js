const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  console.log('=== LOGIN REQUEST ===');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);

  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({
      message: 'Username dan password wajib diisi',
    });
  }

  try {
    console.log('Cari user...');

    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    console.log('Query result:', result.rows);

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        message: 'Username tidak ditemukan',
      });
    }

    console.log('User ditemukan:', user.username);

    console.log('Cek password...');
    const valid = await bcrypt.compare(password, user.password);

    console.log('Password valid:', valid);

    if (!valid) {
      return res.status(401).json({
        message: 'Password salah',
      });
    }

    console.log('JWT_SECRET:', process.env.JWT_SECRET);
    console.log('JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN);

    const token = jwt.sign(
      {
        id: user.id,
        nama: user.nama,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      }
    );

    console.log('Token berhasil dibuat');

    await pool.query(
      'UPDATE users SET is_logged_in = TRUE WHERE id = $1',
      [user.id]
    );

    console.log('Login sukses');

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
      stack: err.stack,
    });
  }
};

const logout = async (req, res) => {
  try {
    await pool.query(
      'UPDATE users SET is_logged_in = FALSE WHERE id = $1',
      [req.user.id]
    );

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

module.exports = { login, logout };