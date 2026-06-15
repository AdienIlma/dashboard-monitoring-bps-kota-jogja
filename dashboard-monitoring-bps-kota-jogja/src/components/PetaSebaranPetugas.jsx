import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getSebaranPetugas } from "../services/dataService";

// ─── FlyToMarker ───────────────────────────────────────────────────────────
const FlyToMarker = ({ lat, lng, triggerKey }) => {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lng != null) {
      map.flyTo([lat, lng], 16, { animate: true, duration: 0.8 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerKey]);
  return null;
};

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

// ─── SearchableSelect ──────────────────────────────────────────────────────
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

// ─── Shared styles ─────────────────────────────────────────────────────────
const rowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  paddingBottom: 7,
  marginBottom: 7,
  borderBottom: "1px solid #F0F2F5",
};
const keyStyle = { fontSize: 11, color: "#9AA5B4" };
const valStyle = { fontSize: 12, fontWeight: 500, color: "#2D3748" };
const sectionTitle = {
  fontSize: 11,
  fontWeight: 500,
  color: "#9AA5B4",
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  marginBottom: 10,
  paddingBottom: 8,
  borderBottom: "1px solid #F0F2F5",
};
const thStyle = {
  background: "#F7F8FA",
  padding: "7px 10px",
  fontSize: 9,
  fontWeight: 500,
  color: "#9AA5B4",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  borderBottom: "1px solid #EBEEf2",
  textAlign: "left",
  whiteSpace: "nowrap",
};
const tdStyle = {
  padding: "7px 10px",
  fontSize: 11,
  color: "#4A5568",
  borderBottom: "1px solid #F7F8FA",
};
const linkStyle = {
  color: "#003366",
  fontWeight: 500,
  cursor: "pointer",
  textDecoration: "underline",
  textDecorationStyle: "dotted",
  textDecorationColor: "#B0BAC6",
};

