const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getMyInputs, inputHarian, kirimLokasi } = require('../controllers/pplController');

router.use(authenticate, authorize('ppl'));

router.get('/inputs', getMyInputs);
router.post('/input', inputHarian);
router.post('/lokasi', kirimLokasi);

module.exports = router;