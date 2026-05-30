const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth");

const {
  // user
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getPMLList,
  getPPLByPML,
  deleteUsersBulk,
  importUsers,
  upload,

  // wilayah
  getWilayah,
  createWilayah,
  updateWilayah,
  deleteWilayah,
  deleteWilayahBulk,
  importWilayah,

  // dashboard
  getDashboardProgress,
  getDashboardPetugas,
  getDashboardKecamatan,
  getDashboardKecamatanHarian,
  getDashboardPetugasDetail,
  getDashboardSebaranPetugas,
  getDashboardProgress15Hari,
  getDashboardPetugasDetailHarian,
} = require("../controllers/adminController");

// Semua route di bawah hanya bisa diakses admin
router.use(authenticate, authorize("admin"));

// USER MANAGEMENT 
router.get   ("/users",                    getAllUsers);
router.post  ("/users",                    createUser);
router.post  ("/users/import",             upload.single("file"), importUsers);
router.delete("/users/bulk",               deleteUsersBulk);
router.get   ("/users/pml",                getPMLList);
router.get   ("/users/pml/:id/ppl",        getPPLByPML);

router.put   ("/users/:id",                updateUser);   // ← hanya sekali
router.delete("/users/:id",                deleteUser);

//WILAYAH MANAGEMENT
router.get   ("/wilayah",                  getWilayah);
router.post  ("/wilayah",                  createWilayah);
router.post  ("/wilayah/import",           upload.single("file"), importWilayah);
router.delete("/wilayah/bulk",             deleteWilayahBulk);
router.put   ("/wilayah/:id",              updateWilayah);
router.delete("/wilayah/:id",             deleteWilayah);

// DASHBOARD 
router.get("/dashboard/progress",              getDashboardProgress);
router.get("/dashboard/petugas",               getDashboardPetugas);
router.get("/dashboard/kecamatan",             getDashboardKecamatan);
router.get("/dashboard/kecamatan/harian",      getDashboardKecamatanHarian);
router.get("/dashboard/petugas-detail",        getDashboardPetugasDetail);
router.get("/dashboard/sebaran-petugas",       getDashboardSebaranPetugas);
router.get("/dashboard/progress-15-hari",      getDashboardProgress15Hari);
router.get("/dashboard/petugas-detail-harian", getDashboardPetugasDetailHarian);

module.exports = router;