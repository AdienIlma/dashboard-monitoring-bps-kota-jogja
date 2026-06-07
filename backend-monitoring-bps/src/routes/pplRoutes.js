const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth");
const {
  getMyInputs,
  inputHarian,
  kirimLokasi,
  editInput,
  hapusInput,
} = require("../controllers/pplController");

router.use(authenticate, authorize("ppl"));

router.get("/inputs", getMyInputs);
router.post("/input", inputHarian);
router.post("/lokasi", kirimLokasi);
router.put("/input/:input_id", editInput);
router.delete("/input/:input_id", hapusInput);

module.exports = router;
