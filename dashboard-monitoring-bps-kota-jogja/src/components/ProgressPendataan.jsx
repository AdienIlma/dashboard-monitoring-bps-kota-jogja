import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#003366', '#E8702A', '#1D9E75', '#E8ECF0'];

const StatCard = ({ label, value, persen, color }) => (
  <div style={{
    background: '#F7F8FA',
    border: '1px solid #EBEEf2',
    borderTop: `3px solid ${color}`,
    borderRadius: 10,
    padding: '10px 8px',
    textAlign: 'center',
    flex: 1,
    minWidth: 0,
  }}>
    <div style={{ fontSize: 9, color: '#9AA5B4', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>
      {label}
    </div>
    <div style={{ fontSize: 26, fontWeight: 500, color: color, lineHeight: 1.1 }}>{value}</div>
    <div style={{ fontSize: 10, color: '#B0BAC6', marginTop: 3 }}>{persen}%</div>
  </div>
);

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#1A2B42', color: '#fff', borderRadius: 8, padding: '6px 12px', fontSize: 12 }}>
        <span style={{ fontWeight: 500 }}>{payload[0].name}</span>: {payload[0].value}%
      </div>
    );
  }
  return null;
};

const ProgressPendataan = ({ data }) => {
  if (!data) return <div style={{ padding: 20, color: '#9AA5B4', fontSize: 13 }}>Memuat data...</div>;

  const chartData = [
    { name: 'Ke Lapangan', value: parseFloat(data.sudahKeLapanganChartPersen) },
    { name: 'Submit', value: parseFloat(data.submitChartPersen) },
    { name: 'Approve', value: parseFloat(data.approvePersen2) },
    { name: 'Belum', value: parseFloat(data.belumPersen) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>
      <div style={{ fontSize: 11, fontWeight: 500, color: '#9AA5B4', letterSpacing: '0.07em', textTransform: 'uppercase', borderBottom: '1px solid #F0F2F5', paddingBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        <i className="ti ti-chart-pie" style={{ fontSize: 14, color: '#E8702A' }} aria-hidden="true" />
        Progress Pendataan
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <StatCard label="Ke Lapangan" value={data.sudahKeLapangan} persen={data.sudahKeLapanganPersen} color="#003366" />
        <StatCard label="Submit" value={data.submit} persen={data.submitPersen} color="#E8702A" />
        <StatCard label="Approve" value={data.approve} persen={data.approvePersen} color="#1D9E75" />
      </div>

      <div style={{ position: 'relative', flex: 1 }}>
        <ResponsiveContainer width="100%" height={190}>
          <PieChart>
            <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={2} dataKey="value" startAngle={90} endAngle={-270}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} stroke="none" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
          <div style={{ fontSize: 9, color: '#9AA5B4', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>TARGET</div>
          <div style={{ fontSize: 20, fontWeight: 500, color: '#1A2B42', lineHeight: 1.2 }}>
            {data.target.toLocaleString('id-ID')}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 12px' }}>
        {chartData.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#7A8899' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i], flexShrink: 0 }} />
            <span>{item.name}</span>
            <span style={{ marginLeft: 'auto', fontWeight: 500, color: '#1A2B42' }}>{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressPendataan;