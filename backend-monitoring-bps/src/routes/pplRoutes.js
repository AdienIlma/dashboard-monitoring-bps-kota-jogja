const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getMyResponden, submitResponden, kirimLokasi } = require('../controllers/pplController');

router.use(authenticate, authorize('ppl'));

router.get('/responden', getMyResponden);
router.post('/responden/:id/submit', submitResponden);
router.post('/lokasi', kirimLokasi);

module.exports = router;
