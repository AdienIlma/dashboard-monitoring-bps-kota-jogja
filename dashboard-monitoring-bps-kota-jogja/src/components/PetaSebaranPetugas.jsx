import React, { useState, useEffect, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getSebaranPetugas } from "../services/dataService";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const pmlOnlineIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
const pmlOfflineIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
const pplOnlineIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const formatWaktu = (recorded_at) => {
  if (!recorded_at) return "Belum pernah login";
  return new Date(recorded_at).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const baseInputStyle = {
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

// ─── Komponen SearchableSelect ─────────────────────────────────────────────
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

  return (
    <div
      ref={wrapperRef}
      style={{ position: "relative", flex: 1, minWidth: 0 }}
    >
      {/* Trigger */}
      <div
        onClick={handleToggle}
        style={{
          ...baseInputStyle,
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

      {/* Panel dropdown */}
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
          {/* Input pencarian */}
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

          {/* List opsi */}
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
const PetaSebaranPetugas = () => {
  const [sebaranData, setSebaranData] = useState([]);
  const [selectedPML, setSelectedPML] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const [filterKecamatan, setFilterKecamatan] = useState("");
  const [filterKelurahan, setFilterKelurahan] = useState("");
  const [filterPML, setFilterPML] = useState("");
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const data = await getSebaranPetugas();
      setSebaranData(data);
      setLastUpdate(new Date());
    } catch (err) {
      console.error("Gagal ambil sebaran:", err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const pmlList = sebaranData.filter((p) => p.role === "pml");
  const pplList = sebaranData.filter((p) => p.role === "ppl");
  const pmlOnline = pmlList.filter((p) => p.online).length;
  const pplOnline = pplList.filter((p) => p.online).length;

  const kecamatanOptions = [
    ...new Set(sebaranData.map((p) => p.kecamatan).filter(Boolean)),
  ]
    .sort()
    .map((k) => ({ value: k, label: k }));

  const kelurahanOptions = [
    ...new Set(
      sebaranData
        .filter((p) => !filterKecamatan || p.kecamatan === filterKecamatan)
        .map((p) => p.kelurahan)
        .filter(Boolean),
    ),
  ]
    .sort()
    .map((k) => ({ value: k, label: k }));

  const pmlSelectOptions = pmlList
    .filter((p) => !filterKecamatan || p.kecamatan === filterKecamatan)
    .map((p) => ({ value: String(p.id), label: p.nama }));

  const handleKecamatanChange = (val) => {
    setFilterKecamatan(val);
    setFilterKelurahan("");
    setFilterPML("");
    setSelectedPML(null);
  };

  const filteredPML = pmlList.filter((p) => {
    if (p.lat == null || p.lng == null) return false;
    if (filterKecamatan && p.kecamatan !== filterKecamatan) return false;
    if (filterKelurahan && p.kelurahan !== filterKelurahan) return false;
    if (filterPML && String(p.id) !== filterPML) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!p.nama.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const filteredPPL = pplList.filter((p) => {
    if (!p.punya_lokasi) return false;
    if (!selectedPML) return false;
    if (p.pml_id !== selectedPML) return false;
    if (filterKecamatan && p.kecamatan !== filterKecamatan) return false;
    if (filterKelurahan && p.kelurahan !== filterKelurahan) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !p.nama.toLowerCase().includes(q) &&
        !(p.kecamatan || "").toLowerCase().includes(q) &&
        !(p.kelurahan || "").toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  const resetFilter = () => {
    setFilterKecamatan("");
    setFilterKelurahan("");
    setFilterPML("");
    setSearch("");
    setSelectedPML(null);
  };

  const adaFilter = filterKecamatan || filterKelurahan || filterPML || search;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "#9AA5B4",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
          }}
        >
          Sebaran Petugas
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {lastUpdate && (
            <span style={{ fontSize: 10, color: "#B0BAC6" }}>
              {formatWaktu(lastUpdate)}
            </span>
          )}
          <button
            onClick={fetchData}
            style={{
              fontSize: 11,
              padding: "4px 10px",
              border: "1px solid #EBEEf2",
              borderRadius: 6,
              background: "white",
              cursor: "pointer",
              color: "#7A8899",
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {/* Search — cursor text */}
        <div style={{ position: "relative", flex: 2, minWidth: 120 }}>
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
            placeholder="Cari nama, kecamatan, kelurahan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              ...baseInputStyle,
              paddingLeft: 26,
              width: "100%",
              boxSizing: "border-box",
              cursor: "text",
            }}
          />
        </div>

        <SearchableSelect
          value={filterKecamatan}
          onChange={handleKecamatanChange}
          options={kecamatanOptions}
          placeholder="Semua Kecamatan"
        />

        <SearchableSelect
          value={filterKelurahan}
          onChange={setFilterKelurahan}
          options={kelurahanOptions}
          placeholder="Semua Kelurahan"
        />

        <SearchableSelect
          value={filterPML}
          onChange={(val) => {
            setFilterPML(val);
            setSelectedPML(null);
          }}
          options={pmlSelectOptions}
          placeholder="Semua PML"
        />

        {(adaFilter || selectedPML) && (
          <button
            onClick={resetFilter}
            style={{
              fontSize: 10,
              padding: "4px 10px",
              border: "1px solid #EBEEf2",
              borderRadius: 7,
              background: "white",
              cursor: "pointer",
              color: "#E8702A",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Reset
          </button>
        )}
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: 8,
          background: "#F7F8FA",
          padding: "5px 10px",
          borderRadius: 8,
          border: "1px solid #EBEEf2",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 10, color: "#7A8899", fontWeight: 500 }}>
          Keterangan:
        </span>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 3,
            fontSize: 10,
            color: "#003366",
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#003366",
              display: "inline-block",
            }}
          />
          PML Online ({pmlOnline})
        </span>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 3,
            fontSize: 10,
            color: "#9AA5B4",
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#9AA5B4",
              display: "inline-block",
            }}
          />
          PML Offline ({pmlList.length - pmlOnline})
        </span>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 3,
            fontSize: 10,
            color: "#E8702A",
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#E8702A",
              display: "inline-block",
            }}
          />
          PPL Online ({pplOnline})
        </span>
        {selectedPML && (
          <span
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <span style={{ fontSize: 10, color: "#E8702A", fontWeight: 500 }}>
              PPL: {pmlList.find((p) => p.id === selectedPML)?.nama}
            </span>
            <button
              onClick={() => setSelectedPML(null)}
              style={{
                fontSize: 9,
                padding: "1px 7px",
                border: "1px solid #EBEEf2",
                borderRadius: 20,
                background: "white",
                cursor: "pointer",
                color: "#7A8899",
              }}
            >
              Reset
            </button>
          </span>
        )}
      </div>

      {/* Map */}
      <div
        style={{
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid #EBEEf2",
          height: 460,
        }}
      >
        <MapContainer
          center={[-7.82, 110.4]}
          zoom={12}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap"
          />

          {filteredPML.map((pml) => (
            <Marker
              key={`pml-${pml.id}`}
              position={[pml.lat, pml.lng]}
              icon={pml.online ? pmlOnlineIcon : pmlOfflineIcon}
              eventHandlers={{
                click: () =>
                  setSelectedPML(selectedPML === pml.id ? null : pml.id),
              }}
            >
              <Popup>
                <div style={{ fontSize: 12, minWidth: 170 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      color: "#1A2B42",
                      marginBottom: 4,
                    }}
                  >
                    {pml.nama}
                  </div>
                  {pml.kecamatan && (
                    <div
                      style={{
                        fontSize: 10,
                        color: "#B0BAC6",
                        marginBottom: 4,
                      }}
                    >
                      {pml.kelurahan}, {pml.kecamatan}
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: pml.online ? "#1D9E75" : "#9AA5B4",
                        display: "inline-block",
                      }}
                    />
                    <span
                      style={{
                        fontSize: 11,
                        color: pml.online ? "#1D9E75" : "#9AA5B4",
                        fontWeight: 500,
                      }}
                    >
                      {pml.online ? "Online" : "Offline"}
                    </span>
                  </div>
                  <div
                    style={{ fontSize: 11, color: "#9AA5B4", marginBottom: 8 }}
                  >
                    Terakhir: {formatWaktu(pml.recorded_at)}
                  </div>
                  <div
                    onClick={() =>
                      setSelectedPML(selectedPML === pml.id ? null : pml.id)
                    }
                    style={{
                      padding: "5px 8px",
                      backgroundColor: "#EEF5FF",
                      borderRadius: 6,
                      fontSize: 11,
                      color: "#003366",
                      textAlign: "center",
                      cursor: "pointer",
                      fontWeight: 500,
                    }}
                  >
                    {selectedPML === pml.id ? "Sembunyikan PPL" : "Lihat PPL"}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {filteredPPL.map((ppl) => (
            <Marker
              key={`ppl-${ppl.id}`}
              position={[ppl.lat, ppl.lng]}
              icon={pplOnlineIcon}
            >
              <Popup>
                <div style={{ fontSize: 12, minWidth: 170 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      color: "#1A2B42",
                      marginBottom: 4,
                    }}
                  >
                    {ppl.nama}
                  </div>
                  {ppl.kecamatan && (
                    <div
                      style={{
                        fontSize: 10,
                        color: "#B0BAC6",
                        marginBottom: 4,
                      }}
                    >
                      {ppl.kelurahan}, {ppl.kecamatan}
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: ppl.online ? "#1D9E75" : "#9AA5B4",
                        display: "inline-block",
                      }}
                    />
                    <span
                      style={{
                        fontSize: 11,
                        color: ppl.online ? "#1D9E75" : "#9AA5B4",
                        fontWeight: 500,
                      }}
                    >
                      {ppl.online ? "Online" : "Offline"}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "#9AA5B4" }}>
                    Terakhir: {formatWaktu(ppl.recorded_at)}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {sebaranData.every((p) => !p.punya_lokasi) && (
        <div style={{ textAlign: "center", fontSize: 11, color: "#B0BAC6" }}>
          Belum ada petugas yang mengirim lokasi
        </div>
      )}
    </div>
  );
};

export default PetaSebaranPetugas;
