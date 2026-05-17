import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const MENU = [
  { key: "lapangan", label: "Ke Lapangan", color: "#003366" },
  { key: "submit", label: "Submit", color: "#E8702A" },
  { key: "approve", label: "Approve", color: "#1D9E75" },
];

const DashboardPPL = () => {
  const { user, logout } = useAuth();
  const [activeMenu, setActiveMenu] = useState("lapangan");
  const [wilayah, setWilayah] = useState([]);
  const [inputs, setInputs] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Sesi (dibagi semua form) ──────────────────────────────────────────────
  const [sesi, setSesi] = useState({
    tanggal: new Date().toISOString().split("T")[0],
    pml_hadir: false,
  });

  // ── Form per-tahapan ──────────────────────────────────────────────────────
  const [form, setForm] = useState({
    wilayah_id: "",
    kecamatan: "",
    ke_lapangan: "",
    submit: "",
    approve: "",
    catatan: "",
  });

  const [submitLoading, setSubmitLoading] = useState(false);
  const [pesan, setPesan] = useState({ text: "", type: "" });

  useEffect(() => {
    fetchAll();
    kirimLokasiOtomatis();
    const interval = setInterval(kirimLokasiOtomatis, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchAll = async () => {
    try {
      const [w, i] = await Promise.all([
        api.get("/wilayah"),
        api.get("/ppl/inputs"),
      ]);
      setWilayah(w.data);
      setInputs(i.data);
    } catch (err) {
      console.error("Gagal fetch", err);
    } finally {
      setLoading(false);
    }
  };

  const kirimLokasiOtomatis = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        await api.post("/ppl/lokasi", {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      } catch (err) {
        console.error("Gagal kirim lokasi", err);
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.wilayah_id) {
      setPesan({ text: "Wilayah wajib dipilih!", type: "error" });
      return;
    }

    const nilai = {
      lapangan: parseInt(form.ke_lapangan) || 0,
      submit: parseInt(form.submit) || 0,
      approve: parseInt(form.approve) || 0,
    };

    if (nilai[activeMenu] <= 0) {
      setPesan({ text: "Jumlah harus lebih dari 0!", type: "error" });
      return;
    }

    setSubmitLoading(true);
    setPesan({ text: "", type: "" });
    try {
      await api.post("/ppl/input", {
        wilayah_id: form.wilayah_id,
        ke_lapangan: activeMenu === "lapangan" ? nilai.lapangan : 0,
        submit: activeMenu === "submit" ? nilai.submit : 0,
        approve: activeMenu === "approve" ? nilai.approve : 0,
        catatan: form.catatan,
        // ← ambil dari sesi, bukan dari form
        tanggal: sesi.tanggal,
        pml_hadir: sesi.pml_hadir,
      });
      setPesan({ text: "Data berhasil disimpan!", type: "success" });
      // reset hanya field per-tahapan, sesi tetap
      setForm((f) => ({
        ...f,
        wilayah_id: "",
        kecamatan: "",
        ke_lapangan: "",
        submit: "",
        approve: "",
        catatan: "",
      }));
      fetchAll();
    } catch (err) {
      setPesan({
        text: err.response?.data?.message || "Gagal simpan",
        type: "error",
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const kecamatanList = [...new Set(wilayah.map((w) => w.kecamatan))];
  const kelurahanList = wilayah.filter(
    (w) =>
      w.kecamatan === form.kecamatan &&
      w.kelurahan &&
      w.kelurahan !== w.kecamatan,
  );

  const totalLapangan = inputs.reduce((a, b) => a + parseInt(b.ke_lapangan), 0);
  const totalSubmit = inputs.reduce((a, b) => a + parseInt(b.submit), 0);
  const totalApprove = inputs.reduce((a, b) => a + parseInt(b.approve), 0);

  const filteredInputs = inputs.filter((i) => {
    if (activeMenu === "lapangan") return parseInt(i.ke_lapangan) > 0;
    if (activeMenu === "submit") return parseInt(i.submit) > 0;
    if (activeMenu === "approve") return parseInt(i.approve) > 0;
    return true;
  });

  const activeColor =
    MENU.find((m) => m.key === activeMenu)?.color || "#003366";

  const fieldLabel = {
    lapangan: "Jumlah Ke Lapangan",
    submit: "Jumlah Submit",
    approve: "Jumlah Approve",
  };

  const fieldKey = {
    lapangan: "ke_lapangan",
    submit: "submit",
    approve: "approve",
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.avatar}>{user?.nama?.charAt(0)}</div>
          <div>
            <div style={styles.headerName}>{user?.nama}</div>
            <div style={styles.headerRole}>Petugas PPL</div>
          </div>
        </div>
        <button style={styles.logoutBtn} onClick={logout}>
          Keluar
        </button>
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        {MENU.map((m) => (
          <div key={m.key} style={styles.statCard}>
            <div style={{ ...styles.statNum, color: m.color }}>
              {m.key === "lapangan"
                ? totalLapangan
                : m.key === "submit"
                  ? totalSubmit
                  : totalApprove}
            </div>
            <div style={styles.statLabel}>{m.label}</div>
          </div>
        ))}
      </div>

      <div style={styles.card}>
        {/* Tanggal */}
        <div style={styles.field}>
          <label style={styles.label}>Tanggal</label>
          <input
            style={styles.input}
            type="date"
            value={sesi.tanggal}
            max={new Date().toISOString().split("T")[0]}
            onChange={(e) =>
              setSesi((s) => ({ ...s, tanggal: e.target.value }))
            }
            required
          />
        </div>

        {/* PML Hadir */}
        <div style={styles.field}>
          <label style={styles.label}>Kunjungan PML</label>
          <div
            onClick={() => setSesi((s) => ({ ...s, pml_hadir: !s.pml_hadir }))}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              border: `1.5px solid ${sesi.pml_hadir ? "#1D9E75" : "#EBEEf2"}`,
              borderRadius: 8,
              backgroundColor: sesi.pml_hadir ? "#EDFAF4" : "#F7F8FA",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: 6,
                border: `2px solid ${sesi.pml_hadir ? "#1D9E75" : "#B0BAC6"}`,
                backgroundColor: sesi.pml_hadir ? "#1D9E75" : "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "all 0.15s",
              }}
            >
              {sesi.pml_hadir && (
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2 6l3 3 5-5"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <span
              style={{
                fontSize: 13,
                color: sesi.pml_hadir ? "#1D9E75" : "#4A5568",
                fontWeight: sesi.pml_hadir ? 600 : 400,
              }}
            >
              {sesi.pml_hadir
                ? "PML datang berkunjung hari ini ✓"
                : "PML datang berkunjung hari ini?"}
            </span>
          </div>
        </div>
      </div>

      {/* Menu Tahapan */}
      <div style={styles.menuRow}>
        {MENU.map((m) => (
          <button
            key={m.key}
            onClick={() => {
              setActiveMenu(m.key);
              setPesan({ text: "", type: "" });
            }}
            style={{
              ...styles.menuBtn,
              backgroundColor: activeMenu === m.key ? m.color : "white",
              color: activeMenu === m.key ? "white" : "#7A8899",
              borderColor: activeMenu === m.key ? m.color : "#EBEEf2",
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Form Input */}
      <div style={styles.card}>
        <div style={{ ...styles.cardTitle, color: activeColor }}>
          Input {MENU.find((m) => m.key === activeMenu)?.label}
        </div>

        {pesan.text && (
          <div
            style={{
              ...styles.pesan,
              backgroundColor: pesan.type === "success" ? "#EDFAF4" : "#FEE2E2",
              color: pesan.type === "success" ? "#1D9E75" : "#DC2626",
            }}
          >
            {pesan.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Kecamatan */}
          <div style={styles.field}>
            <label style={styles.label}>Kecamatan</label>
            <select
              style={styles.input}
              value={form.kecamatan}
              onChange={(e) =>
                setForm({ ...form, kecamatan: e.target.value, wilayah_id: "" })
              }
            >
              <option value="">Pilih Kecamatan</option>
              {kecamatanList.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          {/* Kelurahan */}
          <div style={styles.field}>
            <label style={styles.label}>Kelurahan</label>
            <select
              style={{
                ...styles.input,
                color: !form.kecamatan ? "#B0BAC6" : "#2D3748",
              }}
              value={form.wilayah_id}
              onChange={(e) => setForm({ ...form, wilayah_id: e.target.value })}
              disabled={!form.kecamatan}
            >
              <option value="">Pilih Kelurahan</option>
              {kelurahanList.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.kelurahan}
                </option>
              ))}
            </select>
          </div>

          {/* Jumlah sesuai menu aktif */}
          <div style={styles.field}>
            <label style={styles.label}>{fieldLabel[activeMenu]}</label>
            <input
              style={{
                ...styles.input,
                borderColor: activeColor,
                borderWidth: 1.5,
              }}
              type="number"
              min="1"
              placeholder="Masukkan jumlah"
              value={form[fieldKey[activeMenu]]}
              onChange={(e) =>
                setForm({ ...form, [fieldKey[activeMenu]]: e.target.value })
              }
              required
            />
          </div>

          {/* Catatan */}
          <div style={styles.field}>
            <label style={styles.label}>Catatan (opsional)</label>
            <textarea
              style={{ ...styles.input, resize: "none", height: 60 }}
              placeholder="Catatan tambahan..."
              value={form.catatan}
              onChange={(e) => setForm({ ...form, catatan: e.target.value })}
            />
          </div>

          <button
            type="submit"
            style={{ ...styles.submitBtn, backgroundColor: activeColor }}
            disabled={submitLoading}
          >
            {submitLoading
              ? "Menyimpan..."
              : `Simpan ${MENU.find((m) => m.key === activeMenu)?.label}`}
          </button>
        </form>
      </div>

      {/* Riwayat */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>
          Riwayat — {MENU.find((m) => m.key === activeMenu)?.label}
        </div>
        {loading ? (
          <p style={{ textAlign: "center", color: "#9AA5B4", fontSize: 13 }}>
            Memuat...
          </p>
        ) : filteredInputs.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              color: "#9AA5B4",
              fontSize: 13,
              padding: "20px 0",
            }}
          >
            Belum ada data{" "}
            {MENU.find((m) => m.key === activeMenu)?.label.toLowerCase()}.
          </p>
        ) : (
          filteredInputs.map((i) => (
            <div key={i.id} style={styles.inputItem}>
              <div style={styles.inputLeft}>
                <div style={styles.inputWilayah}>
                  {i.kelurahan}, {i.kecamatan}
                </div>
                <div style={styles.inputDate}>
                  {new Date(i.tanggal).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  {i.catatan && (
                    <span style={{ color: "#B0BAC6" }}> · {i.catatan}</span>
                  )}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{ fontSize: 22, fontWeight: 500, color: activeColor }}
                >
                  {activeMenu === "lapangan"
                    ? i.ke_lapangan
                    : activeMenu === "submit"
                      ? i.submit
                      : i.approve}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    color: "#9AA5B4",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {MENU.find((m) => m.key === activeMenu)?.label}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: 480,
    margin: "0 auto",
    padding: "1rem",
    backgroundColor: "#F0F2F5",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#003366",
    padding: "14px 16px",
    borderRadius: 14,
    marginBottom: 14,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 10 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    backgroundColor: "#E8702A",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontWeight: 500,
    fontSize: 15,
  },
  headerName: { color: "white", fontWeight: 500, fontSize: 14 },
  headerRole: { color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 2 },
  logoutBtn: {
    backgroundColor: "transparent",
    border: "1px solid rgba(255,255,255,0.2)",
    color: "rgba(255,255,255,0.7)",
    padding: "6px 14px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 12,
  },
  statsRow: { display: "flex", gap: 10, marginBottom: 12 },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 12,
    padding: "12px 10px",
    textAlign: "center",
    border: "1px solid #EBEEf2",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },
  statNum: { fontSize: 24, fontWeight: 500 },
  statLabel: {
    fontSize: 10,
    color: "#9AA5B4",
    marginTop: 3,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  menuRow: { display: "flex", gap: 8, marginBottom: 14 },
  menuBtn: {
    flex: 1,
    padding: "9px 0",
    border: "1px solid",
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.15s",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: "16px",
    marginBottom: 14,
    border: "1px solid #EBEEf2",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    marginBottom: 14,
    paddingBottom: 10,
    borderBottom: "1px solid #F0F2F5",
    color: "#9AA5B4",
  },
  pesan: {
    padding: "10px 14px",
    borderRadius: 8,
    marginBottom: 14,
    fontSize: 13,
    fontWeight: 500,
  },
  field: { marginBottom: 12 },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 500,
    color: "#4A5568",
    marginBottom: 5,
  },
  input: {
    width: "100%",
    padding: "9px 12px",
    border: "1px solid #EBEEf2",
    borderRadius: 8,
    fontSize: 13,
    color: "#2D3748",
    background: "#F7F8FA",
    outline: "none",
    boxSizing: "border-box",
  },
  submitBtn: {
    width: "100%",
    padding: "12px",
    color: "white",
    border: "none",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    marginTop: 4,
  },
  inputItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
    borderBottom: "1px solid #F7F8FA",
  },
  inputLeft: { flex: 1 },
  inputWilayah: {
    fontSize: 13,
    fontWeight: 500,
    color: "#2D3748",
    marginBottom: 3,
  },
  inputDate: { fontSize: 11, color: "#9AA5B4" },
  sesiInfo: { display: "flex", alignItems: "center", gap: 6, marginTop: 4 },
  sesiDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    backgroundColor: "#1D9E75",
    flexShrink: 0,
  },
  sesiText: { fontSize: 11, color: "#9AA5B4", fontStyle: "italic" },
};

export default DashboardPPL;
