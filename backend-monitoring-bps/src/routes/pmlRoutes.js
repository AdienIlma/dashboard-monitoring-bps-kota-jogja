const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getMyPPL, getInputsByPPL, kirimLokasi, getWilayahByPPL, simpanApprove } = require('../controllers/pmlController');

router.use(authenticate, authorize('pml'));

router.get('/ppl',              getMyPPL);
router.get('/inputs/:ppl_id',   getInputsByPPL);
router.get('/wilayah/:ppl_id',  getWilayahByPPL);  // ← tambah
router.post('/lokasi',          kirimLokasi);
router.post('/approve',         simpanApprove);     // ← tambah (kalau belum ada)

module.exports = router;