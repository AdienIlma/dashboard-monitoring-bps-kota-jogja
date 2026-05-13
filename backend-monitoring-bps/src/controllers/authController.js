const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);

  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ message: 'Username dan password wajib diisi' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user) return res.status(401).json({ message: 'Username tidak ditemukan' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Password salah' });

    const token = jwt.sign(
      { id: user.id, nama: user.nama, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    await pool.query(
    'UPDATE users SET is_logged_in = TRUE WHERE id = $1',
    [user.id]
    );
    res.json({ token, role: user.role, nama: user.nama });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const logout = async (req, res) => {
  try {
    await pool.query(
  'UPDATE users SET is_logged_in = FALSE WHERE id = $1',
  [req.user.id]
);
    res.json({ message: 'Logout berhasil' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal logout', error: err.message });
  }
};

module.exports = { login, logout };