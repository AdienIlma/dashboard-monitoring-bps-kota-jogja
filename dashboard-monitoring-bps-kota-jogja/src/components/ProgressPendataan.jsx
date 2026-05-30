import React from "react";

const StatCard = ({ label, value, color }) => (
  <div
    style={{
      background: "#F7F8FA",
      border: "1px solid #EBEEf2",
      borderTop: `3px solid ${color}`,
      borderRadius: 8,
      padding: "6px 8px",
      textAlign: "center",
      flex: 1,
      minWidth: 0,
    }}
  >
    <div
      style={{
        fontSize: 9,
        color: "#9AA5B4",
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: "0.07em",
        marginBottom: 2,
      }}
    >
      {label}
    </div>
    <div style={{ fontSize: 20, fontWeight: 500, color, lineHeight: 1.1 }}>
      {(value ?? 0).toLocaleString("id-ID")}
    </div>
  </div>
);

const BAR_COLORS = {
  Target: "#6C47C4",
  "Ke Lapangan": "#003366",
  Submit: "#E8702A",
  Approve: "#1D9E75",
  Belum: "#9AA5B4",
};
const ProgressBar = ({ name, value, pct, color, target }) => {
  const barWidth = Math.min((value / target) * 100, 100);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {/* Label */}
      <div
        style={{
          width: 72,
          fontSize: 11,
          color: "#9AA5B4",
          textAlign: "right",
          flexShrink: 0,
        }}
      >
        {name}
      </div>

      {/* Track */}
      <div
        style={{
          flex: 1,
          height: 28,
          background: "#F7F8FA",
          border: "1px solid #EBEEF2",
          borderRadius: 5,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Fill */}
        <div
          style={{
            width: `${barWidth}%`,
            height: "100%",
            background: color,
            borderRadius: 5,
            display: "flex",
            alignItems: "center",
            paddingLeft: 10,
            boxSizing: "border-box",
            transition: "width 0.6s ease",
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#fff",
              whiteSpace: "nowrap",
            }}
          >
            {value.toLocaleString("id-ID")}
          </span>
        </div>
      </div>

      {/* Persen */}
      <div
        style={{
          width: 36,
          fontSize: 11,
          color: "#9AA5B4",
          textAlign: "right",
          flexShrink: 0,
        }}
      >
        {pct}%
      </div>
    </div>
  );
};

const ProgressPendataan = ({ data }) => {
  if (!data) {
    return (
      <div style={{ padding: 12, color: "#9AA5B4", fontSize: 13 }}>
        Memuat data...
      </div>
    );
  }

  const target     = data.target          ?? 0;
  const keLapangan = data.sudahKeLapangan ?? 0;
  const submit     = data.submit          ?? 0;
  const approve    = data.approve         ?? 0;
  const belum = Math.max(target - approve, 0);

  const rows = [
    {
      name: "Target",
      value: target,
      pct: 100,
      color: BAR_COLORS["Target"],
    },
    {
      name: "Ke Lapangan",
      value: keLapangan,
      pct: data.sudahKeLapanganPersen ?? 0,
      color: BAR_COLORS["Ke Lapangan"],
    },
    {
      name: "Submit",
      value: submit,
      pct: data.submitPersen ?? 0,
      color: BAR_COLORS["Submit"],
    },
    {
      name: "Approve",
      value: approve,
      pct: data.approvePersen ?? 0,
      color: BAR_COLORS["Approve"],
    },
    {
      name: "Belum",
      value: belum,
      pct:
        target > 0
          ? Number(((belum / target) * 100).toFixed(2))
          : 0,
      color: BAR_COLORS["Belum"],
    },
  ];

  return (
    <div
        style={{
    display: "flex",
    flexDirection: "column",
    gap: 8,
    background: "#FFFFFF",
    border: "1px solid #EBEEF2",
    borderRadius: 10,
    padding: "12px 14px",
  }}
    >
      {/* Header */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#9AA5B4",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          paddingBottom: 8,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <i className="ti ti-filter" style={{ fontSize: 13, color: "#E8702A" }} aria-hidden="true" />
        Progress Pendataan
      </div>

      {/* Stat Cards */}
      <div style={{ display: "flex", gap: 6 }}>
        <StatCard label="Ke Lapangan" value={keLapangan} color="#003366" />
        <StatCard label="Submit"      value={submit}     color="#E8702A" />
        <StatCard label="Approve"     value={approve}    color="#1D9E75" />
      </div>

      {/* Bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
        {rows.map((row) => (
          <ProgressBar
            key={row.name}
            name={row.name}
            value={row.value}
            pct={row.pct}
            color={row.color}
            target={target}
          />
        ))}
      </div>
    </div>
  );
};

export default ProgressPendataan;