import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const MENU = [
  { key: "lapangan", label: "Ke Lapangan", color: "#003366" },
  { key: "submit",   label: "Submit",       color: "#E8702A" },
];

const getToday = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().split("T")[0];
};

const DashboardPPL = () => {
  const { user, logout } = useAuth();
  const [activeMenu, setActiveMenu] = useState("lapangan");
  const [wilayah, setWilayah] = useState([]);
  const [inputs, setInputs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [sesi, setSesi] = useState({
    tanggal: getToday(),
    pml_hadir: false,
  });

  const [form, setForm] = useState({
    wilayah_id: "",
    ke_lapangan: "",
    submit: "",
    catatan: "",
  });

  const [selectedSLS, setSelectedSLS] = useState(null);
  const [slsOpen, setSlsOpen] = useState(false);
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

  const isSLSPenuh = (w) => {
    if (!w.target || parseInt(w.target) <= 0) return false;
    const target = parseInt(w.target);
    if (activeMenu === "lapangan") return parseInt(w.total_lapangan || 0) >= target;
    if (activeMenu === "submit")   return parseInt(w.total_submit   || 0) >= target;
    return false;
  };

  const getProgres = (w) => {
    if (activeMenu === "lapangan") return parseInt(w.total_lapangan || 0);
    if (activeMenu === "submit")   return parseInt(w.total_submit   || 0);
    return 0;
  };

  const handlePilihSLS = (w) => {
    if (isSLSPenuh(w)) return;
    setSelectedSLS(w);
    setForm((f) => ({ ...f, wilayah_id: w.id }));
    setSlsOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.wilayah_id) {
      setPesan({ text: "SLS wajib dipilih!", type: "error" });
      return;
    }

    const nilai = {
      lapangan: parseInt(form.ke_lapangan) || 0,
      submit:   parseInt(form.submit)      || 0,
    };

    if (nilai[activeMenu] <= 0) {
      setPesan({ text: "Jumlah harus lebih dari 0!", type: "error" });
      return;
    }

    if (selectedSLS && selectedSLS.target > 0) {
      const progres = getProgres(selectedSLS);
      const sisa = parseInt(selectedSLS.target) - progres;
      if (nilai[activeMenu] > sisa) {
        setPesan({ text: `Jumlah melebihi sisa target! Sisa: ${sisa}`, type: "error" });
        return;
      }
    }

    setSubmitLoading(true);
    setPesan({ text: "", type: "" });
    try {
      await api.post("/ppl/input", {
        wilayah_id:  form.wilayah_id,
        ke_lapangan: activeMenu === "lapangan" ? nilai.lapangan : 0,
        submit:      activeMenu === "submit"   ? nilai.submit   : 0,
        catatan:     form.catatan,
        tanggal:     sesi.tanggal,
        pml_hadir:   sesi.pml_hadir,
      });
      setPesan({ text: "Data berhasil disimpan!", type: "success" });
      setForm({ wilayah_id: "", ke_lapangan: "", submit: "", catatan: "" });
      setSelectedSLS(null);
      fetchAll();
    } catch (err) {
      setPesan({ text: err.response?.data?.message || "Gagal simpan", type: "error" });
    } finally {
      setSubmitLoading(false);
    }
  };

  const totalLapangan = inputs.reduce((a, b) => a + parseInt(b.ke_lapangan), 0);
  const totalSubmit   = inputs.reduce((a, b) => a + parseInt(b.submit),      0);

  const filteredInputs = inputs.filter((i) => {
    if (activeMenu === "lapangan") return parseInt(i.ke_lapangan) > 0;
    if (activeMenu === "submit")   return parseInt(i.submit)      > 0;
    return true;
  });

  const activeColor = MENU.find((m) => m.key === activeMenu)?.color || "#003366";

  const fieldLabel = {
    lapangan: "Jumlah Ke Lapangan",
    submit:   "Jumlah Submit",
  };

  const fieldKey = {
    lapangan: "ke_lapangan",
    submit:   "submit",
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
        <button style={styles.logoutBtn} onClick={logout}>Keluar</button>
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        {MENU.map((m) => (
          <div key={m.key} style={styles.statCard}>
            <div style={{ ...styles.statNum, color: m.color }}>
              {m.key === "lapangan" ? totalLapangan : totalSubmit}
            </div>
            <div style={styles.statLabel}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Card Sesi */}
      <div style={styles.card}>
        <div style={styles.field}>
          <label style={styles.label}>Tanggal</label>
          <input
            style={styles.input}
            type="date"
            value={sesi.tanggal}
            max={getToday()}
            onChange={(e) => setSesi((s) => ({ ...s, tanggal: e.target.value }))}
            required
          />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Kunjungan PML</label>
          <div
            onClick={() => setSesi((s) => ({ ...s, pml_hadir: !s.pml_hadir }))}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px",
              border: `1.5px solid ${sesi.pml_hadir ? "#1D9E75" : "#EBEEf2"}`,
              borderRadius: 8,
              backgroundColor: sesi.pml_hadir ? "#EDFAF4" : "#F7F8FA",
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            <div style={{
              width: 20, height: 20, borderRadius: 6,
              border: `2px solid ${sesi.pml_hadir ? "#1D9E75" : "#B0BAC6"}`,
              backgroundColor: sesi.pml_hadir ? "#1D9E75" : "white",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "all 0.15s",
            }}>
              {sesi.pml_hadir && (
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span style={{ fontSize: 13, color: sesi.pml_hadir ? "#1D9E75" : "#4A5568", fontWeight: sesi.pml_hadir ? 600 : 400 }}>
              {sesi.pml_hadir ? "PML datang berkunjung hari ini ✓" : "PML datang berkunjung hari ini?"}
            </span>
          </div>
        </div>
      </div>

      {/* Menu Tahapan */}
      <div style={styles.menuRow}>
        {MENU.map((m) => (
          <button
            key={m.key}
            onClick={() => { setActiveMenu(m.key); setPesan({ text: "", type: "" }); }}
            style={{
              ...styles.menuBtn,
              backgroundColor: activeMenu === m.key ? m.color : "white",
              color:            activeMenu === m.key ? "white" : "#7A8899",
              borderColor:      activeMenu === m.key ? m.color : "#EBEEf2",
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
          <div style={{
            ...styles.pesan,
            backgroundColor: pesan.type === "success" ? "#EDFAF4" : "#FEE2E2",
            color:            pesan.type === "success" ? "#1D9E75" : "#DC2626",
          }}>
            {pesan.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Pilih SLS */}
          <div style={styles.field}>
            <label style={styles.label}>SLS</label>
            <div
              onClick={() => setSlsOpen((v) => !v)}
              style={{
                ...styles.input,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                cursor: "pointer", userSelect: "none",
                borderColor: slsOpen ? activeColor : "#EBEEf2",
                borderWidth:  slsOpen ? 1.5 : 1,
                color: selectedSLS ? "#2D3748" : "#B0BAC6",
              }}
            >
              <span style={{ fontSize: 13 }}>
                {selectedSLS ? `${selectedSLS.kode_sls || "—"} — ${selectedSLS.kelurahan}` : "Pilih SLS"}
              </span>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
                style={{ transform: slsOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s", flexShrink: 0 }}>
                <path d="M4 6l4 4 4-4" stroke="#9AA5B4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {slsOpen && (
              <div style={styles.slsDropdown}>
                {wilayah.length === 0 ? (
                  <div style={styles.slsEmpty}>Tidak ada SLS tersedia</div>
                ) : (
                  wilayah.map((w) => {
                    const penuh   = isSLSPenuh(w);
                    const progres = getProgres(w);
                    const target  = parseInt(w.target || 0);
                    const pct     = target > 0 ? Math.min((progres / target) * 100, 100) : 0;
                    return (
                      <div
                        key={w.id}
                        onClick={() => handlePilihSLS(w)}
                        style={{
                          ...styles.slsOption,
                          backgroundColor: penuh ? "#FFF8F8" : form.wilayah_id === w.id ? "#F0F4FF" : "white",
                          borderLeft: penuh ? "3px solid #FECACA" : form.wilayah_id === w.id ? `3px solid ${activeColor}` : "3px solid transparent",
                          opacity: penuh ? 0.75 : 1,
                          cursor:  penuh ? "not-allowed" : "pointer",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={styles.slsKode}>{w.kode_sls || "—"}</span>
                          {penuh ? (
                            <span style={styles.badgePenuh}>✓ Target Terpenuhi</span>
                          ) : target > 0 ? (
                            <span style={styles.badgeProgres}>{progres}/{target}</span>
                          ) : null}
                        </div>
                        <div style={styles.slsNama}>
                          {w.kelurahan}<span style={styles.slsKec}>, {w.kecamatan}</span>
                        </div>
                        {target > 0 && (
                          <div style={styles.progressWrap}>
                            <div style={{ ...styles.progressBar, width: `${pct}%`, backgroundColor: penuh ? "#EF4444" : activeColor }} />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {selectedSLS && (
              <div style={styles.slsPreview}>
                <div style={styles.slsPreviewRow}>
                  <span style={styles.slsPreviewKey}>Kode SLS</span>
                  <span style={styles.slsPreviewVal}>{selectedSLS.kode_sls || "—"}</span>
                </div>
                <div style={styles.slsPreviewRow}>
                  <span style={styles.slsPreviewKey}>Kelurahan</span>
                  <span style={styles.slsPreviewVal}>{selectedSLS.kelurahan}</span>
                </div>
                <div style={styles.slsPreviewRow}>
                  <span style={styles.slsPreviewKey}>Kecamatan</span>
                  <span style={styles.slsPreviewVal}>{selectedSLS.kecamatan}</span>
                </div>
                {selectedSLS.target > 0 && (
                  <div style={{ ...styles.slsPreviewRow, borderBottom: "none", marginBottom: 0, paddingBottom: 0 }}>
                    <span style={styles.slsPreviewKey}>Progres</span>
                    <span style={{ ...styles.slsPreviewVal, color: activeColor, fontWeight: 600 }}>
                      {getProgres(selectedSLS)} / {selectedSLS.target}
                      <span style={{ fontSize: 10, fontWeight: 400, color: "#9AA5B4", marginLeft: 4 }}>
                        (sisa {parseInt(selectedSLS.target) - getProgres(selectedSLS)})
                      </span>
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Jumlah */}
          <div style={styles.field}>
            <label style={styles.label}>{fieldLabel[activeMenu]}</label>
            <input
              style={{ ...styles.input, borderColor: activeColor, borderWidth: 1.5 }}
              type="number"
              min="1"
              placeholder="Masukkan jumlah"
              value={form[fieldKey[activeMenu]]}
              onChange={(e) => setForm({ ...form, [fieldKey[activeMenu]]: e.target.value })}
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
            {submitLoading ? "Menyimpan..." : `Simpan ${MENU.find((m) => m.key === activeMenu)?.label}`}
          </button>
        </form>
      </div>

      {/* Riwayat */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>
          Riwayat — {MENU.find((m) => m.key === activeMenu)?.label}
        </div>
        {loading ? (
          <p style={{ textAlign: "center", color: "#9AA5B4", fontSize: 13 }}>Memuat...</p>
        ) : filteredInputs.length === 0 ? (
          <p style={{ textAlign: "center", color: "#9AA5B4", fontSize: 13, padding: "20px 0" }}>
            Belum ada data {MENU.find((m) => m.key === activeMenu)?.label.toLowerCase()}.
          </p>
        ) : (
          filteredInputs.map((i) => (
            <div key={i.id} style={styles.inputItem}>
              <div style={styles.inputLeft}>
                <div style={styles.inputKodeSLS}>{i.kode_sls}</div>
                <div style={styles.inputWilayah}>{i.kelurahan}, {i.kecamatan}</div>
                <div style={styles.inputDate}>
                  {new Date(i.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  {i.catatan && <span style={{ color: "#B0BAC6" }}> · {i.catatan}</span>}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 22, fontWeight: 500, color: activeColor }}>
                  {activeMenu === "lapangan" ? i.ke_lapangan : i.submit}
                </div>
                <div style={{ fontSize: 9, color: "#9AA5B4", textTransform: "uppercase", letterSpacing: "0.05em" }}>
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
  container: { maxWidth: 480, margin: "0 auto", padding: "1rem", backgroundColor: "#F0F2F5", minHeight: "100vh" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#003366", padding: "14px 16px", borderRadius: 14, marginBottom: 14 },
  headerLeft: { display: "flex", alignItems: "center", gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: "50%", backgroundColor: "#E8702A", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 500, fontSize: 15 },
  headerName: { color: "white", fontWeight: 500, fontSize: 14 },
  headerRole: { color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 2 },
  logoutBtn: { backgroundColor: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.7)", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12 },
  statsRow: { display: "flex", gap: 10, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: "white", borderRadius: 12, padding: "12px 10px", textAlign: "center", border: "1px solid #EBEEf2", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" },
  statNum: { fontSize: 24, fontWeight: 500 },
  statLabel: { fontSize: 10, color: "#9AA5B4", marginTop: 3, textTransform: "uppercase", letterSpacing: "0.05em" },
  menuRow: { display: "flex", gap: 8, marginBottom: 14 },
  menuBtn: { flex: 1, padding: "9px 0", border: "1px solid", borderRadius: 10, fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.15s" },
  card: { backgroundColor: "white", borderRadius: 14, padding: "16px", marginBottom: 14, border: "1px solid #EBEEf2", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" },
  cardTitle: { fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid #F0F2F5", color: "#9AA5B4" },
  pesan: { padding: "10px 14px", borderRadius: 8, marginBottom: 14, fontSize: 13, fontWeight: 500 },
  field: { marginBottom: 12 },
  label: { display: "block", fontSize: 12, fontWeight: 500, color: "#4A5568", marginBottom: 5 },
  input: { width: "100%", padding: "9px 12px", border: "1px solid #EBEEf2", borderRadius: 8, fontSize: 13, color: "#2D3748", background: "#F7F8FA", outline: "none", boxSizing: "border-box" },
  submitBtn: { width: "100%", padding: "12px", color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: "pointer", marginTop: 4 },
  slsDropdown: { marginTop: 4, border: "1px solid #EBEEf2", borderRadius: 10, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", backgroundColor: "white", maxHeight: 260, overflowY: "auto" },
  slsOption: { padding: "10px 14px", borderBottom: "1px solid #F7F8FA", transition: "background 0.1s" },
  slsKode: { fontSize: 10, fontWeight: 600, color: "#9AA5B4", letterSpacing: "0.08em", textTransform: "uppercase" },
  slsNama: { fontSize: 13, fontWeight: 500, color: "#2D3748" },
  slsKec: { fontWeight: 400, color: "#9AA5B4" },
  slsEmpty: { padding: "16px", textAlign: "center", color: "#B0BAC6", fontSize: 13 },
  badgePenuh: { fontSize: 9, fontWeight: 700, color: "#DC2626", backgroundColor: "#FEE2E2", padding: "2px 8px", borderRadius: 20, letterSpacing: "0.04em" },
  badgeProgres: { fontSize: 10, fontWeight: 500, color: "#9AA5B4" },
  progressWrap: { marginTop: 6, height: 3, backgroundColor: "#F0F2F5", borderRadius: 99, overflow: "hidden" },
  progressBar: { height: "100%", borderRadius: 99, transition: "width 0.3s" },
  slsPreview: { marginTop: 8, padding: "10px 14px", backgroundColor: "#F7F8FA", borderRadius: 8, border: "1px solid #EBEEf2" },
  slsPreviewRow: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 6, marginBottom: 6, borderBottom: "1px solid #EEF0F3" },
  slsPreviewKey: { fontSize: 11, color: "#9AA5B4" },
  slsPreviewVal: { fontSize: 12, fontWeight: 500, color: "#2D3748" },
  inputItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #F7F8FA" },
  inputLeft: { flex: 1 },
  inputKodeSLS: { fontSize: 9, fontWeight: 600, color: "#B0BAC6", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 },
  inputWilayah: { fontSize: 13, fontWeight: 500, color: "#2D3748", marginBottom: 3 },
  inputDate: { fontSize: 11, color: "#9AA5B4" },
};

export default DashboardPPL;