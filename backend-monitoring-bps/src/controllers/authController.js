const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const isDev = process.env.NODE_ENV !== 'production';

const login = async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ message: 'Username dan password wajib diisi' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, nama, username, password, role FROM users WHERE username = ?',
      [username]
    );

    const user = rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Username tidak ditemukan' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Password salah' });
    }

    // Generate session token baru — otomatis invalidate sesi lama
    const sessionToken = crypto.randomBytes(32).toString('hex');

    const token = jwt.sign(
      { id: user.id, nama: user.nama, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    await pool.query(
      'UPDATE users SET is_logged_in = TRUE, session_token = ? WHERE id = ?',
      [sessionToken, user.id]
    );

    if (isDev) {
      console.log('LOGIN BERHASIL:', { id: user.id, username: user.username, role: user.role });
    }

    return res.json({
      token,
      sessionToken,
      role: user.role,
      nama: user.nama,
    });

  } catch (err) {
    console.error('LOGIN ERROR:', err.message);
    return res.status(500).json({
      message: 'Server error',
      ...(isDev && { error: err.message }),
    });
  }
};

const logout = async (req, res) => {
  try {
    await pool.query(
      'UPDATE users SET is_logged_in = FALSE, session_token = NULL WHERE id = ?',
      [req.user.id]
    );

    if (isDev) {
      console.log('LOGOUT: user id', req.user.id);
    }

    return res.json({ message: 'Logout berhasil' });

  } catch (err) {
    console.error('LOGOUT ERROR:', err.message);
    return res.status(500).json({
      message: 'Gagal logout',
      ...(isDev && { error: err.message }),
    });
  }
};

module.exports = { login, logout };