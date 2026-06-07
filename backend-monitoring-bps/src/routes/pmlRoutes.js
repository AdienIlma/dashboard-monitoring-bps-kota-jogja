const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getMyPPL, getInputsByPPL, kirimLokasi, getWilayahByPPL, simpanApprove, editApprove, hapusApprove } = require('../controllers/pmlController');

router.use(authenticate, authorize('pml'));

router.get('/ppl',              getMyPPL);
router.get('/inputs/:ppl_id',   getInputsByPPL);
router.get('/wilayah/:ppl_id',  getWilayahByPPL);  
router.post('/lokasi',          kirimLokasi);
router.post('/approve',         simpanApprove);    
router.put('/approve/:input_id',      editApprove);    
router.delete('/approve/:input_id',   hapusApprove);   

module.exports = router;