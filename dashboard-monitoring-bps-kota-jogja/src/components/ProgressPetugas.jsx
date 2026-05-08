import React, { useState } from 'react';

const ProgressPetugas = ({ petugasDetailData, kecamatanList }) => {
  const [search, setSearch] = useState('');
  const [expandedPML, setExpandedPML] = useState({});

  // pisahkan PML dan PPL
  const pmlList = (petugasDetailData || []).filter(p => p.tipe === 'PML');
  const pplList = (petugasDetailData || []).filter(p => p.tipe === 'PPL');

  // toggle expand PML
  const togglePML = (pmlId) => {
    setExpandedPML(prev => ({ ...prev, [pmlId]: !prev[pmlId] }));
  };

  // filter berdasarkan search
  const filteredPML = pmlList.filter(p =>
    p.nama.toLowerCase().includes(search.toLowerCase())
  );

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

  const renderRow = (petugas, isPPL = false) => (
    <tr key={petugas.id} style={{ 
      backgroundColor: isPPL ? '#f8fafc' : 'white',
    }}>
      <td style={{ ...cellStyle, textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* indent PPL */}
          {isPPL && <span style={{ color: '#cbd5e1', marginLeft: 8 }}>└</span>}
          {/* toggle button untuk PML */}
          {!isPPL && (
            <button
              onClick={() => togglePML(petugas.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 10,
                color: '#6366f1',
                padding: '2px 4px',
                borderRadius: 4,
                backgroundColor: '#eef2ff',
              }}
            >
              {expandedPML[petugas.id] ? '▼' : '▶'}
            </button>
          )}
          <div>
            <div style={{ 
              fontWeight: isPPL ? 500 : 700, 
              color: isPPL ? '#475569' : '#1e293b',
              fontSize: isPPL ? 11 : 12,
            }}>
              {petugas.nama}
            </div>
            <div style={{ 
              fontSize: 10, 
              color: isPPL ? '#94a3b8' : '#6366f1',
              fontWeight: 600,
            }}>
              {isPPL ? 'PPL' : 'PML'}
            </div>
          </div>
        </div>
      </td>
      <td style={{ ...cellStyle, fontWeight: 600, color: '#6366f1' }}>
        {petugas.sudahKeLapangan}
      </td>
      <td style={{ ...cellStyle, fontWeight: 600, color: '#f59e0b' }}>
        {petugas.submit}
      </td>
      <td style={{ ...cellStyle, fontWeight: 600, color: '#22c55e' }}>
        {petugas.approve}
      </td>
      <td style={{ ...cellStyle, fontWeight: 700, color: '#6366f1' }}>
        {(petugas.target || 0).toLocaleString('id-ID')}
      </td>
    </tr>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 10 }}>
      {/* Header */}
      <div style={{ 
        fontSize: 13, 
        fontWeight: 700, 
        color: '#1e293b', 
        letterSpacing: '0.03em', 
        textTransform: 'uppercase', 
        borderBottom: '1px solid #e2e8f0', 
        paddingBottom: 10 
      }}>
        👥 Progress Petugas
      </div>

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <span style={{ 
          position: 'absolute', left: 10, top: '50%', 
          transform: 'translateY(-50%)', fontSize: 14, color: '#94a3b8' 
        }}>🔍</span>
        <input
          type="text"
          placeholder="Cari nama PML..."
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

      {/* Stats */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, background: '#eef2ff', borderRadius: 8, padding: '6px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#6366f1' }}>{pmlList.length}</div>
          <div style={{ fontSize: 10, color: '#6366f1' }}>PML</div>
        </div>
        <div style={{ flex: 1, background: '#f0fdf4', borderRadius: 8, padding: '6px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#22c55e' }}>{pplList.length}</div>
          <div style={{ fontSize: 10, color: '#22c55e' }}>PPL</div>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto', borderRadius: 10, border: '1px solid #e2e8f0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            <tr>
              <th style={{ ...headerStyle, textAlign: 'left', width: '35%' }}>Nama Petugas</th>
              <th style={headerStyle}>Lapangan</th>
              <th style={headerStyle}>Submit</th>
              <th style={headerStyle}>Approve</th>
              <th style={headerStyle}>Target</th>
            </tr>
          </thead>
          <tbody>
            {filteredPML.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                  📭 Tidak ada data petugas
                </td>
              </tr>
            ) : (
              filteredPML.map((pml) => {
                // cari PPL yang berada di bawah PML ini
                const pplDibawahPML = pplList.filter(p => p.pml_id === pml.id);
                return (
                  <React.Fragment key={pml.id}>
                    {renderRow(pml, false)}
                    {expandedPML[pml.id] && pplDibawahPML.map(ppl => renderRow(ppl, true))}
                    {expandedPML[pml.id] && pplDibawahPML.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ 
                          textAlign: 'center', padding: '8px', 
                          color: '#94a3b8', fontSize: 11,
                          backgroundColor: '#f8fafc'
                        }}>
                          Belum ada PPL
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProgressPetugas;