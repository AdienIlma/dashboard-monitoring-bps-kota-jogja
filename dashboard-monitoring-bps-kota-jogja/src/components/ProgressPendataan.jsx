import React from "react";
import { BarChart, Bar, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#6C47C4", "#003366", "#E8702A", "#1D9E75", "#9AA5B4"];

const StatCard = ({ label, value, persen, color }) => (
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
    <div
      style={{ fontSize: 20, fontWeight: 500, color: color, lineHeight: 1.1 }}
    >
      {value}
    </div>
    <div style={{ fontSize: 9, color: "#B0BAC6", marginTop: 1 }}>{persen}%</div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "#1A2B42", color: "#fff", borderRadius: 8, padding: "5px 10px", fontSize: 11 }}>
        <span style={{ fontWeight: 500 }}>{label}</span>:{" "}
        {payload[0].value.toLocaleString("id-ID")}
      </div>
    );
  }
  return null;
};

const ProgressPendataan = ({ data }) => {
  if (!data)
    return (
      <div style={{ padding: 12, color: "#9AA5B4", fontSize: 13 }}>
        Memuat data...
      </div>
    );

    console.log("target:", data.target);
console.log("ke lapangan:", data.sudahKeLapangan);
console.log("submit:", data.submit);
console.log("approve:", data.approve);

  const chartData = [
  { name: "Target", value: data.target },
  { name: "Ke Lapangan", value: data.sudahKeLapangan },
  { name: "Submit", value: data.submit },
  { name: "Approve", value: data.approve },
  { name: "Belum", value: data.target - data.approve },  
];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: "#9AA5B4",
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          borderBottom: "1px solid #F0F2F5",
          paddingBottom: 6,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <i
          className="ti ti-chart-pie"
          style={{ fontSize: 13, color: "#E8702A" }}
          aria-hidden="true"
        />
        Progress Pendataan
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        <StatCard
          label="Ke Lapangan"
          value={data.sudahKeLapangan}
          persen={data.sudahKeLapanganPersen}
          color="#003366"
        />
        <StatCard
          label="Submit"
          value={data.submit}
          persen={data.submitPersen}
          color="#E8702A"
        />
        <StatCard
          label="Approve"
          value={data.approve}
          persen={data.approvePersen}
          color="#1D9E75"
        />
      </div>

      <div style={{ position: "relative" }}>
        <ResponsiveContainer width="100%" height={150}>
 <BarChart
  data={chartData}
  layout="vertical"
  margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
>
  <XAxis
    type="number"
    domain={[0, data.target]}
    tick={{ fontSize: 9 }}
    tickFormatter={(v) => v.toLocaleString("id-ID")}
  />
  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={72} />
  <Tooltip content={<CustomTooltip />} />
  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={14}>
    {chartData.map((entry, index) => (
      <Cell key={`cell-${index}`} fill={COLORS[index]} />
    ))}
  </Bar>
</BarChart>
</ResponsiveContainer>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
        </div>
      </div>

    </div>
  );
};

export default ProgressPendataan;
