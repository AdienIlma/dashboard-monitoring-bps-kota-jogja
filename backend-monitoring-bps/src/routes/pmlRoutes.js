const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getMyPPL, getSubmissions, reviewSubmission, kirimLokasi } = require('../controllers/pmlController');

router.use(authenticate, authorize('pml'));

router.get('/ppl', getMyPPL);
router.get('/submissions', getSubmissions);
router.put('/submissions/:id/review', reviewSubmission);
router.post('/lokasi', kirimLokasi);

module.exports = router;
