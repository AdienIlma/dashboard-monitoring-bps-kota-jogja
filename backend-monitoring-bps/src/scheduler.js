const cron = require('node-cron');
const pool = require('./config/db'); // sesuaikan path ke koneksi db kamu

// Setiap hari jam 23:00 (11 malam) — reset semua is_logged_in jadi FALSE
cron.schedule('0 23 * * *', async () => {
  try {
    const [result] = await pool.query(
      'UPDATE users SET is_logged_in = FALSE WHERE is_logged_in = TRUE'
    );
    console.log(`✅ [CRON 23:00] Reset ${result.affectedRows} user jadi offline`);
  } catch (err) {
    console.error('❌ [CRON 23:00] Gagal reset login:', err.message);
  }
}, {
  timezone: 'Asia/Jakarta'
});

console.log('🕐 Scheduler aktif — reset login tiap jam 23:00 WIB');