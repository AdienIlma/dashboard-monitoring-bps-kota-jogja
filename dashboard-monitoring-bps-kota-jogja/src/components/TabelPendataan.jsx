import React, { useState } from "react";

const TabelPendataan = ({
  kecamatanData,
  kecamatanHarianData,
  tanggalHarian,
  onTanggalChange,
}) => {
  const [activeTab, setActiveTab] = useState("total");
  const [search, setSearch] = useState("");
  const [expandedKec, setExpandedKec] = useState(null);
  // Sorting kolom (Target / Lapangan / Submit / Approve)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "desc" });

  const activeData =
    activeTab === "total" ? kecamatanData : kecamatanHarianData;

  const toggleKec = (id) => setExpandedKec(expandedKec === id ? null : id);

  // Klik header kolom: kalau kolom yang sama, toggle arah; kalau beda, mulai dari desc
  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "desc" ? "asc" : "desc" };
      }
      return { key, direction: "desc" };
    });
  };

  // Urutkan array (kecamatan ataupun kelurahan) berdasarkan sortConfig aktif
  const sortData = (arr) => {
    if (!sortConfig.key) return arr;
    const { key, direction } = sortConfig;
    return [...arr].sort((a, b) => {
      const aVal = Number(a[key] || 0);
      const bVal = Number(b[key] || 0);
      return direction === "asc" ? aVal - bVal : bVal - aVal;
    });
  };

  const filtered = (activeData || []).reduce((acc, kec) => {
    const q = search.toLowerCase();
    const kecMatch = kec.nama.toLowerCase().includes(q);
    const kelMatch = kec.kelurahan.filter((kel) =>
      kel.nama.toLowerCase().includes(q),
    );
    if (kecMatch) {
      acc.push(kec);
    } else if (kelMatch.length > 0) {
      acc.push({ ...kec, kelurahan: kelMatch, _autoExpand: true });
    }
    return acc;
  }, []);

  // Urutkan daftar kecamatan sesuai sort yang aktif
  const sortedFiltered = sortData(filtered);

  const headerStyle = {
    background: "#F7F8FA",
    padding: "8px 10px",
    fontSize: 9,
    fontWeight: 500,
    color: "#9AA5B4",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    borderBottom: "1px solid #EBEEf2",
    textAlign: "right",
  };
  const cellStyle = {
    padding: "8px 10px",
    fontSize: 11,
    color: "#4A5568",
    borderBottom: "1px solid #F7F8FA",
    textAlign: "right",
  };

  // Ikon panah sort: netral (belum aktif) atau menunjukkan arah aktif
  const SortIcon = ({ active, direction }) => (
    <svg width="9" height="9" viewBox="0 0 10 10" fill="none" style={{ marginLeft: 3, flexShrink: 0 }}>
      {!active ? (
        <>
          <path d="M2.5 4L5 1.5L7.5 4" stroke="#D1D5DB" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2.5 6L5 8.5L7.5 6" stroke="#D1D5DB" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : direction === "asc" ? (
        <path d="M2 6.5L5 3L8 6.5" stroke="#003366" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M2 3.5L5 7L8 3.5" stroke="#003366" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
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
        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "flex-end" }}>
          {label}
          <SortIcon active={active} direction={sortConfig.direction} />
        </span>
      </th>
    );
  };

  const fmt = (val, target) => {
    if (target == null || target === 0) return val;
    const pct = Math.round((val / target) * 100);
    return (
      <span>
        {val}
        <span style={{ fontSize: 9, color: "#9AA5B4", marginLeft: 3 }}>
          ({pct}%)
        </span>
      </span>
    );
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        gap: 10,
      }}
    >
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
          className="ti ti-table"
          style={{ fontSize: 14, color: "#E8702A" }}
          aria-hidden="true"
        />
        Tabel Pendataan
      </div>

      {/* Tab */}
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
              setExpandedKec(null);
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
              const offset = now.getTimezoneOffset();
              const local = new Date(now.getTime() - offset * 60 * 1000);
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

      <div style={{ position: "relative" }}>
        <i
          className="ti ti-search"
          style={{
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 13,
            color: "#B0BAC6",
          }}
          aria-hidden="true"
        />
        <input
          type="text"
          placeholder="Cari kecamatan atau kelurahan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "7px 10px 7px 30px",
            border: "1px solid #EBEEf2",
            borderRadius: 8,
            fontSize: 11,
            color: "#4A5568",
            background: "#F7F8FA",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
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
                Wilayah
              </th>
              {renderSortableHeader("Target", "target")}
              {renderSortableHeader("Lapangan", "sudahKeLapangan")}
              {renderSortableHeader("Submit", "submit")}
              {renderSortableHeader("Approve", "approve")}
            </tr>
          </thead>
          <tbody>
            {sortedFiltered.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  style={{
                    textAlign: "center",
                    padding: 30,
                    color: "#B0BAC6",
                    fontSize: 12,
                  }}
                >
                  Tidak ada data
                </td>
              </tr>
            ) : (
              sortedFiltered.map((kec) => {
                const isExpanded = expandedKec === kec.id || kec._autoExpand;
                const kelurahanList = sortData(
                  kec.kelurahan.filter(
                    (kel) =>
                      kel.nama &&
                      kel.nama.trim() !== "" &&
                      kel.nama !== kec.nama
                  )
                );
                return (
                  <React.Fragment key={kec.id}>
                    <tr
                      onClick={() => toggleKec(kec.id)}
                      style={{
                        cursor: "pointer",
                        background: isExpanded ? "#EEF2FF" : "white",
                      }}
                    >
                      <td
                        style={{
                          ...cellStyle,
                          textAlign: "left",
                          fontWeight: 500,
                          color: "#1A2B42",
                        }}
                      >
                        <span
                          style={{
                            marginRight: 6,
                            fontSize: 9,
                            color: "#003366",
                          }}
                        >
                          {isExpanded ? "▼" : "▶"}
                        </span>
                        {kec.nama}
                      </td>
                      <td
                        style={{
                          ...cellStyle,
                          fontWeight: 500,
                          color: "#003366",
                        }}
                      >
                        {kec.target}
                      </td>
                      <td
                        style={{
                          ...cellStyle,
                          fontWeight: 500,
                          color: "#003366",
                        }}
                      >
                        {fmt(kec.sudahKeLapangan, kec.target)}
                      </td>

                      <td
                        style={{
                          ...cellStyle,
                          fontWeight: 500,
                          color: "#E8702A",
                        }}
                      >
                        {fmt(kec.submit, kec.target)}
                      </td>

                      <td
                        style={{
                          ...cellStyle,
                          fontWeight: 500,
                          color: "#1D9E75",
                        }}
                      >
                        {fmt(kec.approve, kec.target)}
                      </td>
                    </tr>
                    {isExpanded &&
                      kelurahanList.map((kel) => (
                        <tr key={kel.id} style={{ background: "#F7F8FA" }}>
                          <td
                            style={{
                              ...cellStyle,
                              textAlign: "left",
                              paddingLeft: 28,
                              color: "#7A8899",
                            }}
                          >
                            {kel.nama}
                          </td>
                          <td style={{ ...cellStyle, color: "#7A8899" }}>
                            {kel.target}
                          </td>
                          <td style={{ ...cellStyle, color: "#7A8899" }}>
                            {fmt(kel.sudahKeLapangan, kel.target)}
                          </td>

                          <td style={{ ...cellStyle, color: "#7A8899" }}>
                            {fmt(kel.submit, kel.target)}
                          </td>

                          <td style={{ ...cellStyle, color: "#7A8899" }}>
                            {fmt(kel.approve, kel.target)}
                          </td>
                        </tr>
                      ))}
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

export default TabelPendataan;