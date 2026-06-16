import api from "./api";

// ─── Progress Pendataan ──────────────────────────────────────
export const getProgressData = async () => {
  const res = await api.get("/admin/dashboard/progress");
  return res.data;
};

// ─── Petugas Lapangan ────────────────────────────────────────
export const getPetugasData = async () => {
  const res = await api.get("/admin/dashboard/petugas");
  return res.data;
};

// ─── Tabel Kecamatan/Kelurahan ───────────────────────────────
export const getKecamatanData = async () => {
  const res = await api.get("/admin/dashboard/kecamatan");
  return res.data;
};

// ─── Tabel Harian ────────────────────────────────────────────
export const getKecamatanHarianData = async (tanggal) => {
  const res = await api.get(
    `/admin/dashboard/kecamatan/harian?tanggal=${tanggal}`,
  );
  return res.data;
};

// ─── Sebaran Petugas di Peta ─────────────────────────────────
export const getSebaranPetugas = async () => {
  const res = await api.get("/admin/dashboard/sebaran-petugas");
  return res.data;
};

// ─── Progress 15 Hari Terakhir ───────────────────────────────
export const getProgress15Hari = async () => {
  const res = await api.get("/admin/dashboard/progress-15-hari");
  return res.data;
};

// ─── Progres Petugas (detail total) ──────────────────────────
export const getPetugasDetail = async () => {
  const res = await api.get("/admin/dashboard/petugas-detail");
  return res.data;
};

// ─── Progres Petugas Harian ──────────────────────────────────
export const getPetugasDetailHarian = async (tanggal) => {
  const res = await api.get(
    `/admin/dashboard/petugas-detail-harian?tanggal=${tanggal}`,
  );
  return res.data;
};

// ─── Wilayah ─────────────────────────────────────────────────
export const getWilayahData = async () => {
  const res = await api.get("/admin/wilayah");
  return res.data;
};

export const getWilayahHarianData = async (tanggal) => {
  const res = await api.get(`/admin/wilayah/harian?tanggal=${tanggal}`);
  return res.data;
};
