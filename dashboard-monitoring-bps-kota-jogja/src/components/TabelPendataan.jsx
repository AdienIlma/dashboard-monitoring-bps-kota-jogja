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
    background: '#f1f5f9',
    padding: '7px 10px',
    fontSize: 11,
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    borderBottom: '1px solid #e2e8f0',
    textAlign: 'right',
  };

  const cellStyle = {
    padding: '8px 10px',
    fontSize: 12,
    color: '#334155',
    borderBottom: '1px solid #f1f5f9',
    textAlign: 'right',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', letterSpacing: '0.03em', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
        📋 Tabel Pendataan
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, background: '#f1f5f9', borderRadius: 8, padding: 3 }}>
        {['total', 'harian'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '6px 0',
              border: 'none',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              background: activeTab === tab ? '#6366f1' : 'transparent',
              color: activeTab === tab ? '#fff' : '#64748b',
              transition: 'all 0.2s',
              textTransform: 'capitalize',
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#94a3b8' }}>🔍</span>
        <input
          type="text"
          placeholder="Cari kecamatan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '7px 10px 7px 32px',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            fontSize: 12,
            color: '#334155',
            background: '#fff',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ flex: 1, overflow: 'auto', borderRadius: 10, border: '1px solid #e2e8f0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
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
            {filtered.map((kec) => (
              <React.Fragment key={kec.id}>
                <tr
                  onClick={() => toggleKec(kec.id)}
                  style={{
                    cursor: 'pointer',
                    background: expandedKec === kec.id ? '#eef2ff' : '#fff',
                    transition: 'background 0.15s',
                  }}
                >
                  <td style={{ ...cellStyle, textAlign: 'left', fontWeight: 700, color: '#1e293b' }}>
                    <span style={{ marginRight: 6, fontSize: 10 }}>{expandedKec === kec.id ? '▼' : '▶'}</span>
                    {kec.nama}
                  </td>
                  <td style={{ ...cellStyle, fontWeight: 600, color: '#6366f1' }}>{kec.sudahKeLapangan}</td>
                  <td style={{ ...cellStyle, fontWeight: 600, color: '#f59e0b' }}>{kec.submit}</td>
                  <td style={{ ...cellStyle, fontWeight: 600, color: '#22c55e' }}>{kec.approve}</td>
                  <td style={{ ...cellStyle, fontWeight: 700, color: '#6366f1' }}>{kec.target}</td>
                </tr>

                {expandedKec === kec.id &&
                  kec.kelurahan.map((kel) => (
                    <tr key={kel.id} style={{ background: '#f8fafc' }}>
                      <td style={{ ...cellStyle, textAlign: 'left', paddingLeft: 28, color: '#475569' }}>
                        {kel.nama}
                      </td>
                      <td style={{ ...cellStyle, color: '#475569' }}>{kel.sudahKeLapangan}</td>
                      <td style={{ ...cellStyle, color: '#475569' }}>{kel.submit}</td>
                      <td style={{ ...cellStyle, color: '#475569' }}>{kel.approve}</td>
                      <td style={{ ...cellStyle, color: '#6366f1', fontWeight: 600 }}>{kel.target}</td>
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