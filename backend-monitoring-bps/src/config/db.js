const mysql = require('mysql2/promise');
require('dotenv').config();

console.log(
  'DB_USER=',
  process.env.DB_USER,
  'DB_NAME=',
  process.env.DB_NAME
);

console.log('================ DATABASE CONFIG ================');
console.log('DB_HOST     =', process.env.DB_HOST);
console.log('DB_PORT     =', process.env.DB_PORT);
console.log('DB_USER     =', process.env.DB_USER);
console.log('DB_NAME     =', process.env.DB_NAME);
console.log('DB_PASSWORD =', process.env.DB_PASSWORD ? 'ADA' : 'KOSONG');
console.log('================================================');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 50,
  connectTimeout: 10000,
});

pool.getConnection()
  .then((conn) => {
    console.log('✅ MySQL terhubung');
    conn.release();
  })
  .catch((err) => {
    console.error('❌ MySQL gagal:', err.message);
  });

module.exports = pool;