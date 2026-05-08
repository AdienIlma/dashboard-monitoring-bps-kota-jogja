import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#94a3b8'];

const StatCard = ({ label, value, persen, color }) => (
  <div
    style={{
      background: '#fff',
      border: `2px solid ${color}20`,
      borderTop: `3px solid ${color}`,
      borderRadius: 12,
      padding: '12px 10px',
      textAlign: 'center',
      flex: 1,
      minWidth: 0,
    }}
  >
    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
      {label}
    </div>
    <div style={{ fontSize: 28, fontWeight: 800, color: color, lineHeight: 1.1 }}>{value}</div>
    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{persen}%</div>
  </div>
);

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#1e293b', color: '#fff', borderRadius: 8, padding: '6px 12px', fontSize: 13 }}>
        <span style={{ fontWeight: 600 }}>{payload[0].name}</span>: {payload[0].value}%
      </div>
    );
  }
  return null;
};

const ProgressPendataan = ({ data }) => {
  if (!data) return <div style={{ padding: 20, color: '#94a3b8' }}>Memuat data...</div>;

  const chartData = [
    { name: 'Sudah ke Lapangan', value: parseFloat(data.sudahKeLapanganChartPersen) },
    { name: 'Submit', value: parseFloat(data.submitChartPersen) },
    { name: 'Approve', value: parseFloat(data.approvePersen2) },
    { name: 'Belum', value: parseFloat(data.belumPersen) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', letterSpacing: '0.03em', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
        📊 Progress Pendataan
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <StatCard label="Ke Lapangan" value={data.sudahKeLapangan} persen={data.sudahKeLapanganPersen} color="#6366f1" />
        <StatCard label="Submit" value={data.submit} persen={data.submitPersen} color="#f59e0b" />
        <StatCard label="Approve" value={data.approve} persen={data.approvePersen} color="#22c55e" />
      </div>

      <div style={{ position: 'relative', flex: 1 }}>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} stroke="none" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>TARGET</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', lineHeight: 1.2 }}>
            {data.target.toLocaleString('id-ID')}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
        {chartData.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#475569' }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: COLORS[i], flexShrink: 0 }} />
            <span>{item.name}</span>
            <span style={{ marginLeft: 'auto', fontWeight: 700, color: '#1e293b' }}>{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressPendataan;