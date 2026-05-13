import React, { useState } from 'react';

const TabelPendataan = ({ kecamatanData }) => {
  const [activeTab, setActiveTab] = useState('total');
  const [search, setSearch] = useState('');
  const [expandedKec, setExpandedKec] = useState(null);

  const filtered = (kecamatanData || []).filter((k) =>
    k.nama.toLowerCase().includes(search.toLowerCase())
  );

  const toggleKec = (id) => setExpandedKec(expandedKec === id ? null : id);

  const headerStyle = {
    background: '#F7F8FA',
    padding: '8px 10px',
    fontSize: 9,
    fontWeight: 500,
    color: '#9AA5B4',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    borderBottom: '1px solid #EBEEf2',
    textAlign: 'right',
  };

  const cellStyle = {
    padding: '8px 10px',
    fontSize: 11,
    color: '#4A5568',
    borderBottom: '1px solid #F7F8FA',
    textAlign: 'right',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 500, color: '#9AA5B4', letterSpacing: '0.07em', textTransform: 'uppercase', borderBottom: '1px solid #F0F2F5', paddingBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        <i className="ti ti-table" style={{ fontSize: 14, color: '#E8702A' }} aria-hidden="true" />
        Tabel Pendataan
      </div>

      <div style={{ display: 'flex', gap: 0, background: '#F0F2F5', borderRadius: 8, padding: 3 }}>
        {['total', 'harian'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            flex: 1, padding: '6px 0', border: 'none', borderRadius: 6,
            fontSize: 11, fontWeight: 500, cursor: 'pointer',
            background: activeTab === tab ? '#003366' : 'transparent',
            color: activeTab === tab ? '#fff' : '#7A8899',
          }}>
            {tab === 'total' ? 'Total' : 'Harian'}
          </button>
        ))}
      </div>

      <div style={{ position: 'relative' }}>
        <i className="ti ti-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#B0BAC6' }} aria-hidden="true" />
        <input
          type="text"
          placeholder="Cari kecamatan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '7px 10px 7px 30px', border: '1px solid #EBEEf2', borderRadius: 8, fontSize: 11, color: '#4A5568', background: '#F7F8FA', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ flex: 1, overflow: 'auto', borderRadius: 10, border: '1px solid #EBEEf2' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            <tr>
              <th style={{ ...headerStyle, textAlign: 'left', width: '38%' }}>Wilayah</th>
              <th style={headerStyle}>Lapangan</th>
              <th style={headerStyle}>Submit</th>
              <th style={headerStyle}>Approve</th>
              <th style={headerStyle}>Target</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: 30, color: '#B0BAC6', fontSize: 12 }}>Tidak ada data</td></tr>
            ) : filtered.map((kec) => (
              <React.Fragment key={kec.id}>
                <tr onClick={() => toggleKec(kec.id)} style={{ cursor: 'pointer', background: expandedKec === kec.id ? '#EEF2FF' : 'white' }}>
                  <td style={{ ...cellStyle, textAlign: 'left', fontWeight: 500, color: '#1A2B42' }}>
                    <span style={{ marginRight: 6, fontSize: 9, color: '#003366' }}>{expandedKec === kec.id ? '▼' : '▶'}</span>
                    {kec.nama}
                  </td>
                  <td style={{ ...cellStyle, fontWeight: 500, color: '#003366' }}>{kec.sudahKeLapangan}</td>
                  <td style={{ ...cellStyle, fontWeight: 500, color: '#E8702A' }}>{kec.submit}</td>
                  <td style={{ ...cellStyle, fontWeight: 500, color: '#1D9E75' }}>{kec.approve}</td>
                  <td style={{ ...cellStyle, fontWeight: 500, color: '#003366' }}>{kec.target}</td>
                </tr>
                {expandedKec === kec.id && kec.kelurahan.map((kel) => (
                  <tr key={kel.id} style={{ background: '#F7F8FA' }}>
                    <td style={{ ...cellStyle, textAlign: 'left', paddingLeft: 28, color: '#7A8899' }}>{kel.nama}</td>
                    <td style={{ ...cellStyle, color: '#7A8899' }}>{kel.sudahKeLapangan}</td>
                    <td style={{ ...cellStyle, color: '#7A8899' }}>{kel.submit}</td>
                    <td style={{ ...cellStyle, color: '#7A8899' }}>{kel.approve}</td>
                    <td style={{ ...cellStyle, color: '#7A8899' }}>{kel.target}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TabelPendataan;