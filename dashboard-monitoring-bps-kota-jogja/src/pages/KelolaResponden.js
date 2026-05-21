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

  // SLS states
  const [expandedKelurahan, setExpandedKelurahan] = useState({});
  const [addingSlsFor, setAddingSlsFor] = useState(null);
  const [kodeSls, setKodeSls] = useState('');
  const [targetSls, setTargetSls] = useState('');
  const [editingSls, setEditingSls] = useState(null);
  const [editKodeSls, setEditKodeSls] = useState('');
  const [editTargetSls, setEditTargetSls] = useState('');

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
    if (!acc[item.kecamatan]) acc[item.kecamatan] = {};
    if (!item.kelurahan || item.kelurahan.trim() === '') return acc;

    const kelKey = item.kelurahan;
    if (!acc[item.kecamatan][kelKey]) {
      acc[item.kecamatan][kelKey] = {
        kelurahan: item.kelurahan,
        kecamatan: item.kecamatan,
        items: []
      };
    }
    acc[item.kecamatan][kelKey].items.push(item);
    return acc;
  }, {});

  wilayah.forEach((item) => {
    if (!grouped[item.kecamatan]) {
      grouped[item.kecamatan] = {};
    }
  });

  const filteredKecamatan = Object.keys(grouped).filter((kec) =>
    kec.toLowerCase().includes(search.toLowerCase())
  );

  const showPesan = (text, type) => setPesan({ text, type });

  // ── TAMBAH KECAMATAN ─────────────────────────────────────────────────
  const handleTambahKecamatan = async (e) => {
    e.preventDefault();
    if (!kecamatanBaru.trim()) return;
    try {
      await api.post('/admin/wilayah', { kecamatan: kecamatanBaru, kelurahan: '' });
      showPesan('Kecamatan berhasil ditambahkan!', 'success');
      setKecamatanBaru('');
      fetchData();
    } catch (err) {
      showPesan(err.response?.data?.message || 'Gagal tambah kecamatan', 'error');
    }
  };

  // ── EDIT KECAMATAN ───────────────────────────────────────────────────
  const handleEditKecamatan = async (oldKecamatan) => {
    if (!editNamaKecamatan.trim() || editNamaKecamatan === oldKecamatan) {
      setEditingKecamatan(null);
      return;
    }
    try {
      const allItems = wilayah.filter((w) => w.kecamatan === oldKecamatan);
      for (const item of allItems) {
        await api.put(`/admin/wilayah/${item.id}`, {
          kecamatan: editNamaKecamatan,
          kelurahan: item.kelurahan,
          kode_sls: item.kode_sls || null,
          target: Number(item.target || 0)
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

  // ── HAPUS KECAMATAN ──────────────────────────────────────────────────
  const handleDeleteKecamatan = async (kecamatan) => {
    if (!window.confirm(`Hapus kecamatan "${kecamatan}" beserta seluruh kelurahan & SLS-nya?`)) return;
    try {
      const allItems = wilayah.filter((w) => w.kecamatan === kecamatan);
      for (const item of allItems) {
        await api.delete(`/admin/wilayah/${item.id}`);
      }
      showPesan('Kecamatan berhasil dihapus!', 'success');
      fetchData();
    } catch (err) {
      showPesan(err.response?.data?.message || 'Gagal hapus kecamatan', 'error');
    }
  };

  // ── TAMBAH KELURAHAN ─────────────────────────────────────────────────
  const handleTambahKelurahan = async (kecamatan) => {
    if (!namaKelurahan.trim()) return;
    try {
      await api.post('/admin/wilayah', {
        kecamatan,
        kelurahan: namaKelurahan,
        kode_sls: null
      });
      showPesan('Kelurahan berhasil ditambahkan!', 'success');
      setNamaKelurahan('');
      setAddingKelurahan(null);
      fetchData();
    } catch (err) {
      showPesan(err.response?.data?.message || 'Gagal tambah kelurahan', 'error');
    }
  };

  // ── EDIT KELURAHAN ───────────────────────────────────────────────────
  const handleEditKelurahan = async (kecamatan, oldKelurahan) => {
    if (!editNamaKelurahan.trim() || editNamaKelurahan === oldKelurahan) {
      setEditingKelurahan(null);
      return;
    }
    try {
      const items = wilayah.filter(
        (w) => w.kecamatan === kecamatan && w.kelurahan === oldKelurahan
      );
      for (const item of items) {
        await api.put(`/admin/wilayah/${item.id}`, {
          kecamatan: item.kecamatan,
          kelurahan: editNamaKelurahan,
          kode_sls: item.kode_sls || null,
          target: Number(item.target || 0)
        });
      }
      showPesan('Kelurahan berhasil diperbarui!', 'success');
      setEditingKelurahan(null);
      setEditNamaKelurahan('');
      fetchData();
    } catch (err) {
      showPesan(err.response?.data?.message || 'Gagal edit kelurahan', 'error');
    }
  };

  // ── HAPUS KELURAHAN ──────────────────────────────────────────────────
  const handleDeleteKelurahan = async (kecamatan, kelurahan) => {
    if (!window.confirm(`Hapus kelurahan "${kelurahan}" beserta semua kode SLS-nya?`)) return;
    try {
      const items = wilayah.filter(
        (w) => w.kecamatan === kecamatan && w.kelurahan === kelurahan
      );
      for (const item of items) {
        await api.delete(`/admin/wilayah/${item.id}`);
      }
      showPesan('Kelurahan berhasil dihapus!', 'success');
      fetchData();
    } catch (err) {
      showPesan(err.response?.data?.message || 'Gagal hapus kelurahan', 'error');
    }
  };

  // ── TAMBAH KODE SLS ──────────────────────────────────────────────────
  const handleTambahSls = async (kecamatan, kelurahan) => {
    if (!kodeSls.trim()) return;
    try {
      await api.post('/admin/wilayah', {
        kecamatan,
        kelurahan,
        kode_sls: kodeSls.trim(),
        target: Number(targetSls || 0)
      });
      showPesan('Kode SLS berhasil ditambahkan!', 'success');
      setKodeSls('');
      setTargetSls('');
      setAddingSlsFor(null);
      fetchData();
    } catch (err) {
      showPesan(err.response?.data?.message || 'Gagal tambah kode SLS', 'error');
    }
  };

  // ── EDIT KODE SLS ────────────────────────────────────────────────────
  const handleEditSls = async (item) => {
    if (!editKodeSls.trim()) {
      setEditingSls(null);
      return;
    }
    try {
      await api.put(`/admin/wilayah/${item.id}`, {
        kecamatan: item.kecamatan,
        kelurahan: item.kelurahan,
        kode_sls: editKodeSls.trim(),
        target: Number(editTargetSls || 0)
      });
      showPesan('Kode SLS berhasil diperbarui!', 'success');
      setEditingSls(null);
      setEditKodeSls('');
      setEditTargetSls('');
      fetchData();
    } catch (err) {
      showPesan(err.response?.data?.message || 'Gagal edit kode SLS', 'error');
    }
  };

  // ── HAPUS KODE SLS ───────────────────────────────────────────────────
  const handleDeleteSls = async (item) => {
    if (!window.confirm(`Hapus kode SLS "${item.kode_sls}"?`)) return;
    try {
      await api.delete(`/admin/wilayah/${item.id}`);
      showPesan('Kode SLS berhasil dihapus!', 'success');
      fetchData();
    } catch (err) {
      showPesan(err.response?.data?.message || 'Gagal hapus kode SLS', 'error');
    }
  };

  const totalKecamatan = Object.keys(grouped).length;
  const totalKelurahan = Object.values(grouped).reduce(
    (sum, kelMap) => sum + Object.keys(kelMap).length, 0
  );
  const totalSls = wilayah.filter((w) => w.kode_sls && w.kode_sls.trim() !== '').length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .kelola-wrap * { box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; }
        .kelola-wrap { padding: 24px; background: #f0f4f8; min-height: 100vh; }

        /* Stat cards */
        .stat-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; margin-bottom: 22px; }
        .stat-card {
          background: white; border-radius: 16px; padding: 18px 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,.06), 0 4px 12px rgba(0,0,0,.04);
          display: flex; align-items: center; gap: 14px;
        }
        .stat-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
        .stat-icon.blue   { background: #eff6ff; }
        .stat-icon.green  { background: #f0fdf4; }
        .stat-icon.purple { background: #faf5ff; }
        .stat-num   { font-size: 26px; font-weight: 800; color: #0f172a; line-height: 1; }
        .stat-label { font-size: 12px; color: #64748b; margin-top: 3px; font-weight: 500; }

        /* Toast */
        .toast { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-radius: 12px; margin-bottom: 18px; font-size: 13px; font-weight: 600; animation: slideIn .25s ease; }
        .toast.success { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
        .toast.error   { background: #fff1f2; color: #be123c; border: 1px solid #fecdd3; }
        @keyframes slideIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }

        /* Form card */
        .form-card { background: white; border-radius: 16px; padding: 20px 22px; margin-bottom: 18px; box-shadow: 0 1px 3px rgba(0,0,0,.06), 0 4px 12px rgba(0,0,0,.04); }
        .form-card h4 { margin: 0 0 14px; font-size: 13px; font-weight: 700; color: #1e3a5f; text-transform: uppercase; letter-spacing: .5px; }
        .form-row { display: flex; gap: 10px; }

        /* Inputs */
        .inp { padding: 9px 13px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 13px; outline: none; transition: border .2s, box-shadow .2s; font-family: inherit; }
        .inp:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.12); }

        /* Search */
        .search-bar { position: relative; margin-bottom: 16px; }
        .search-bar .inp { width: 100%; padding-left: 38px; }
        .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 15px; pointer-events: none; }

        /* Table */
        .table-card { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.06), 0 4px 12px rgba(0,0,0,.04); }
        table { width: 100%; border-collapse: collapse; }
        thead tr { background: #f8fafc; }
        th { padding: 11px 16px; font-size: 11px; font-weight: 700; color: #94a3b8; text-align: left; text-transform: uppercase; letter-spacing: .6px; border-bottom: 1px solid #f1f5f9; }
        td { padding: 12px 16px; font-size: 13px; color: #334155; vertical-align: middle; }
        .kec-row { border-bottom: 1px solid #f1f5f9; transition: background .15s; }
        .kec-row:hover { background: #fafbfc; }
        .kec-name { font-weight: 700; color: #0f172a; font-size: 14px; }

        /* Badges */
        .badge-count { display: inline-flex; align-items: center; justify-content: center; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; }
        .badge-blue   { background: #eff6ff; color: #2563eb; }
        .badge-purple { background: #faf5ff; color: #7c3aed; }
        .badge-green  { background: #f0fdf4; color: #15803d; }

        /* Buttons */
        .btn { padding: 6px 14px; border-radius: 8px; border: none; cursor: pointer; font-size: 12px; font-weight: 600; transition: filter .15s, transform .1s; font-family: inherit; }
        .btn:hover { filter: brightness(.94); }
        .btn:active { transform: scale(.97); }
        .btn-primary { background: #1e3a5f; color: white; padding: 9px 18px; font-size: 13px; border-radius: 10px; }
        .btn-view    { background: #eff6ff; color: #2563eb; }
        .btn-add-kel { background: #f0fdf4; color: #15803d; }
        .btn-add-sls { background: #faf5ff; color: #7c3aed; }
        .btn-edit    { background: #fef9c3; color: #a16207; }
        .btn-delete  { background: #fff1f2; color: #be123c; }
        .btn-save    { background: #1e3a5f; color: white; }
        .btn-cancel  { background: #f1f5f9; color: #64748b; }

        /* Actions */
        .actions { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }

        /* Expand kecamatan panel */
        .expand-kec-panel { background: #f8fafc; padding: 0; border-bottom: 1px solid #f1f5f9; }

        /* Kelurahan list in expand panel */
        .kel-block { border-bottom: 1px solid #edf2f7; }
        .kel-block:last-child { border-bottom: none; }

        /* Kelurahan header row */
        .kel-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 12px 20px; background: #f8fafc;
          cursor: default;
        }
        .kel-header-left { display: flex; align-items: center; gap: 10px; }
        .kel-dot { width: 7px; height: 7px; border-radius: 50%; background: #94a3b8; flex-shrink: 0; }
        .kel-name-text { font-size: 13px; font-weight: 600; color: #1e3a5f; }

        /* Inline edit */
        .inline-edit { display: flex; gap: 6px; align-items: center; flex: 1; }
        .inline-edit .inp { flex: 1; padding: 6px 10px; font-size: 12px; }

        /* SLS panel */
        .sls-panel { background: white; margin: 0 20px 12px 36px; border-radius: 10px; border: 1px solid #e2e8f0; overflow: hidden; }
        .sls-header-row { display: flex; align-items: center; padding: 7px 14px; background: #f8fafc; border-bottom: 1px solid #f1f5f9; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: .5px; }
        .sls-item { display: flex; align-items: center; padding: 9px 14px; border-bottom: 1px solid #f9fafb; font-size: 13px; color: #334155; }
        .sls-item:last-child { border-bottom: none; }
        .sls-kode   { font-weight: 700; color: #1e3a5f; flex: 0 0 130px; }
        .sls-target { flex: 0 0 90px; }
        .sls-kel    { flex: 1; color: #64748b; }
        .sls-kec    { flex: 1; color: #64748b; }
        .sls-aksi   { flex: 0 0 120px; display: flex; gap: 6px; justify-content: flex-end; }

        /* Add SLS row */
        .add-sls-row { padding: 10px 14px; display: flex; gap: 8px; align-items: center; background: #fffbeb; border-top: 1px dashed #fde68a; flex-wrap: wrap; }
        .add-sls-row .inp { font-size: 12px; padding: 6px 10px; }

        /* Add kel form */
        .add-kel-form { display: flex; gap: 8px; margin: 12px 20px; }
        .add-kel-form .inp { flex: 1; font-size: 12px; padding: 7px 11px; }

        /* Edit kecamatan */
        .edit-kec-wrap { display: flex; gap: 8px; align-items: center; }
        .edit-kec-wrap .inp { font-size: 14px; font-weight: 700; flex: 1; }

        /* Empty */
        .empty-cell { text-align: center; padding: 44px; color: #cbd5e1; font-size: 13px; }
        .sls-empty { padding: 10px 14px; color: #94a3b8; font-size: 12px; font-style: italic; }
      `}</style>

      <div className="kelola-wrap">

        {/* Stat Cards */}
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
          <div className="stat-card">
            <div className="stat-icon purple">📋</div>
            <div>
              <div className="stat-num">{totalSls}</div>
              <div className="stat-label">Total Kode SLS</div>
            </div>
          </div>
        </div>

        {/* Toast */}
        {pesan.text && (
          <div className={`toast ${pesan.type}`}>
            {pesan.type === 'success' ? '✅' : '❌'} {pesan.text}
          </div>
        )}

        {/* Form Tambah Kecamatan */}
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

        {/* Search */}
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

        {/* Table */}
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
                <tr><td colSpan="3" className="empty-cell">Memuat data...</td></tr>
              ) : filteredKecamatan.length === 0 ? (
                <tr><td colSpan="3" className="empty-cell">Tidak ada data kecamatan</td></tr>
              ) : (
                filteredKecamatan.map((kecamatan) => {
                  const kelMap = grouped[kecamatan] || {};
                  const kelurahanList = Object.values(kelMap);
                  const isExpanded = expanded[kecamatan];
                  const isEditingKec = editingKecamatan === kecamatan;

                  // Total target seluruh SLS di kecamatan ini
                  const totalTargetKec = kelurahanList.reduce(
                    (sum, kel) =>
                      sum +
                      kel.items.reduce(
                        (subtotal, item) => subtotal + Number(item.target || 0),
                        0
                      ),
                    0
                  );

                  return (
                    <React.Fragment key={kecamatan}>
                      {/* Row Kecamatan */}
                      <tr className="kec-row">
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

                        <td>
                          <span className="badge-count badge-blue">{kelurahanList.length} Kelurahan</span>
                          &nbsp;
                          <span className="badge-count badge-purple">
                            {kelurahanList.reduce((s, k) => s + k.items.filter(i => i.kode_sls).length, 0)} SLS
                          </span>
                          &nbsp;
                          <span className="badge-count badge-green">
                            {totalTargetKec} Target
                          </span>
                        </td>

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

                      {/* Expanded Panel Kecamatan */}
                      {isExpanded && (
                        <tr>
                          <td colSpan="3" style={{ padding: 0 }}>
                            <div className="expand-kec-panel">

                              {/* Form Tambah Kelurahan */}
                              {addingKelurahan === kecamatan && (
                                <div className="add-kel-form">
                                  <input
                                    autoFocus
                                    className="inp"
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

                              {/* Daftar Kelurahan */}
                              {kelurahanList.length === 0 ? (
                                <div style={{ padding: '14px 20px', color: '#94a3b8', fontSize: 13 }}>
                                  Belum ada kelurahan. Klik <strong>+ Kelurahan</strong> untuk menambah.
                                </div>
                              ) : (
                                kelurahanList.map((kelData) => {
                                  const kelKey = `${kecamatan}__${kelData.kelurahan}`;
                                  const isKelExpanded = expandedKelurahan[kelKey];
                                  const isEditKel = editingKelurahan === kelKey;
                                  const slsItems = kelData.items.filter((i) => i.kode_sls && i.kode_sls.trim() !== '');
                                  const isAddingSls = addingSlsFor === kelKey;

                                  // Total target kelurahan ini
                                  const totalTargetKel = slsItems.reduce(
                                    (sum, item) => sum + Number(item.target || 0),
                                    0
                                  );

                                  return (
                                    <div key={kelKey} className="kel-block">
                                      {/* Header Kelurahan */}
                                      <div className="kel-header">
                                        <div className="kel-header-left">
                                          <span className="kel-dot" />
                                          {isEditKel ? (
                                            <div className="inline-edit">
                                              <input
                                                autoFocus
                                                className="inp"
                                                value={editNamaKelurahan}
                                                onChange={(e) => setEditNamaKelurahan(e.target.value)}
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter') handleEditKelurahan(kecamatan, kelData.kelurahan);
                                                  if (e.key === 'Escape') setEditingKelurahan(null);
                                                }}
                                              />
                                              <button className="btn btn-save" onClick={() => handleEditKelurahan(kecamatan, kelData.kelurahan)}>Simpan</button>
                                              <button className="btn btn-cancel" onClick={() => setEditingKelurahan(null)}>Batal</button>
                                            </div>
                                          ) : (
                                            <>
                                              <span className="kel-name-text">{kelData.kelurahan}</span>
                                              <span className="badge-count badge-purple" style={{ fontSize: 11 }}>
                                                {slsItems.length} SLS
                                              </span>
                                              <span className="badge-count badge-green" style={{ fontSize: 11 }}>
                                                {totalTargetKel} Target
                                              </span>
                                            </>
                                          )}
                                        </div>

                                        {!isEditKel && (
                                          <div className="actions">
                                            <button
                                              className="btn btn-view"
                                              style={{ fontSize: 11, padding: '4px 10px' }}
                                              onClick={() =>
                                                setExpandedKelurahan((prev) => ({
                                                  ...prev,
                                                  [kelKey]: !prev[kelKey]
                                                }))
                                              }
                                            >
                                              {isKelExpanded ? '▲ SLS' : '▼ SLS'}
                                            </button>
                                            <button
                                              className="btn btn-add-sls"
                                              style={{ fontSize: 11, padding: '4px 10px' }}
                                              onClick={() => {
                                                setAddingSlsFor(kelKey);
                                                setExpandedKelurahan((prev) => ({ ...prev, [kelKey]: true }));
                                                setKodeSls('');
                                                setTargetSls('');
                                              }}
                                            >
                                              + Kode SLS
                                            </button>
                                            <button
                                              className="btn btn-edit"
                                              style={{ fontSize: 11, padding: '4px 10px' }}
                                              onClick={() => {
                                                setEditingKelurahan(kelKey);
                                                setEditNamaKelurahan(kelData.kelurahan);
                                              }}
                                            >
                                              ✏️
                                            </button>
                                            <button
                                              className="btn btn-delete"
                                              style={{ fontSize: 11, padding: '4px 10px' }}
                                              onClick={() => handleDeleteKelurahan(kecamatan, kelData.kelurahan)}
                                            >
                                              🗑
                                            </button>
                                          </div>
                                        )}
                                      </div>

                                      {/* SLS Panel */}
                                      {isKelExpanded && (
                                        <div className="sls-panel">
                                          {/* Header kolom SLS */}
                                          <div className="sls-header-row">
                                            <span className="sls-kode">Kode SLS</span>
                                            <span className="sls-target">Target</span>
                                            <span className="sls-kel">Kelurahan</span>
                                            <span className="sls-kec">Kecamatan</span>
                                            <span className="sls-aksi">Aksi</span>
                                          </div>

                                          {/* List SLS */}
                                          {slsItems.length === 0 ? (
                                            <div className="sls-empty">Belum ada kode SLS.</div>
                                          ) : (
                                            slsItems.map((item) => {
                                              const isEditSls = editingSls === item.id;
                                              return (
                                                <div key={item.id} className="sls-item">
                                                  {isEditSls ? (
                                                    <>
                                                      <input
                                                        autoFocus
                                                        className="inp"
                                                        style={{ flex: 1, fontSize: 12, padding: '5px 9px', marginRight: 8 }}
                                                        value={editKodeSls}
                                                        onChange={(e) => setEditKodeSls(e.target.value)}
                                                        onKeyDown={(e) => {
                                                          if (e.key === 'Enter') handleEditSls(item);
                                                          if (e.key === 'Escape') setEditingSls(null);
                                                        }}
                                                      />
                                                      <input
                                                        className="inp"
                                                        type="number"
                                                        min="0"
                                                        placeholder="Target"
                                                        style={{ width: 90, fontSize: 12, padding: '5px 9px', marginRight: 8 }}
                                                        value={editTargetSls}
                                                        onChange={(e) => setEditTargetSls(e.target.value)}
                                                        onKeyDown={(e) => {
                                                          if (e.key === 'Enter') handleEditSls(item);
                                                          if (e.key === 'Escape') setEditingSls(null);
                                                        }}
                                                      />
                                                      <button className="btn btn-save" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => handleEditSls(item)}>Simpan</button>
                                                      <button className="btn btn-cancel" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => { setEditingSls(null); setEditKodeSls(''); setEditTargetSls(''); }}>Batal</button>
                                                    </>
                                                  ) : (
                                                    <>
                                                      <span className="sls-kode">{item.kode_sls}</span>
                                                      <span className="sls-target" style={{ fontWeight: 700, color: '#7c3aed' }}>
                                                        {Number(item.target || 0)}
                                                      </span>
                                                      <span className="sls-kel">{item.kelurahan}</span>
                                                      <span className="sls-kec">{item.kecamatan}</span>
                                                      <span className="sls-aksi">
                                                        <button
                                                          className="btn btn-edit"
                                                          style={{ fontSize: 11, padding: '4px 9px' }}
                                                          onClick={() => {
                                                            setEditingSls(item.id);
                                                            setEditKodeSls(item.kode_sls);
                                                            setEditTargetSls(String(item.target || 0));
                                                          }}
                                                        >✏️</button>
                                                        <button
                                                          className="btn btn-delete"
                                                          style={{ fontSize: 11, padding: '4px 9px' }}
                                                          onClick={() => handleDeleteSls(item)}
                                                        >🗑</button>
                                                      </span>
                                                    </>
                                                  )}
                                                </div>
                                              );
                                            })
                                          )}

                                          {/* Form Tambah SLS */}
                                          {isAddingSls ? (
                                            <div className="add-sls-row">
                                              <input
                                                autoFocus
                                                className="inp"
                                                style={{ flex: 1, minWidth: 140 }}
                                                placeholder="Kode SLS baru (contoh: 001, 002A...)"
                                                value={kodeSls}
                                                onChange={(e) => setKodeSls(e.target.value)}
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter') handleTambahSls(kecamatan, kelData.kelurahan);
                                                  if (e.key === 'Escape') setAddingSlsFor(null);
                                                }}
                                              />
                                              <input
                                                className="inp"
                                                type="number"
                                                min="0"
                                                placeholder="Target"
                                                value={targetSls}
                                                onChange={(e) => setTargetSls(e.target.value)}
                                                style={{ width: 120 }}
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter') handleTambahSls(kecamatan, kelData.kelurahan);
                                                  if (e.key === 'Escape') setAddingSlsFor(null);
                                                }}
                                              />
                                              <button
                                                className="btn btn-save"
                                                style={{ fontSize: 12 }}
                                                onClick={() => handleTambahSls(kecamatan, kelData.kelurahan)}
                                              >
                                                Simpan
                                              </button>
                                              <button
                                                className="btn btn-cancel"
                                                style={{ fontSize: 12 }}
                                                onClick={() => { setAddingSlsFor(null); setKodeSls(''); setTargetSls(''); }}
                                              >
                                                Batal
                                              </button>
                                            </div>
                                          ) : (
                                            <div style={{ padding: '8px 14px' }}>
                                              <button
                                                className="btn btn-add-sls"
                                                style={{ fontSize: 11, padding: '5px 12px', border: '1.5px dashed #7c3aed' }}
                                                onClick={() => {
                                                  setAddingSlsFor(kelKey);
                                                  setKodeSls('');
                                                  setTargetSls('');
                                                }}
                                              >
                                                + Tambah Kode SLS
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })
                              )}
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