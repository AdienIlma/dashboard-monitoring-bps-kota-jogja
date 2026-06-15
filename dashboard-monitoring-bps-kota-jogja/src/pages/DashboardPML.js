import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const getToday = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().split("T")[0];
};

const DashboardPML = () => {
  const { user, logout } = useAuth();
  const [pplList, setPplList] = useState([]);
  const [expandedPPL, setExpandedPPL] = useState(null);
  const [inputs, setInputs] = useState({});
  const [wilayahMap, setWilayahMap] = useState({});
  const [loadingMap, setLoadingMap] = useState({});
  const [loading, setLoading] = useState(true);

  const [selectedSLS, setSelectedSLS] = useState({});
  const [slsOpen, setSlsOpen] = useState({});
  const [jumlahApprove, setJumlahApprove] = useState({});
  const [tanggalApprove, setTanggalApprove] = useState({});
  const [riwayatOpen, setRiwayatOpen] = useState({}); // ← dipakai untuk toggle
  const [lokasiStatus, setLokasiStatus] = useState("idle"); // idle | loading | success | error
  const [submitLoading, setSubmitLoading] = useState({});
  const [pesan, setPesan] = useState({});

  const [editMode, setEditMode] = useState({});
  const [editJumlah, setEditJumlah] = useState({});
  const [editLoading, setEditLoading] = useState({});

  const [filterTgl, setFilterTgl] = useState({}); // { ppl_id: { dari: "", sampai: "" } }
  const [filterSLS, setFilterSLS] = useState({}); // { ppl_id: wilayah_id }
  const [perPage, setPerPage] = useState({}); // { ppl_id: 10 }
  const [halaman, setHalaman] = useState({});

  useEffect(() => {
    fetchPPL();

  }, []);

  const fetchPPL = async () => {
    try {
      const res = await api.get("/pml/ppl");
      setPplList(res.data);
    } catch (err) {
      console.error("Gagal fetch PPL", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInputs = async (ppl_id) => {
    try {
      const res = await api.get(`/pml/inputs/${ppl_id}`);
      setInputs((prev) => ({ ...prev, [ppl_id]: res.data }));
      return res.data;
    } catch (err) {
      console.error("Gagal fetch inputs", err);
      return [];
    }
  };

  const fetchWilayah = async (ppl_id) => {
    setLoadingMap((prev) => ({ ...prev, [ppl_id]: true }));
    try {
      const res = await api.get(`/pml/wilayah/${ppl_id}`);
      setWilayahMap((prev) => ({ ...prev, [ppl_id]: res.data }));
      return res.data;
    } catch (err) {
      console.error("Gagal fetch wilayah", err);
      setWilayahMap((prev) => ({ ...prev, [ppl_id]: [] }));
      return [];
    } finally {
      setLoadingMap((prev) => ({ ...prev, [ppl_id]: false }));
    }
  };

  const kirimLokasiManual = () => {
    if (!navigator.geolocation) {
      setLokasiStatus("error");
      setTimeout(() => setLokasiStatus("idle"), 3000);
      return;
    }
    setLokasiStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await api.post("/pml/lokasi", {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          setLokasiStatus("success");
        } catch (err) {
          setLokasiStatus("error");
        } finally {
          setTimeout(() => setLokasiStatus("idle"), 3000);
        }
      },
      () => {
        setLokasiStatus("error");
        setTimeout(() => setLokasiStatus("idle"), 3000);
      },
      { timeout: 10000 }
    );
  };

  const handleTogglePPL = (ppl) => {
    const id = ppl.id;
    if (expandedPPL === id) {
      setExpandedPPL(null);
      setSlsOpen((prev) => ({ ...prev, [id]: false }));
    } else {
      setExpandedPPL(id);
      setSlsOpen((prev) => ({ ...prev, [id]: false }));
      setTanggalApprove((prev) => ({ ...prev, [id]: getToday() }));
      if (!inputs[id]) fetchInputs(id);
      if (!wilayahMap[id]) fetchWilayah(id);
    }
  };


  const handlePilihSLS = (ppl_id, w) => {
    setSelectedSLS((prev) => ({ ...prev, [ppl_id]: w }));
    setSlsOpen((prev) => ({ ...prev, [ppl_id]: false }));
  };

  const handleApprove = async (e, ppl_id) => {
    e.preventDefault();
    const sls = selectedSLS[ppl_id];
    const jumlah = parseInt(jumlahApprove[ppl_id]) || 0;
    const tanggal = tanggalApprove[ppl_id];

    if (!sls) {
      setPesan((prev) => ({
        ...prev,
        [ppl_id]: { text: "SLS wajib dipilih!", type: "error" },
      }));
      return;
    }
    if (!tanggal) {
      setPesan((prev) => ({
        ...prev,
        [ppl_id]: { text: "Tanggal wajib dipilih!", type: "error" },
      }));
      return;
    }
    if (jumlah <= 0) {
      setPesan((prev) => ({
        ...prev,
        [ppl_id]: { text: "Jumlah harus lebih dari 0!", type: "error" },
      }));
      return;
    }
    const sisa =
      parseInt(sls.total_submit || 0) - parseInt(sls.total_approve || 0);
    if (jumlah > sisa) {
      setPesan((prev) => ({
        ...prev,
        [ppl_id]: {
          text: `Melebihi sisa approve! Sisa: ${sisa}`,
          type: "error",
        },
      }));
      return;
    }

    setSubmitLoading((prev) => ({ ...prev, [ppl_id]: true }));
    setPesan((prev) => ({ ...prev, [ppl_id]: { text: "", type: "" } }));

    try {
      await api.post("/pml/approve", {
        ppl_id,
        wilayah_id: sls.id,
        approve: jumlah,
        tanggal: tanggal,
      });

      setPesan((prev) => ({
        ...prev,
        [ppl_id]: { text: "✅ Approve berhasil disimpan!", type: "success" },
      }));
      setJumlahApprove((prev) => ({ ...prev, [ppl_id]: "" }));

      const [updatedInputs, , updatedWilayahList] = await Promise.all([
        fetchInputs(ppl_id),
        fetchPPL(),
        fetchWilayah(ppl_id),
      ]);

      if (updatedWilayahList) {
        const updatedSls = updatedWilayahList.find((w) => w.id === sls.id);
        if (updatedSls) {
          const sisaBaru =
            parseInt(updatedSls.total_submit || 0) -
            parseInt(updatedSls.total_approve || 0);
          if (sisaBaru <= 0) {
            setSelectedSLS((prev) => ({ ...prev, [ppl_id]: null }));
          } else {
            setSelectedSLS((prev) => ({ ...prev, [ppl_id]: updatedSls }));
          }
        }
      }

      if (updatedInputs) {
        setInputs((prev) => ({ ...prev, [ppl_id]: updatedInputs }));
      }
    } catch (err) {
      setPesan((prev) => ({
        ...prev,
        [ppl_id]: {
          text: err.response?.data?.message || "Gagal simpan",
          type: "error",
        },
      }));
    } finally {
      setSubmitLoading((prev) => ({ ...prev, [ppl_id]: false }));
    }
  };

  const handleEdit = async (inp, ppl_id) => {
    const jumlah = parseInt(editJumlah[inp.id]);
    if (!jumlah || jumlah <= 0) return;

    setEditLoading((prev) => ({ ...prev, [inp.id]: true }));
    try {
      await api.put(`/pml/approve/${inp.id}`, { approve: jumlah });
      setPesan((prev) => ({
        ...prev,
        [ppl_id]: { text: "✅ Approve diperbarui!", type: "success" },
      }));
      setEditMode((prev) => ({ ...prev, [inp.id]: false }));
      await Promise.all([
        fetchInputs(ppl_id),
        fetchWilayah(ppl_id),
        fetchPPL(),
      ]);
    } catch (err) {
      setPesan((prev) => ({
        ...prev,
        [ppl_id]: {
          text: err.response?.data?.message || "Gagal update",
          type: "error",
        },
      }));
    } finally {
      setEditLoading((prev) => ({ ...prev, [inp.id]: false }));
    }
  };

  const handleHapus = async (inp, ppl_id) => {
    if (!window.confirm(`Hapus approve ${inp.approve} untuk ${inp.kelurahan}?`))
      return;
    try {
      await api.delete(`/pml/approve/${inp.id}`);
      setPesan((prev) => ({
        ...prev,
        [ppl_id]: { text: "🗑️ Approve dihapus!", type: "success" },
      }));
      await Promise.all([
        fetchInputs(ppl_id),
        fetchWilayah(ppl_id),
        fetchPPL(),
      ]);
    } catch (err) {
      setPesan((prev) => ({
        ...prev,
        [ppl_id]: {
          text: err.response?.data?.message || "Gagal hapus",
          type: "error",
        },
      }));
    }
  };

  const cekTanggalTerisi = (pplInputs, dateString) => {
    if (!dateString) return false;
    return pplInputs.some((inp) => {
      if (!inp.tanggal) return false;
      if (parseInt(inp.approve || 0) <= 0) return false;
      return inp.tanggal.slice(0, 10) === dateString;
    });
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.avatar}>{user?.nama?.charAt(0)}</div>
          <div>
            <div style={styles.headerName}>{user?.nama}</div>
            <div style={styles.headerRole}>Petugas PML</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={kirimLokasiManual}
            disabled={lokasiStatus === "loading"}
            style={{
              backgroundColor:
                lokasiStatus === "success" ? "#1D9E75"
                : lokasiStatus === "error" ? "#DC2626"
                : "transparent",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "rgba(255,255,255,0.9)",
              padding: "6px 12px",
              borderRadius: 8,
              cursor: lokasiStatus === "loading" ? "not-allowed" : "pointer",
              fontSize: 11,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 5,
              transition: "all 0.2s",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="10" r="3" />
              <path d="M12 2a8 8 0 0 1 8 8c0 5.25-8 14-8 14S4 15.25 4 10a8 8 0 0 1 8-8z" />
            </svg>
            {lokasiStatus === "loading" ? "..." : lokasiStatus === "success" ? "Terkirim ✓" : lokasiStatus === "error" ? "Gagal ✗" : "Kirim Lokasi"}
          </button>
          <button style={styles.logoutBtn} onClick={logout}>
            Keluar
          </button>
        </div>
      </div>

      {/* Daftar PPL */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>PPL yang Dibawahi</div>

        {loading ? (
          <p
            style={{
              textAlign: "center",
              color: "#9AA5B4",
              fontSize: 13,
              padding: "16px 0",
            }}
          >
            Memuat...
          </p>
        ) : pplList.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              color: "#9AA5B4",
              fontSize: 13,
              padding: "16px 0",
            }}
          >
            Belum ada PPL.
          </p>
        ) : (
          pplList.map((ppl) => {
            const isOpen = expandedPPL === ppl.id;
            const pplInputs = inputs[ppl.id] || [];
            const wilayahList = wilayahMap[ppl.id] || [];

            const totalLapangan = pplInputs.reduce(
              (a, b) => a + parseInt(b.ke_lapangan || 0),
              0,
            );
            const totalSubmit = pplInputs.reduce(
              (a, b) => a + parseInt(b.submit || 0),
              0,
            );
            const totalApprove = pplInputs.reduce(
              (a, b) => a + parseInt(b.approve || 0),
              0,
            );

            const slsSelected = selectedSLS[ppl.id];
            const isSlsOpen = slsOpen[ppl.id];
            const isSubmitting = submitLoading[ppl.id];
            const pesanItem = pesan[ppl.id];
            const isRiwayatOpen = riwayatOpen[ppl.id]; // ← dipakai di JSX
            const tglTerpilih = tanggalApprove[ppl.id] || getToday();

            const isHariIniHijau = cekTanggalTerisi(pplInputs, tglTerpilih);

            const slsBisaApprove = wilayahList.filter(
              (w) =>
                parseInt(w.total_submit || 0) - parseInt(w.total_approve || 0) >
                0,
            );

            return (
              <div key={ppl.id} style={{ marginBottom: 8 }}>
                {/* Baris PPL */}
                <div
                  onClick={() => handleTogglePPL(ppl)}
                  style={{
                    ...styles.pplItem,
                    backgroundColor: isOpen ? "#EEF5FF" : "#F7F8FA",
                    borderColor: isOpen ? "#C7DEFF" : "#EBEEf2",
                  }}
                >
                  <div style={styles.pplAvatar}>{ppl.nama.charAt(0)}</div>
                  <div style={styles.pplInfo}>
                    <div style={styles.pplName}>{ppl.nama}</div>
                    <div style={styles.pplemail}>
                      @{ppl.email || ppl.username}
                    </div>
                  </div>
                  <div style={styles.pplStats}>
                    <div style={styles.pplStat}>
                      <div style={{ ...styles.pplStatNum, color: "#003366" }}>
                        {ppl.total_ke_lapangan}
                      </div>
                      <div style={styles.pplStatLabel}>Lapangan</div>
                    </div>
                    <div style={styles.pplStat}>
                      <div style={{ ...styles.pplStatNum, color: "#E8702A" }}>
                        {ppl.total_submit}
                      </div>
                      <div style={styles.pplStatLabel}>Submit</div>
                    </div>
                    <div style={styles.pplStat}>
                      <div style={{ ...styles.pplStatNum, color: "#1D9E75" }}>
                        {ppl.total_approve}
                      </div>
                      <div style={styles.pplStatLabel}>Approve</div>
                    </div>
                  </div>
                  <span
                    style={{ fontSize: 10, color: "#9AA5B4", marginLeft: 6 }}
                  >
                    {isOpen ? "▲" : "▼"}
                  </span>
                </div>

                {/* Panel accordion */}
                {isOpen && (
                  <div style={styles.accordionBody}>
                    {/* Ringkasan */}
                    <div style={styles.section}>
                      <div style={styles.sectionTitle}>Ringkasan</div>
                      <div style={styles.summaryRow}>
                        {[
                          {
                            label: "Lapangan",
                            val: totalLapangan,
                            color: "#003366",
                          },
                          {
                            label: "Submit",
                            val: totalSubmit,
                            color: "#E8702A",
                          },
                          {
                            label: "Approve",
                            val: totalApprove,
                            color: "#1D9E75",
                          },
                        ].map(({ label, val, color }) => (
                          <div key={label} style={styles.summaryCard}>
                            <div style={{ ...styles.summaryNum, color }}>
                              {val}
                            </div>
                            <div style={styles.summaryLabel}>{label}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Form Approve */}
                    <div
                      style={{
                        ...styles.section,
                        borderTop: "1px solid #EEF5FF",
                        paddingTop: 14,
                      }}
                    >
                      <div style={styles.sectionTitle}>Approve Data</div>

                      {pesanItem?.text && (
                        <div
                          style={{
                            ...styles.pesan,
                            backgroundColor:
                              pesanItem.type === "success"
                                ? "#F0FDF4"
                                : "#FFF1F2",
                            color:
                              pesanItem.type === "success"
                                ? "#15803D"
                                : "#BE123C",
                            border: `1px solid ${pesanItem.type === "success" ? "#BBF7D0" : "#FECDD3"}`,
                          }}
                        >
                          {pesanItem.text}
                        </div>
                      )}

                      {loadingMap[ppl.id] ? (
                        <p
                          style={{
                            fontSize: 12,
                            color: "#9AA5B4",
                            textAlign: "center",
                          }}
                        >
                          Memuat SLS...
                        </p>
                      ) : slsBisaApprove.length === 0 && !slsSelected ? (
                        <p
                          style={{
                            fontSize: 12,
                            color: "#9AA5B4",
                            textAlign: "center",
                            padding: "8px 0",
                          }}
                        >
                          Tidak ada SLS yang bisa di-approve saat ini.
                        </p>
                      ) : (
                        <form onSubmit={(e) => handleApprove(e, ppl.id)}>
                          {/* Pilih SLS */}
                          <div style={styles.field}>
                            <label style={styles.label}>Pilih SLS</label>
                            <div style={{ position: "relative" }}>
                              <div
                                onClick={() =>
                                  setSlsOpen((prev) => ({
                                    ...prev,
                                    [ppl.id]: !prev[ppl.id],
                                  }))
                                }
                                style={{
                                  ...styles.input,
                                  cursor: "pointer",
                                  color: slsSelected ? "#2D3748" : "#A0AEC0",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <span>
                                  {slsSelected
                                    ? `${slsSelected.kode_sls} — ${slsSelected.kelurahan}`
                                    : "Pilih kode SLS..."}
                                </span>
                                <span style={{ fontSize: 9 }}>
                                  {isSlsOpen ? "▲" : "▼"}
                                </span>
                              </div>

                              {isSlsOpen && (
                                <div style={styles.slsDropdown}>
                                  {slsBisaApprove.map((w) => {
                                    const sisa =
                                      parseInt(w.total_submit || 0) -
                                      parseInt(w.total_approve || 0);
                                    return (
                                      <div
                                        key={w.id}
                                        onClick={() =>
                                          handlePilihSLS(ppl.id, w)
                                        }
                                        style={{
                                          ...styles.slsOption,
                                          cursor: "pointer",
                                        }}
                                        onMouseEnter={(e) =>
                                          (e.currentTarget.style.background =
                                            "#F0F2F5")
                                        }
                                        onMouseLeave={(e) =>
                                          (e.currentTarget.style.background =
                                            "white")
                                        }
                                      >
                                        <div
                                          style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                          }}
                                        >
                                          <div>
                                            <div style={styles.slsKode}>
                                              {w.kode_sls}
                                            </div>
                                            <div style={styles.slsNama}>
                                              {w.kelurahan}
                                              <span style={styles.slsKec}>
                                                , {w.kecamatan}
                                              </span>
                                            </div>
                                          </div>
                                          <span style={styles.badgeProgres}>
                                            Sisa: {sisa}
                                          </span>
                                        </div>
                                        <div style={styles.progressWrap}>
                                          <div
                                            style={{
                                              ...styles.progressBar,
                                              width: `${Math.min(100, (parseInt(w.total_approve || 0) / Math.max(1, parseInt(w.total_submit || 0))) * 100)}%`,
                                              backgroundColor: "#1D9E75",
                                            }}
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            {slsSelected && (
                              <div style={styles.slsPreview}>
                                <div
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 500,
                                    color: "#2D3748",
                                  }}
                                >
                                  {slsSelected.kode_sls && (
                                    <span
                                      style={{
                                        color: "#9AA5B4",
                                        marginRight: 6,
                                      }}
                                    >
                                      {slsSelected.kode_sls} —
                                    </span>
                                  )}
                                  {slsSelected.kelurahan},{" "}
                                  {slsSelected.kecamatan}
                                </div>
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: "#9AA5B4",
                                    marginTop: 4,
                                  }}
                                >
                                  <span
                                    style={{
                                      color: "#003366",
                                      fontWeight: 500,
                                    }}
                                  >
                                    Lapangan: {slsSelected.total_lapangan || 0}
                                  </span>
                                  <span style={{ margin: "0 6px" }}>·</span>
                                  <span
                                    style={{
                                      color: "#E8702A",
                                      fontWeight: 500,
                                    }}
                                  >
                                    Submit: {slsSelected.total_submit || 0}
                                  </span>
                                  <span style={{ margin: "0 6px" }}>·</span>
                                  <span
                                    style={{
                                      color: "#1D9E75",
                                      fontWeight: 500,
                                    }}
                                  >
                                    Approve: {slsSelected.total_approve || 0}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Tanggal */}
                          <div style={styles.field}>
                            <label style={styles.label}>Tanggal</label>
                            <input
                              type="date"
                              max={getToday()}
                              value={tglTerpilih}
                              onChange={(e) =>
                                setTanggalApprove((prev) => ({
                                  ...prev,
                                  [ppl.id]: e.target.value,
                                }))
                              }
                              style={{
                                ...styles.input,
                                backgroundColor: isHariIniHijau
                                  ? "#DCFCE7"
                                  : "#F7F8FA",
                                color: isHariIniHijau ? "#15803D" : "#2D3748",
                                borderColor: isHariIniHijau
                                  ? "#BBF7D0"
                                  : "#EBEEf2",
                                fontWeight: isHariIniHijau ? "600" : "400",
                              }}
                            />
                            {isHariIniHijau && (
                              <div
                                style={{
                                  fontSize: 11,
                                  color: "#15803D",
                                  marginTop: 4,
                                  fontWeight: 500,
                                }}
                              >
                                ✅ Sudah ada approve pada tanggal ini
                              </div>
                            )}
                          </div>

                          {/* Jumlah Approve */}
                          <div style={styles.field}>
                            <label style={styles.label}>Jumlah Approve</label>
                            <input
                              type="number"
                              min="1"
                              max={
                                slsSelected
                                  ? parseInt(slsSelected.total_submit || 0) -
                                    parseInt(slsSelected.total_approve || 0)
                                  : undefined
                              }
                              placeholder="Masukkan jumlah..."
                              value={jumlahApprove[ppl.id] || ""}
                              onChange={(e) =>
                                setJumlahApprove((prev) => ({
                                  ...prev,
                                  [ppl.id]: e.target.value,
                                }))
                              }
                              style={styles.input}
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={isSubmitting}
                            style={{
                              ...styles.submitBtn,
                              opacity: isSubmitting ? 0.7 : 1,
                            }}
                          >
                            {isSubmitting ? "Menyimpan..." : "Simpan Approve"}
                          </button>
                        </form>
                      )}
                    </div>

                    {/* ── Riwayat Input — dengan tombol toggle ── */}
                    {pplInputs.length > 0 && (
                      <div
                        style={{
                          ...styles.section,
                          borderTop: "1px solid #EEF5FF",
                          paddingTop: 10,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setRiwayatOpen((prev) => ({
                              ...prev,
                              [ppl.id]: !prev[ppl.id],
                            }))
                          }
                          style={{
                            ...styles.toggleRiwayatBtn,
                            backgroundColor: isRiwayatOpen
                              ? "#003366"
                              : "#F0F5FF",
                            color: isRiwayatOpen ? "white" : "#003366",
                            borderColor: isRiwayatOpen ? "#002244" : "#D0E1FD",
                          }}
                        >
                          <span>Riwayat Input ({pplInputs.length})</span>
                          <span>
                            {isRiwayatOpen ? "▲ Sembunyikan" : "▼ Tampilkan"}
                          </span>
                        </button>

                        {isRiwayatOpen &&
                          (() => {
                            const tglDari = filterTgl[ppl.id]?.dari || "";
                            const tglSampai = filterTgl[ppl.id]?.sampai || "";
                            const slsFilter = filterSLS[ppl.id] || "";
                            const pg = perPage[ppl.id] || 10;
                            const hl = halaman[ppl.id] || 1;

                            const setHl = (val) =>
                              setHalaman((prev) => ({
                                ...prev,
                                [ppl.id]: val,
                              }));

                            const filtered = pplInputs.filter((inp) => {
                              const tgl =
                                inp.tanggal?.slice(0, 10) ||
                                inp.created_at?.slice(0, 10) ||
                                "";
                              if (tglDari && tgl < tglDari) return false;
                              if (tglSampai && tgl > tglSampai) return false;
                              if (
                                slsFilter &&
                                String(inp.wilayah_id) !== String(slsFilter)
                              )
                                return false;
                              return true;
                            });

                            const totalPages = Math.ceil(filtered.length / pg);
                            const paged = filtered.slice(
                              (hl - 1) * pg,
                              hl * pg,
                            );

                            return (
                              <div style={{ marginTop: 10 }}>
                                {/* Filter */}
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 8,
                                    marginBottom: 10,
                                    padding: "10px 12px",
                                    backgroundColor: "#F7F8FA",
                                    borderRadius: 8,
                                    border: "1px solid #EBEEf2",
                                  }}
                                >
                                  <div style={{ display: "flex", gap: 8 }}>
                                    <div style={{ flex: 1 }}>
                                      <label style={styles.label}>Dari</label>
                                      <input
                                        type="date"
                                        style={styles.input}
                                        value={tglDari}
                                        max={tglSampai || getToday()}
                                        onChange={(e) => {
                                          setFilterTgl((prev) => ({
                                            ...prev,
                                            [ppl.id]: {
                                              ...prev[ppl.id],
                                              dari: e.target.value,
                                            },
                                          }));
                                          setHl(1);
                                        }}
                                      />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                      <label style={styles.label}>Sampai</label>
                                      <input
                                        type="date"
                                        style={styles.input}
                                        value={tglSampai}
                                        min={tglDari}
                                        max={getToday()}
                                        onChange={(e) => {
                                          setFilterTgl((prev) => ({
                                            ...prev,
                                            [ppl.id]: {
                                              ...prev[ppl.id],
                                              sampai: e.target.value,
                                            },
                                          }));
                                          setHl(1);
                                        }}
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label style={styles.label}>
                                      Filter SLS
                                    </label>
                                    <select
                                      style={styles.input}
                                      value={slsFilter}
                                      onChange={(e) => {
                                        setFilterSLS((prev) => ({
                                          ...prev,
                                          [ppl.id]: e.target.value,
                                        }));
                                        setHl(1);
                                      }}
                                    >
                                      <option value="">Semua SLS</option>
                                      {wilayahList.map((w) => (
                                        <option key={w.id} value={w.id}>
                                          {w.kode_sls ? `${w.kode_sls} — ` : ""}
                                          {w.kelurahan}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  {(tglDari || tglSampai || slsFilter) && (
                                    <button
                                      onClick={() => {
                                        setFilterTgl((prev) => ({
                                          ...prev,
                                          [ppl.id]: { dari: "", sampai: "" },
                                        }));
                                        setFilterSLS((prev) => ({
                                          ...prev,
                                          [ppl.id]: "",
                                        }));
                                        setHl(1);
                                      }}
                                      style={{
                                        ...styles.btnBatal,
                                        alignSelf: "flex-start",
                                        fontSize: 11,
                                      }}
                                    >
                                      ✕ Reset filter
                                    </button>
                                  )}
                                </div>

                                {/* Per page + info */}
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: 8,
                                  }}
                                >
                                  <span
                                    style={{ fontSize: 11, color: "#9AA5B4" }}
                                  >
                                    {filtered.length === 0
                                      ? "0 data"
                                      : `${(hl - 1) * pg + 1}–${Math.min(hl * pg, filtered.length)} dari ${filtered.length}`}
                                  </span>
                                  <div style={{ display: "flex", gap: 4 }}>
                                    {[10, 20, 30].map((n) => (
                                      <button
                                        key={n}
                                        onClick={() => {
                                          setPerPage((prev) => ({
                                            ...prev,
                                            [ppl.id]: n,
                                          }));
                                          setHl(1);
                                        }}
                                        style={{
                                          padding: "2px 8px",
                                          fontSize: 11,
                                          borderRadius: 6,
                                          border: `1px solid ${pg === n ? "#003366" : "#EBEEf2"}`,
                                          backgroundColor:
                                            pg === n ? "#003366" : "white",
                                          color: pg === n ? "white" : "#9AA5B4",
                                          cursor: "pointer",
                                        }}
                                      >
                                        {n}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* List */}
                                {paged.length === 0 ? (
                                  <p
                                    style={{
                                      textAlign: "center",
                                      color: "#9AA5B4",
                                      fontSize: 12,
                                      padding: "12px 0",
                                    }}
                                  >
                                    Tidak ada data ditemukan.
                                  </p>
                                ) : (
                                  paged.map((inp) => {
                                    const isApproveRow =
                                      parseInt(inp.ke_lapangan) === 0 &&
                                      parseInt(inp.submit) === 0 &&
                                      parseInt(inp.approve) > 0;
                                    const isEditing = editMode[inp.id];
                                    const isEditLoad = editLoading[inp.id];

                                    return (
                                      <div
                                        key={inp.id}
                                        style={styles.inputItem}
                                      >
                                        <div style={styles.inputLeft}>
                                          <div style={styles.inputWilayah}>
                                            {inp.kelurahan}, {inp.kecamatan}
                                          </div>
                                          <div style={styles.inputDate}>
                                            {new Date(
                                              inp.tanggal,
                                            ).toLocaleDateString("id-ID", {
                                              day: "numeric",
                                              month: "short",
                                              year: "numeric",
                                            })}
                                          </div>
                                          {inp.catatan && (
                                            <div style={styles.inputCatatan}>
                                              "{inp.catatan}"
                                            </div>
                                          )}
                                          {isApproveRow && !isEditing && (
                                            <div
                                              style={{
                                                display: "flex",
                                                gap: 6,
                                                marginTop: 5,
                                              }}
                                            >
                                              <button
                                                onClick={() => {
                                                  setEditMode((prev) => ({
                                                    ...prev,
                                                    [inp.id]: true,
                                                  }));
                                                  setEditJumlah((prev) => ({
                                                    ...prev,
                                                    [inp.id]: inp.approve,
                                                  }));
                                                }}
                                                style={styles.btnEdit}
                                              >
                                                ✏️ Edit
                                              </button>
                                              <button
                                                onClick={() =>
                                                  handleHapus(inp, ppl.id)
                                                }
                                                style={styles.btnHapus}
                                              >
                                                🗑️ Hapus
                                              </button>
                                            </div>
                                          )}
                                          {isApproveRow && isEditing && (
                                            <div
                                              style={{
                                                display: "flex",
                                                gap: 6,
                                                marginTop: 6,
                                                alignItems: "center",
                                              }}
                                            >
                                              <input
                                                type="number"
                                                min="1"
                                                value={editJumlah[inp.id] || ""}
                                                onChange={(e) =>
                                                  setEditJumlah((prev) => ({
                                                    ...prev,
                                                    [inp.id]: e.target.value,
                                                  }))
                                                }
                                                style={{
                                                  ...styles.input,
                                                  width: 80,
                                                  padding: "5px 8px",
                                                  fontSize: 12,
                                                }}
                                              />
                                              <button
                                                onClick={() =>
                                                  handleEdit(inp, ppl.id)
                                                }
                                                disabled={isEditLoad}
                                                style={{
                                                  ...styles.btnSimpanEdit,
                                                  opacity: isEditLoad ? 0.6 : 1,
                                                }}
                                              >
                                                {isEditLoad ? "..." : "Simpan"}
                                              </button>
                                              <button
                                                onClick={() =>
                                                  setEditMode((prev) => ({
                                                    ...prev,
                                                    [inp.id]: false,
                                                  }))
                                                }
                                                style={styles.btnBatal}
                                              >
                                                Batal
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                        <div style={styles.inputStats}>
                                          {[
                                            {
                                              label: "Lap",
                                              val: inp.ke_lapangan,
                                              color: "#003366",
                                            },
                                            {
                                              label: "Sub",
                                              val: inp.submit,
                                              color: "#E8702A",
                                            },
                                            {
                                              label: "Apr",
                                              val: inp.approve,
                                              color: "#1D9E75",
                                            },
                                          ].map(({ label, val, color }) => (
                                            <div
                                              key={label}
                                              style={styles.inputStat}
                                            >
                                              <div
                                                style={{
                                                  ...styles.inputStatNum,
                                                  color,
                                                }}
                                              >
                                                {val}
                                              </div>
                                              <div
                                                style={styles.inputStatLabel}
                                              >
                                                {label}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })
                                )}

                                {/* Pagination */}
                                {totalPages > 1 && (
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "center",
                                      alignItems: "center",
                                      gap: 6,
                                      marginTop: 12,
                                      paddingTop: 10,
                                      borderTop: "1px solid #F0F2F5",
                                    }}
                                  >
                                    <button
                                      onClick={() => setHl(Math.max(1, hl - 1))}
                                      disabled={hl === 1}
                                      style={{
                                        ...styles.btnBatal,
                                        opacity: hl === 1 ? 0.4 : 1,
                                        padding: "3px 8px",
                                      }}
                                    >
                                      ‹
                                    </button>
                                    {Array.from(
                                      { length: totalPages },
                                      (_, i) => i + 1,
                                    )
                                      .filter(
                                        (p) =>
                                          p === 1 ||
                                          p === totalPages ||
                                          Math.abs(p - hl) <= 1,
                                      )
                                      .reduce((acc, p, i, arr) => {
                                        if (i > 0 && p - arr[i - 1] > 1)
                                          acc.push("...");
                                        acc.push(p);
                                        return acc;
                                      }, [])
                                      .map((p, idx) =>
                                        p === "..." ? (
                                          <span
                                            key={`e${idx}`}
                                            style={{
                                              fontSize: 11,
                                              color: "#9AA5B4",
                                            }}
                                          >
                                            …
                                          </span>
                                        ) : (
                                          <button
                                            key={p}
                                            onClick={() => setHl(p)}
                                            style={{
                                              padding: "3px 8px",
                                              fontSize: 11,
                                              borderRadius: 6,
                                              minWidth: 26,
                                              border: `1px solid ${hl === p ? "#003366" : "#EBEEf2"}`,
                                              backgroundColor:
                                                hl === p ? "#003366" : "white",
                                              color:
                                                hl === p ? "white" : "#9AA5B4",
                                              cursor: "pointer",
                                            }}
                                          >
                                            {p}
                                          </button>
                                        ),
                                      )}
                                    <button
                                      onClick={() =>
                                        setHl(Math.min(totalPages, hl + 1))
                                      }
                                      disabled={hl === totalPages}
                                      style={{
                                        ...styles.btnBatal,
                                        opacity: hl === totalPages ? 0.4 : 1,
                                        padding: "3px 8px",
                                      }}
                                    >
                                      ›
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: "100%",
    maxWidth: 480,
    margin: "0 auto",
    padding: "1rem",
    backgroundColor: "#F0F2F5",
    minHeight: "100vh",
    boxSizing: "border-box",
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

  card: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: "16px",
    marginBottom: 14,
    border: "1px solid #EBEEf2",
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: 500,
    color: "#9AA5B4",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    marginBottom: 12,
    paddingBottom: 10,
    borderBottom: "1px solid #F0F2F5",
  },

  pplItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid",
    cursor: "pointer",
    transition: "all 0.15s",
    WebkitTapHighlightColor: "transparent",
    position: "relative",
    zIndex: 1,
  },
  pplAvatar: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    backgroundColor: "#003366",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontWeight: 500,
    fontSize: 14,
    flexShrink: 0,
  },
  pplInfo: { flex: 1 },
  pplName: { fontSize: 13, fontWeight: 500, color: "#2D3748" },
  pplemail: { fontSize: 11, color: "#9AA5B4", marginTop: 1 },
  pplStats: { display: "flex", gap: 12 },
  pplStat: { textAlign: "center" },
  pplStatNum: { fontSize: 15, fontWeight: 500, lineHeight: 1 },
  pplStatLabel: {
    fontSize: 9,
    color: "#9AA5B4",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    marginTop: 2,
  },

  accordionBody: {
    border: "1px solid #EBEEf2",
    borderTop: "none",
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: "#FAFBFF",
  },
  section: { padding: "14px 14px" },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: "#9AA5B4",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    marginBottom: 12,
  },

  summaryRow: { display: "flex", gap: 8, marginBottom: 4 },
  summaryCard: {
    flex: 1,
    background: "white",
    border: "1px solid #EBEEf2",
    borderRadius: 10,
    padding: "8px 6px",
    textAlign: "center",
  },
  summaryNum: { fontSize: 20, fontWeight: 500 },
  summaryLabel: {
    fontSize: 9,
    color: "#9AA5B4",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginTop: 2,
  },

  pesan: {
    padding: "9px 12px",
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 12,
    fontWeight: 500,
  },
  field: { marginBottom: 10 },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 500,
    color: "#4A5568",
    marginBottom: 4,
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
    transition: "all 0.2s",
  },
  submitBtn: {
    width: "100%",
    padding: "11px",
    color: "white",
    border: "none",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    marginTop: 14,
    backgroundColor: "#1D9E75",
  },

  toggleRiwayatBtn: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 12px",
    border: "1px solid",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
    outline: "none",
  },

  slsDropdown: {
    position: "absolute",
    top: "calc(100% + 3px)",
    left: 0,
    right: 0,
    zIndex: 99,
    border: "1px solid #EBEEf2",
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "white",
    maxHeight: 220,
    overflowY: "auto",
  },
  slsOption: {
    padding: "9px 12px",
    borderBottom: "1px solid #F7F8FA",
    background: "white",
  },
  slsKode: {
    fontSize: 10,
    fontWeight: 600,
    color: "#9AA5B4",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  slsNama: { fontSize: 12, fontWeight: 500, color: "#2D3748" },
  slsKec: { fontWeight: 400, color: "#9AA5B4" },
  badgeProgres: { fontSize: 10, fontWeight: 500, color: "#9AA5B4" },
  progressWrap: {
    marginTop: 5,
    height: 3,
    backgroundColor: "#F0F2F5",
    borderRadius: 99,
    overflow: "hidden",
  },
  progressBar: { height: "100%", borderRadius: 99, transition: "width 0.3s" },

  slsPreview: {
    marginTop: 8,
    padding: "8px 12px",
    backgroundColor: "#F7F8FA",
    borderRadius: 8,
    border: "1px solid #EBEEf2",
  },
  slsPreviewRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 5,
    marginBottom: 5,
    borderBottom: "1px solid #EEF0F3",
  },
  slsPreviewKey: { fontSize: 11, color: "#9AA5B4" },
  slsPreviewVal: { fontSize: 12, fontWeight: 500, color: "#2D3748" },

  inputItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px solid #F0F2F5",
  },
  inputLeft: { flex: 1 },
  inputWilayah: {
    fontSize: 12,
    fontWeight: 500,
    color: "#2D3748",
    marginBottom: 2,
  },
  inputDate: { fontSize: 10, color: "#9AA5B4" },
  inputCatatan: {
    fontSize: 10,
    color: "#7A8899",
    marginTop: 2,
    fontStyle: "italic",
  },
  inputStats: { display: "flex", gap: 8, marginLeft: 8 },
  inputStat: { textAlign: "center" },
  inputStatNum: { fontSize: 14, fontWeight: 500, lineHeight: 1 },
  inputStatLabel: {
    fontSize: 8,
    color: "#9AA5B4",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    marginTop: 2,
  },

  btnEdit: {
    padding: "3px 8px",
    fontSize: 11,
    borderRadius: 6,
    border: "1px solid #C7DEFF",
    backgroundColor: "#EEF5FF",
    color: "#003366",
    cursor: "pointer",
  },
  btnHapus: {
    padding: "3px 8px",
    fontSize: 11,
    borderRadius: 6,
    border: "1px solid #FECDD3",
    backgroundColor: "#FFF1F2",
    color: "#BE123C",
    cursor: "pointer",
  },
  btnSimpanEdit: {
    padding: "4px 10px",
    fontSize: 11,
    borderRadius: 6,
    border: "none",
    backgroundColor: "#1D9E75",
    color: "white",
    cursor: "pointer",
  },
  btnBatal: {
    padding: "4px 10px",
    fontSize: 11,
    borderRadius: 6,
    border: "1px solid #EBEEf2",
    backgroundColor: "white",
    color: "#9AA5B4",
    cursor: "pointer",
  },
};

export default DashboardPML;