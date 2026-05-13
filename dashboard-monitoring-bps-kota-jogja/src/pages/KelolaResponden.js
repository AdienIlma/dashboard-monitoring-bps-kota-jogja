import React, { useEffect, useState } from 'react';
import api from '../services/api';

const KelolaResponden = () => {
  const [wilayah, setWilayah] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kecamatanBaru, setKecamatanBaru] = useState('');
  const [expanded, setExpanded] = useState({});
  const [addingKelurahan, setAddingKelurahan] = useState(null);
  const [namaKelurahan, setNamaKelurahan] = useState('');
  const [search, setSearch] = useState('');
  const [pesan, setPesan] = useState({ text: '', type: '' });

  // Edit states
  const [editingKecamatan, setEditingKecamatan] = useState(null);
  const [editNamaKecamatan, setEditNamaKecamatan] = useState('');
  const [editingKelurahan, setEditingKelurahan] = useState(null);
  const [editNamaKelurahan, setEditNamaKelurahan] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (pesan.text) {
      const t = setTimeout(() => setPesan({ text: '', type: '' }), 3500);
      return () => clearTimeout(t);
    }
  }, [pesan]);

  const fetchData = async () => {
    try {
      const res = await api.get('/admin/wilayah');
      setWilayah(res.data);
    } catch (err) {
      console.error('Gagal ambil data wilayah', err);
    } finally {
      setLoading(false);
    }
  };

  const grouped = wilayah.reduce((acc, item) => {
    if (!acc[item.kecamatan]) acc[item.kecamatan] = [];
    acc[item.kecamatan].push(item);
    return acc;
  }, {});

  const filteredKecamatan = Object.keys(grouped).filter((kec) =>
    kec.toLowerCase().includes(search.toLowerCase())
  );

  const showPesan = (text, type) => setPesan({ text, type });

  // ── TAMBAH KECAMATAN ────────────────────────────────────────────────
  const handleTambahKecamatan = async (e) => {
    e.preventDefault();
    if (!kecamatanBaru.trim()) return;
    try {
      await api.post('/admin/wilayah', {
        kecamatan: kecamatanBaru,
        kelurahan: kecamatanBaru,
      });
      showPesan('Kecamatan berhasil ditambahkan!', 'success');
      setKecamatanBaru('');
      fetchData();
    } catch (err) {
      showPesan(err.response?.data?.message || 'Gagal tambah kecamatan', 'error');
    }
  };

  // ── EDIT KECAMATAN ──────────────────────────────────────────────────
  const handleEditKecamatan = async (oldKecamatan) => {
    if (!editNamaKecamatan.trim() || editNamaKecamatan === oldKecamatan) {
      setEditingKecamatan(null);
      return;
    }
    try {
      const items = grouped[oldKecamatan];
      for (const item of items) {
        await api.put(`/admin/wilayah/${item.id}`, {
          kecamatan: editNamaKecamatan,
          kelurahan: item.kelurahan === item.kecamatan ? editNamaKecamatan : item.kelurahan,
        });
      }
      showPesan('Kecamatan berhasil diperbarui!', 'success');
      setEditingKecamatan(null);
      setEditNamaKecamatan('');
      fetchData();
    } catch (err) {
      showPesan(err.response?.data?.message || 'Gagal edit kecamatan', 'error');
    }
  };

  // ── TAMBAH KELURAHAN ────────────────────────────────────────────────
  const handleTambahKelurahan = async (kecamatan) => {
    if (!namaKelurahan.trim()) return;
    try {
      await api.post('/admin/wilayah', { kecamatan, kelurahan: namaKelurahan });
      showPesan('Kelurahan berhasil ditambahkan!', 'success');
      setNamaKelurahan('');
      setAddingKelurahan(null);
      fetchData();
    } catch (err) {
      showPesan(err.response?.data?.message || 'Gagal tambah kelurahan', 'error');
    }
  };

  // ── EDIT KELURAHAN ──────────────────────────────────────────────────
  const handleEditKelurahan = async (item) => {
    if (!editNamaKelurahan.trim() || editNamaKelurahan === item.kelurahan) {
      setEditingKelurahan(null);
      return;
    }
    try {
      await api.put(`/admin/wilayah/${item.id}`, {
        kecamatan: item.kecamatan,
        kelurahan: editNamaKelurahan,
      });
      showPesan('Kelurahan berhasil diperbarui!', 'success');
      setEditingKelurahan(null);
      setEditNamaKelurahan('');
      fetchData();
    } catch (err) {
      showPesan(err.response?.data?.message || 'Gagal edit kelurahan', 'error');
    }
  };

  // ── HAPUS KELURAHAN ─────────────────────────────────────────────────
  const handleDeleteKelurahan = async (item) => {
    if (!window.confirm(`Hapus kelurahan "${item.kelurahan}"?`)) return;
    try {
      await api.delete(`/admin/wilayah/${item.id}`);
      showPesan('Kelurahan berhasil dihapus!', 'success');
      fetchData();
    } catch (err) {
      showPesan(err.response?.data?.message || 'Gagal hapus kelurahan', 'error');
    }
  };

  // ── HAPUS KECAMATAN ─────────────────────────────────────────────────
  const handleDeleteKecamatan = async (kecamatan) => {
    if (!window.confirm(`Hapus kecamatan "${kecamatan}" beserta seluruh kelurahannya?`)) return;
    try {
      for (const item of grouped[kecamatan]) {
        await api.delete(`/admin/wilayah/${item.id}`);
      }
      showPesan('Kecamatan berhasil dihapus!', 'success');
      fetchData();
    } catch (err) {
      showPesan(err.response?.data?.message || 'Gagal hapus kecamatan', 'error');
    }
  };

  const totalKecamatan = Object.keys(grouped).length;
  const totalKelurahan = wilayah.filter((k) => k.kelurahan !== k.kecamatan).length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .kelola-wrap * { box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; }

        .kelola-wrap { padding: 24px; background: #f0f4f8; min-height: 100vh; }

        /* ── Stat cards ── */
        .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 22px; }
        .stat-card {
          background: white; border-radius: 16px; padding: 20px 22px;
          box-shadow: 0 1px 3px rgba(0,0,0,.06), 0 4px 12px rgba(0,0,0,.04);
          display: flex; align-items: center; gap: 16px;
        }
        .stat-icon {
          width: 46px; height: 46px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; flex-shrink: 0;
        }
        .stat-icon.blue { background: #eff6ff; }
        .stat-icon.green { background: #f0fdf4; }
        .stat-num { font-size: 26px; font-weight: 800; color: #0f172a; line-height: 1; }
        .stat-label { font-size: 12px; color: #64748b; margin-top: 3px; font-weight: 500; }

        /* ── Toast ── */
        .toast {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 16px; border-radius: 12px; margin-bottom: 18px;
          font-size: 13px; font-weight: 600; animation: slideIn .25s ease;
        }
        .toast.success { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
        .toast.error   { background: #fff1f2; color: #be123c; border: 1px solid #fecdd3; }
        @keyframes slideIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }

        /* ── Form card ── */
        .form-card {
          background: white; border-radius: 16px; padding: 20px 22px;
          margin-bottom: 18px; box-shadow: 0 1px 3px rgba(0,0,0,.06), 0 4px 12px rgba(0,0,0,.04);
        }
        .form-card h4 { margin: 0 0 14px; font-size: 13px; font-weight: 700; color: #1e3a5f; text-transform: uppercase; letter-spacing: .5px; }
        .form-row { display: flex; gap: 10px; }

        /* ── Inputs ── */
        .inp {
          padding: 9px 13px; border: 1.5px solid #e2e8f0; border-radius: 10px;
          font-size: 13px; outline: none; transition: border .2s, box-shadow .2s;
          font-family: inherit;
        }
        .inp:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.12); }

        /* ── Search bar ── */
        .search-bar { position: relative; margin-bottom: 16px; }
        .search-bar .inp { width: 100%; padding-left: 38px; }
        .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 15px; pointer-events: none; }

        /* ── Table ── */
        .table-card {
          background: white; border-radius: 16px; overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,.06), 0 4px 12px rgba(0,0,0,.04);
        }
        table { width: 100%; border-collapse: collapse; }
        thead tr { background: #f8fafc; }
        th {
          padding: 11px 16px; font-size: 11px; font-weight: 700; color: #94a3b8;
          text-align: left; text-transform: uppercase; letter-spacing: .6px;
          border-bottom: 1px solid #f1f5f9;
        }
        td { padding: 12px 16px; font-size: 13px; color: #334155; vertical-align: middle; }
        .kec-row { border-bottom: 1px solid #f1f5f9; transition: background .15s; }
        .kec-row:hover { background: #fafbfc; }
        .kec-name { font-weight: 700; color: #0f172a; font-size: 14px; }

        /* ── Badges ── */
        .badge-count {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 700;
          background: #eff6ff; color: #2563eb;
        }

        /* ── Buttons ── */
        .btn { padding: 6px 14px; border-radius: 8px; border: none; cursor: pointer; font-size: 12px; font-weight: 600; transition: filter .15s, transform .1s; font-family: inherit; }
        .btn:hover { filter: brightness(.94); }
        .btn:active { transform: scale(.97); }
        .btn-primary { background: #1e3a5f; color: white; padding: 9px 18px; font-size: 13px; border-radius: 10px; }
        .btn-view    { background: #eff6ff; color: #2563eb; }
        .btn-add-kel { background: #f0fdf4; color: #15803d; }
        .btn-edit    { background: #faf5ff; color: #7c3aed; }
        .btn-delete  { background: #fff1f2; color: #be123c; }
        .btn-save    { background: #1e3a5f; color: white; }
        .btn-cancel  { background: #f1f5f9; color: #64748b; }

        /* ── Action group ── */
        .actions { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }

        /* ── Expand panel ── */
        .expand-panel { background: #f8fafc; padding: 14px 20px; border-bottom: 1px solid #f1f5f9; }
        .expand-panel-inner { max-width: 520px; }

        /* ── Add kel form ── */
        .add-kel-form { display: flex; gap: 8px; margin-bottom: 14px; padding-bottom: 14px; border-bottom: 1px dashed #e2e8f0; }

        /* ── Kelurahan list ── */
        .kel-item {
          display: flex; justify-content: space-between; align-items: center;
          padding: 9px 0; border-bottom: 1px solid #f1f5f9; gap: 10px;
        }
        .kel-item:last-child { border-bottom: none; }
        .kel-name { font-size: 13px; color: #334155; display: flex; align-items: center; gap: 7px; }
        .kel-dot { width: 6px; height: 6px; border-radius: 50%; background: #94a3b8; flex-shrink: 0; }

        /* ── Inline edit form ── */
        .inline-edit { display: flex; gap: 6px; align-items: center; flex: 1; }
        .inline-edit .inp { flex: 1; padding: 6px 10px; font-size: 12px; }

        /* ── Edit kecamatan row ── */
        .edit-kec-wrap { display: flex; gap: 8px; align-items: center; }
        .edit-kec-wrap .inp { font-size: 14px; font-weight: 700; flex: 1; }

        /* ── Empty ── */
        .empty-cell { text-align: center; padding: 44px; color: #cbd5e1; font-size: 13px; }

        /* ── Loading skeleton ── */
        .skeleton { background: linear-gradient(90deg,#f1f5f9 25%,#e8edf2 50%,#f1f5f9 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 8px; height: 14px; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>

      <div className="kelola-wrap">

        {/* ── Stat Cards ── */}
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-icon blue">🏙️</div>
            <div>
              <div className="stat-num">{totalKecamatan}</div>
              <div className="stat-label">Total Kecamatan</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">🏘️</div>
            <div>
              <div className="stat-num">{totalKelurahan}</div>
              <div className="stat-label">Total Kelurahan</div>
            </div>
          </div>
        </div>

        {/* ── Toast ── */}
        {pesan.text && (
          <div className={`toast ${pesan.type}`}>
            {pesan.type === 'success' ? '✅' : '❌'} {pesan.text}
          </div>
        )}

        {/* ── Form Tambah Kecamatan ── */}
        <div className="form-card">
          <h4>Tambah Kecamatan</h4>
          <form onSubmit={handleTambahKecamatan} className="form-row">
            <input
              className="inp"
              style={{ flex: 1 }}
              type="text"
              placeholder="Nama kecamatan baru..."
              value={kecamatanBaru}
              onChange={(e) => setKecamatanBaru(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary">+ Tambah</button>
          </form>
        </div>

        {/* ── Search ── */}
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            className="inp"
            type="text"
            placeholder="Cari kecamatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* ── Table ── */}
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Kecamatan</th>
                <th>Kelurahan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="3" className="empty-cell">Memuat data...</td>
                </tr>
              ) : filteredKecamatan.length === 0 ? (
                <tr>
                  <td colSpan="3" className="empty-cell">Tidak ada data kecamatan</td>
                </tr>
              ) : (
                filteredKecamatan.map((kecamatan) => {
                  const kelurahanList = grouped[kecamatan];
                  const realKelurahan = kelurahanList.filter((k) => k.kelurahan !== k.kecamatan);
                  const isExpanded = expanded[kecamatan];
                  const isEditingKec = editingKecamatan === kecamatan;

                  return (
                    <React.Fragment key={kecamatan}>
                      <tr className="kec-row">
                        {/* Nama Kecamatan */}
                        <td>
                          {isEditingKec ? (
                            <div className="edit-kec-wrap">
                              <input
                                autoFocus
                                className="inp"
                                value={editNamaKecamatan}
                                onChange={(e) => setEditNamaKecamatan(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleEditKecamatan(kecamatan);
                                  if (e.key === 'Escape') setEditingKecamatan(null);
                                }}
                              />
                              <button className="btn btn-save" onClick={() => handleEditKecamatan(kecamatan)}>Simpan</button>
                              <button className="btn btn-cancel" onClick={() => setEditingKecamatan(null)}>Batal</button>
                            </div>
                          ) : (
                            <span className="kec-name">{kecamatan}</span>
                          )}
                        </td>

                        {/* Badge jumlah kelurahan */}
                        <td>
                          <span className="badge-count">{realKelurahan.length}</span>
                        </td>

                        {/* Aksi */}
                        <td>
                          <div className="actions">
                            <button
                              className="btn btn-view"
                              onClick={() =>
                                setExpanded((prev) => ({ ...prev, [kecamatan]: !prev[kecamatan] }))
                              }
                            >
                              {isExpanded ? '▲ Tutup' : '▼ Lihat'}
                            </button>

                            <button
                              className="btn btn-add-kel"
                              onClick={() => {
                                setAddingKelurahan(kecamatan);
                                setExpanded((prev) => ({ ...prev, [kecamatan]: true }));
                              }}
                            >
                              + Kelurahan
                            </button>

                            <button
                              className="btn btn-edit"
                              onClick={() => {
                                setEditingKecamatan(kecamatan);
                                setEditNamaKecamatan(kecamatan);
                              }}
                            >
                              ✏️ Edit
                            </button>

                            <button
                              className="btn btn-delete"
                              onClick={() => handleDeleteKecamatan(kecamatan)}
                            >
                              🗑 Hapus
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* ── Expanded Panel ── */}
                      {isExpanded && (
                        <tr>
                          <td colSpan="3" style={{ padding: 0 }}>
                            <div className="expand-panel">
                              <div className="expand-panel-inner">

                                {/* Form tambah kelurahan */}
                                {addingKelurahan === kecamatan && (
                                  <div className="add-kel-form">
                                    <input
                                      autoFocus
                                      className="inp"
                                      style={{ flex: 1 }}
                                      placeholder="Nama kelurahan baru..."
                                      value={namaKelurahan}
                                      onChange={(e) => setNamaKelurahan(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleTambahKelurahan(kecamatan);
                                        if (e.key === 'Escape') setAddingKelurahan(null);
                                      }}
                                    />
                                    <button className="btn btn-save" onClick={() => handleTambahKelurahan(kecamatan)}>Simpan</button>
                                    <button className="btn btn-cancel" onClick={() => setAddingKelurahan(null)}>Batal</button>
                                  </div>
                                )}

                                {/* List kelurahan */}
                                {realKelurahan.length === 0 ? (
                                  <div style={{ color: '#94a3b8', fontSize: 13, padding: '6px 0' }}>
                                    Belum ada kelurahan. Klik <strong>+ Kelurahan</strong> untuk menambah.
                                  </div>
                                ) : (
                                  realKelurahan.map((item) => {
                                    const isEditingKel = editingKelurahan === item.id;
                                    return (
                                      <div className="kel-item" key={item.id}>
                                        {isEditingKel ? (
                                          <div className="inline-edit">
                                            <input
                                              autoFocus
                                              className="inp"
                                              value={editNamaKelurahan}
                                              onChange={(e) => setEditNamaKelurahan(e.target.value)}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleEditKelurahan(item);
                                                if (e.key === 'Escape') setEditingKelurahan(null);
                                              }}
                                            />
                                            <button className="btn btn-save" onClick={() => handleEditKelurahan(item)}>Simpan</button>
                                            <button className="btn btn-cancel" onClick={() => setEditingKelurahan(null)}>Batal</button>
                                          </div>
                                        ) : (
                                          <span className="kel-name">
                                            <span className="kel-dot" />
                                            {item.kelurahan}
                                          </span>
                                        )}

                                        {!isEditingKel && (
                                          <div className="actions">
                                            <button
                                              className="btn btn-edit"
                                              onClick={() => {
                                                setEditingKelurahan(item.id);
                                                setEditNamaKelurahan(item.kelurahan);
                                              }}
                                            >
                                              ✏️ Edit
                                            </button>
                                            <button
                                              className="btn btn-delete"
                                              onClick={() => handleDeleteKelurahan(item)}
                                            >
                                              🗑 Hapus
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>
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
    </>
  );
};

export default KelolaResponden;