import React, { useEffect, useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import api from '../services/api';

const initialForm = {
  nama: '',
  email: '',
  password: '',
  role: 'pml',
  pml_id: '',
  nomor_whatsapp: '',
  wilayah_ids: []
};

/* ─── Inject CSS ─────────────────────────────────────────────────── */
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

  .kp-root { font-family: var(--font); background: var(--bg); min-height: 100vh; color: #1e293b; }

  /* ── Stats ── */
  .kp-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-bottom: 24px; }
  .kp-stat-card {
    background: var(--white); border-radius: var(--radius); padding: 18px 20px;
    box-shadow: var(--shadow); display: flex; align-items: center; gap: 14px; position: relative; overflow: hidden;
  }
  .kp-stat-card::after {
    content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%;
    background: var(--accent); border-radius: var(--radius) 0 0 var(--radius);
  }
  .kp-stat-card.red::after  { background: var(--red); }
  .kp-stat-card.indigo::after { background: #6366f1; }
  .kp-stat-card.green::after { background: var(--green); }
  .kp-stat-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
  .kp-stat-info { flex: 1; }
  .kp-stat-num  { font-size: 26px; font-weight: 800; color: var(--navy); line-height: 1; }
  .kp-stat-lbl  { font-size: 11px; font-weight: 600; color: var(--slate); text-transform: uppercase; letter-spacing: .06em; margin-top: 3px; }

  /* ── Alert ── */
  .kp-alert { padding: 11px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
  .kp-alert.success { background: var(--green-lt); color: var(--green); border: 1px solid #a7f3c5; }
  .kp-alert.error   { background: var(--red-lt); color: var(--red); border: 1px solid #fca5a5; }

  /* ── Toolbar ── */
  .kp-toolbar { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; }
  .kp-tabs { display: flex; background: var(--white); border-radius: 8px; border: 1px solid var(--line); padding: 3px; gap: 2px; }
  .kp-tab { padding: 6px 18px; border: none; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer; background: transparent; color: var(--slate); font-family: var(--font); transition: var(--trans); }
  .kp-tab.active { background: var(--navy); color: #fff; }
  .kp-tab:hover:not(.active) { background: var(--accent-lt); color: var(--accent); }

  .kp-search { position: relative; }
  .kp-search input { padding: 8px 12px 8px 34px; border: 1px solid var(--line); border-radius: 8px; font-size: 13px; font-family: var(--font); background: var(--white); color: #1e293b; outline: none; width: 210px; transition: var(--trans); }
  .kp-search input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(59,124,244,.12); }
  .kp-search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--slate); font-size: 14px; pointer-events: none; }

  .kp-spacer { flex: 1; }
  .kp-btn-group { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

  /* ── Buttons ── */
  .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; font-family: var(--font); cursor: pointer; border: none; transition: var(--trans); white-space: nowrap; }
  .btn:disabled { opacity: .5; cursor: not-allowed; }
  .btn-primary  { background: var(--navy); color: #fff; }
  .btn-primary:hover:not(:disabled) { background: var(--navy-mid); }
  .btn-danger   { background: var(--red-lt); color: var(--red); border: 1px solid #fca5a5; }
  .btn-danger:hover:not(:disabled) { background: #ffe4e4; }
  .btn-success  { background: var(--green-lt); color: var(--green); border: 1px solid #86efac; }
  .btn-success:hover:not(:disabled) { background: #d1fae5; }
  .btn-ghost    { background: var(--white); color: var(--slate); border: 1px solid var(--line); }
  .btn-ghost:hover:not(:disabled) { background: var(--bg); }
  .btn-sm       { padding: 5px 11px; font-size: 12px; border-radius: 6px; }
  .btn-edit     { background: #eef2ff; color: #4f46e5; }
  .btn-edit:hover { background: #e0e7ff; }
  .btn-del      { background: var(--red-lt); color: var(--red); }
  .btn-del:hover { background: #ffe4e4; }
  .btn-add-sls  { background: transparent; color: var(--navy); border: 1.5px dashed var(--navy-lt); border-radius: 8px; padding: 7px 16px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: var(--font); transition: var(--trans); margin-top: 10px; }
  .btn-add-sls:hover { background: var(--accent-lt); }

  /* ── Import result ── */
  .kp-import-result { background: var(--amber-lt); border: 1px solid #fcd34d; border-radius: 8px; padding: 14px 16px; margin-bottom: 16px; }
  .kp-import-result-title { font-size: 13px; font-weight: 700; color: var(--amber); margin-bottom: 8px; }
  .kp-import-result-scroll { max-height: 150px; overflow-y: auto; }
  .kp-import-result-row { font-size: 12px; color: #78350f; margin-bottom: 3px; }

  /* ── Form Card ── */
  .kp-form-card { background: var(--white); border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: var(--shadow); border: 1px solid var(--line); }
  .kp-form-title { font-size: 15px; font-weight: 800; color: var(--navy); margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
  .kp-form-grid  { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 18px; }
  .kp-field      { display: flex; flex-direction: column; gap: 5px; }
  .kp-label      { font-size: 12px; font-weight: 700; color: #374151; letter-spacing: .02em; }
  .kp-label span { font-weight: 400; color: var(--slate); }
  .kp-input      { padding: 9px 12px; border: 1.5px solid var(--line); border-radius: 8px; font-size: 13px; font-family: var(--font); color: #1e293b; background: var(--white); outline: none; transition: var(--trans); }
  .kp-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(59,124,244,.1); }
  .kp-wa-wrap    { display: flex; align-items: center; border: 1.5px solid var(--line); border-radius: 8px; overflow: hidden; transition: var(--trans); }
  .kp-wa-wrap:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(59,124,244,.1); }
  .kp-wa-prefix  { padding: 9px 10px; background: var(--bg); font-size: 13px; color: var(--slate); border-right: 1.5px solid var(--line); white-space: nowrap; font-weight: 600; }
  .kp-wa-input   { padding: 9px 12px; border: none; flex: 1; font-family: var(--font); font-size: 13px; outline: none; background: transparent; }

  /* ── SLS section inside form ── */
  .kp-sls-form-section { margin-bottom: 18px; }
  .kp-sls-form-row { display: flex; gap: 8px; margin-bottom: 10px; align-items: flex-end; }

  /* ── Table ── */
  .kp-table-wrap { background: var(--white); border-radius: 12px; overflow: hidden; box-shadow: var(--shadow); border: 1px solid var(--line); }
  .kp-table { width: 100%; border-collapse: collapse; }
  .kp-th { padding: 11px 14px; background: #f8fafc; font-size: 10.5px; font-weight: 800; color: var(--slate); text-align: left; text-transform: uppercase; letter-spacing: .06em; border-bottom: 1px solid var(--line); white-space: nowrap; }
  .kp-th.center { text-align: center; }
  .kp-tr { border-bottom: 1px solid var(--line); transition: background .1s; }
  .kp-tr:hover { background: #f9fbff; }
  .kp-tr.alt  { background: #fafbfd; }
  .kp-tr.pml  { background: #f8faff; }
  .kp-tr.ppl  { background: var(--white); }
  .kp-td { padding: 11px 14px; font-size: 13px; color: #334155; vertical-align: middle; }
  .kp-td.center { text-align: center; }

  /* ── Badges ── */
  .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 10.5px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; }
  .badge-admin  { background: #fee2e2; color: var(--red); }
  .badge-pml    { background: #eef2ff; color: #4f46e5; }
  .badge-ppl    { background: var(--green-lt); color: var(--green); }

  /* ── Name cell ── */
  .kp-name-btn { background: none; border: none; padding: 0; cursor: pointer; font-family: var(--font); font-size: 13px; font-weight: 700; color: var(--navy); display: inline-flex; align-items: center; gap: 6px; text-align: left; transition: color .15s; }
  .kp-name-btn:hover { color: var(--accent); }
  .kp-chevron { display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 4px; font-size: 8px; flex-shrink: 0; transition: var(--trans); }
  .kp-chevron.open { background: var(--navy); color: #fff; }
  .kp-chevron.closed { background: var(--line); color: var(--slate); }
  .kp-ppl-indent { color: var(--slate); font-size: 10px; }
  .kp-ppl-badge-count { background: #eef2ff; color: #4338ca; border-radius: 10px; padding: 1px 8px; font-size: 10px; font-weight: 700; }

  .kp-wa-link  { color: var(--green); font-size: 12px; text-decoration: none; font-family: var(--mono); font-weight: 600; }
  .kp-wa-link:hover { text-decoration: underline; }
  .kp-wa-none  { color: var(--line); font-size: 16px; }
  .kp-target   { font-weight: 800; color: var(--navy); font-family: var(--mono); font-size: 13px; }
  .kp-target-none { color: var(--line); }
  .kp-date     { font-size: 11px; color: var(--slate); font-family: var(--mono); }
  .kp-pml-chip { background: #eef2ff; color: #4338ca; border-radius: 6px; padding: 2px 9px; font-size: 11px; font-weight: 700; }
  .kp-empty    { text-align: center; padding: 48px; color: var(--slate); font-size: 13px; }

  /* ── SLS expand panel ── */
  .kp-sls-panel { background: linear-gradient(to bottom, #f0f5ff, #edf2fc); padding: 16px 20px; border-top: 2px solid #dce7fc; }
  .kp-sls-panel-hd { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
  .kp-sls-panel-title { font-size: 13px; font-weight: 800; color: var(--navy); display: flex; align-items: center; gap: 8px; }
  .kp-sls-count { background: var(--navy); color: #fff; border-radius: 20px; padding: 2px 9px; font-size: 10px; font-weight: 700; }

  .kp-sls-thead { display: flex; align-items: center; padding: 7px 12px; background: rgba(255,255,255,.6); border-radius: 6px; font-size: 10px; font-weight: 800; color: var(--slate); text-transform: uppercase; letter-spacing: .05em; margin-bottom: 4px; }
  .kp-sls-row   { display: flex; align-items: center; padding: 9px 12px; background: var(--white); border-radius: 8px; margin-bottom: 4px; font-size: 13px; box-shadow: 0 1px 3px rgba(15,37,69,.05); transition: box-shadow .15s; }
  .kp-sls-row:hover { box-shadow: 0 2px 8px rgba(15,37,69,.1); }
  .col-kode   { flex: 0 0 110px; font-family: var(--mono); font-weight: 700; color: var(--navy); }
  .col-kel    { flex: 1; color: #334155; }
  .col-kec    { flex: 1; color: #475569; }
  .col-target { flex: 0 0 70px; text-align: right; padding-right: 8px; font-family: var(--mono); font-weight: 700; color: var(--navy); }
  .col-aksi   { flex: 0 0 76px; display: flex; justify-content: flex-end; }
  .kp-sls-empty { padding: 14px 12px; color: var(--slate); font-size: 13px; font-style: italic; }

  .kp-add-sls-box { display: flex; gap: 8px; align-items: center; margin-top: 10px; padding: 12px; background: var(--white); border-radius: 8px; border: 1px solid var(--line); }
  .kp-add-sls-box select { flex: 1; }

  /* ── Checkbox ── */
  .kp-check { cursor: pointer; accent-color: var(--navy); width: 15px; height: 15px; }

  /* ── Scrollbar ── */
  .kp-root ::-webkit-scrollbar { width: 5px; height: 5px; }
  .kp-root ::-webkit-scrollbar-track { background: var(--bg); }
  .kp-root ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
`;

function InjectStyle() {
  useEffect(() => {
    const id = 'kp-styles';
    if (!document.getElementById(id)) {
      const el = document.createElement('style');
      el.id = id;
      el.textContent = GLOBAL_CSS;
      document.head.appendChild(el);
    }
    return () => {};
  }, []);
  return null;
}

/* ═══════════════════════════════════════════════════════════════════ */
const KelolaPetugas = () => {
  const [users, setUsers]             = useState([]);
  const [pmlList, setPmlList]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [editingId, setEditingId]     = useState(null);
  const [form, setForm]               = useState(initialForm);
  const [pesan, setPesan]             = useState({ text: '', type: '' });
  const [activeTab, setActiveTab]     = useState('semua');
  const [wilayahList, setWilayahList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [expandedPmlIds, setExpandedPmlIds]   = useState({});
  const [expandedUserId, setExpandedUserId]   = useState(null);
  const [showAddSls, setShowAddSls]           = useState(null);
  const [selectedSlsId, setSelectedSlsId]     = useState('');
  const [slsLoading, setSlsLoading]           = useState(false);
  const [formSelectedWilayahId, setFormSelectedWilayahId] = useState('');

  const [selectedIds, setSelectedIds]     = useState(new Set());
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult]   = useState(null);
  const fileInputRef                      = useRef(null);

  const filteredUsers = users.filter((u) =>
    u.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (!pesan.text) return;
    const t = setTimeout(() => setPesan({ text: '', type: '' }), 4000);
    return () => clearTimeout(t);
  }, [pesan]);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [usersRes, wilayahRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/wilayah')
      ]);
      setUsers(usersRes.data);
      setPmlList(usersRes.data.filter((u) => u.role === 'pml'));
      const slsList = wilayahRes.data.filter(
        (w) => w.kode_sls?.trim() && w.kelurahan?.trim() && w.kecamatan?.trim()
      );
      setWilayahList(slsList);
    } catch (err) {
      console.error('Gagal ambil data', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(initialForm); setEditingId(null); setShowForm(false); setFormSelectedWilayahId('');
  };

  const slsLabel        = (w) => `${w.kode_sls}  •  ${w.kelurahan}  •  ${w.kecamatan}`;
  const togglePml       = (id) => setExpandedPmlIds((p) => ({ ...p, [id]: !p[id] }));
  const toggleExpandSls = (id) => { setExpandedUserId(expandedUserId === id ? null : id); setShowAddSls(null); setSelectedSlsId(''); };
  const formatWaDisplay = (n) => (!n ? '—' : `+62 ${n.replace(/^0/, '')}`);
  const waHref          = (n) => (!n ? '#' : `https://wa.me/62${n.replace(/^0/, '')}`);
  const getSlsTarget    = (wid) => Number(wilayahList.find((x) => Number(x.id) === Number(wid))?.target || 0);
  const getUserTarget   = (user) => {
    if (!user) return 0;
    if (user.role === 'ppl') return (user.wilayah_ids || []).reduce((s, id) => s + getSlsTarget(id), 0);
    if (user.role === 'pml') return users.filter((u) => u.role === 'ppl' && u.pml_id === user.id).reduce((s, p) => s + getUserTarget(p), 0);
    return 0;
  };

  const getVisibleUserIds = () => activeTab === 'semua' ? users.map((u) => u.id) : users.filter((u) => u.role === activeTab).map((u) => u.id);
  const toggleSelect    = (id) => setSelectedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSelectAll = () => { const v = getVisibleUserIds(); const all = v.length > 0 && v.every((id) => selectedIds.has(id)); setSelectedIds(all ? new Set() : new Set(v)); };

  const handleDeleteBulk = async () => {
    if (!selectedIds.size || !window.confirm(`Hapus ${selectedIds.size} petugas? Tidak bisa dibatalkan.`)) return;
    try {
      await api.delete('/admin/users/bulk', { data: { ids: [...selectedIds] } });
      setPesan({ text: `✅ ${selectedIds.size} petugas berhasil dihapus!`, type: 'success' });
      setSelectedIds(new Set()); fetchAll();
    } catch (err) {
      setPesan({ text: '❌ ' + (err.response?.data?.message || 'Gagal hapus bulk'), type: 'error' });
    }
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setImportLoading(true); setImportResult(null);
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await api.post('/admin/users/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setImportResult(res.data);
      setPesan({ text: `✅ ${res.data.message}`, type: 'success' }); fetchAll();
    } catch (err) {
      setPesan({ text: '❌ ' + (err.response?.data?.message || 'Gagal import Excel'), type: 'error' });
    } finally {
      setImportLoading(false); if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownloadTemplate = () => {
    const data = [
      { nama: 'Suryani', email: 'suryani@example.com', password: 'password123', role: 'pml', nomor_whatsapp: '08987654321', pml_email: '', kode_sls: '' },
      { nama: 'Saiful', email: 'saiful@example.com', password: 'password123', role: 'ppl', nomor_whatsapp: '08123456789', pml_email: 'suryani@example.com', kode_sls: '001A,001B' }
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [{ wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 8 }, { wch: 18 }, { wch: 25 }, { wch: 20 }];
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Template Petugas');
    XLSX.writeFile(wb, 'template_petugas.xlsx');
  };

  const handleExportExcel = () => {
  const rows = [];

  users.forEach((u) => {
    if (u.role === 'admin') {
      rows.push({
        Nama: u.nama,
        Role: u.role.toUpperCase(),
        Email: u.email,
        'No. WhatsApp': u.nomor_whatsapp ? `+62${u.nomor_whatsapp.replace(/^0/, '')}` : '',
        'Kode SLS': '',
        Kelurahan: '',
        Kecamatan: '',
        Target: '',
      });
    } else if (u.role === 'pml') {
      rows.push({
        Nama: u.nama,
        Role: u.role.toUpperCase(),
        Email: u.email,
        'No. WhatsApp': u.nomor_whatsapp ? `+62${u.nomor_whatsapp.replace(/^0/, '')}` : '',
        'Kode SLS': '',
        Kelurahan: '',
        Kecamatan: '',
        Target: '',
      });
    } else if (u.role === 'ppl') {
  const wilayahUser = Array.isArray(u.wilayah_ids) ? u.wilayah_ids : [];
  const pmlUser  = u.pml_id ? users.find((p) => p.id === u.pml_id) : null;  // ← fix
  const pmlNama  = pmlUser?.nama  || '';
  const pmlEmail = pmlUser?.email || '';

  if (wilayahUser.length === 0)  {
        rows.push({
          Nama: u.nama,
          Role: u.role.toUpperCase(),
          Email: u.email,
          'No. WhatsApp': u.nomor_whatsapp ? `+62${u.nomor_whatsapp.replace(/^0/, '')}` : '',
          'PML Atasan': pmlNama,
          'Email PML': pmlEmail, 
          'Kode SLS': '',
          Kelurahan: '',
          Kecamatan: '',
          Target: '',
        });
      } else {
        wilayahUser.forEach((wid) => {
  const w = wilayahList.find((x) => x.id === wid);
  rows.push({
    Nama: u.nama,
    Role: 'PPL',
    Email: u.email,
    'No. WhatsApp': u.nomor_whatsapp ? `+62${u.nomor_whatsapp.replace(/^0/, '')}` : '',
    'PML Atasan': pmlNama,
    'Email PML': pmlEmail, 
    'Kode SLS': w?.kode_sls || '',
    Kelurahan: w?.kelurahan || '',
    Kecamatan: w?.kecamatan || '',
    Target: w ? Number(w.target || 0) : '',
  });
});
      }
    }
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
  { wch: 22 }, { wch: 8 }, { wch: 28 }, { wch: 18 },
  { wch: 22 }, { wch: 28 }, { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 8 },
];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data Petugas');
  XLSX.writeFile(wb, 'data_petugas.xlsx');
};

  const handleAddSls = async (userId) => {
    if (!selectedSlsId) return; setSlsLoading(true);
    try {
      const user = users.find((u) => u.id === userId);
      const cur  = Array.isArray(user.wilayah_ids) ? user.wilayah_ids.map(Number) : [];
      const nid  = Number(selectedSlsId);
      if (cur.includes(nid)) return;
      await api.put(`/admin/users/${userId}`, { nama: user.nama, email: user.email, role: user.role, pml_id: user.pml_id || null, nomor_whatsapp: user.nomor_whatsapp || '', wilayah_ids: [...cur, nid] });
      setSelectedSlsId(''); setShowAddSls(null); await fetchAll();
      setPesan({ text: '✅ SLS berhasil ditambahkan!', type: 'success' });
    } catch (err) {
      setPesan({ text: '❌ ' + (err.response?.data?.message || 'Gagal tambah SLS'), type: 'error' });
    } finally { setSlsLoading(false); }
  };

  const handleRemoveSls = async (userId, wilayahId) => {
    if (!window.confirm('Hapus SLS ini dari petugas?')) return;
    try {
      const user   = users.find((u) => u.id === userId);
      const newIds = (Array.isArray(user.wilayah_ids) ? user.wilayah_ids.map(Number) : []).filter((id) => id !== Number(wilayahId));
      await api.put(`/admin/users/${userId}`, { nama: user.nama, email: user.email, role: user.role, pml_id: user.pml_id || null, nomor_whatsapp: user.nomor_whatsapp || '', wilayah_ids: newIds });
      await fetchAll(); setPesan({ text: '✅ SLS berhasil dihapus!', type: 'success' });
    } catch (err) {
      setPesan({ text: '❌ ' + (err.response?.data?.message || 'Gagal hapus SLS'), type: 'error' });
    }
  };

  const addWilayahForm    = () => { if (!formSelectedWilayahId || form.wilayah_ids.includes(formSelectedWilayahId)) return; setForm((p) => ({ ...p, wilayah_ids: [...p.wilayah_ids, formSelectedWilayahId] })); setFormSelectedWilayahId(''); };
  const removeWilayahForm = (id) => setForm((p) => ({ ...p, wilayah_ids: p.wilayah_ids.filter((x) => x !== id) }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setPesan({ text: '', type: '' });
    try {
      const payload = { ...form, pml_id: form.role === 'ppl' ? form.pml_id || null : null, wilayah_ids: form.role === 'ppl' ? form.wilayah_ids : [], password: form.password || undefined };
      if (editingId) { if (!payload.password) delete payload.password; await api.put(`/admin/users/${editingId}`, payload); setPesan({ text: '✅ Petugas berhasil diupdate!', type: 'success' }); }
      else { await api.post('/admin/users', payload); setPesan({ text: '✅ Petugas berhasil ditambahkan!', type: 'success' }); }
      resetForm(); fetchAll();
    } catch (err) {
      setPesan({ text: '❌ ' + (err.response?.data?.message || 'Gagal simpan petugas'), type: 'error' });
    }
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    setForm({ nama: user.nama, email: user.email, password: '', role: user.role, pml_id: user.pml_id || '', nomor_whatsapp: user.nomor_whatsapp || '', wilayah_ids: user.wilayah_ids || [] });
    setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Hapus user ${user.nama}?`)) return;
    try {
      await api.delete(`/admin/users/${user.id}`); setPesan({ text: '✅ Petugas berhasil dihapus!', type: 'success' }); fetchAll();
    } catch (err) {
      setPesan({ text: '❌ ' + (err.response?.data?.message || 'Gagal hapus petugas'), type: 'error' });
    }
  };

  const counts = {
    admin: users.filter((u) => u.role === 'admin').length,
    pml:   users.filter((u) => u.role === 'pml').length,
    ppl:   users.filter((u) => u.role === 'ppl').length
  };

  /* ── SLS Panel ── */
  const renderSlsPanel = (ppl, colSpan) => {
    const wilayahUser = Array.isArray(ppl.wilayah_ids) ? ppl.wilayah_ids : [];
    const isOpen      = showAddSls === ppl.id;
    const usedIds     = users.filter((u) => u.role === 'ppl' && u.id !== ppl.id).flatMap((u) => Array.isArray(u.wilayah_ids) ? u.wilayah_ids.map(Number) : []);
    const available   = wilayahList.filter((w) => !wilayahUser.includes(w.id) && !usedIds.includes(Number(w.id)));

    return (
      <tr key={`sls-${ppl.id}`}>
        <td colSpan={colSpan + 1} style={{ padding: 0 }}>
          <div className="kp-sls-panel">
            <div className="kp-sls-panel-hd">
              <span className="kp-sls-panel-title">
                📋 Kode SLS — {ppl.nama}
                <span className="kp-sls-count">{wilayahUser.length}</span>
              </span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>SLS terdaftar</span>
            </div>

            {wilayahUser.length > 0 ? (
              <>
                <div className="kp-sls-thead">
                  <span className="col-kode">Kode SLS</span>
                  <span className="col-kel">Kelurahan</span>
                  <span className="col-kec">Kecamatan</span>
                  <span className="col-target">Target</span>
                  <span className="col-aksi">Aksi</span>
                </div>
                {wilayahUser.map((id) => {
                  const w = wilayahList.find((x) => x.id === id);
                  if (!w) return null;
                  return (
                    <div key={id} className="kp-sls-row">
                      <span className="col-kode">{w.kode_sls}</span>
                      <span className="col-kel">{w.kelurahan}</span>
                      <span className="col-kec">{w.kecamatan}</span>
                      <span className="col-target">{Number(w.target || 0)}</span>
                      <span className="col-aksi">
                        <button type="button" className="btn btn-del btn-sm" onClick={() => handleRemoveSls(ppl.id, id)}>Hapus</button>
                      </span>
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="kp-sls-empty">Belum ada Kode SLS untuk petugas ini.</div>
            )}

            {isOpen ? (
              <div className="kp-add-sls-box">
                <select className="kp-input" style={{ flex: 1, fontSize: 12 }} value={selectedSlsId} onChange={(e) => setSelectedSlsId(e.target.value)}>
                  <option value="">Pilih Kode SLS…</option>
                  {available.map((w) => <option key={w.id} value={w.id}>{slsLabel(w)}</option>)}
                </select>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => handleAddSls(ppl.id)} disabled={slsLoading || !selectedSlsId}>
                  {slsLoading ? 'Menyimpan…' : 'Simpan'}
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setShowAddSls(null); setSelectedSlsId(''); }}>Batal</button>
              </div>
            ) : (
              <button type="button" className="btn-add-sls" onClick={() => { setShowAddSls(ppl.id); setSelectedSlsId(''); }}>
                + Tambah SLS
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  /* ── PPL row ── */
  const renderPplRow = (ppl, showPmlCol = false) => {
    const isExpanded = expandedUserId === ppl.id;
    const colSpan    = showPmlCol ? 8 : 7;
    const pmlNama    = showPmlCol && ppl.pml_id ? users.find((p) => p.id === ppl.pml_id)?.nama || '—' : null;
    const target     = getUserTarget(ppl);

    return (
      <React.Fragment key={ppl.id}>
        <tr className={`kp-tr kp-tr-ppl${!showPmlCol ? ' kp-tr-indent' : ''}`}
          style={{ background: showPmlCol ? undefined : '#fafbff' }}>
          <td className="kp-td center"><input type="checkbox" className="kp-check" checked={selectedIds.has(ppl.id)} onChange={() => toggleSelect(ppl.id)} /></td>
          <td className="kp-td" style={!showPmlCol ? { paddingLeft: 36, borderLeft: '3px solid #6366f1' } : {}}>
            <button type="button" className="kp-name-btn" onClick={() => toggleExpandSls(ppl.id)}>
              {!showPmlCol && <span className="kp-ppl-indent">↳</span>}
              <span style={{ fontWeight: showPmlCol ? 700 : 600 }}>{ppl.nama}</span>
              <span className={`kp-chevron ${isExpanded ? 'open' : 'closed'}`}>{isExpanded ? '▲' : '▼'}</span>
            </button>
          </td>
          <td className="kp-td" style={{ color: '#64748b', fontSize: 12 }}>{ppl.email}</td>
          <td className="kp-td"><span className="badge badge-ppl">PPL</span></td>
          {showPmlCol && (
            <td className="kp-td">
              {pmlNama ? <span className="kp-pml-chip">{pmlNama}</span> : <span className="kp-wa-none">—</span>}
            </td>
          )}
          <td className="kp-td">
            {ppl.nomor_whatsapp
              ? <a href={waHref(ppl.nomor_whatsapp)} target="_blank" rel="noreferrer" className="kp-wa-link">{formatWaDisplay(ppl.nomor_whatsapp)}</a>
              : <span className="kp-wa-none">—</span>}
          </td>
          <td className="kp-td"><span className={target ? 'kp-target' : 'kp-target-none'}>{target || '—'}</span></td>
          <td className="kp-td"><span className="kp-date">{new Date(ppl.created_at).toLocaleDateString('id-ID')}</span></td>
          <td className="kp-td">
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-edit btn-sm" onClick={() => handleEdit(ppl)}>Edit</button>
              <button className="btn btn-del btn-sm"  onClick={() => handleDelete(ppl)}>Hapus</button>
            </div>
          </td>
        </tr>
        {isExpanded && renderSlsPanel(ppl, colSpan)}
      </React.Fragment>
    );
  };

  /* ── PML row ── */
  const renderPmlRow = (pml) => {
    const isOpen      = !!expandedPmlIds[pml.id];
    const children    = users.filter((u) => u.role === 'ppl' && u.pml_id === pml.id);
    const target      = getUserTarget(pml);

    return (
      <React.Fragment key={pml.id}>
        <tr className="kp-tr kp-tr-pml" style={{ background: '#f8fafc' }}>
          <td className="kp-td center"><input type="checkbox" className="kp-check" checked={selectedIds.has(pml.id)} onChange={() => toggleSelect(pml.id)} /></td>
          <td className="kp-td">
            <button type="button" className="kp-name-btn" onClick={() => togglePml(pml.id)}>
              <span className={`kp-chevron ${isOpen ? 'open' : 'closed'}`}>{isOpen ? '▲' : '▼'}</span>
              {pml.nama}
              {children.length > 0 && <span className="kp-ppl-badge-count">{children.length} PPL</span>}
            </button>
          </td>
          <td className="kp-td" style={{ color: '#64748b', fontSize: 12 }}>{pml.email}</td>
          <td className="kp-td"><span className="badge badge-pml">PML</span></td>
          <td className="kp-td">
            {pml.nomor_whatsapp
              ? <a href={waHref(pml.nomor_whatsapp)} target="_blank" rel="noreferrer" className="kp-wa-link">{formatWaDisplay(pml.nomor_whatsapp)}</a>
              : <span className="kp-wa-none">—</span>}
          </td>
          <td className="kp-td"><span className={target ? 'kp-target' : 'kp-target-none'}>{target || '—'}</span></td>
          <td className="kp-td"><span className="kp-date">{new Date(pml.created_at).toLocaleDateString('id-ID')}</span></td>
          <td className="kp-td">
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-edit btn-sm" onClick={() => handleEdit(pml)}>Edit</button>
              <button className="btn btn-del btn-sm"  onClick={() => handleDelete(pml)}>Hapus</button>
            </div>
          </td>
        </tr>
        {isOpen && children.map((ppl) => renderPplRow(ppl, false))}
      </React.Fragment>
    );
  };

  /* ── Admin / plain row ── */
  const renderPlainRow = (u) => {
    const badgeClass = { admin: 'badge-admin', pml: 'badge-pml', ppl: 'badge-ppl' }[u.role] || '';
    return (
      <tr key={u.id} className="kp-tr">
        <td className="kp-td center"><input type="checkbox" className="kp-check" checked={selectedIds.has(u.id)} onChange={() => toggleSelect(u.id)} /></td>
        <td className="kp-td"><span style={{ fontWeight: 700, color: '#0f2545', fontSize: 13 }}>{u.nama}</span></td>
        <td className="kp-td" style={{ color: '#64748b', fontSize: 12 }}>{u.email}</td>
        <td className="kp-td"><span className={`badge ${badgeClass}`}>{u.role.toUpperCase()}</span></td>
        <td className="kp-td">
          {u.nomor_whatsapp
            ? <a href={waHref(u.nomor_whatsapp)} target="_blank" rel="noreferrer" className="kp-wa-link">{formatWaDisplay(u.nomor_whatsapp)}</a>
            : <span className="kp-wa-none">—</span>}
        </td>
        <td className="kp-td"><span className="kp-target-none">—</span></td>
        <td className="kp-td"><span className="kp-date">{new Date(u.created_at).toLocaleDateString('id-ID')}</span></td>
        <td className="kp-td">
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-edit btn-sm" onClick={() => handleEdit(u)}>Edit</button>
            <button className="btn btn-del btn-sm"  onClick={() => handleDelete(u)}>Hapus</button>
          </div>
        </td>
      </tr>
    );
  };

  /* ── Table body ── */
  const renderTableBody = () => {
    if (loading) return <tr><td colSpan="9" className="kp-empty">⏳ Memuat data…</td></tr>;

    if (activeTab === 'semua') {
      if (!filteredUsers.length) return <tr><td colSpan="9" className="kp-empty">Tidak ada data</td></tr>;
      return (
        <>
          {filteredUsers.filter((u) => u.role === 'admin').map(renderPlainRow)}
          {filteredUsers.filter((u) => u.role === 'pml').map(renderPmlRow)}
          {filteredUsers.filter((u) => u.role === 'ppl' && !u.pml_id).map(renderPlainRow)}
        </>
      );
    }
    if (activeTab === 'pml') {
      const list = filteredUsers.filter((u) => u.role === 'pml');
      if (!list.length) return <tr><td colSpan="9" className="kp-empty">Tidak ada data</td></tr>;
      return list.map(renderPmlRow);
    }
    if (activeTab === 'admin') {
      const list = filteredUsers.filter((u) => u.role === 'admin');
      if (!list.length) return <tr><td colSpan="9" className="kp-empty">Tidak ada data</td></tr>;
      return list.map(renderPlainRow);
    }
    if (activeTab === 'ppl') {
      const list = filteredUsers.filter((u) => u.role === 'ppl');
      if (!list.length) return <tr><td colSpan="9" className="kp-empty">Tidak ada data</td></tr>;
      return list.map((p) => renderPplRow(p, true));
    }
    return null;
  };

  const isPplTab   = activeTab === 'ppl';
  const visibleIds = getVisibleUserIds();
  const allChecked = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someChecked = visibleIds.some((id) => selectedIds.has(id));

  /* Render*/
  return (
    <div className="kp-root" style={{ padding: '1.5rem' }}>
      <InjectStyle />

      {/* Stats */}
      <div className="kp-stats">
        {[
          { label: 'Total User', val: users.length, icon: '👥', cls: '',       bg: '#eef3fe' },
          { label: 'Admin',      val: counts.admin,  icon: '🛡️', cls: 'red',    bg: '#fff0f0' },
          { label: 'PML',        val: counts.pml,    icon: '📊', cls: 'indigo', bg: '#eef2ff' },
          { label: 'PPL',        val: counts.ppl,    icon: '🗺️', cls: 'green',  bg: '#edfbf4' },
        ].map((s) => (
          <div key={s.label} className={`kp-stat-card ${s.cls}`}>
            <div className="kp-stat-icon" style={{ background: s.bg }}>{s.icon}</div>
            <div className="kp-stat-info">
              <div className="kp-stat-num">{s.val}</div>
              <div className="kp-stat-lbl">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Alert */}
      {pesan.text && (
        <div className={`kp-alert ${pesan.type}`}>{pesan.text}</div>
      )}

      {/* Toolbar */}
      <div className="kp-toolbar">
        {/* Tabs */}
        <div className="kp-tabs">
          {[['semua','Semua'],['admin','Admin'],['pml','PML'],['ppl','PPL']].map(([val, lbl]) => (
            <button key={val} className={`kp-tab ${activeTab === val ? 'active' : ''}`}
              onClick={() => { setActiveTab(val); setSelectedIds(new Set()); }}>
              {lbl}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="kp-search">
          <span className="kp-search-icon">🔍</span>
          <input type="text" placeholder="Cari nama / email…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>

        <div className="kp-spacer" />

        {/* Action buttons */}
        <div className="kp-btn-group">
          {selectedIds.size > 0 && (
            <button className="btn btn-danger" onClick={handleDeleteBulk}>
              🗑 Hapus {selectedIds.size} Terpilih
            </button>
          )}
          <input type="file" accept=".xlsx,.xls" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImportExcel} />
          <button className="btn btn-success" onClick={() => fileInputRef.current?.click()} disabled={importLoading}>
            {importLoading ? '⏳ Mengimpor…' : '📥 Import Excel'}
          </button>
          <button className="btn btn-ghost" onClick={handleDownloadTemplate}>📄 Template</button>
          <button className="btn btn-ghost" onClick={handleExportExcel}>Export Excel</button>
          <button className="btn btn-primary" onClick={() => showForm ? resetForm() : setShowForm(true)}>
            {showForm ? '✕ Batal' : '+ Tambah Petugas'}
          </button>
        </div>
      </div>

      {/* Import result */}
      {importResult && importResult.gagal?.length > 0 && (
        <div className="kp-import-result">
          <div className="kp-import-result-title">
            ⚠️ {importResult.berhasil} berhasil, {importResult.gagal.length} baris gagal:
          </div>
          <div className="kp-import-result-scroll">
            {importResult.gagal.map((g, i) => (
              <div key={i} className="kp-import-result-row">• <b>{g.email}</b>: {g.alasan}</div>
            ))}
          </div>
          <button onClick={() => setImportResult(null)}
            style={{ marginTop: 8, fontSize: 11, color: '#92400e', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
            Tutup
          </button>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="kp-form-card">
          <div className="kp-form-title">
            {editingId ? '✏️ Edit Petugas' : '➕ Tambah Petugas Baru'}
          </div>
          <form onSubmit={handleSubmit}>
            <div className="kp-form-grid">
              <div className="kp-field">
                <label className="kp-label">Nama Lengkap</label>
                <input className="kp-input" type="text" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required />
              </div>
              <div className="kp-field">
                <label className="kp-label">Email</label>
                <input className="kp-input" type="email" placeholder="contoh@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="kp-field">
                <label className="kp-label">
                  Password {editingId && <span>(kosongkan jika tidak diubah)</span>}
                </label>
                <input className="kp-input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editingId} />
              </div>
              <div className="kp-field">
                <label className="kp-label">Role</label>
                <select className="kp-input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value, pml_id: '', wilayah_ids: [] })}>
                  <option value="admin">Admin</option>
                  <option value="pml">PML</option>
                  <option value="ppl">PPL</option>
                </select>
              </div>
              <div className="kp-field">
                <label className="kp-label">Nomor WhatsApp</label>
                <div className="kp-wa-wrap">
                  <span className="kp-wa-prefix">+62</span>
                  <input className="kp-wa-input" type="tel" placeholder="812-3456-7890"
                    value={form.nomor_whatsapp} onChange={(e) => setForm({ ...form, nomor_whatsapp: e.target.value })} />
                </div>
              </div>
              {form.role === 'ppl' && (
                <div className="kp-field">
                  <label className="kp-label">PML Atasan</label>
                  <select className="kp-input" value={form.pml_id} onChange={(e) => setForm({ ...form, pml_id: e.target.value })}>
                    <option value="">— Pilih PML —</option>
                    {pmlList.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
                  </select>
                </div>
              )}
            </div>

            {form.role === 'ppl' && (
              <div className="kp-sls-form-section">
                <label className="kp-label" style={{ display: 'block', marginBottom: 8 }}>Kode SLS</label>
                <div className="kp-sls-form-row">
                  <select className="kp-input" style={{ flex: 1 }} value={formSelectedWilayahId}
                    onChange={(e) => setFormSelectedWilayahId(e.target.value)}>
                    <option value="">Pilih Kode SLS…</option>
                    {wilayahList.filter((w) => {
                      const usedIds = users.filter((u) => u.role === 'ppl' && u.id !== editingId).flatMap((u) => Array.isArray(u.wilayah_ids) ? u.wilayah_ids.map(Number) : []);
                      return !form.wilayah_ids.includes(w.id) && !usedIds.includes(Number(w.id));
                    }).map((w) => <option key={w.id} value={w.id}>{slsLabel(w)}</option>)}
                  </select>
                  <button type="button" className="btn btn-primary" onClick={addWilayahForm}>+ Tambah</button>
                </div>
                {form.wilayah_ids.length > 0 && (
                  <>
                    <div className="kp-sls-thead">
                      <span className="col-kode">Kode SLS</span>
                      <span className="col-kel">Kelurahan</span>
                      <span className="col-kec">Kecamatan</span>
                      <span className="col-target">Target</span>
                      <span className="col-aksi">Aksi</span>
                    </div>
                    {form.wilayah_ids.map((id) => {
                      const w = wilayahList.find((x) => x.id === id);
                      if (!w) return null;
                      return (
                        <div key={id} className="kp-sls-row">
                          <span className="col-kode">{w.kode_sls}</span>
                          <span className="col-kel">{w.kelurahan}</span>
                          <span className="col-kec">{w.kecamatan}</span>
                          <span className="col-target">{Number(w.target || 0)}</span>
                          <span className="col-aksi">
                            <button type="button" className="btn btn-del btn-sm" onClick={() => removeWilayahForm(id)}>Hapus</button>
                          </span>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ paddingInline: 28 }}>
              {editingId ? '💾 Update Petugas' : '✅ Simpan Petugas'}
            </button>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="kp-table-wrap">
        <table className="kp-table">
          <thead>
            <tr>
              <th className="kp-th center" style={{ width: 40 }}>
                <input type="checkbox" className="kp-check"
                  checked={allChecked}
                  ref={(el) => { if (el) el.indeterminate = someChecked && !allChecked; }}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="kp-th">Nama</th>
              <th className="kp-th">Email</th>
              <th className="kp-th">Role</th>
              {isPplTab && <th className="kp-th">PML Atasan</th>}
              <th className="kp-th">No. WhatsApp</th>
              <th className="kp-th">Target</th>
              <th className="kp-th">Dibuat</th>
              <th className="kp-th">Aksi</th>
            </tr>
          </thead>
          <tbody>{renderTableBody()}</tbody>
        </table>
      </div>
    </div>
  );
};

export default KelolaPetugas;