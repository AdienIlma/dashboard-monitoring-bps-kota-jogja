import React from 'react';

const StatBox = ({ label, value, sub, color, big }) => (
  <div
    style={{
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: 12,
      padding: big ? '16px 20px' : '12px 16px',
      textAlign: 'center',
      flex: 1,
      minWidth: 0,
      borderTop: `3px solid ${color}`,
    }}
  >
    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    <div style={{ fontSize: big ? 36 : 28, fontWeight: 800, color: color, lineHeight: 1.1, marginTop: 4 }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
  </div>
);

const PetugasLapangan = ({ data }) => {
  if (!data) return <div style={{ padding: 20, color: '#94a3b8' }}>Memuat data...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          👥 Petugas Lapangan
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8', background: '#f1f5f9', padding: '4px 10px', borderRadius: 20 }}>
          🕐 {data.lastUpdate}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 10 }}>
        <StatBox label="Total Petugas" value={data.totalPetugas} color="#6366f1" />
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '3px solid #6366f1' }}>
            <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>Total PML</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#6366f1' }}>{data.totalPML}</span>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '3px solid #22c55e' }}>
            <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>Total PPL</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#22c55e' }}>{data.totalPPL}</span>
          </div>
        </div>
        <div
          style={{
            background: 'linear-gradient(135deg, #6366f1, #818cf8)',
            borderRadius: 12,
            padding: '12px 16px',
            textAlign: 'center',
            flex: 1,
            color: '#fff',
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8 }}>Aktif Hari Ini</div>
          <div style={{ fontSize: 34, fontWeight: 900, lineHeight: 1.1, marginTop: 4 }}>{data.petugasAktif}</div>
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>{data.petugasAktifPersen}%</div>
          {/* Progress bar */}
          <div style={{ marginTop: 8, background: 'rgba(255,255,255,0.3)', borderRadius: 99, height: 5 }}>
            <div style={{ width: `${data.petugasAktifPersen}%`, height: '100%', background: '#fff', borderRadius: 99 }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetugasLapangan;