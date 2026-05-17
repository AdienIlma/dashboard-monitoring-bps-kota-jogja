import React from "react";

const PetugasLapangan = ({ data }) => {
  if (!data)
    return (
      <div style={{ padding: 12, color: "#9AA5B4", fontSize: 13 }}>
        Memuat data...
      </div>
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: "#9AA5B4",
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        <i
          className="ti ti-users"
          style={{ fontSize: 13, color: "#E8702A" }}
          aria-hidden="true"
        />
        Petugas Lapangan
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {/* Total */}
        <div
          style={{
            flex: 1,
            background: "#eef2ff",
            borderRadius: 8,
            padding: "6px 10px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700, color: "#003366" }}>
            {data.totalPetugas}
          </div>
          <div style={{ fontSize: 10, color: "#003366" }}>Total</div>
        </div>

        {/* PML */}
        <div
          style={{
            flex: 1,
            background: "#f1f5f9",
            borderRadius: 8,
            padding: "6px 10px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700, color: "#003366" }}>
            {data.totalPML}
          </div>
          <div style={{ fontSize: 10, color: "#64748b" }}>PML</div>
        </div>

        {/* PPL */}
        <div
          style={{
            flex: 1,
            background: "#f1f5f9",
            borderRadius: 8,
            padding: "6px 10px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700, color: "#E8702A" }}>
            {data.totalPPL}
          </div>
          <div style={{ fontSize: 10, color: "#64748b" }}>PPL</div>
        </div>

        {/* Aktif Hari Ini */}
        <div
          style={{
            flex: 1,
            background: "#003366",
            borderRadius: 8,
            padding: "6px 10px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 3,
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 700, color: "#E8702A" }}>
              {data.petugasAktif}
            </span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>
              {data.petugasAktifPersen}%
            </span>
          </div>
          <div
            style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.6)",
              whiteSpace: "nowrap",
            }}
          >
            Aktif Hari Ini
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetugasLapangan;
