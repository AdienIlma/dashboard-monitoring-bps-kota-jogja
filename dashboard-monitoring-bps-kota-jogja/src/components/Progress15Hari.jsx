import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: '#1e293b',
          borderRadius: 10,
          padding: '10px 14px',
          border: '1px solid #334155',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>{label}</div>
        {payload.map((p) => (
          <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
            <span style={{ fontSize: 12, color: '#cbd5e1' }}>{p.name}:</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const Progress15Hari = ({ data }) => {
  if (!data || data.length === 0) return <div style={{ padding: 20, color: '#94a3b8' }}>Memuat data...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
        📈 Progress 15 Hari Terakhir
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="tanggal"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            axisLine={{ stroke: '#e2e8f0' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
            iconType="circle"
            iconSize={8}
          />
          <Line
            type="monotone"
            dataKey="sudahKeLapangan"
            name="Sudah ke Lapangan"
            stroke="#6366f1"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="submit"
            name="Submit"
            stroke="#f59e0b"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="approve"
            name="Approve"
            stroke="#22c55e"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#22c55e', strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Progress15Hari;