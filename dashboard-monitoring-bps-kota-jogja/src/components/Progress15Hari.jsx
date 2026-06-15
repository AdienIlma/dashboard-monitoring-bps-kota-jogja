import React, { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const FILTER_OPTIONS = [
  { key: "7",     label: "7 Hari"  },
  { key: "15",    label: "15 Hari" },
  { key: "bulan", label: "Bulan Ini" },
  { key: "total", label: "Total"   },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "#1A2B42",
          borderRadius: 8,
          padding: "6px 10px",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ fontSize: 10, color: "#9AA5B4", marginBottom: 4 }}>
          {label
            ? new Date(label).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
              })
            : ""}
        </div>
        {payload.map((p) => (
          <div
            key={p.dataKey}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 2,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: p.color,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 11, color: "#B0BAC6" }}>{p.name}:</span>
            <span style={{ fontSize: 11, fontWeight: 500, color: "#fff" }}>
              {p.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const Progress15Hari = ({ data }) => {
  const [filter, setFilter] = useState("15");

  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (filter === "total") return data;

    if (filter === "bulan") {
      const y = today.getFullYear();
      const m = today.getMonth();
      return data.filter((d) => {
        const tgl = new Date(d.tanggal);
        return tgl.getFullYear() === y && tgl.getMonth() === m;
      });
    }

    // 7 atau 15 hari
    const days = parseInt(filter);
    const batas = new Date(today);
    batas.setDate(batas.getDate() - (days - 1));
    batas.setHours(0, 0, 0, 0);
    return data.filter((d) => new Date(d.tanggal) >= batas);
  }, [data, filter]);

  const labelPeriode = FILTER_OPTIONS.find((o) => o.key === filter)?.label ?? "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Header + Filter */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 6,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "#9AA5B4",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <i
            className="ti ti-trending-up"
            style={{ fontSize: 14, color: "#E8702A" }}
            aria-hidden="true"
          />
          Progress {labelPeriode}
        </div>

        {/* Tombol filter */}
        <div style={{ display: "flex", gap: 4 }}>
          {FILTER_OPTIONS.map((opt) => {
            const isActive = filter === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setFilter(opt.key)}
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 20,
                  border: "1px solid",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  borderColor: isActive ? "#E8702A" : "rgba(255,255,255,0.12)",
                  background: isActive ? "#E8702A" : "rgba(255,255,255,0.04)",
                  color: isActive ? "#fff" : "#9AA5B4",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart */}
      {filteredData.length === 0 ? (
        <div style={{ padding: "8px 0", color: "#9AA5B4", fontSize: 12 }}>
          Belum ada data untuk periode ini.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={140}>
          <LineChart
            data={filteredData}
            margin={{ top: 4, right: 8, left: -24, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" />
            <XAxis
              dataKey="tanggal"
              tick={{ fontSize: 8, fill: "#B0BAC6" }}
              axisLine={{ stroke: "#EBEEf2" }}
              tickLine={false}
              interval="preserveStartEnd"
              tickFormatter={(val) => {
                if (!val) return "";
                const d = new Date(val);
                return d.toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                });
              }}
            />
            <YAxis
              tick={{ fontSize: 8, fill: "#B0BAC6" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 10, paddingTop: 4, color: "#9AA5B4" }}
              iconType="circle"
              iconSize={6}
            />
            <Line
              type="monotone"
              dataKey="ke_lapangan"
              name="Ke Lapangan"
              stroke="#003366"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="submit"
              name="Submit"
              stroke="#E8702A"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="approve"
              name="Approve"
              stroke="#1D9E75"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default Progress15Hari;