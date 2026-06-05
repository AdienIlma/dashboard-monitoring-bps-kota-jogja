const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token tidak ada' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Cek session_token di DB
    const [rows] = await pool.query(
      'SELECT session_token FROM users WHERE id = ?',
      [decoded.id]
    );

    const sessionTokenFromClient = req.headers['x-session-token'];

    if (!rows[0] || rows[0].session_token !== sessionTokenFromClient) {
      return res.status(401).json({
        message: 'Sesi tidak valid, silakan login ulang',
        code: 'SESSION_INVALIDATED',
      });
    }

    req.user = decoded;
    next();

  } catch {
    return res.status(401).json({ message: 'Token tidak valid' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Akses ditolak' });
  }
  next();
};

module.exports = { authenticate, authorize };