// ─── Halaman Detail Petugas ────────────────────────────────────────────────
const DetailPetugas = ({
  petugas,
  sebaranData,
  wilayahData,
  onBack,
  onNavigate,
}) => {
  const isPML = petugas.role === "pml";

  const pplDibawah = isPML
    ? sebaranData.filter((p) => p.role === "ppl" && p.pml_id === petugas.id)
    : [];

  const pmlPengawas = !isPML
    ? sebaranData.find((p) => p.role === "pml" && p.id === petugas.pml_id)
    : null;

  const slsPPL =
    !isPML && wilayahData
      ? wilayahData.filter((w) => w.ppl_id === petugas.id)
      : [];

  const getSlsPPL = (pplId) =>
    wilayahData ? wilayahData.filter((w) => w.ppl_id === pplId) : [];

  const waHref = petugas.nomor_whatsapp
    ? `https://wa.me/${petugas.nomor_whatsapp.replace(/[^0-9]/g, "").replace(/^0/, "62")}`
    : null;

  // ── FIX: helper untuk format koordinat dengan aman ────────────────────
  const formatKoordinat = (val) => {
    if (val == null) return "—";
    const num = parseFloat(val);
    return isNaN(num) ? "—" : num.toFixed(6);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        overflowY: "auto",
        height: "100%",
      }}
    >
      {/* Tombol kembali */}
      <button
        onClick={onBack}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#003366",
          fontSize: 12,
          fontWeight: 500,
          padding: 0,
          alignSelf: "flex-start",
          flexShrink: 0,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path
            d="M10 4l-4 4 4 4"
            stroke="#003366"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Kembali ke Peta
      </button>

      {/* Card info utama */}
      <div
        style={{
          background: "white",
          borderRadius: 12,
          padding: 16,
          border: "1px solid #EBEEf2",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              backgroundColor: isPML ? "#003366" : "#E8702A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 600,
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            {petugas.nama?.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#1A2B42" }}>
              {petugas.nama}
            </div>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 20,
                backgroundColor: isPML ? "#EEF5FF" : "#FFF3EC",
                color: isPML ? "#003366" : "#E8702A",
                border: `1px solid ${isPML ? "#C7DEFF" : "#FDDCBF"}`,
              }}
            >
              {isPML ? "PML" : "PPL"}
            </span>
          </div>
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                justifyContent: "flex-end",
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: petugas.online ? "#1D9E75" : "#9AA5B4",
                  display: "inline-block",
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  color: petugas.online ? "#1D9E75" : "#9AA5B4",
                  fontWeight: 500,
                }}
              >
                {petugas.online ? "Online" : "Offline"}
              </span>
            </div>
            <div style={{ fontSize: 10, color: "#B0BAC6", marginTop: 3 }}>
              {formatWaktu(petugas.recorded_at)}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={rowStyle}>
            <span style={keyStyle}>WhatsApp</span>
            {waHref ? (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 12,
                  color: "#1D9E75",
                  fontWeight: 500,
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#1D9E75">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                {petugas.nomor_whatsapp}
              </a>
            ) : (
              <span style={{ fontSize: 12, color: "#B0BAC6" }}>—</span>
            )}
          </div>
          {/* FIX: pakai formatKoordinat() agar aman dari string/null */}
          <div style={rowStyle}>
            <span style={keyStyle}>Latitude</span>
            <span style={valStyle}>{formatKoordinat(petugas.lat)}</span>
          </div>
          <div style={rowStyle}>
            <span style={keyStyle}>Longitude</span>
            <span style={valStyle}>{formatKoordinat(petugas.lng)}</span>
          </div>
          {petugas.kecamatan && (
            <div style={rowStyle}>
              <span style={keyStyle}>Wilayah</span>
              <span style={valStyle}>
                {petugas.kelurahan}, {petugas.kecamatan}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* PML: daftar PPL */}
      {isPML && (
        <div
          style={{
            background: "white",
            borderRadius: 12,
            padding: 16,
            border: "1px solid #EBEEf2",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div style={sectionTitle}>
            PPL yang Dibawahi ({pplDibawah.length})
          </div>
          {pplDibawah.length === 0 ? (
            <p
              style={{
                color: "#B0BAC6",
                fontSize: 12,
                textAlign: "center",
                padding: "12px 0",
              }}
            >
              Belum ada PPL
            </p>
          ) : (
            <div
              style={{
                overflowX: "auto",
                overflowY: "auto",
                maxHeight: 280,
                borderRadius: 8,
                border: "1px solid #EBEEf2",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                  <tr>
                    {["Nama PPL", "Kode SLS", "Kelurahan", "Kecamatan"].map(
                      (h) => (
                        <th key={h} style={thStyle}>
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {pplDibawah.map((ppl) => {
                    const slsList = getSlsPPL(ppl.id);
                    const rowCount = slsList.length || 1;
                    return slsList.length === 0 ? (
                      <tr key={ppl.id}>
                        <td style={tdStyle}>
                          <span
                            onClick={() => onNavigate(ppl)}
                            style={linkStyle}
                          >
                            {ppl.nama}
                          </span>
                        </td>
                        <td style={tdStyle} colSpan={3}>
                          <span style={{ color: "#B0BAC6", fontSize: 11 }}>
                            —
                          </span>
                        </td>
                      </tr>
                    ) : (
                      slsList.map((sls, idx) => (
                        <tr
                          key={`${ppl.id}-${sls.id}`}
                          style={{
                            background: idx % 2 === 0 ? "white" : "#F7F8FA",
                          }}
                        >
                          {idx === 0 && (
                            <td
                              style={{ ...tdStyle, verticalAlign: "middle" }}
                              rowSpan={rowCount}
                            >
                              <span
                                onClick={() => onNavigate(ppl)}
                                style={linkStyle}
                              >
                                {ppl.nama}
                              </span>
                            </td>
                          )}
                          <td style={tdStyle}>
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
                              {sls.kode_sls || "—"}
                            </span>
                          </td>
                          <td style={tdStyle}>{sls.kelurahan || "—"}</td>
                          <td style={tdStyle}>{sls.kecamatan || "—"}</td>
                        </tr>
                      ))
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* PPL: PML pengawas */}
      {!isPML && (
        <div
          style={{
            background: "white",
            borderRadius: 12,
            padding: 16,
            border: "1px solid #EBEEf2",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div style={sectionTitle}>PML Pengawas</div>
          {pmlPengawas ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                background: "#F7F8FA",
                border: "1px solid #EBEEf2",
                borderRadius: 8,
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  backgroundColor: "#003366",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: 600,
                  fontSize: 14,
                  flexShrink: 0,
                }}
              >
                {pmlPengawas.nama?.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <span onClick={() => onNavigate(pmlPengawas)} style={linkStyle}>
                  {pmlPengawas.nama}
                </span>
                <div style={{ fontSize: 10, color: "#B0BAC6", marginTop: 2 }}>
                  {pmlPengawas.kecamatan
                    ? `${pmlPengawas.kelurahan}, ${pmlPengawas.kecamatan}`
                    : "—"}
                </div>
              </div>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 20,
                  backgroundColor: "#EEF5FF",
                  color: "#003366",
                  border: "1px solid #C7DEFF",
                }}
              >
                PML
              </span>
            </div>
          ) : (
            <p
              style={{
                color: "#B0BAC6",
                fontSize: 12,
                textAlign: "center",
                padding: "12px 0",
              }}
            >
              Belum ada PML pengawas
            </p>
          )}
        </div>
      )}

      {/* PPL: SLS yang dikerjakan */}
      {!isPML && (
        <div
          style={{
            background: "white",
            borderRadius: 12,
            padding: 16,
            border: "1px solid #EBEEf2",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div style={sectionTitle}>SLS yang Dikerjakan ({slsPPL.length})</div>
          {slsPPL.length === 0 ? (
            <p
              style={{
                color: "#B0BAC6",
                fontSize: 12,
                textAlign: "center",
                padding: "12px 0",
              }}
            >
              Belum ada SLS
            </p>
          ) : (
            <div
              style={{
                overflowX: "auto",
                borderRadius: 8,
                border: "1px solid #EBEEf2",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Kode SLS", "Kelurahan", "Kecamatan"].map((h) => (
                      <th key={h} style={thStyle}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {slsPPL.map((sls, idx) => (
                    <tr
                      key={sls.id}
                      style={{
                        background: idx % 2 === 0 ? "white" : "#F7F8FA",
                      }}
                    >
                      <td style={tdStyle}>
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
                          {sls.kode_sls || "—"}
                        </span>
                      </td>
                      <td style={tdStyle}>{sls.kelurahan || "—"}</td>
                      <td style={tdStyle}>{sls.kecamatan || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Komponen Utama ────────────────────────────────────────────────────────
const PetaSebaranPetugas = ({ wilayahData }) => {
  const [sebaranData, setSebaranData] = useState([]);
  const [selectedPML, setSelectedPML] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [detailPetugas, setDetailPetugas] = useState(null);
  const [detailHistory, setDetailHistory] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterKecamatan, setFilterKecamatan] = useState("");
  const [filterKelurahan, setFilterKelurahan] = useState("");
  const [filterPML, setFilterPML] = useState("");
  const [search, setSearch] = useState("");
  const [flyTarget, setFlyTarget] = useState(null);

  // ── FIX: normalize lat/lng ke number saat data masuk ──────────────────
  const fetchData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await getSebaranPetugas();
      const normalized = data.map((p) => ({
        ...p,
        lat: p.lat != null && p.lat !== "" ? parseFloat(p.lat) : null,
        lng: p.lng != null && p.lng !== "" ? parseFloat(p.lng) : null,
      }));
      setSebaranData(normalized);
      setLastUpdate(new Date());
    } catch (err) {
      console.error("Gagal ambil sebaran:", err);
    } finally {
      setIsRefreshing(false);
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

  const slsData = (wilayahData || []).filter(
    (w) => w.kode_sls && w.kode_sls.trim() !== "",
  );

  const kecamatanOptions = [
    ...new Set(slsData.map((w) => w.kecamatan).filter(Boolean)),
  ]
    .sort()
    .map((k) => ({ value: k, label: k }));

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

  const pplIdsWithSLSInWilayah =
    filterKecamatan || filterKelurahan
      ? new Set(
          slsData
            .filter((w) => {
              const matchKec =
                !filterKecamatan || w.kecamatan === filterKecamatan;
              const matchKel =
                !filterKelurahan || w.kelurahan === filterKelurahan;
              return matchKec && matchKel;
            })
            .map((w) => w.ppl_id),
        )
      : null;

  const pmlIdsWithSLSInWilayah = pplIdsWithSLSInWilayah
    ? new Set(
        pplList
          .filter((p) => pplIdsWithSLSInWilayah.has(p.id))
          .map((p) => p.pml_id),
      )
    : null;

  const pmlSelectOptions = pmlList
    .filter((p) => !pmlIdsWithSLSInWilayah || pmlIdsWithSLSInWilayah.has(p.id))
    .map((p) => ({ value: String(p.id), label: p.nama }));

  const pmlLulusFilterWilayah = (pml) => {
    if (!pmlIdsWithSLSInWilayah) return true;
    return pmlIdsWithSLSInWilayah.has(pml.id);
  };

  const pplLulusFilterWilayah = (ppl) => {
    if (!pplIdsWithSLSInWilayah) return true;
    return pplIdsWithSLSInWilayah.has(ppl.id);
  };

  const handleKecamatanChange = (val) => {
    setFilterKecamatan(val);
    setFilterKelurahan("");
    setFilterPML("");
    setSelectedPML(null);
  };

  const handleKelurahanChange = (val) => {
    setFilterKelurahan(val);
    setFilterPML("");
    setSelectedPML(null);
  };

  // ── FIX: filter marker — lat/lng sudah pasti number setelah normalize ─
  const filteredPML = pmlList.filter((p) => {
    if (p.lat == null || p.lng == null || isNaN(p.lat) || isNaN(p.lng))
      return false;
    if (filterPML && String(p.id) !== filterPML) return false;
    if (search && !p.nama.toLowerCase().includes(search.toLowerCase()))
      return false;
    if (!pmlLulusFilterWilayah(p)) return false;
    return true;
  });

  const filteredPPL = pplList.filter((p) => {
    if (!p.online || !p.punya_lokasi) return false;
    if (p.lat == null || p.lng == null || isNaN(p.lat) || isNaN(p.lng))
      return false;
    if (!selectedPML || p.pml_id !== selectedPML) return false;
    if (!pplLulusFilterWilayah(p)) return false;
    const q = search.toLowerCase();
    if (
      search &&
      !(
        p.nama.toLowerCase().includes(q) ||
        (p.kecamatan || "").toLowerCase().includes(q) ||
        (p.kelurahan || "").toLowerCase().includes(q)
      )
    )
      return false;
    return true;
  });

  const resetFilter = () => {
    setFilterKecamatan("");
    setFilterKelurahan("");
    setFilterPML("");
    setSearch("");
    setSelectedPML(null);
    setFlyTarget(null);
  };

  const adaFilter = filterKecamatan || filterKelurahan || filterPML || search;

  useEffect(() => {
    if (!search.trim()) {
      setFlyTarget(null);
      return;
    }
    const q = search.toLowerCase();
    const candidates = sebaranData.filter(
      (p) =>
        p.lat != null &&
        p.lng != null &&
        !isNaN(p.lat) &&
        !isNaN(p.lng) &&
        p.nama.toLowerCase().includes(q),
    );
    if (candidates.length === 0) {
      setFlyTarget(null);
      return;
    }
    const exact = candidates.find((p) => p.nama.toLowerCase() === q);
    const match = exact ?? candidates[0];
    setFlyTarget({ lat: match.lat, lng: match.lng, key: Date.now() });
  }, [search, sebaranData]);

  const openDetail = (petugas) => {
    if (detailPetugas) {
      setDetailHistory((h) => [...h, detailPetugas]);
    }
    setDetailPetugas(petugas);
  };

  const handleBack = () => {
    if (detailHistory.length > 0) {
      const prev = detailHistory[detailHistory.length - 1];
      setDetailHistory((h) => h.slice(0, -1));
      setDetailPetugas(prev);
    } else {
      setDetailPetugas(null);
    }
  };

  if (detailPetugas) {
    return (
      <DetailPetugas
        petugas={detailPetugas}
        sebaranData={sebaranData}
        wilayahData={wilayahData || []}
        onBack={handleBack}
        onNavigate={openDetail}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, height: "100%" }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
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
            disabled={isRefreshing}
            style={{
              fontSize: 11,
              padding: "4px 10px",
              border: "1px solid #EBEEf2",
              borderRadius: 6,
              background: isRefreshing ? "#F7F8FA" : "white",
              cursor: isRefreshing ? "not-allowed" : "pointer",
              color: isRefreshing ? "#B0BAC6" : "#7A8899",
              display: "flex",
              alignItems: "center",
              gap: 5,
              transition: "all 0.2s",
            }}
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke={isRefreshing ? "#B0BAC6" : "#7A8899"}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                animation: isRefreshing ? "spin 0.8s linear infinite" : "none",
                flexShrink: 0,
              }}
            >
              <path d="M23 4v6h-6" />
              <path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            {isRefreshing ? "Memuat..." : "Refresh"}
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
            placeholder="Cari nama petugas..."
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
          onChange={handleKelurahanChange}
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
            Menampilkan petugas dengan SLS di:{" "}
            {[filterKelurahan, filterKecamatan].filter(Boolean).join(", ")}
          </span>
        </div>
      )}

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
        {[
          { label: `PML Online (${pmlOnline})`, color: "#003366" },
          {
            label: `PML Offline (${pmlList.length - pmlOnline})`,
            color: "#9AA5B4",
          },
          { label: `PPL Online (${pplOnline})`, color: "#E8702A" },
        ].map(({ label, color }) => (
          <span
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 3,
              fontSize: 10,
              color,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: color,
                display: "inline-block",
              }}
            />
            {label}
          </span>
        ))}
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
            height: 380,   // ← fixed height, sesuaikan angkanya
            flexShrink: 0,
          }}
        >
        <MapContainer
          center={[-7.801389, 110.364444]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap"
          />
          {flyTarget && (
            <FlyToMarker
              lat={flyTarget.lat}
              lng={flyTarget.lng}
              triggerKey={flyTarget.key}
            />
          )}

          {/* Marker PML */}
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
              <Tooltip direction="top" offset={[0, -36]} opacity={1}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#1A2B42",
                    whiteSpace: "nowrap",
                  }}
                >
                  {pml.nama}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    color: "#003366",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  PML · {pml.online ? "Online" : "Offline"}
                </div>
              </Tooltip>

              <Popup>
                <div style={{ fontSize: 12, minWidth: 180 }}>
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
                        marginBottom: 6,
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
                      marginBottom: 4,
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
                    style={{ fontSize: 11, color: "#9AA5B4", marginBottom: 10 }}
                  >
                    Terakhir: {formatWaktu(pml.recorded_at)}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <div
                      onClick={() =>
                        setSelectedPML(selectedPML === pml.id ? null : pml.id)
                      }
                      style={{
                        flex: 1,
                        padding: "6px 8px",
                        backgroundColor: "#EEF5FF",
                        border: "1px solid #C7DEFF",
                        borderRadius: 7,
                        fontSize: 11,
                        color: "#003366",
                        textAlign: "center",
                        cursor: "pointer",
                        fontWeight: 500,
                      }}
                    >
                      {selectedPML === pml.id ? "Sembunyikan PPL" : "Lihat PPL"}
                    </div>
                    <div
                      onClick={() => openDetail(pml)}
                      style={{
                        flex: 1,
                        padding: "6px 8px",
                        backgroundColor: "#003366",
                        borderRadius: 7,
                        fontSize: 11,
                        color: "white",
                        textAlign: "center",
                        cursor: "pointer",
                        fontWeight: 500,
                      }}
                    >
                      Detail
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Marker PPL */}
          {filteredPPL.map((ppl) => (
            <Marker
              key={`ppl-${ppl.id}`}
              position={[ppl.lat, ppl.lng]}
              icon={pplOnlineIcon}
            >
              <Tooltip direction="top" offset={[0, -36]} opacity={1}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#1A2B42",
                    whiteSpace: "nowrap",
                  }}
                >
                  {ppl.nama}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    color: "#E8702A",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  PPL · Online
                </div>
              </Tooltip>

              <Popup>
                <div style={{ fontSize: 12, minWidth: 180 }}>
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
                        marginBottom: 6,
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
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: "#1D9E75",
                        display: "inline-block",
                      }}
                    />
                    <span
                      style={{
                        fontSize: 11,
                        color: "#1D9E75",
                        fontWeight: 500,
                      }}
                    >
                      Online
                    </span>
                  </div>
                  <div
                    style={{ fontSize: 11, color: "#9AA5B4", marginBottom: 10 }}
                  >
                    Terakhir: {formatWaktu(ppl.recorded_at)}
                  </div>
                  <div
                    onClick={() => openDetail(ppl)}
                    style={{
                      padding: "6px 8px",
                      backgroundColor: "#E8702A",
                      borderRadius: 7,
                      fontSize: 11,
                      color: "white",
                      textAlign: "center",
                      cursor: "pointer",
                      fontWeight: 500,
                    }}
                  >
                    Detail Petugas
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
