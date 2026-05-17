import React, { useState, useEffect, useRef } from "react";

// ─── SearchableSelect ─────────────────
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

// ─── Komponen Utama ────────────────────────────────────────────────────────
const ProgressPetugas = ({
  petugasDetailData,
  petugasHarianData,
  tanggalHarian,
  onTanggalChange,
  wilayahData,
}) => {
  const [activeTab, setActiveTab] = useState("total");
  const [search, setSearch] = useState("");
  const [expandedPML, setExpandedPML] = useState({});
  const [filterKecamatan, setFilterKecamatan] = useState("");
  const [filterKelurahan, setFilterKelurahan] = useState("");
  const [filterPML, setFilterPML] = useState("");
  const rawData =
    activeTab === "total" ? petugasDetailData || [] : petugasHarianData || [];

  const pmlList = rawData.filter((p) => p.tipe === "PML");
  const pplList = rawData.filter((p) => p.tipe === "PPL");
  const allPML = rawData.filter((p) => p.tipe === "PML");

  const kecamatanOptions = wilayahData
    ? [...new Set(wilayahData.map((w) => w.kecamatan).filter(Boolean))]
        .sort()
        .map((k) => ({ value: k, label: k }))
    : [];

  const kelurahanOptions = wilayahData
    ? [
        ...new Set(
          wilayahData
            .filter((w) => !filterKecamatan || w.kecamatan === filterKecamatan)
            .map((w) => w.kelurahan)
            .filter(Boolean),
        ),
      ]
        .sort()
        .map((k) => ({ value: k, label: k }))
    : [];

  const pmlOptions = allPML.map((p) => ({
    value: String(p.id),
    label: p.nama,
  }));

  const petugasMatchWilayah = (petugas, isPPL) => {
    if (!wilayahData || (!filterKecamatan && !filterKelurahan)) return true;
    return wilayahData.some((w) => {
      const matchKec = !filterKecamatan || w.kecamatan === filterKecamatan;
      const matchKel = !filterKelurahan || w.kelurahan === filterKelurahan;
      const matchPetugas = isPPL
        ? w.ppl_id === petugas.id
        : w.pml_id === petugas.id;
      return matchKec && matchKel && matchPetugas;
    });
  };

  const handleKecamatanChange = (val) => {
    setFilterKecamatan(val);
    setFilterKelurahan("");
    setFilterPML("");
    setExpandedPML({});
  };

  const togglePML = (pmlId) =>
    setExpandedPML((prev) => ({ ...prev, [pmlId]: !prev[pmlId] }));

  const resetFilter = () => {
    setFilterKecamatan("");
    setFilterKelurahan("");
    setFilterPML("");
    setSearch("");
    setExpandedPML({});
  };

  const adaFilter = filterKecamatan || filterKelurahan || filterPML || search;

  const filteredPML = pmlList
    .filter((pml) => {
      if (filterPML && String(pml.id) !== filterPML) return false;
      if (search && !pml.nama.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (!petugasMatchWilayah(pml, false)) return false;
      return true;
    })
    .map((pml) => {
      const pplDibawah = pplList.filter((p) => p.pml_id === pml.id);
      const hadirHariIni = pplDibawah.some((p) => p.hadirHariIni === 1) ? 1 : 0;

      const totalLapangan = pplDibawah.reduce(
        (sum, p) => sum + (p.sudahKeLapangan || 0),
        0,
      );

      const totalSubmit = pplDibawah.reduce(
        (sum, p) => sum + (p.submit || 0),
        0,
      );

      const totalApprove = pplDibawah.reduce(
        (sum, p) => sum + (p.approve || 0),
        0,
      );

      const totalTarget = pplDibawah.reduce(
        (sum, p) => sum + (p.target || 0),
        0,
      );

      return {
        ...pml,
        sudahKeLapangan: totalLapangan,
        submit: totalSubmit,
        approve: totalApprove,
        target: totalTarget,
        hadirHariIni: pml.pmlHadirSebagaiPml ?? 0,
      };
    });

  // ─── Styles ───────────────────────────────────────────────────────────────
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

  const fmt = (val, target) => {
    const number = parseInt(val || 0);
    const targetNum = parseInt(target || 0);

    if (targetNum <= 0) {
      return number.toLocaleString("id-ID");
    }

    const pct = Math.round((number / targetNum) * 100);

    return (
      <span>
        {number.toLocaleString("id-ID")}
        <span
          style={{
            fontSize: 9,
            color: "#9AA5B4",
            marginLeft: 3,
          }}
        >
          ({pct}%)
        </span>
      </span>
    );
  };

  // ─── Badge kehadiran PML ──────────────────────────────────────────────────
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
            border: `1px solid ${1 ? "#BBF0DC" : "#FECACA"}`,
          }}
        >
          {hadir ? "1" : "0"}
        </span>
      );
    }
  };

  const renderRow = (petugas, isPPL = false) => (
    <tr
      key={petugas.id}
      style={{ backgroundColor: isPPL ? "#F7F8FA" : "white" }}
    >
      <td style={{ ...cellStyle, textAlign: "left" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {isPPL && (
            <span style={{ color: "#D1D5DB", marginLeft: 12, fontSize: 10 }}>
              └
            </span>
          )}
          {!isPPL && (
            <button
              onClick={() => togglePML(petugas.id)}
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
              {expandedPML[petugas.id] ? "▼" : "▶"}
            </button>
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
                style={{
                  fontWeight: isPPL ? 500 : 600,
                  color: isPPL ? "#4A5568" : "#1A2B42",
                  fontSize: isPPL ? 11 : 12,
                }}
              >
                {petugas.nama}
              </span>
              {!isPPL && renderHadirBadge(petugas)}
              {isPPL && activeTab === "harian" && (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    padding: "1px 6px",
                    borderRadius: 10,
                    lineHeight: "15px",
                    whiteSpace: "nowrap",
                    backgroundColor: petugas.hadirHariIni
                      ? "#EDFAF4"
                      : "#FEF2F2",
                    color: petugas.hadirHariIni ? "#1D9E75" : "#EF4444",
                    border: `1px solid ${petugas.hadirHariIni ? "#BBF0DC" : "#FECACA"}`,
                  }}
                >
                  {petugas.hadirHariIni ? "PML hadir" : "PML tidak hadir"}
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: 9,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: isPPL ? "#B0BAC6" : "#003366",
              }}
            >
              {isPPL ? "PPL" : ""}
            </div>
          </div>
        </div>
      </td>
      <td style={{ ...cellStyle, fontWeight: 600, color: "#003366" }}>
        {(petugas.target || 0).toLocaleString("id-ID")}
      </td>
      <td style={{ ...cellStyle, fontWeight: 600, color: "#1D9E75" }}>
        {fmt(petugas.sudahKeLapangan, petugas.target)}
      </td>

      <td style={{ ...cellStyle, fontWeight: 600, color: "#E8702A" }}>
        {fmt(petugas.submit, petugas.target)}
      </td>

      <td style={{ ...cellStyle, fontWeight: 600, color: "#6366f1" }}>
        {fmt(petugas.approve, petugas.target)}
      </td>
    </tr>
  );

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
          style={{ fontSize: 14, color: "#003366" }}
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
            max={new Date().toISOString().split("T")[0]}
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

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <div style={{ display: "flex", gap: 6 }}>
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
          {kecamatanOptions.length > 0 && (
            <div style={{ flex: 1 }}>
              <SearchableSelect
                value={filterKecamatan}
                onChange={handleKecamatanChange}
                options={kecamatanOptions}
                placeholder="Semua Kecamatan"
              />
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {kelurahanOptions.length > 0 && (
            <div style={{ flex: 1 }}>
              <SearchableSelect
                value={filterKelurahan}
                onChange={setFilterKelurahan}
                options={kelurahanOptions}
                placeholder="Semua Kelurahan"
              />
            </div>
          )}

          <div style={{ flex: 1 }}>
            <SearchableSelect
              value={filterPML}
              onChange={(val) => {
                setFilterPML(val);
                setExpandedPML({});
              }}
              options={pmlOptions}
              placeholder="Semua PML"
            />
          </div>

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
      </div>

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
              <th style={headerStyle}>Target</th>
              <th style={headerStyle}>Lapangan</th>
              <th style={headerStyle}>Submit</th>
              <th style={headerStyle}>Approve</th>
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
                  Tidak ada data petugas
                </td>
              </tr>
            ) : (
              filteredPML.map((pml) => {
                const pplDibawahPML = pplList.filter((p) => {
                  if (p.pml_id !== pml.id) return false;
                  if (
                    search &&
                    !p.nama.toLowerCase().includes(search.toLowerCase())
                  )
                    return false;
                  if (!petugasMatchWilayah(p, true)) return false;
                  return true;
                });
                return (
                  <React.Fragment key={pml.id}>
                    {renderRow(pml, false)}
                    {expandedPML[pml.id] &&
                      pplDibawahPML.map((ppl) => renderRow(ppl, true))}
                    {expandedPML[pml.id] && pplDibawahPML.length === 0 && (
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
                          Belum ada PPL
                        </td>
                      </tr>
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
