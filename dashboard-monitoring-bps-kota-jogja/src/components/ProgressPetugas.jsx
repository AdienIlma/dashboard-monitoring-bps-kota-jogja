import React, { useState, useEffect, useRef } from "react";

// SearchableSelect
const SearchableSelect = ({ value, onChange, options, placeholder }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const selectedLabel = value
    ? (options.find((o) => o.value === value)?.label ?? placeholder)
    : placeholder;

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredOptions = options.filter((o) =>
    o.label.toLowerCase().includes(query.toLowerCase()),
  );

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
    setQuery("");
  };

  const handleToggle = () => {
    setOpen((prev) => {
      if (!prev) setTimeout(() => inputRef.current?.focus(), 0);
      else setQuery("");
      return !prev;
    });
  };

  const base = {
    fontSize: 11,
    color: "#4A5568",
    border: "1px solid #EBEEf2",
    borderRadius: 7,
    padding: "4px 8px",
    background: "#F7F8FA",
    outline: "none",
    flex: 1,
    minWidth: 0,
  };

  return (
    <div
      ref={wrapperRef}
      style={{ position: "relative", flex: 1, minWidth: 0 }}
    >
      <div
        onClick={handleToggle}
        style={{
          ...base,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "default",
          userSelect: "none",
          color: value ? "#4A5568" : "#A0AEC0",
          paddingRight: 6,
        }}
      >
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {selectedLabel}
        </span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          style={{
            flexShrink: 0,
            marginLeft: 4,
            transition: "transform .15s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          <path
            d="M2 3.5L5 6.5L8 3.5"
            stroke="#9AA5B4"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 3px)",
            left: 0,
            right: 0,
            zIndex: 9999,
            background: "white",
            border: "1px solid #EBEEf2",
            borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "6px 8px",
              borderBottom: "1px solid #F0F2F5",
              position: "relative",
            }}
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 11 11"
              fill="none"
              style={{
                position: "absolute",
                left: 16,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            >
              <circle
                cx="4.5"
                cy="4.5"
                r="3.5"
                stroke="#B0BAC6"
                strokeWidth="1.3"
              />
              <path
                d="M7.5 7.5L9.5 9.5"
                stroke="#B0BAC6"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
            <input
              ref={inputRef}
              type="text"
              placeholder="Cari..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                fontSize: 11,
                color: "#4A5568",
                border: "1px solid #EBEEf2",
                borderRadius: 6,
                padding: "3px 8px 3px 24px",
                background: "#F7F8FA",
                outline: "none",
                cursor: "text",
              }}
            />
          </div>
          <div style={{ maxHeight: 180, overflowY: "auto" }}>
            <div
              onClick={() => handleSelect("")}
              style={{
                padding: "6px 12px",
                fontSize: 11,
                cursor: "default",
                color: value === "" ? "#003366" : "#A0AEC0",
                background: value === "" ? "#EEF5FF" : "transparent",
                fontStyle: "italic",
              }}
              onMouseEnter={(e) => {
                if (value !== "") e.currentTarget.style.background = "#F7F8FA";
              }}
              onMouseLeave={(e) => {
                if (value !== "")
                  e.currentTarget.style.background = "transparent";
              }}
            >
              {placeholder}
            </div>
            {filteredOptions.length === 0 ? (
              <div
                style={{ padding: "6px 12px", fontSize: 11, color: "#B0BAC6" }}
              >
                Tidak ditemukan
              </div>
            ) : (
              filteredOptions.map((o) => (
                <div
                  key={o.value}
                  onClick={() => handleSelect(o.value)}
                  style={{
                    padding: "6px 12px",
                    fontSize: 11,
                    cursor: "default",
                    color: value === o.value ? "#003366" : "#4A5568",
                    background: value === o.value ? "#EEF5FF" : "transparent",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  onMouseEnter={(e) => {
                    if (value !== o.value)
                      e.currentTarget.style.background = "#F7F8FA";
                  }}
                  onMouseLeave={(e) => {
                    if (value !== o.value)
                      e.currentTarget.style.background = "transparent";
                  }}
                >
                  {o.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Komponen Utama
const ProgressPetugas = ({
  petugasDetailData,
  petugasHarianData,
  tanggalHarian,
  onTanggalChange,
  wilayahData,
  wilayahHarianData,
}) => {
  const [activeTab, setActiveTab] = useState("total");
  const [search, setSearch] = useState("");
  const [expandedPML, setExpandedPML] = useState({});
  const [expandedPPL, setExpandedPPL] = useState({});
  const [filterKecamatan, setFilterKecamatan] = useState("");
  const [filterKelurahan, setFilterKelurahan] = useState("");
  const [filterPML, setFilterPML] = useState("");
  // Sorting kolom (Target / Lapangan / Submit / Approve)
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "desc",
  });

  const rawData =
    activeTab === "total" ? petugasDetailData || [] : petugasHarianData || [];
  const pmlList = rawData.filter((p) => p.tipe === "PML");
  const pplList = rawData.filter((p) => p.tipe === "PPL");
  const allPML = rawData.filter((p) => p.tipe === "PML");

  // Pilih sumber wilayah sesuai tab aktif (total = kumulatif, harian = per tanggal)
  const activeWilayahData =
    activeTab === "total" ? wilayahData : wilayahHarianData;

  // SLS valid (punya kode_sls)
  const slsData = (activeWilayahData || []).filter(
    (w) => w.kode_sls && w.kode_sls.trim() !== "",
  );

  // Opsi filter dari wilayahData (SLS)
  // Kecamatan: semua kecamatan yang ada di SLS
  const kecamatanOptions = [
    ...new Set(slsData.map((w) => w.kecamatan).filter(Boolean)),
  ]
    .sort()
    .map((k) => ({ value: k, label: k }));

  // Kelurahan: hanya kelurahan yang SLS-nya ada di kecamatan terpilih
  const kelurahanOptions = [
    ...new Set(
      slsData
        .filter((w) => !filterKecamatan || w.kecamatan === filterKecamatan)
        .map((w) => w.kelurahan)
        .filter(Boolean),
    ),
  ]
    .sort()
    .map((k) => ({ value: k, label: k }));

  const pmlOptions = allPML.map((p) => ({
    value: String(p.id),
    label: p.nama,
  }));

  // ── Cek apakah petugas punya SLS di kecamatan/kelurahan terpilih ─────────
  /**
   * Kembalikan true jika petugas (PML atau PPL) memiliki minimal 1 SLS
   * yang cocok dengan filter kecamatan & kelurahan yang sedang aktif.
   *
   * Logika:
   *  - Jika tidak ada filter wilayah aktif → selalu lolos.
   *  - PPL: cek langsung di slsData berdasarkan ppl_id.
   *  - PML: cek lewat PPL yang berada di bawah PML tersebut,
   *          atau langsung lewat pml_id jika wilayahData menyimpannya.
   */
  const petugasMemilikiSLSDiWilayah = (petugas, isPPL) => {
    if (!filterKecamatan && !filterKelurahan) return true;

    const matchSLS = (sls) => {
      const matchKec = !filterKecamatan || sls.kecamatan === filterKecamatan;
      const matchKel = !filterKelurahan || sls.kelurahan === filterKelurahan;
      return matchKec && matchKel;
    };

    if (isPPL) {
      // PPL: ada SLS milik PPL ini yang cocok filter?
      return slsData.some((sls) => sls.ppl_id === petugas.id && matchSLS(sls));
    } else {
      // PML: ada PPL di bawah PML ini yang punya SLS cocok?
      const pplIdsBawahPML = pplList
        .filter((p) => p.pml_id === petugas.id)
        .map((p) => p.id);

      return slsData.some(
        (sls) => pplIdsBawahPML.includes(sls.ppl_id) && matchSLS(sls),
      );
    }
  };

  // Handlers
  const handleKecamatanChange = (val) => {
    setFilterKecamatan(val);
    setFilterKelurahan(""); // reset kelurahan kalau kecamatan berubah
    setFilterPML("");
    setExpandedPML({});
    setExpandedPPL({});
  };

  const handleKelurahanChange = (val) => {
    setFilterKelurahan(val);
    setExpandedPML({});
    setExpandedPPL({});
  };

  const togglePML = (pmlId) =>
    setExpandedPML((prev) => ({ ...prev, [pmlId]: !prev[pmlId] }));
  const togglePPL = (pplId) =>
    setExpandedPPL((prev) => ({ ...prev, [pplId]: !prev[pplId] }));

  const resetFilter = () => {
    setFilterKecamatan("");
    setFilterKelurahan("");
    setFilterPML("");
    setSearch("");
    setExpandedPML({});
    setExpandedPPL({});
  };

  // Klik header kolom: kalau kolom yang sama, toggle arah; kalau beda, mulai dari desc
  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "desc" ? "asc" : "desc" };
      }
      return { key, direction: "desc" };
    });
  };

  // Urutkan array petugas (PML atau PPL) berdasarkan sortConfig aktif
  const sortPetugas = (arr) => {
    if (!sortConfig.key) return arr;
    const { key, direction } = sortConfig;
    return [...arr].sort((a, b) => {
      const aVal = Number(a[key] || 0);
      const bVal = Number(b[key] || 0);
      return direction === "asc" ? aVal - bVal : bVal - aVal;
    });
  };

  const adaFilter = filterKecamatan || filterKelurahan || filterPML || search;

  // Filter PML untuk tabel
  const filteredPML = sortPetugas(
    pmlList
      .filter((pml) => {
        if (filterPML && String(pml.id) !== filterPML) return false;
        if (search) {
          const q = search.toLowerCase();
          const namaMatch = pml.nama.toLowerCase().includes(q);
          const adaPPLMatch = pplList.some(
            (p) => p.pml_id === pml.id && p.nama.toLowerCase().includes(q),
          );
          if (!namaMatch && !adaPPLMatch) return false;
        }
        // Filter utama: apakah PML ini punya PPL dengan SLS di wilayah terpilih?
        if (!petugasMemilikiSLSDiWilayah(pml, false)) return false;
        return true;
      })
      .map((pml) => {
        const pplDibawah = pplList.filter((p) => p.pml_id === pml.id);
        return {
          ...pml,
          sudahKeLapangan: pplDibawah.reduce(
            (sum, p) => sum + (p.sudahKeLapangan || 0),
            0,
          ),
          submit: pplDibawah.reduce((sum, p) => sum + (p.submit || 0), 0),
          approve: pplDibawah.reduce((sum, p) => sum + (p.approve || 0), 0),
          target: pplDibawah.reduce((sum, p) => sum + (p.target || 0), 0),
          hadirHariIni: pml.pmlHadirSebagaiPml ?? 0,
        };
      }),
  );

  // Styles
  const headerStyle = {
    background: "#F7F8FA",
    padding: "7px 10px",
    fontSize: 9,
    fontWeight: 500,
    color: "#9AA5B4",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    borderBottom: "1px solid #EBEEf2",
    textAlign: "right",
  };
  const cellStyle = {
    padding: "7px 10px",
    fontSize: 11,
    color: "#4A5568",
    borderBottom: "1px solid #F7F8FA",
    textAlign: "right",
  };

  // Ikon panah sort: netral (belum aktif) atau menunjukkan arah aktif
  const SortIcon = ({ active, direction }) => (
    <svg
      width="9"
      height="9"
      viewBox="0 0 10 10"
      fill="none"
      style={{ marginLeft: 3, flexShrink: 0 }}
    >
      {!active ? (
        <>
          <path
            d="M2.5 4L5 1.5L7.5 4"
            stroke="#D1D5DB"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2.5 6L5 8.5L7.5 6"
            stroke="#D1D5DB"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : direction === "asc" ? (
        <path
          d="M2 6.5L5 3L8 6.5"
          stroke="#003366"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M2 3.5L5 7L8 3.5"
          stroke="#003366"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );

  // Header kolom yang bisa diklik untuk sorting
  const renderSortableHeader = (label, key) => {
    const active = sortConfig.key === key;
    return (
      <th
        onClick={() => handleSort(key)}
        style={{ ...headerStyle, cursor: "pointer", userSelect: "none" }}
        title="Klik untuk urutkan"
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          {label}
          <SortIcon active={active} direction={sortConfig.direction} />
        </span>
      </th>
    );
  };

  const fmt = (val, target) => {
    const number = parseInt(val || 0);
    const targetNum = parseInt(target || 0);
    if (targetNum <= 0) return number.toLocaleString("id-ID");
    const pct = Math.round((number / targetNum) * 100);
    return (
      <span>
        {number.toLocaleString("id-ID")}
        <span style={{ fontSize: 9, color: "#9AA5B4", marginLeft: 3 }}>
          ({pct}%)
        </span>
      </span>
    );
  };

  // Badge kehadiran
  const renderHadirBadge = (petugas) => {
    if (activeTab === "total") {
      const n = petugas.jumlahHadir ?? 0;
      return (
        <span
          style={{
            fontSize: 9,
            fontWeight: 600,
            padding: "1px 6px",
            borderRadius: 10,
            lineHeight: "15px",
            whiteSpace: "nowrap",
            backgroundColor: n > 0 ? "#EDFAF4" : "#F3F4F6",
            color: n > 0 ? "#1D9E75" : "#9AA5B4",
            border: `1px solid ${n > 0 ? "#BBF0DC" : "#E5E7EB"}`,
          }}
        >
          {n > 0 ? `${n}× hadir` : "0× hadir"}
        </span>
      );
    } else {
      const hadir = petugas.hadirHariIni ?? 0;
      return (
        <span
          style={{
            fontSize: 9,
            fontWeight: 600,
            padding: "1px 6px",
            borderRadius: 10,
            lineHeight: "15px",
            whiteSpace: "nowrap",
            backgroundColor: hadir ? "#EDFAF4" : "#FEF2F2",
            color: hadir ? "#1D9E75" : "#EF4444",
            border: `1px solid ${hadir ? "#BBF0DC" : "#FECACA"}`,
          }}
        >
          {hadir ? "1" : "0"}
        </span>
      );
    }
  };

  // Row PML
  const renderPMLRow = (pml) => (
    <tr key={`pml-${pml.id}`} style={{ backgroundColor: "white" }}>
      <td style={{ ...cellStyle, textAlign: "left" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            onClick={() => togglePML(pml.id)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 9,
              color: "#003366",
              padding: "2px 4px",
              borderRadius: 4,
              backgroundColor: "#EEF5FF",
              lineHeight: 1,
            }}
          >
            {(search ? true : expandedPML[pml.id]) ? "▼" : "▶"}
          </button>
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontWeight: 600, color: "#1A2B42", fontSize: 12 }}>
                {pml.nama}
              </span>
              {renderHadirBadge(pml)}
            </div>
            <div
              style={{
                fontSize: 9,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: "#003366",
              }}
            >
              PML
            </div>
          </div>
        </div>
      </td>
      <td style={{ ...cellStyle, fontWeight: 600, color: "#003366" }}>
        {(pml.target || 0).toLocaleString("id-ID")}
      </td>
      <td style={{ ...cellStyle, fontWeight: 600, color: "#1D9E75" }}>
        {fmt(pml.sudahKeLapangan, pml.target)}
      </td>
      <td style={{ ...cellStyle, fontWeight: 600, color: "#E8702A" }}>
        {fmt(pml.submit, pml.target)}
      </td>
      <td style={{ ...cellStyle, fontWeight: 600, color: "#6366f1" }}>
        {fmt(pml.approve, pml.target)}
      </td>
    </tr>
  );

  // Row PPL (expandable → SLS)
  const renderPPLRow = (ppl) => {
    // SLS milik PPL ini — jika filter wilayah aktif, hanya tampilkan SLS yang cocok
    const slsMilikPPL = slsData.filter((w) => {
      if (w.ppl_id !== ppl.id) return false;
      if (filterKecamatan && w.kecamatan !== filterKecamatan) return false;
      if (filterKelurahan && w.kelurahan !== filterKelurahan) return false;
      return true;
    });

    return (
      <React.Fragment key={`ppl-${ppl.id}`}>
        <tr style={{ backgroundColor: "#F7F8FA" }}>
          <td style={{ ...cellStyle, textAlign: "left" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#D1D5DB", marginLeft: 12, fontSize: 10 }}>
                └
              </span>
              {/* Tombol expand SLS — hanya tampil jika ada SLS */}
              {slsMilikPPL.length > 0 ? (
                <button
                  onClick={() => togglePPL(ppl.id)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 9,
                    color: "#7c3aed",
                    padding: "2px 4px",
                    borderRadius: 4,
                    backgroundColor: "#F3F0FF",
                    lineHeight: 1,
                  }}
                >
                  {expandedPPL[ppl.id] ? "▼" : "▶"}
                </button>
              ) : (
                <span style={{ width: 18 }} />
              )}
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{ fontWeight: 500, color: "#4A5568", fontSize: 11 }}
                  >
                    {ppl.nama}
                  </span>
                  {activeTab === "harian" && (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 600,
                        padding: "1px 6px",
                        borderRadius: 10,
                        lineHeight: "15px",
                        whiteSpace: "nowrap",
                        backgroundColor: ppl.hadirHariIni
                          ? "#EDFAF4"
                          : "#FEF2F2",
                        color: ppl.hadirHariIni ? "#1D9E75" : "#EF4444",
                        border: `1px solid ${ppl.hadirHariIni ? "#BBF0DC" : "#FECACA"}`,
                      }}
                    >
                      {ppl.hadirHariIni ? "Hadir" : "Tidak hadir"}
                    </span>
                  )}
                  {slsMilikPPL.length > 0 && (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 600,
                        padding: "1px 6px",
                        borderRadius: 10,
                        lineHeight: "15px",
                        whiteSpace: "nowrap",
                        backgroundColor: "#F3F0FF",
                        color: "#7c3aed",
                        border: "1px solid #DDD6FE",
                      }}
                    >
                      {slsMilikPPL.length} SLS
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    color: "#B0BAC6",
                  }}
                >
                  PPL
                </div>
              </div>
            </div>
          </td>
          <td style={{ ...cellStyle, fontWeight: 600, color: "#003366" }}>
            {(ppl.target || 0).toLocaleString("id-ID")}
          </td>
          <td style={{ ...cellStyle, fontWeight: 600, color: "#1D9E75" }}>
            {fmt(ppl.sudahKeLapangan, ppl.target)}
          </td>
          <td style={{ ...cellStyle, fontWeight: 600, color: "#E8702A" }}>
            {fmt(ppl.submit, ppl.target)}
          </td>
          <td style={{ ...cellStyle, fontWeight: 600, color: "#6366f1" }}>
            {fmt(ppl.approve, ppl.target)}
          </td>
        </tr>

        {/* ── Baris SLS di bawah PPL ── */}
        {expandedPPL[ppl.id] &&
          slsMilikPPL.map((sls) => (
            <tr key={`sls-${sls.id}`} style={{ backgroundColor: "#FAFAFF" }}>
              <td style={{ ...cellStyle, textAlign: "left", paddingLeft: 48 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: "#C4B5FD", fontSize: 10 }}>└</span>
                  <div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 5 }}
                    >
                      <span
                        style={{
                          fontWeight: 700,
                          color: "#5B21B6",
                          fontSize: 11,
                          background: "#EDE9FE",
                          borderRadius: 5,
                          padding: "1px 7px",
                        }}
                      >
                        {sls.kode_sls}
                      </span>
                    </div>
                    <div
                      style={{ fontSize: 9, color: "#B0BAC6", marginTop: 1 }}
                    >
                      {sls.kelurahan} • {sls.kecamatan}
                    </div>
                  </div>
                </div>
              </td>
              <td style={{ ...cellStyle, fontWeight: 700, color: "#7c3aed" }}>
                {Number(sls.target || 0).toLocaleString("id-ID")}
              </td>
              <td style={{ ...cellStyle, color: "#1D9E75", fontSize: 10 }}>
                {sls.sudahKeLapangan != null
                  ? fmt(sls.sudahKeLapangan, sls.target)
                  : "—"}
              </td>
              <td style={{ ...cellStyle, color: "#E8702A", fontSize: 10 }}>
                {sls.submit != null ? fmt(sls.submit, sls.target) : "—"}
              </td>
              <td style={{ ...cellStyle, color: "#6366f1", fontSize: 10 }}>
                {sls.approve != null ? fmt(sls.approve, sls.target) : "—"}
              </td>
            </tr>
          ))}
      </React.Fragment>
    );
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        gap: 8,
      }}
    >
      {/* Header */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: "#9AA5B4",
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          borderBottom: "1px solid #F0F2F5",
          paddingBottom: 10,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <i
          className="ti ti-users"
          style={{ fontSize: 14, color: "#E8702A" }}
          aria-hidden="true"
        />
        Progress Petugas
      </div>

      {/* Tab Total / Harian */}
      <div
        style={{
          display: "flex",
          gap: 0,
          background: "#F0F2F5",
          borderRadius: 8,
          padding: 3,
        }}
      >
        {["total", "harian"].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setExpandedPML({});
              setExpandedPPL({});
            }}
            style={{
              flex: 1,
              padding: "6px 0",
              border: "none",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 500,
              cursor: "pointer",
              background: activeTab === tab ? "#003366" : "transparent",
              color: activeTab === tab ? "#fff" : "#7A8899",
            }}
          >
            {tab === "total" ? "Total" : "Harian"}
          </button>
        ))}
      </div>

      {activeTab === "harian" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "#F7F8FA",
            border: "1px solid #EBEEf2",
            borderRadius: 8,
            padding: "5px 10px",
          }}
        >
          <i
            className="ti ti-calendar"
            style={{ fontSize: 13, color: "#9AA5B4" }}
            aria-hidden="true"
          />
          <span style={{ fontSize: 11, color: "#9AA5B4" }}>Tanggal:</span>
          <input
            type="date"
            value={tanggalHarian}
            max={(() => {
              const now = new Date();
              const local = new Date(
                now.getTime() - now.getTimezoneOffset() * 60000,
              );
              return local.toISOString().split("T")[0];
            })()}
            onChange={(e) => onTanggalChange(e.target.value)}
            style={{
              border: "none",
              background: "transparent",
              fontSize: 11,
              color: "#4A5568",
              outline: "none",
              cursor: "pointer",
              flex: 1,
            }}
          />
        </div>
      )}

      {/* Filter */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {/* Search nama */}
          <div style={{ position: "relative", flex: 1 }}>
            <svg
              width="11"
              height="11"
              viewBox="0 0 11 11"
              fill="none"
              style={{
                position: "absolute",
                left: 8,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            >
              <circle
                cx="4.5"
                cy="4.5"
                r="3.5"
                stroke="#B0BAC6"
                strokeWidth="1.3"
              />
              <path
                d="M7.5 7.5L9.5 9.5"
                stroke="#B0BAC6"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
            <input
              type="text"
              placeholder="Cari nama petugas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                fontSize: 11,
                color: "#4A5568",
                border: "1px solid #EBEEf2",
                borderRadius: 7,
                padding: "4px 8px 4px 26px",
                background: "#F7F8FA",
                outline: "none",
                width: "100%",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Filter PML */}
          <SearchableSelect
            value={filterPML}
            onChange={(val) => {
              setFilterPML(val);
              setExpandedPML({});
              setExpandedPPL({});
            }}
            options={pmlOptions}
            placeholder="Semua PML"
          />
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {/* Filter Kecamatan — dari SLS */}
          <SearchableSelect
            value={filterKecamatan}
            onChange={handleKecamatanChange}
            options={kecamatanOptions}
            placeholder="Semua Kecamatan"
          />

          {/* Filter Kelurahan — dari SLS, bergantung kecamatan terpilih */}
          <SearchableSelect
            value={filterKelurahan}
            onChange={handleKelurahanChange}
            options={kelurahanOptions}
            placeholder="Semua Kelurahan"
          />

          {adaFilter && (
            <button
              onClick={resetFilter}
              style={{
                fontSize: 10,
                padding: "4px 12px",
                border: "1px solid #EBEEf2",
                borderRadius: 7,
                background: "white",
                cursor: "pointer",
                color: "#E8702A",
                whiteSpace: "nowrap",
              }}
            >
              Reset
            </button>
          )}
        </div>

        {/* Info chip wilayah aktif */}
        {(filterKecamatan || filterKelurahan) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#EEF5FF",
              border: "1px solid #C7DEFF",
              borderRadius: 8,
              padding: "4px 10px",
            }}
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#003366"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="10" r="3" />
              <path d="M12 2a8 8 0 0 1 8 8c0 5.25-8 14-8 14S4 15.25 4 10a8 8 0 0 1 8-8z" />
            </svg>
            <span style={{ fontSize: 10, color: "#003366", fontWeight: 500 }}>
              SLS di:{" "}
              {[filterKelurahan, filterKecamatan].filter(Boolean).join(", ")}
            </span>
          </div>
        )}
      </div>

      {/* Tabel */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          borderRadius: 10,
          border: "1px solid #EBEEf2",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
            <tr>
              <th style={{ ...headerStyle, textAlign: "left", width: "38%" }}>
                Nama Petugas
              </th>
              {renderSortableHeader("Target", "target")}
              {renderSortableHeader("Lapangan", "sudahKeLapangan")}
              {renderSortableHeader("Submit", "submit")}
              {renderSortableHeader("Approve", "approve")}
            </tr>
          </thead>
          <tbody>
            {filteredPML.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  style={{
                    textAlign: "center",
                    padding: 40,
                    color: "#B0BAC6",
                    fontSize: 12,
                  }}
                >
                  {adaFilter
                    ? "Tidak ada petugas dengan SLS di wilayah ini"
                    : "Tidak ada data petugas"}
                </td>
              </tr>
            ) : (
              filteredPML.map((pml) => {
                // PPL di bawah PML ini yang juga lolos filter wilayah & search
                const namaPMLMatch =
                  search &&
                  pml.nama.toLowerCase().includes(search.toLowerCase());

                const pplDibawahPML = sortPetugas(
                  pplList.filter((p) => {
                    if (p.pml_id !== pml.id) return false;
                    // Kalau nama PML sendiri sudah cocok dengan pencarian, tampilkan semua PPL di bawahnya.
                    // Kalau tidak, baru cek nama PPL-nya satu per satu.
                    if (
                      search &&
                      !namaPMLMatch &&
                      !p.nama.toLowerCase().includes(search.toLowerCase())
                    )
                      return false;
                    // PPL harus punya SLS di wilayah terpilih
                    if (!petugasMemilikiSLSDiWilayah(p, true)) return false;
                    return true;
                  }),
                );
                const isExpanded = search ? true : expandedPML[pml.id];
                return (
                  <React.Fragment key={pml.id}>
                    {renderPMLRow(pml)}
                    {isExpanded && (
                      <>
                        {pplDibawahPML.length === 0 ? (
                          <tr>
                            <td
                              colSpan="5"
                              style={{
                                textAlign: "center",
                                padding: "8px 12px",
                                color: "#B0BAC6",
                                fontSize: 11,
                                background: "#F7F8FA",
                              }}
                            >
                              {filterKecamatan || filterKelurahan
                                ? "Tidak ada PPL dengan SLS di wilayah ini"
                                : "Belum ada PPL"}
                            </td>
                          </tr>
                        ) : (
                          pplDibawahPML.map((ppl) => renderPPLRow(ppl))
                        )}
                      </>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProgressPetugas;
