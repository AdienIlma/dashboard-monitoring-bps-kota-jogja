import React from 'react';

const PetugasLapangan = ({ data }) => {
  if (!data) return <div style={{ padding: 20, color: '#9AA5B4', fontSize: 13 }}>Memuat data...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F0F2F5', paddingBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: '#9AA5B4', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'flex', alignItems: 'center', gap: 6 }}>
          <i className="ti ti-users" style={{ fontSize: 14, color: '#E8702A' }} aria-hidden="true" />
          Petugas Lapangan
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ background: '#F7F8FA', border: '1px solid #EBEEf2', borderRadius: 10, padding: '12px 16px', textAlign: 'center', flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9, color: '#9AA5B4', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Total Petugas</div>
          <div style={{ fontSize: 28, fontWeight: 500, color: '#003366', lineHeight: 1 }}>{data.totalPetugas}</div>
        </div>

        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ background: '#F7F8FA', border: '1px solid #EBEEf2', borderLeft: '3px solid #003366', borderRadius: 10, padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#7A8899', fontWeight: 500 }}>Total PML</span>
            <span style={{ fontSize: 20, fontWeight: 500, color: '#003366' }}>{data.totalPML}</span>
          </div>
          <div style={{ background: '#F7F8FA', border: '1px solid #EBEEf2', borderLeft: '3px solid #E8702A', borderRadius: 10, padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#7A8899', fontWeight: 500 }}>Total PPL</span>
            <span style={{ fontSize: 20, fontWeight: 500, color: '#E8702A' }}>{data.totalPPL}</span>
          </div>
        </div>

        <div style={{ background: '#003366', borderRadius: 10, padding: '12px 16px', textAlign: 'center', flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Aktif Hari Ini</div>
          <div style={{ fontSize: 30, fontWeight: 500, color: '#E8702A', lineHeight: 1.1 }}>{data.petugasAktif}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>{data.petugasAktifPersen}%</div>
          <div style={{ marginTop: 8, background: 'rgba(255,255,255,0.12)', borderRadius: 99, height: 4 }}>
            <div style={{ width: `${data.petugasAktifPersen}%`, height: '100%', background: '#E8702A', borderRadius: 99 }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetugasLapangan;