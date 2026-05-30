import React, { useEffect, useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import api from '../services/api';

/* ─── Global CSS — design system dari KelolaPetugas ──────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --navy:      #0f2545;
    --navy-mid:  #1a3a6b;
    --navy-lt:   #2d5ba0;
    --accent:    #3b7cf4;
    --accent-lt: #eef3fe;
    --red:       #e53935;
    --red-lt:    #fff0f0;
    --green:     #1a9955;
    --green-lt:  #edfbf4;
    --amber:     #d97706;
    --amber-lt:  #fffbeb;
    --purple:    #6366f1;
    --purple-lt: #eef2ff;
    --slate:     #64748b;
    --line:      #e8edf4;
    --bg:        #f4f7fb;
    --white:     #ffffff;
    --radius:    10px;
    --shadow:    0 2px 12px rgba(15,37,69,.08);
    --shadow-md: 0 4px 24px rgba(15,37,69,.12);
    --font:      'Plus Jakarta Sans', sans-serif;
    --mono:      'JetBrains Mono', monospace;
    --trans:     all .18s ease;
  }

  .wr-root { font-family: var(--font); background: var(--bg); min-height: 100vh; color: #1e293b; padding: 1.5rem; }

  /* ── Stats ── */
  .wr-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 24px; }
  .wr-stat-card {
    background: var(--white); border-radius: var(--radius); padding: 18px 20px;
    box-shadow: var(--shadow); display: flex; align-items: center; gap: 14px;
    position: relative; overflow: hidden;
  }
  .wr-stat-card::after {
    content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%;
    background: var(--accent); border-radius: var(--radius) 0 0 var(--radius);
  }
  .wr-stat-card.teal::after   { background: var(--green); }
  .wr-stat-card.purple::after { background: var(--purple); }
  .wr-stat-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
  .wr-stat-num  { font-size: 26px; font-weight: 800; color: var(--navy); line-height: 1; }
  .wr-stat-lbl  { font-size: 11px; font-weight: 600; color: var(--slate); text-transform: uppercase; letter-spacing: .06em; margin-top: 3px; }

  /* ── Alert ── */
  .wr-alert { padding: 11px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; animation: slideIn .18s ease; }
  .wr-alert.success { background: var(--green-lt); color: var(--green); border: 1px solid #a7f3c5; }
  .wr-alert.error   { background: var(--red-lt);   color: var(--red);   border: 1px solid #fca5a5; }
  @keyframes slideIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }

  /* ── Toolbar ── */
  .wr-toolbar { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; }
  .wr-spacer  { flex: 1; }
  .wr-btn-group { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

  /* ── Search ── */
  .wr-search { position: relative; }
  .wr-search input { padding: 8px 12px 8px 34px; border: 1px solid var(--line); border-radius: 8px; font-size: 13px; font-family: var(--font); background: var(--white); color: #1e293b; outline: none; width: 220px; transition: var(--trans); }
  .wr-search input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(59,124,244,.12); }
  .wr-search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--slate); font-size: 14px; pointer-events: none; }

  /* ── Import result ── */
  .wr-import-result { background: var(--amber-lt); border: 1px solid #fcd34d; border-radius: 8px; padding: 14px 16px; margin-bottom: 16px; }
  .wr-import-title  { font-size: 13px; font-weight: 700; color: var(--amber); margin-bottom: 8px; }
  .wr-import-scroll { max-height: 130px; overflow-y: auto; }
  .wr-import-row    { font-size: 12px; color: #78350f; margin-bottom: 3px; }
  .wr-import-close  { margin-top: 8px; font-size: 12px; color: var(--amber); background: none; border: none; cursor: pointer; font-family: var(--font); text-decoration: underline; padding: 0; }

  /* ── Del bar ── */
  .wr-del-bar { display: flex; align-items: center; gap: 10px; padding: 11px 16px; background: var(--red-lt); border: 1px solid #fca5a5; border-radius: 8px; margin-bottom: 16px; font-size: 13px; color: var(--red); font-weight: 600; }
  .wr-del-bar .spacer { flex: 1; }

  /* ── Form card (tambah kecamatan) ── */
  .wr-form-card { background: var(--white); border-radius: 12px; padding: 20px 22px; margin-bottom: 16px; box-shadow: var(--shadow); border: 1px solid var(--line); }
  .wr-form-title { font-size: 13px; font-weight: 800; color: var(--navy); margin-bottom: 12px; display: flex; align-items: center; gap: 7px; }
  .wr-form-row   { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

  /* ── Buttons ── */
  .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; font-family: var(--font); cursor: pointer; border: none; transition: var(--trans); white-space: nowrap; }
  .btn:disabled { opacity: .5; cursor: not-allowed; }
  .btn-primary { background: var(--navy); color: #fff; }
  .btn-primary:hover:not(:disabled) { background: var(--navy-mid); }
  .btn-danger  { background: var(--red-lt); color: var(--red); border: 1px solid #fca5a5; }
  .btn-danger:hover:not(:disabled) { background: #ffe4e4; }
  .btn-success { background: var(--green-lt); color: var(--green); border: 1px solid #86efac; }
  .btn-success:hover:not(:disabled) { background: #d1fae5; }
  .btn-ghost   { background: var(--white); color: var(--slate); border: 1px solid var(--line); }
  .btn-ghost:hover:not(:disabled) { background: var(--bg); }
  .btn-edit    { background: var(--purple-lt); color: var(--purple); }
  .btn-edit:hover { background: #e0e7ff; }
  .btn-dashed  { background: transparent; color: var(--navy); border: 1.5px dashed var(--navy-lt); border-radius: 8px; padding: 7px 16px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: var(--font); transition: var(--trans); margin-top: 10px; }
  .btn-dashed:hover { background: var(--accent-lt); }
  .btn-sm  { padding: 5px 11px; font-size: 12px; border-radius: 6px; }
  .btn-xs  { padding: 4px 9px;  font-size: 11px; border-radius: 5px; }
  .btn-icon { padding: 5px 8px; }

  /* ── Input ── */
  .wr-inp { padding: 9px 12px; border: 1.5px solid var(--line); border-radius: 8px; font-size: 13px; font-family: var(--font); color: #1e293b; background: var(--white); outline: none; transition: var(--trans); }
  .wr-inp:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(59,124,244,.1); }
  .wr-inp::placeholder { color: #94a3b8; }

  /* ── Checkbox ── */
  .wr-check { cursor: pointer; accent-color: var(--navy); width: 15px; height: 15px; flex-shrink: 0; }

  /* ── Badges ── */
  .badge { display: inline-flex; align-items: center; gap: 3px; padding: 3px 9px; border-radius: 20px; font-size: 10.5px; font-weight: 800; letter-spacing: .03em; }
  .badge-blue   { background: var(--accent-lt); color: var(--accent); }
  .badge-teal   { background: var(--green-lt);  color: var(--green); }
  .badge-purple { background: var(--purple-lt); color: var(--purple); }
  .badge-amber  { background: var(--amber-lt);  color: var(--amber); }

  /* ── Table card ── */
  .wr-table-card { background: var(--white); border-radius: 12px; overflow: hidden; box-shadow: var(--shadow); border: 1px solid var(--line); }

  /* ── Kecamatan row ── */
  .wr-kec-wrap { border-bottom: 1px solid var(--line); }
  .wr-kec-wrap:last-child { border-bottom: none; }

  .wr-kec-row {
    display: grid; grid-template-columns: 42px 1fr auto auto;
    align-items: center; padding: 13px 18px; gap: 12px;
    transition: background .12s;
  }
  .wr-kec-row:hover { background: #f9fbff; }

  .wr-kec-left    { display: flex; align-items: center; gap: 10px; }
  .wr-kec-icon    { font-size: 18px; }
  .wr-kec-name    { font-size: 14px; font-weight: 800; color: var(--navy); }
  .wr-kec-badges  { display: flex; gap: 6px; flex-wrap: wrap; }
  .wr-kec-actions { display: flex; gap: 5px; align-items: center; }

  /* ── Inline edit ── */
  .wr-inline-edit { display: flex; gap: 6px; align-items: center; }
  .wr-inline-edit .wr-inp { flex: 1; }

  /* ── Expand panel ── */
  .wr-expand-panel { background: #f9fbff; border-top: 1px solid var(--line); }

  /* ── Add kelurahan bar ── */
  .wr-add-kel { display: flex; gap: 8px; padding: 12px 18px 12px 42px; background: var(--green-lt); border-bottom: 1px solid #bbf7d0; align-items: center; }
  .wr-add-kel .wr-inp { flex: 1; font-size: 13px; }

  /* ── Kelurahan block ── */
  .wr-kel-block { border-bottom: 1px solid var(--line); }
  .wr-kel-block:last-child { border-bottom: none; }

  .wr-kel-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 18px 10px 40px; background: var(--white);
    transition: background .12s; cursor: pointer;
  }
  .wr-kel-header:hover { background: var(--accent-lt); }

  .wr-kel-left    { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1; }
  .wr-kel-dot     { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); flex-shrink: 0; }
  .wr-kel-name    { font-size: 13px; font-weight: 700; color: #1e293b; }
  .wr-kel-actions { display: flex; gap: 5px; align-items: center; flex-shrink: 0; }

  /* ── SLS panel ── */
  .wr-sls-panel {
    margin: 0 18px 12px 52px; border-radius: 10px; overflow: hidden;
    border: 1px solid var(--line); background: var(--white);
    box-shadow: 0 1px 5px rgba(15,37,69,.05);
  }

  .wr-sls-thead { display: grid; grid-template-columns: 110px 70px 1fr 1fr 90px; padding: 8px 14px; background: #f8fafc; border-bottom: 1px solid var(--line); }
  .wr-sls-th    { font-size: 10px; font-weight: 800; color: var(--slate); text-transform: uppercase; letter-spacing: .05em; }

  .wr-sls-row {
    display: grid; grid-template-columns: 110px 70px 1fr 1fr 90px;
    padding: 10px 14px; border-bottom: 1px solid var(--line);
    align-items: center; transition: background .1s;
  }
  .wr-sls-row:last-of-type { border-bottom: none; }
  .wr-sls-row:hover { background: #f9fbff; }

  .wr-sls-edit-row {
    display: flex; align-items: center; gap: 8px; padding: 10px 14px;
    background: var(--amber-lt); border-bottom: 1px solid #fcd34d; flex-wrap: wrap;
  }

  .col-kode   { font-family: var(--mono); font-size: 12px; font-weight: 700; color: var(--accent); }
  .col-target { font-family: var(--mono); font-size: 12px; font-weight: 700; color: var(--purple); }
  .col-sub    { font-size: 12px; color: var(--slate); }
  .col-act    { display: flex; gap: 5px; justify-content: flex-end; align-items: center; }

  .wr-sls-empty { padding: 16px 14px; font-size: 13px; color: var(--slate); font-style: italic; text-align: center; }

  /* ── Add SLS ── */
  .wr-add-sls { display: flex; gap: 8px; padding: 10px 14px; background: var(--accent-lt); border-top: 1px solid #c7d7fc; align-items: center; flex-wrap: wrap; }
  .wr-add-sls .wr-inp { font-size: 12px; }
  .wr-add-sls-trigger { padding: 10px 14px; background: #f8fafc; border-top: 1px dashed #d1d5db; }

  /* ── Empty ── */
  .wr-no-kel { padding: 16px 18px 16px 42px; font-size: 13px; color: var(--slate); font-style: italic; }
  .wr-empty  { text-align: center; padding: 48px; color: var(--slate); font-size: 13px; }

  /* ── Chevron ── */
  .wr-chevron { display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 4px; font-size: 8px; flex-shrink: 0; transition: var(--trans); }
  .wr-chevron.open   { background: var(--navy); color: #fff; }
  .wr-chevron.closed { background: var(--line); color: var(--slate); }

  /* ── Skeleton ── */
  .wr-skeleton { height: 52px; background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: wrSkel 1.2s infinite; border-radius: var(--radius); margin-bottom: 8px; }
  @keyframes wrSkel { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

  /* ── Scrollbar ── */
  .wr-root ::-webkit-scrollbar { width: 5px; height: 5px; }
  .wr-root ::-webkit-scrollbar-track { background: var(--bg); }
  .wr-root ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
`;

function InjectStyle() {
  useEffect(() => {
    const id = 'wr-root-styles';
    if (!document.getElementById(id)) {
      const el = document.createElement('style');
      el.id = id;
      el.textContent = GLOBAL_CSS;
      document.head.appendChild(el);
    }
  }, []);
  return null;
}

/* ═══════════════════════════════════════════════════════════════════ */
const KelolaResponden = () => {
  const [wilayah, setWilayah]                 = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [kecamatanBaru, setKecamatanBaru]     = useState('');
  const [expanded, setExpanded]               = useState({});
  const [expandedKel, setExpandedKel]         = useState({});
  const [addingKel, setAddingKel]             = useState(null);
  const [namaKelurahan, setNamaKelurahan]     = useState('');
  const [addingSls, setAddingSls]             = useState(null);
  const [kodeSls, setKodeSls]                 = useState('');
  const [targetSls, setTargetSls]             = useState('');
  const [search, setSearch]                   = useState('');
  const [pesan, setPesan]                     = useState({ text: '', type: '' });

  const [editingKec, setEditingKec]           = useState(null);
  const [editNamaKec, setEditNamaKec]         = useState('');
  const [editingKel, setEditingKel]           = useState(null);
  const [editNamaKel, setEditNamaKel]         = useState('');
  const [editingSls, setEditingSls]           = useState(null);
  const [editKodeSls, setEditKodeSls]         = useState('');
  const [editTargetSls, setEditTargetSls]     = useState('');

  const [selectedIds, setSelectedIds]         = useState({});
  const [importLoading, setImportLoading]     = useState(false);
  const [importResult, setImportResult]       = useState(null);
  const fileInputRef                          = useRef(null);

  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    if (!pesan.text) return;
    const t = setTimeout(() => setPesan({ text: '', type: '' }), 4000);
    return () => clearTimeout(t);
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

  /* ── Grouping ── */
  const grouped = wilayah.reduce((acc, item) => {
    if (!acc[item.kecamatan]) acc[item.kecamatan] = {};
    if (!item.kelurahan?.trim()) return acc;
    if (!acc[item.kecamatan][item.kelurahan])
      acc[item.kecamatan][item.kelurahan] = { kelurahan: item.kelurahan, kecamatan: item.kecamatan, items: [] };
    acc[item.kecamatan][item.kelurahan].items.push(item);
    return acc;
  }, {});
  wilayah.forEach((item) => { if (!grouped[item.kecamatan]) grouped[item.kecamatan] = {}; });

  const filteredKec = Object.keys(grouped).filter((k) =>
    k.toLowerCase().includes(search.toLowerCase())
  );

  /* ── Helpers ── */
  const showPesan = (text, type) => setPesan({ text, type });
  const getIdsInKec = (kec) => wilayah.filter((w) => w.kecamatan === kec).map((w) => w.id);

  /* ── Selection ── */
  const toggleSelectKec = (kec) => {
    const ids = getIdsInKec(kec);
    setSelectedIds((prev) => {
      const cur = prev[kec] || new Set();
      const allSelected = ids.every((id) => cur.has(id));
      return { ...prev, [kec]: allSelected ? new Set() : new Set(ids) };
    });
  };
  const toggleSelectSls = (kec, id) =>
    setSelectedIds((prev) => {
      const cur = new Set(prev[kec] || []);
      cur.has(id) ? cur.delete(id) : cur.add(id);
      return { ...prev, [kec]: cur };
    });
  const getSelectedCount = () => Object.values(selectedIds).reduce((s, x) => s + x.size, 0);
  const getAllSelectedIds = () => Object.values(selectedIds).flatMap((s) => [...s]);
  const clearSelection = () => setSelectedIds({});

  const allFiltered = filteredKec.flatMap(getIdsInKec);
  const allChecked  = allFiltered.length > 0 && allFiltered.every((id) => Object.values(selectedIds).some((s) => s.has(id)));
  const someChecked = allFiltered.some((id) => Object.values(selectedIds).some((s) => s.has(id)));

  const toggleAll = (checked) => {
    if (checked) {
      const next = {};
      filteredKec.forEach((kec) => { next[kec] = new Set(getIdsInKec(kec)); });
      setSelectedIds(next);
    } else {
      clearSelection();
    }
  };

  /* ── CRUD: Kecamatan ── */
  const handleTambahKec = async (e) => {
    e.preventDefault();
    if (!kecamatanBaru.trim()) return;
    try {
      await api.post('/admin/wilayah', { kecamatan: kecamatanBaru, kelurahan: '' });
      showPesan('✅ Kecamatan berhasil ditambahkan!', 'success');
      setKecamatanBaru('');
      fetchData();
    } catch (err) {
      showPesan('❌ ' + (err.response?.data?.message || 'Gagal tambah kecamatan'), 'error');
    }
  };

  const handleEditKec = async (old) => {
    if (!editNamaKec.trim() || editNamaKec === old) { setEditingKec(null); return; }
    try {
      for (const item of wilayah.filter((w) => w.kecamatan === old)) {
        await api.put(`/admin/wilayah/${item.id}`, {
          kecamatan: editNamaKec, kelurahan: item.kelurahan,
          kode_sls: item.kode_sls || null, target: Number(item.target || 0),
        });
      }
      showPesan('✅ Kecamatan berhasil diperbarui!', 'success');
      setEditingKec(null); setEditNamaKec('');
      fetchData();
    } catch (err) {
      showPesan('❌ ' + (err.response?.data?.message || 'Gagal edit kecamatan'), 'error');
    }
  };

  const handleDeleteKec = async (kec) => {
    const count = wilayah.filter((w) => w.kecamatan === kec).length;
    if (!window.confirm(`Hapus kecamatan "${kec}"${count ? ` beserta ${count} data di dalamnya` : ''}? Tidak bisa dibatalkan.`)) return;
    try {
      const ids = getIdsInKec(kec);
      if (ids.length) await api.delete('/admin/wilayah/bulk', { data: { ids } });
      showPesan('✅ Kecamatan berhasil dihapus!', 'success');
      fetchData();
    } catch (err) {
      showPesan('❌ ' + (err.response?.data?.message || 'Gagal hapus kecamatan'), 'error');
    }
  };

  /* ── CRUD: Kelurahan ── */
  const handleTambahKel = async (kec) => {
    if (!namaKelurahan.trim()) return;
    try {
      await api.post('/admin/wilayah', { kecamatan: kec, kelurahan: namaKelurahan, kode_sls: null });
      showPesan('✅ Kelurahan berhasil ditambahkan!', 'success');
      setNamaKelurahan(''); setAddingKel(null);
      fetchData();
    } catch (err) {
      showPesan('❌ ' + (err.response?.data?.message || 'Gagal tambah kelurahan'), 'error');
    }
  };

  const handleEditKel = async (kec, old) => {
    if (!editNamaKel.trim() || editNamaKel === old) { setEditingKel(null); return; }
    try {
      for (const item of wilayah.filter((w) => w.kecamatan === kec && w.kelurahan === old)) {
        await api.put(`/admin/wilayah/${item.id}`, {
          kecamatan: item.kecamatan, kelurahan: editNamaKel,
          kode_sls: item.kode_sls || null, target: Number(item.target || 0),
        });
      }
      showPesan('✅ Kelurahan berhasil diperbarui!', 'success');
      setEditingKel(null); setEditNamaKel('');
      fetchData();
    } catch (err) {
      showPesan('❌ ' + (err.response?.data?.message || 'Gagal edit kelurahan'), 'error');
    }
  };

  const handleDeleteKel = async (kec, kel) => {
    if (!window.confirm(`Hapus kelurahan "${kel}" beserta semua kode SLS-nya?`)) return;
    try {
      const ids = wilayah.filter((w) => w.kecamatan === kec && w.kelurahan === kel).map((w) => w.id);
      if (ids.length) await api.delete('/admin/wilayah/bulk', { data: { ids } });
      showPesan('✅ Kelurahan berhasil dihapus!', 'success');
      fetchData();
    } catch (err) {
      showPesan('❌ ' + (err.response?.data?.message || 'Gagal hapus kelurahan'), 'error');
    }
  };

  /* ── CRUD: SLS ── */
  const handleTambahSls = async (kec, kel) => {
    if (!kodeSls.trim()) return;
    try {
      await api.post('/admin/wilayah', {
        kecamatan: kec, kelurahan: kel,
        kode_sls: kodeSls.trim(), target: Number(targetSls || 0),
      });
      showPesan('✅ Kode SLS berhasil ditambahkan!', 'success');
      setKodeSls(''); setTargetSls(''); setAddingSls(null);
      fetchData();
    } catch (err) {
      showPesan('❌ ' + (err.response?.data?.message || 'Gagal tambah kode SLS'), 'error');
    }
  };

  const handleEditSls = async (item) => {
    if (!editKodeSls.trim()) { setEditingSls(null); return; }
    try {
      await api.put(`/admin/wilayah/${item.id}`, {
        kecamatan: item.kecamatan, kelurahan: item.kelurahan,
        kode_sls: editKodeSls.trim(), target: Number(editTargetSls || 0),
      });
      showPesan('✅ Kode SLS berhasil diperbarui!', 'success');
      setEditingSls(null); setEditKodeSls(''); setEditTargetSls('');
      fetchData();
    } catch (err) {
      showPesan('❌ ' + (err.response?.data?.message || 'Gagal edit kode SLS'), 'error');
    }
  };

  const handleDeleteSls = async (item) => {
    if (!window.confirm(`Hapus kode SLS "${item.kode_sls}"?`)) return;
    try {
      await api.delete(`/admin/wilayah/${item.id}`);
      showPesan('✅ Kode SLS berhasil dihapus!', 'success');
      fetchData();
    } catch (err) {
      showPesan('❌ ' + (err.response?.data?.message || 'Gagal hapus kode SLS'), 'error');
    }
  };

  /* ── Bulk delete ── */
  const handleDeleteBulk = async () => {
    const ids = getAllSelectedIds();
    if (!ids.length) return;
    if (!window.confirm(`Hapus ${ids.length} data? Tidak bisa dibatalkan.`)) return;
    try {
      await api.delete('/admin/wilayah/bulk', { data: { ids } });
      showPesan(`✅ ${ids.length} data berhasil dihapus!`, 'success');
      clearSelection();
      fetchData();
    } catch (err) {
      showPesan('❌ ' + (err.response?.data?.message || 'Gagal hapus bulk'), 'error');
    }
  };

  /* ── Import / Export ── */
  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportLoading(true); setImportResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/admin/wilayah/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setImportResult(res.data);
      showPesan(`✅ ${res.data.message}`, 'success');
      fetchData();
    } catch (err) {
      showPesan('❌ ' + (err.response?.data?.message || 'Gagal import Excel'), 'error');
    } finally {
      setImportLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownloadTemplate = () => {
    const data = [
      { kecamatan: 'Danurejan', kelurahan: 'Bausasran', kode_sls: '001A', target: 50 },
      { kecamatan: 'Gedongtengen', kelurahan: 'Pringgokusuman', kode_sls: '001B', target: 45 },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [{ wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 10 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Wilayah');
    XLSX.writeFile(wb, 'template_wilayah.xlsx');
  };

  /* ── Stats ── */
  const totalKec = Object.keys(grouped).length;
  const totalKel = Object.values(grouped).reduce((s, m) => s + Object.keys(m).length, 0);
  const totalSls = wilayah.filter((w) => w.kode_sls?.trim()).length;
  const selectedCount = getSelectedCount();

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="wr-root">
      <InjectStyle />

      {/* ── Stats ── */}
      <div className="wr-stats">
        {[
          { label: 'Total Kecamatan', val: totalKec, icon: '🏙️', cls: '',       bg: '#eef3fe' },
          { label: 'Total Kelurahan', val: totalKel, icon: '🏘️', cls: 'teal',   bg: '#edfbf4' },
          { label: 'Total Kode SLS',  val: totalSls, icon: '📋',  cls: 'purple', bg: '#eef2ff' },
        ].map((s) => (
          <div key={s.label} className={`wr-stat-card ${s.cls}`}>
            <div className="wr-stat-icon" style={{ background: s.bg }}>{s.icon}</div>
            <div>
              <div className="wr-stat-num">{s.val}</div>
              <div className="wr-stat-lbl">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Alert ── */}
      {pesan.text && <div className={`wr-alert ${pesan.type}`}>{pesan.text}</div>}

      {/* ── Del bar ── */}
      {selectedCount > 0 && (
        <div className="wr-del-bar">
          ☑ <span>{selectedCount} item terpilih</span>
          <span className="spacer" />
          <button className="btn btn-danger btn-sm" onClick={handleDeleteBulk}>
            🗑 Hapus {selectedCount} Terpilih
          </button>
          <button className="btn btn-ghost btn-sm" onClick={clearSelection}>✕ Batal</button>
        </div>
      )}

      {/* ── Import result ── */}
      {importResult?.gagal?.length > 0 && (
        <div className="wr-import-result">
          <div className="wr-import-title">
            ⚠️ {importResult.berhasil} berhasil · {importResult.dilewati} dilewati · {importResult.gagal.length} gagal
          </div>
          <div className="wr-import-scroll">
            {importResult.gagal.map((g, i) => (
              <div key={i} className="wr-import-row">· <strong>{g.baris}</strong>: {g.alasan}</div>
            ))}
          </div>
          <button className="wr-import-close" onClick={() => setImportResult(null)}>Tutup</button>
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="wr-toolbar">
        {/* Search */}
        <div className="wr-search">
          <span className="wr-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Cari kecamatan…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="wr-spacer" />

        {/* Buttons */}
        <div className="wr-btn-group">
          <input type="file" accept=".xlsx,.xls" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImportExcel} />
          <button className="btn btn-success" onClick={() => fileInputRef.current?.click()} disabled={importLoading}>
            {importLoading ? '⏳ Mengimpor…' : '📥 Import Excel'}
          </button>
          <button className="btn btn-ghost" onClick={handleDownloadTemplate}>📄 Template</button>
        </div>
      </div>

      {/* ── Form tambah kecamatan ── */}
      <div className="wr-form-card">
        <div className="wr-form-title">🏙️ Tambah Kecamatan Baru</div>
        <form onSubmit={handleTambahKec} className="wr-form-row">
          <input
            className="wr-inp"
            style={{ flex: 1, minWidth: 200 }}
            type="text"
            placeholder="Nama kecamatan baru…"
            value={kecamatanBaru}
            onChange={(e) => setKecamatanBaru(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary">+ Tambah Kecamatan</button>
        </form>
      </div>

      {/* ── Table ── */}
      <div className="wr-table-card">
        {/* Header row */}
        <div style={{
          display: 'grid', gridTemplateColumns: '42px 1fr auto auto',
          padding: '10px 18px', background: '#f8fafc',
          borderBottom: '1px solid var(--line)', gap: 12
        }}>
          <span>
            <input
              type="checkbox"
              className="wr-check"
              checked={allChecked}
              ref={(el) => { if (el) el.indeterminate = someChecked && !allChecked; }}
              onChange={(e) => toggleAll(e.target.checked)}
            />
          </span>
          <span style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
            Kecamatan
          </span>
          <span style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
            Ringkasan
          </span>
          <span style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
            Aksi
          </span>
        </div>

        {/* Body */}
        {loading ? (
          <div style={{ padding: 16 }}>
            {[1, 2, 3].map((i) => <div key={i} className="wr-skeleton" />)}
          </div>
        ) : filteredKec.length === 0 ? (
          <div className="wr-empty">Tidak ada data kecamatan</div>
        ) : (
          filteredKec.map((kec) => {
            const kelMap        = grouped[kec] || {};
            const kelList       = Object.values(kelMap);
            const isExp         = expanded[kec];
            const isEditKec     = editingKec === kec;
            const kecIds        = getIdsInKec(kec);
            const kecSel        = selectedIds[kec] || new Set();
            const kecAllChecked = kecIds.length > 0 && kecIds.every((id) => kecSel.has(id));
            const kecSomeSel    = kecIds.some((id) => kecSel.has(id));
            const totalTarget   = kelList.reduce((s, k) => s + k.items.reduce((ss, i) => ss + Number(i.target || 0), 0), 0);
            const totalSlsKec   = kelList.reduce((s, k) => s + k.items.filter((i) => i.kode_sls).length, 0);

            return (
              <div key={kec} className="wr-kec-wrap">
                {/* ── Kecamatan row ── */}
                <div className="wr-kec-row">
                  <span>
                    <input
                      type="checkbox"
                      className="wr-check"
                      checked={kecAllChecked}
                      ref={(el) => { if (el) el.indeterminate = kecSomeSel && !kecAllChecked; }}
                      onChange={() => toggleSelectKec(kec)}
                    />
                  </span>

                  <div className="wr-kec-left">
                    {isEditKec ? (
                      <div className="wr-inline-edit">
                        <input
                          autoFocus
                          className="wr-inp"
                          value={editNamaKec}
                          onChange={(e) => setEditNamaKec(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEditKec(kec);
                            if (e.key === 'Escape') setEditingKec(null);
                          }}
                        />
                        <button className="btn btn-primary btn-sm" onClick={() => handleEditKec(kec)}>💾 Simpan</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditingKec(null)}>Batal</button>
                      </div>
                    ) : (
                      <>
                        <span className="wr-kec-icon">🏙️</span>
                        <span className="wr-kec-name">{kec}</span>
                      </>
                    )}
                  </div>

                  <div className="wr-kec-badges">
                    <span className="badge badge-blue">{kelList.length} Kelurahan</span>
                    <span className="badge badge-purple">{totalSlsKec} SLS</span>
                    <span className="badge badge-amber">{totalTarget} Target</span>
                  </div>

                  <div className="wr-kec-actions">
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setExpanded((p) => ({ ...p, [kec]: !p[kec] }))}
                    >
                      <span className={`wr-chevron ${isExp ? 'open' : 'closed'}`}>{isExp ? '▲' : '▼'}</span>
                      {isExp ? 'Tutup' : 'Detail'}
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => { setAddingKel(kec); setExpanded((p) => ({ ...p, [kec]: true })); }}
                    >
                      + Kel.
                    </button>
                    <button
                      className="btn btn-edit btn-sm btn-icon"
                      title="Edit kecamatan"
                      onClick={() => { setEditingKec(kec); setEditNamaKec(kec); }}
                    >✏️</button>
                    <button
                      className="btn btn-danger btn-sm btn-icon"
                      title="Hapus kecamatan"
                      onClick={() => handleDeleteKec(kec)}
                    >🗑️</button>
                  </div>
                </div>

                {/* ── Expanded panel ── */}
                {isExp && (
                  <div className="wr-expand-panel">
                    {/* Form tambah kelurahan */}
                    {addingKel === kec && (
                      <div className="wr-add-kel">
                        <input
                          autoFocus
                          className="wr-inp"
                          placeholder="Nama kelurahan baru…"
                          value={namaKelurahan}
                          onChange={(e) => setNamaKelurahan(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleTambahKel(kec);
                            if (e.key === 'Escape') setAddingKel(null);
                          }}
                        />
                        <button className="btn btn-primary btn-sm" onClick={() => handleTambahKel(kec)}>💾 Simpan</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => { setAddingKel(null); setNamaKelurahan(''); }}>Batal</button>
                      </div>
                    )}

                    {kelList.length === 0 ? (
                      <div className="wr-no-kel">
                        Belum ada kelurahan. Klik <strong>+ Kel.</strong> untuk menambah.
                      </div>
                    ) : (
                      kelList.map((kelData) => {
                        const kelKey         = `${kec}__${kelData.kelurahan}`;
                        const isKelExp       = expandedKel[kelKey];
                        const isEditKel      = editingKel === kelKey;
                        const slsItems       = kelData.items.filter((i) => i.kode_sls?.trim());
                        const isAddingSls    = addingSls === kelKey;
                        const totalTargetKel = slsItems.reduce((s, i) => s + Number(i.target || 0), 0);

                        return (
                          <div key={kelKey} className="wr-kel-block">
                            {/* Kelurahan header */}
                            <div className="wr-kel-header" onClick={() => !isEditKel && setExpandedKel((p) => ({ ...p, [kelKey]: !p[kelKey] }))}>
                              <div className="wr-kel-left">
                                <span className="wr-kel-dot" />
                                {isEditKel ? (
                                  <div className="wr-inline-edit" style={{ flex: 1 }} onClick={(e) => e.stopPropagation()}>
                                    <input
                                      autoFocus
                                      className="wr-inp"
                                      value={editNamaKel}
                                      onChange={(e) => setEditNamaKel(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleEditKel(kec, kelData.kelurahan);
                                        if (e.key === 'Escape') setEditingKel(null);
                                      }}
                                    />
                                    <button className="btn btn-primary btn-xs" onClick={() => handleEditKel(kec, kelData.kelurahan)}>💾</button>
                                    <button className="btn btn-ghost btn-xs" onClick={() => setEditingKel(null)}>Batal</button>
                                  </div>
                                ) : (
                                  <>
                                    <span className="wr-kel-name">{kelData.kelurahan}</span>
                                    <span className="badge badge-purple" style={{ fontSize: 10 }}>{slsItems.length} SLS</span>
                                    <span className="badge badge-amber" style={{ fontSize: 10 }}>{totalTargetKel} Target</span>
                                  </>
                                )}
                              </div>

                              {!isEditKel && (
                                <div className="wr-kel-actions" onClick={(e) => e.stopPropagation()}>
                                  <span className={`wr-chevron ${isKelExp ? 'open' : 'closed'}`} style={{ pointerEvents: 'none' }}>
                                    {isKelExp ? '▲' : '▼'}
                                  </span>
                                  <button
                                    className="btn btn-ghost btn-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setAddingSls(kelKey);
                                      setExpandedKel((p) => ({ ...p, [kelKey]: true }));
                                      setKodeSls(''); setTargetSls('');
                                    }}
                                  >+ SLS</button>
                                  <button
                                    className="btn btn-edit btn-xs btn-icon"
                                    title="Edit kelurahan"
                                    onClick={(e) => { e.stopPropagation(); setEditingKel(kelKey); setEditNamaKel(kelData.kelurahan); }}
                                  >✏️</button>
                                  <button
                                    className="btn btn-danger btn-xs btn-icon"
                                    title="Hapus kelurahan"
                                    onClick={(e) => { e.stopPropagation(); handleDeleteKel(kec, kelData.kelurahan); }}
                                  >🗑️</button>
                                </div>
                              )}
                            </div>

                            {/* SLS panel */}
                            {isKelExp && (
                              <div className="wr-sls-panel">
                                <div className="wr-sls-thead">
                                  <span className="wr-sls-th">Kode SLS</span>
                                  <span className="wr-sls-th">Target</span>
                                  <span className="wr-sls-th">Kelurahan</span>
                                  <span className="wr-sls-th">Kecamatan</span>
                                  <span className="wr-sls-th" />
                                </div>

                                {slsItems.length === 0 ? (
                                  <div className="wr-sls-empty">Belum ada kode SLS untuk kelurahan ini.</div>
                                ) : (
                                  slsItems.map((item) => {
                                    if (editingSls === item.id) return (
                                      <div key={item.id} className="wr-sls-edit-row">
                                        <input
                                          autoFocus
                                          className="wr-inp"
                                          style={{ flex: 1, minWidth: 80, fontSize: 12 }}
                                          value={editKodeSls}
                                          placeholder="Kode SLS"
                                          onChange={(e) => setEditKodeSls(e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleEditSls(item);
                                            if (e.key === 'Escape') setEditingSls(null);
                                          }}
                                        />
                                        <input
                                          className="wr-inp"
                                          type="number"
                                          min="0"
                                          style={{ width: 90, fontSize: 12 }}
                                          value={editTargetSls}
                                          placeholder="Target"
                                          onChange={(e) => setEditTargetSls(e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleEditSls(item);
                                            if (e.key === 'Escape') setEditingSls(null);
                                          }}
                                        />
                                        <button className="btn btn-primary btn-xs" onClick={() => handleEditSls(item)}>💾 Simpan</button>
                                        <button className="btn btn-ghost btn-xs" onClick={() => { setEditingSls(null); setEditKodeSls(''); setEditTargetSls(''); }}>Batal</button>
                                      </div>
                                    );
                                    return (
                                      <div key={item.id} className="wr-sls-row">
                                        <span className="col-kode">{item.kode_sls}</span>
                                        <span className="col-target">{Number(item.target || 0)}</span>
                                        <span className="col-sub">{item.kelurahan}</span>
                                        <span className="col-sub">{item.kecamatan}</span>
                                        <span className="col-act">
                                          <input
                                            type="checkbox"
                                            className="wr-check"
                                            checked={kecSel.has(item.id)}
                                            onChange={() => toggleSelectSls(kec, item.id)}
                                          />
                                          <button
                                            className="btn btn-edit btn-xs btn-icon"
                                            title="Edit SLS"
                                            onClick={() => { setEditingSls(item.id); setEditKodeSls(item.kode_sls); setEditTargetSls(String(item.target || 0)); }}
                                          >✏️</button>
                                          <button
                                            className="btn btn-danger btn-xs btn-icon"
                                            title="Hapus SLS"
                                            onClick={() => handleDeleteSls(item)}
                                          >🗑️</button>
                                        </span>
                                      </div>
                                    );
                                  })
                                )}

                                {/* Form tambah SLS */}
                                {isAddingSls ? (
                                  <div className="wr-add-sls">
                                    <input
                                      autoFocus
                                      className="wr-inp"
                                      style={{ flex: 1, minWidth: 120 }}
                                      placeholder="Kode SLS (contoh: 001A)"
                                      value={kodeSls}
                                      onChange={(e) => setKodeSls(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleTambahSls(kec, kelData.kelurahan);
                                        if (e.key === 'Escape') setAddingSls(null);
                                      }}
                                    />
                                    <input
                                      className="wr-inp"
                                      type="number"
                                      min="0"
                                      style={{ width: 100 }}
                                      placeholder="Target"
                                      value={targetSls}
                                      onChange={(e) => setTargetSls(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleTambahSls(kec, kelData.kelurahan);
                                        if (e.key === 'Escape') setAddingSls(null);
                                      }}
                                    />
                                    <button className="btn btn-primary btn-sm" onClick={() => handleTambahSls(kec, kelData.kelurahan)}>💾 Simpan</button>
                                    <button className="btn btn-ghost btn-sm" onClick={() => { setAddingSls(null); setKodeSls(''); setTargetSls(''); }}>Batal</button>
                                  </div>
                                ) : (
                                  <div className="wr-add-sls-trigger">
                                    <button
                                      className="btn-dashed"
                                      onClick={() => { setAddingSls(kelKey); setKodeSls(''); setTargetSls(''); }}
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
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default KelolaResponden;