const pool = require("../config/db");

const getMyInputs = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT i.*, w.kecamatan, w.kelurahan, w.kode_sls  -- tambah kode_sls
      FROM input_harian i
      JOIN wilayah w ON i.wilayah_id = w.id
      WHERE i.ppl_id = $1
      ORDER BY i.created_at DESC
    `,
      [req.user.id],
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Gagal ambil data", error: err.message });
  }
};

const inputHarian = async (req, res) => {
  const {
    wilayah_id,
    ke_lapangan,
    submit,
    approve,
    catatan,
    tanggal,
    pml_hadir,
  } = req.body;

  if (!wilayah_id) {
    return res.status(400).json({ message: "Wilayah wajib dipilih" });
  }
  if (!ke_lapangan && !submit && !approve) {
    return res.status(400).json({ message: "Minimal satu data harus diisi" });
  }
  try {
    const result = await pool.query(
      `
      INSERT INTO input_harian (ppl_id, wilayah_id, ke_lapangan, submit, approve, catatan, tanggal, pml_hadir)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
    `,
      [
        req.user.id,
        wilayah_id,
        ke_lapangan || 0,
        submit || 0,
        approve || 0,
        catatan || null,
        tanggal || new Date().toISOString().split("T")[0],
        pml_hadir === true || pml_hadir === "true", // ✅ $8
      ],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Gagal input data", error: err.message });
  }
};

const kirimLokasi = async (req, res) => {
  const { latitude, longitude } = req.body;
  try {
    await pool.query(
      "INSERT INTO lokasi (user_id, latitude, longitude) VALUES ($1,$2,$3)",
      [req.user.id, latitude, longitude],
    );
    res.json({ message: "Lokasi tersimpan" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Gagal simpan lokasi", error: err.message });
  }
};

module.exports = { getMyInputs, inputHarian, kirimLokasi };
