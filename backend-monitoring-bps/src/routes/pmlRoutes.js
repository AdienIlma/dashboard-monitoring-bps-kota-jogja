const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getMyPPL, getInputsByPPL, kirimLokasi } = require('../controllers/pmlController');

router.use(authenticate, authorize('pml'));

router.get('/ppl', getMyPPL);
router.get('/inputs/:ppl_id', getInputsByPPL);
router.post('/lokasi', kirimLokasi);

module.exports = router;