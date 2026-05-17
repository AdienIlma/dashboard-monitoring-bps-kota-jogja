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

  // wilayah
  getWilayah,
  createWilayah,
  updateWilayah,
  deleteWilayah,

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
router.get("/users", getAllUsers);
router.post("/users", createUser);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

router.get("/users/pml", getPMLList);
router.get("/users/pml/:id/ppl", getPPLByPML);

// WILAYAH MANAGEMENT
router.get("/wilayah", getWilayah);
router.post("/wilayah", createWilayah);
router.put("/wilayah/:id", updateWilayah);
router.delete("/wilayah/:id", deleteWilayah);

// DASHBOARD ENDPOINTS
router.get("/dashboard/progress", getDashboardProgress);
router.get("/dashboard/petugas", getDashboardPetugas);
router.get("/dashboard/kecamatan", getDashboardKecamatan);
router.get("/dashboard/kecamatan/harian", getDashboardKecamatanHarian);
router.get("/dashboard/petugas-detail", getDashboardPetugasDetail);
router.get("/dashboard/sebaran-petugas", getDashboardSebaranPetugas);
router.get("/dashboard/progress-15-hari", getDashboardProgress15Hari);
router.get("/dashboard/petugas-detail-harian", getDashboardPetugasDetailHarian);

module.exports = router;
