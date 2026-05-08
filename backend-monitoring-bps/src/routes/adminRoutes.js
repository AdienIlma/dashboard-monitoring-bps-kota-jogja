const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { 
  getAllUsers, 
  createUser, 
  getResponden, 
  createResponden, 
  assignResponden,
  getPMLList,
  getPPLByPML,
  getDashboardProgress,
  getDashboardPetugas,
  getDashboardKecamatan,
  getDashboardPetugasDetail,
  getDashboardSebaranPetugas,
  getDashboardProgress15Hari,
} = require('../controllers/adminController');

router.use(authenticate, authorize('admin'));

router.get('/users', getAllUsers);
router.post('/users', createUser);
router.get('/users/pml', getPMLList);
router.get('/users/pml/:id/ppl', getPPLByPML);
router.get('/responden', getResponden);
router.post('/responden', createResponden);
router.put('/responden/:id/assign', assignResponden);

// dashboard endpoints
router.get('/dashboard/progress', getDashboardProgress);
router.get('/dashboard/petugas', getDashboardPetugas);
router.get('/dashboard/kecamatan', getDashboardKecamatan);
router.get('/dashboard/petugas-detail', getDashboardPetugasDetail);
router.get('/dashboard/sebaran-petugas', getDashboardSebaranPetugas);
router.get('/dashboard/progress-15-hari', getDashboardProgress15Hari);

module.exports = router;