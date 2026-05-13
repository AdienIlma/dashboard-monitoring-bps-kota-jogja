import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#1A2B42', borderRadius: 8, padding: '8px 12px', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: 10, color: '#9AA5B4', marginBottom: 6 }}>{label}</div>
        {payload.map((p) => (
          <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: p.color }} />
            <span style={{ fontSize: 11, color: '#B0BAC6' }}>{p.name}:</span>
            <span style={{ fontSize: 11, fontWeight: 500, color: '#fff' }}>{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const Progress15Hari = ({ data }) => {
  if (!data || data.length === 0) return <div style={{ padding: 20, color: '#9AA5B4', fontSize: 13 }}>Memuat data...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 500, color: '#9AA5B4', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '1px solid #F0F2F5', paddingBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        <i className="ti ti-trending-up" style={{ fontSize: 14, color: '#E8702A' }} aria-hidden="true" />
        Progress 15 Hari Terakhir
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" />
          <XAxis dataKey="tanggal" tick={{ fontSize: 9, fill: '#B0BAC6' }} axisLine={{ stroke: '#EBEEf2' }} tickLine={false} />
          <YAxis tick={{ fontSize: 9, fill: '#B0BAC6' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8, color: '#9AA5B4' }} iconType="circle" iconSize={7} />
          <Line type="monotone" dataKey="sudahKeLapangan" name="Ke Lapangan" stroke="#003366" strokeWidth={2} dot={{ r: 3, fill: '#003366', strokeWidth: 0 }} activeDot={{ r: 5 }} />
          <Line type="monotone" dataKey="submit" name="Submit" stroke="#E8702A" strokeWidth={2} dot={{ r: 3, fill: '#E8702A', strokeWidth: 0 }} activeDot={{ r: 5 }} />
          <Line type="monotone" dataKey="approve" name="Approve" stroke="#1D9E75" strokeWidth={2} dot={{ r: 3, fill: '#1D9E75', strokeWidth: 0 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Progress15Hari;