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

const KelolaPetugas = () => {
  const [users, setUsers]           = useState([]);
  const [pmlList, setPmlList]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [form, setForm]             = useState(initialForm);
  const [pesan, setPesan]           = useState({ text: '', type: '' });
  const [activeTab, setActiveTab]   = useState('semua');
  const [wilayahList, setWilayahList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // PML expand (hierarki PML → PPL)
  const [expandedPmlIds, setExpandedPmlIds] = useState({});

  // SLS expand per PPL
  const [expandedUserId, setExpandedUserId]   = useState(null);
  const [showAddSls, setShowAddSls]           = useState(null);
  const [selectedSlsId, setSelectedSlsId]     = useState('');
  const [slsLoading, setSlsLoading]           = useState(false);
  const [formSelectedWilayahId, setFormSelectedWilayahId] = useState('');

  // ── FITUR BARU: multi-select & import ───────────────────────────────
  const [selectedIds, setSelectedIds]       = useState(new Set());
  const [importLoading, setImportLoading]   = useState(false);
  const [importResult, setImportResult]     = useState(null);
  const fileInputRef                        = useRef(null);
  // ────────────────────────────────────────────────────────────────────

  const filteredUsers = users.filter((u) =>
  u.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
  u.email.toLowerCase().includes(searchQuery.toLowerCase())
);

  // Auto-hide pesan
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
    setForm(initialForm);
    setEditingId(null);
    setShowForm(false);
    setFormSelectedWilayahId('');
  };

  const slsLabel = (w) => `${w.kode_sls}  •  ${w.kelurahan}  •  ${w.kecamatan}`;

  const togglePml       = (pmlId) => setExpandedPmlIds((p) => ({ ...p, [pmlId]: !p[pmlId] }));
  const toggleExpandSls = (userId) => {
    setExpandedUserId(expandedUserId === userId ? null : userId);
    setShowAddSls(null);
    setSelectedSlsId('');
  };

  const formatWaDisplay = (n) => (!n ? '—' : `+62 ${n.replace(/^0/, '')}`);
  const waHref          = (n) => (!n ? '#' : `https://wa.me/62${n.replace(/^0/, '')}`);

  const getSlsTarget  = (wilayahId) =>
    Number(wilayahList.find((x) => Number(x.id) === Number(wilayahId))?.target || 0);

  const getUserTarget = (user) => {
    if (!user) return 0;
    if (user.role === 'ppl')
      return (user.wilayah_ids || []).reduce((s, id) => s + getSlsTarget(id), 0);
    if (user.role === 'pml')
      return users.filter((u) => u.role === 'ppl' && u.pml_id === user.id)
                  .reduce((s, ppl) => s + getUserTarget(ppl), 0);
    return 0;
  };

  // ── Multi-select helpers ─────────────────────────────────────────────
  const getVisibleUserIds = () => {
    if (activeTab === 'semua') return users.map((u) => u.id);
    return users.filter((u) => u.role === activeTab).map((u) => u.id);
  };

  const toggleSelect = (id) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleSelectAll = () => {
    const visible = getVisibleUserIds();
    const allSelected = visible.length > 0 && visible.every((id) => selectedIds.has(id));
    setSelectedIds(allSelected ? new Set() : new Set(visible));
  };

  // ── Hapus bulk ───────────────────────────────────────────────────────
  const handleDeleteBulk = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Hapus ${selectedIds.size} petugas sekaligus? Tindakan ini tidak bisa dibatalkan.`)) return;
    try {
      await api.delete('/admin/users/bulk', { data: { ids: [...selectedIds] } });
      setPesan({ text: `✅ ${selectedIds.size} petugas berhasil dihapus!`, type: 'success' });
      setSelectedIds(new Set());
      fetchAll();
    } catch (err) {
      setPesan({ text: '❌ ' + (err.response?.data?.message || 'Gagal hapus bulk'), type: 'error' });
    }
  };

  // ── Import Excel ─────────────────────────────────────────────────────
  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportLoading(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/admin/users/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImportResult(res.data);
      setPesan({ text: `✅ ${res.data.message}`, type: 'success' });
      fetchAll();
    } catch (err) {
      setPesan({
        text: '❌ ' + (err.response?.data?.message || 'Gagal import Excel'),
        type: 'error'
      });
    } finally {
      setImportLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Download template Excel (.xlsx) ─────────────────────────────────
  const handleDownloadTemplate = () => {
    // Data contoh — 1 baris PML, 2 baris PPL
    const data = [
      {
        nama:            'Suryani',
        email:           'suryani@example.com',
        password:        'password123',
        role:            'pml',
        nomor_whatsapp:  '08987654321',
        pml_email:       '',
        kode_sls:        ''
      },
      {
        nama:            'Saiful',
        email:           'saiful@example.com',
        password:        'password123',
        role:            'ppl',
        nomor_whatsapp:  '08123456789',
        pml_email:       'suryani@example.com',
        kode_sls:        '001A,001B'
      }
    ];

    // Buat worksheet dari array of objects
    const ws = XLSX.utils.json_to_sheet(data);

    // Atur lebar kolom agar mudah dibaca
    ws['!cols'] = [
      { wch: 20 }, // nama
      { wch: 25 }, // email
      { wch: 15 }, // password
      { wch: 8  }, // role
      { wch: 18 }, // nomor_whatsapp
      { wch: 25 }, // pml_email
      { wch: 20 }, // kode_sls
    ];

    // Buat workbook dan masukkan worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Petugas');

    // Download sebagai .xlsx
    XLSX.writeFile(wb, 'template_petugas.xlsx');
  };

  // ── SLS API handlers ─────────────────────────────────────────────────
  const handleAddSls = async (userId) => {
    if (!selectedSlsId) return;
    setSlsLoading(true);
    try {
      const user       = users.find((u) => u.id === userId);
      const currentIds = Array.isArray(user.wilayah_ids) ? user.wilayah_ids.map(Number) : [];
      const newId      = Number(selectedSlsId);
      if (currentIds.includes(newId)) return;
      await api.put(`/admin/users/${userId}`, {
        nama: user.nama, email: user.email, role: user.role,
        pml_id: user.pml_id || null, nomor_whatsapp: user.nomor_whatsapp || '',
        wilayah_ids: [...currentIds, newId]
      });
      setSelectedSlsId(''); setShowAddSls(null);
      await fetchAll();
      setPesan({ text: '✅ SLS berhasil ditambahkan!', type: 'success' });
    } catch (err) {
      setPesan({ text: '❌ ' + (err.response?.data?.message || 'Gagal tambah SLS'), type: 'error' });
    } finally { setSlsLoading(false); }
  };

  const handleRemoveSls = async (userId, wilayahId) => {
    if (!window.confirm('Hapus SLS ini dari petugas?')) return;
    try {
      const user   = users.find((u) => u.id === userId);
      const newIds = (Array.isArray(user.wilayah_ids) ? user.wilayah_ids.map(Number) : [])
                       .filter((id) => id !== Number(wilayahId));
      await api.put(`/admin/users/${userId}`, {
        nama: user.nama, email: user.email, role: user.role,
        pml_id: user.pml_id || null, nomor_whatsapp: user.nomor_whatsapp || '',
        wilayah_ids: newIds
      });
      await fetchAll();
      setPesan({ text: '✅ SLS berhasil dihapus!', type: 'success' });
    } catch (err) {
      setPesan({ text: '❌ ' + (err.response?.data?.message || 'Gagal hapus SLS'), type: 'error' });
    }
  };

  // ── SLS form (lokal) ─────────────────────────────────────────────────
  const addWilayahForm = () => {
    if (!formSelectedWilayahId || form.wilayah_ids.includes(formSelectedWilayahId)) return;
    setForm((p) => ({ ...p, wilayah_ids: [...p.wilayah_ids, formSelectedWilayahId] }));
    setFormSelectedWilayahId('');
  };
  const removeWilayahForm = (id) =>
    setForm((p) => ({ ...p, wilayah_ids: p.wilayah_ids.filter((x) => x !== id) }));

  // ── CRUD form ────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setPesan({ text: '', type: '' });
    try {
      const payload = {
        ...form,
        pml_id:      form.role === 'ppl' ? form.pml_id || null : null,
        wilayah_ids: form.role === 'ppl' ? form.wilayah_ids : [],
        password:    form.password || undefined
      };
      if (editingId) {
        if (!payload.password) delete payload.password;
        await api.put(`/admin/users/${editingId}`, payload);
        setPesan({ text: '✅ Petugas berhasil diupdate!', type: 'success' });
      } else {
        await api.post('/admin/users', payload);
        setPesan({ text: '✅ Petugas berhasil ditambahkan!', type: 'success' });
      }
      resetForm(); fetchAll();
    } catch (err) {
      setPesan({ text: '❌ ' + (err.response?.data?.message || 'Gagal simpan petugas'), type: 'error' });
    }
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    setForm({
      nama: user.nama, email: user.email, password: '', role: user.role,
      pml_id: user.pml_id || '', nomor_whatsapp: user.nomor_whatsapp || '',
      wilayah_ids: user.wilayah_ids || []
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Hapus user ${user.nama}?`)) return;
    try {
      await api.delete(`/admin/users/${user.id}`);
      setPesan({ text: '✅ Petugas berhasil dihapus!', type: 'success' });
      fetchAll();
    } catch (err) {
      setPesan({ text: '❌ ' + (err.response?.data?.message || 'Gagal hapus petugas'), type: 'error' });
    }
  };

  // ── Stats ────────────────────────────────────────────────────────────
  const counts = {
    admin: users.filter((u) => u.role === 'admin').length,
    pml:   users.filter((u) => u.role === 'pml').length,
    ppl:   users.filter((u) => u.role === 'ppl').length
  };

  const roleColor = (role) => ({
    admin: { bg: '#fee2e2', color: '#dc2626' },
    pml:   { bg: '#eef2ff', color: '#6366f1' },
    ppl:   { bg: '#f0fdf4', color: '#16a34a' }
  }[role] || { bg: '#f1f5f9', color: '#64748b' });

  // ── Render: SLS panel ────────────────────────────────────────────────
  const renderSlsPanel = (ppl, colSpan) => {
    const wilayahUser  = Array.isArray(ppl.wilayah_ids) ? ppl.wilayah_ids : [];
    const isAddSlsOpen = showAddSls === ppl.id;
    const usedIds      = users
      .filter((u) => u.role === 'ppl' && u.id !== ppl.id)
      .flatMap((u) => (Array.isArray(u.wilayah_ids) ? u.wilayah_ids.map(Number) : []));
    const availableSls = wilayahList.filter(
      (w) => !wilayahUser.includes(w.id) && !usedIds.includes(Number(w.id))
    );

    return (
      <tr key={`sls-${ppl.id}`}>
        <td colSpan={colSpan + 1 /* +1 untuk kolom checkbox */} style={{ padding: 0 }}>
          <div style={{ ...styles.expandPanel, background: '#f0f4ff' }}>
            <div style={styles.expandHeader}>
              <span style={styles.expandTitle}>📋 Kode SLS — {ppl.nama}</span>
              <span style={{ fontSize: 12, color: '#64748b' }}>{wilayahUser.length} SLS terdaftar</span>
            </div>
            {wilayahUser.length > 0 ? (
              <>
                <div style={styles.slsTableHeader}>
                  <span style={styles.colKode}>Kode SLS</span>
                  <span style={styles.colKel}>Kelurahan</span>
                  <span style={styles.colKec}>Kecamatan</span>
                  <span style={{ ...styles.colTarget, color: '#94a3b8' }}>Target</span>
                  <span style={styles.colAksi}>Aksi</span>
                </div>
                {wilayahUser.map((id) => {
                  const w = wilayahList.find((x) => x.id === id);
                  if (!w) return null;
                  return (
                    <div key={id} style={styles.slsRow}>
                      <span style={{ ...styles.colKode, fontWeight: 700, color: '#1e3a5f' }}>{w.kode_sls}</span>
                      <span style={styles.colKel}>{w.kelurahan}</span>
                      <span style={styles.colKec}>{w.kecamatan}</span>
                      <span style={{ ...styles.colTarget, fontWeight: 700, color: '#1e3a5f' }}>{Number(w.target || 0)}</span>
                      <span style={styles.colAksi}>
                        <button type="button" onClick={() => handleRemoveSls(ppl.id, id)} style={styles.deleteBtn}>Hapus</button>
                      </span>
                    </div>
                  );
                })}
              </>
            ) : (
              <div style={styles.slsEmpty}>Belum ada Kode SLS untuk petugas ini.</div>
            )}
            {isAddSlsOpen ? (
              <div style={styles.addSlsBox}>
                <select
                  style={{ ...styles.input, flex: 1, fontSize: 12 }}
                  value={selectedSlsId}
                  onChange={(e) => setSelectedSlsId(e.target.value)}
                >
                  <option value="">Pilih Kode SLS</option>
                  {availableSls.map((w) => (
                    <option key={w.id} value={w.id}>{slsLabel(w)}</option>
                  ))}
                </select>
                <button
                  type="button" onClick={() => handleAddSls(ppl.id)}
                  disabled={slsLoading || !selectedSlsId}
                  style={{ ...styles.addBtn, opacity: (!selectedSlsId || slsLoading) ? 0.5 : 1 }}
                >
                  {slsLoading ? 'Menyimpan...' : 'Simpan'}
                </button>
                <button type="button" onClick={() => { setShowAddSls(null); setSelectedSlsId(''); }} style={styles.cancelBtn}>
                  Batal
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => { setShowAddSls(ppl.id); setSelectedSlsId(''); }} style={styles.addSlsBtn}>
                + Tambah SLS
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  // ── Render: baris PPL ────────────────────────────────────────────────
  const renderPplRow = (ppl, showPmlCol = false) => {
    const roleStyle  = roleColor(ppl.role);
    const isExpanded = expandedUserId === ppl.id;
    const colSpan    = showPmlCol ? 8 : 7;
    const pmlNama    = showPmlCol && ppl.pml_id
      ? users.find((p) => p.id === ppl.pml_id)?.nama || '—' : null;

    const firstTdStyle = showPmlCol
      ? styles.td
      : { ...styles.td, paddingLeft: 36, borderLeft: '3px solid #6366f1' };

    return (
      <React.Fragment key={ppl.id}>
        <tr style={{ ...styles.tr, background: showPmlCol ? 'inherit' : '#fafbff' }}>
          {/* Checkbox */}
          <td style={{ ...styles.td, width: 40, textAlign: 'center' }}>
            <input
              type="checkbox"
              checked={selectedIds.has(ppl.id)}
              onChange={() => toggleSelect(ppl.id)}
              style={{ cursor: 'pointer', accentColor: '#1e3a5f', width: 15, height: 15 }}
            />
          </td>
          <td style={firstTdStyle}>
            <button type="button" onClick={() => toggleExpandSls(ppl.id)}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                fontWeight: showPmlCol ? 700 : 600, color: showPmlCol ? '#1e3a5f' : '#334155',
                textAlign: 'left', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              {!showPmlCol && <span style={{ color: '#94a3b8', fontSize: 10 }}>↳</span>}
              {ppl.nama}
              <span style={{ color: '#94a3b8', fontSize: 10 }}>{isExpanded ? '▲' : '▼'}</span>
            </button>
          </td>
          <td style={styles.td}>{ppl.email}</td>
          <td style={styles.td}>
            <span style={{ ...styles.badge, backgroundColor: roleStyle.bg, color: roleStyle.color }}>
              {ppl.role.toUpperCase()}
            </span>
          </td>
          {showPmlCol && (
            <td style={styles.td}>
              {pmlNama
                ? <span style={{ fontSize: 12, background: '#eef2ff', color: '#4338ca', borderRadius: 6, padding: '2px 8px', fontWeight: 600 }}>{pmlNama}</span>
                : <span style={styles.waEmpty}>—</span>}
            </td>
          )}
          <td style={styles.td}>
            {ppl.nomor_whatsapp
              ? <a href={waHref(ppl.nomor_whatsapp)} target="_blank" rel="noreferrer" style={styles.waLink}>{formatWaDisplay(ppl.nomor_whatsapp)}</a>
              : <span style={styles.waEmpty}>—</span>}
          </td>
          <td style={styles.td}><span style={{ fontWeight: 700, color: '#1e3a5f' }}>{getUserTarget(ppl)}</span></td>
          <td style={styles.td}>{new Date(ppl.created_at).toLocaleDateString('id-ID')}</td>
          <td style={styles.td}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => handleEdit(ppl)} style={styles.editBtn}>Edit</button>
              <button onClick={() => handleDelete(ppl)} style={styles.deleteBtn}>Hapus</button>
            </div>
          </td>
        </tr>
        {isExpanded && renderSlsPanel(ppl, colSpan)}
      </React.Fragment>
    );
  };

  // ── Render: baris PML ────────────────────────────────────────────────
  const renderPmlRow = (pml) => {
    const roleStyle   = roleColor(pml.role);
    const isOpen      = !!expandedPmlIds[pml.id];
    const pplChildren = users.filter((u) => u.role === 'ppl' && u.pml_id === pml.id);

    return (
      <React.Fragment key={pml.id}>
        <tr style={{ ...styles.tr, background: '#f8fafc' }}>
          {/* Checkbox */}
          <td style={{ ...styles.td, width: 40, textAlign: 'center' }}>
            <input
              type="checkbox"
              checked={selectedIds.has(pml.id)}
              onChange={() => toggleSelect(pml.id)}
              style={{ cursor: 'pointer', accentColor: '#1e3a5f', width: 15, height: 15 }}
            />
          </td>
          <td style={styles.td}>
            <button type="button" onClick={() => togglePml(pml.id)}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                fontWeight: 700, color: '#1e3a5f', textAlign: 'left', fontSize: 13,
                display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 18, height: 18, background: isOpen ? '#1e3a5f' : '#e2e8f0',
                borderRadius: 4, fontSize: 9, color: isOpen ? 'white' : '#64748b',
                transition: 'all .15s', flexShrink: 0 }}>
                {isOpen ? '▲' : '▼'}
              </span>
              {pml.nama}
              {pplChildren.length > 0 && (
                <span style={{ background: '#eef2ff', color: '#4338ca', borderRadius: 10, padding: '1px 8px', fontSize: 10, fontWeight: 600 }}>
                  {pplChildren.length} PPL
                </span>
              )}
            </button>
          </td>
          <td style={styles.td}>{pml.email}</td>
          <td style={styles.td}>
            <span style={{ ...styles.badge, backgroundColor: roleStyle.bg, color: roleStyle.color }}>
              {pml.role.toUpperCase()}
            </span>
          </td>
          <td style={styles.td}>
            {pml.nomor_whatsapp
              ? <a href={waHref(pml.nomor_whatsapp)} target="_blank" rel="noreferrer" style={styles.waLink}>{formatWaDisplay(pml.nomor_whatsapp)}</a>
              : <span style={styles.waEmpty}>—</span>}
          </td>
          <td style={styles.td}><span style={{ fontWeight: 700, color: '#1e3a5f' }}>{getUserTarget(pml)}</span></td>
          <td style={styles.td}>{new Date(pml.created_at).toLocaleDateString('id-ID')}</td>
          <td style={styles.td}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => handleEdit(pml)} style={styles.editBtn}>Edit</button>
              <button onClick={() => handleDelete(pml)} style={styles.deleteBtn}>Hapus</button>
            </div>
          </td>
        </tr>
        {isOpen && pplChildren.map((ppl) => renderPplRow(ppl, false))}
      </React.Fragment>
    );
  };

  // ── Render: baris admin/plain ────────────────────────────────────────
  const renderPlainRow = (u) => {
    const roleStyle = roleColor(u.role);
    return (
      <tr key={u.id} style={styles.tr}>
        <td style={{ ...styles.td, width: 40, textAlign: 'center' }}>
          <input
            type="checkbox"
            checked={selectedIds.has(u.id)}
            onChange={() => toggleSelect(u.id)}
            style={{ cursor: 'pointer', accentColor: '#1e3a5f', width: 15, height: 15 }}
          />
        </td>
        <td style={styles.td}><span style={{ fontWeight: 700, color: '#1e3a5f', fontSize: 13 }}>{u.nama}</span></td>
        <td style={styles.td}>{u.email}</td>
        <td style={styles.td}>
          <span style={{ ...styles.badge, backgroundColor: roleStyle.bg, color: roleStyle.color }}>
            {u.role.toUpperCase()}
          </span>
        </td>
        <td style={styles.td}>
          {u.nomor_whatsapp
            ? <a href={waHref(u.nomor_whatsapp)} target="_blank" rel="noreferrer" style={styles.waLink}>{formatWaDisplay(u.nomor_whatsapp)}</a>
            : <span style={styles.waEmpty}>—</span>}
        </td>
        <td style={styles.td}><span style={{ color: '#94a3b8', fontSize: 12 }}>—</span></td>
        <td style={styles.td}>{new Date(u.created_at).toLocaleDateString('id-ID')}</td>
        <td style={styles.td}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => handleEdit(u)} style={styles.editBtn}>Edit</button>
            <button onClick={() => handleDelete(u)} style={styles.deleteBtn}>Hapus</button>
          </div>
        </td>
      </tr>
    );
  };

  // ── Render: tbody ────────────────────────────────────────────────────
  const renderTableBody = () => {
  if (loading) return <tr><td colSpan="9" style={styles.empty}>Memuat data...</td></tr>;

  if (activeTab === 'semua') {
    if (filteredUsers.length === 0) return <tr><td colSpan="9" style={styles.empty}>Tidak ada data</td></tr>;
    return (
      <>
        {filteredUsers.filter((u) => u.role === 'admin').map(renderPlainRow)}
        {filteredUsers.filter((u) => u.role === 'pml').map(renderPmlRow)}
        {filteredUsers.filter((u) => u.role === 'ppl' && !u.pml_id).map(renderPlainRow)}
      </>
    );
  }
  if (activeTab === 'pml') {
    const pmls = filteredUsers.filter((u) => u.role === 'pml');
    if (!pmls.length) return <tr><td colSpan="9" style={styles.empty}>Tidak ada data</td></tr>;
    return pmls.map(renderPmlRow);
  }
  if (activeTab === 'admin') {
    const admins = filteredUsers.filter((u) => u.role === 'admin');
    if (!admins.length) return <tr><td colSpan="9" style={styles.empty}>Tidak ada data</td></tr>;
    return admins.map(renderPlainRow);
  }
  if (activeTab === 'ppl') {
    const ppls = filteredUsers.filter((u) => u.role === 'ppl');
    if (!ppls.length) return <tr><td colSpan="9" style={styles.empty}>Tidak ada data</td></tr>;
    return ppls.map((ppl) => renderPplRow(ppl, true));
  }
  return null;
};

  const isPplTab       = activeTab === 'ppl';
  const visibleIds     = getVisibleUserIds();
  const allChecked     = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someChecked    = visibleIds.some((id) => selectedIds.has(id));

  return (
    <div style={styles.container}>

      {/* Stats */}
      <div style={styles.statsRow}>
        {[
          { label: 'Total User', val: users.length, color: '#1e3a5f' },
          { label: 'Admin',      val: counts.admin,  color: '#dc2626' },
          { label: 'PML',        val: counts.pml,    color: '#6366f1' },
          { label: 'PPL',        val: counts.ppl,    color: '#16a34a' }
        ].map((s) => (
          <div key={s.label} style={styles.statCard}>
            <div style={{ ...styles.statNum, color: s.color }}>{s.val}</div>
            <div style={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Pesan notifikasi */}
      {pesan.text && (
        <div style={{
          ...styles.pesan,
          backgroundColor: pesan.type === 'success' ? '#dcfce7' : '#fee2e2',
          color:           pesan.type === 'success' ? '#15803d' : '#dc2626'
        }}>
          {pesan.text}
        </div>
      )}

      {/* ── Tabs & tombol aksi ── */}
      <div style={{ ...styles.rowBetween, flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {/* Tabs */}
        <div style={styles.tabs}>
          {[['semua','Semua'],['admin','Admin'],['pml','PML'],['ppl','PPL']].map(([val, label]) => (
            <button key={val}
              onClick={() => { setActiveTab(val); setSelectedIds(new Set()); }}
              style={{ ...styles.tab, ...(activeTab === val ? styles.tabActive : {}) }}>
              {label}
            </button>
          ))}
        </div>

        {/* ── Search ── */}
  <input
    type="text"
    placeholder="🔍 Cari nama / email..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    style={{
      padding: '8px 12px',
      border: '1.5px solid #e2e8f0',
      borderRadius: 8,
      fontSize: 13,
      outline: 'none',
      width: 220,
      color: '#334155'
    }}
  />

        {/* Tombol kanan */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>

          {/* Hapus terpilih — muncul jika ada yang dicentang */}
          {selectedIds.size > 0 && (
            <button onClick={handleDeleteBulk} style={styles.deleteBulkBtn}>
              🗑 Hapus {selectedIds.size} Terpilih
            </button>
          )}

          {/* Import Excel */}
          <input
            type="file"
            accept=".xlsx,.xls"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleImportExcel}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importLoading}
            style={{ ...styles.importBtn, opacity: importLoading ? 0.6 : 1, cursor: importLoading ? 'not-allowed' : 'pointer' }}
          >
            {importLoading ? '⏳ Mengimpor...' : '📥 Import Excel'}
          </button>

          {/* Download template CSV */}
          <button onClick={handleDownloadTemplate} style={styles.templateBtn}>
            📄 Template
          </button>

          {/* Tambah manual */}
          <button onClick={() => showForm ? resetForm() : setShowForm(true)} style={styles.addBtn}>
            {showForm ? '✕ Batal' : '+ Tambah Petugas'}
          </button>
        </div>
      </div>

      {/* ── Hasil import — tampil jika ada baris yang gagal ── */}
      {importResult && importResult.gagal?.length > 0 && (
        <div style={styles.importResultBox}>
          <div style={{ fontWeight: 700, marginBottom: 8, color: '#92400e', fontSize: 13 }}>
            ⚠️ {importResult.berhasil} berhasil, {importResult.gagal.length} baris gagal:
          </div>
          <div style={{ maxHeight: 160, overflowY: 'auto' }}>
            {importResult.gagal.map((g, i) => (
              <div key={i} style={{ fontSize: 12, color: '#78350f', marginBottom: 3 }}>
                • <b>{g.email}</b>: {g.alasan}
              </div>
            ))}
          </div>
          <button
            onClick={() => setImportResult(null)}
            style={{ marginTop: 8, fontSize: 11, color: '#92400e', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Tutup
          </button>
        </div>
      )}

      {/* ── Form Tambah / Edit ── */}
      {showForm && (
        <div style={styles.formCard}>
          <h4 style={styles.formTitle}>{editingId ? '✏️ Edit Petugas' : '➕ Tambah Petugas Baru'}</h4>
          <form onSubmit={handleSubmit}>
            <div style={styles.formGrid}>
              <div style={styles.field}>
                <label style={styles.label}>Nama Lengkap</label>
                <input style={styles.input} type="text" value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })} required />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Email</label>
                <input style={styles.input} type="email" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>
                  Password{' '}
                  {editingId && <span style={{ fontWeight: 400, color: '#94a3b8' }}>(kosongkan jika tidak diubah)</span>}
                </label>
                <input style={styles.input} type="password" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required={!editingId} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Role</label>
                <select style={styles.input} value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value, pml_id: '', wilayah_ids: [] })}>
                  <option value="admin">Admin</option>
                  <option value="pml">PML</option>
                  <option value="ppl">PPL</option>
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Nomor WhatsApp</label>
                <div style={styles.waInputWrap}>
                  <span style={styles.waPrefix}>+62</span>
                  <input
                    style={{ ...styles.input, border: 'none', borderRadius: 0, flex: 1, outline: 'none' }}
                    type="tel" placeholder="812-3456-7890"
                    value={form.nomor_whatsapp}
                    onChange={(e) => setForm({ ...form, nomor_whatsapp: e.target.value })}
                  />
                </div>
              </div>
              {form.role === 'ppl' && (
                <div style={styles.field}>
                  <label style={styles.label}>PML Atasan</label>
                  <select style={styles.input} value={form.pml_id}
                    onChange={(e) => setForm({ ...form, pml_id: e.target.value })}>
                    <option value="">-- Pilih PML --</option>
                    {pmlList.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* Kode SLS — hanya untuk PPL */}
            {form.role === 'ppl' && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ ...styles.label, display: 'block', marginBottom: 6 }}>Kode SLS</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <select style={{ ...styles.input, flex: 1 }} value={formSelectedWilayahId}
                    onChange={(e) => setFormSelectedWilayahId(e.target.value)}>
                    <option value="">Pilih Kode SLS</option>
                    {wilayahList
                      .filter((w) => {
                        const usedIds = users
                          .filter((u) => u.role === 'ppl' && u.id !== editingId)
                          .flatMap((u) => Array.isArray(u.wilayah_ids) ? u.wilayah_ids.map(Number) : []);
                        return !form.wilayah_ids.includes(w.id) && !usedIds.includes(Number(w.id));
                      })
                      .map((w) => <option key={w.id} value={w.id}>{slsLabel(w)}</option>)}
                  </select>
                  <button type="button" onClick={addWilayahForm} style={styles.addBtn}>+ Tambah</button>
                </div>
                {form.wilayah_ids.length > 0 && (
                  <>
                    <div style={styles.slsTableHeader}>
                      <span style={styles.colKode}>Kode SLS</span>
                      <span style={styles.colKel}>Kelurahan</span>
                      <span style={styles.colKec}>Kecamatan</span>
                      <span style={styles.colTarget}>Target</span>
                      <span style={styles.colAksi}>Aksi</span>
                    </div>
                    {form.wilayah_ids.map((id) => {
                      const w = wilayahList.find((x) => x.id === id);
                      if (!w) return null;
                      return (
                        <div key={id} style={styles.slsRow}>
                          <span style={{ ...styles.colKode, fontWeight: 700, color: '#1e3a5f' }}>{w.kode_sls}</span>
                          <span style={styles.colKel}>{w.kelurahan}</span>
                          <span style={styles.colKec}>{w.kecamatan}</span>
                          <span style={{ ...styles.colTarget, fontWeight: 700, color: '#1e3a5f' }}>{Number(w.target || 0)}</span>
                          <span style={styles.colAksi}>
                            <button type="button" onClick={() => removeWilayahForm(id)} style={styles.deleteBtn}>Hapus</button>
                          </span>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}

            <button type="submit" style={styles.submitBtn}>
              {editingId ? '💾 Update Petugas' : '✅ Simpan Petugas'}
            </button>
          </form>
        </div>
      )}

      {/* ── Tabel ── */}
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              {/* Select-all checkbox */}
              <th style={{ ...styles.th, width: 40, textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={allChecked}
                  ref={(el) => { if (el) el.indeterminate = someChecked && !allChecked; }}
                  onChange={toggleSelectAll}
                  style={{ cursor: 'pointer', accentColor: '#1e3a5f', width: 15, height: 15 }}
                />
              </th>
              <th style={styles.th}>Nama</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Role</th>
              {isPplTab && <th style={styles.th}>PML Atasan</th>}
              <th style={styles.th}>No. WhatsApp</th>
              <th style={styles.th}>Target</th>
              <th style={styles.th}>Dibuat</th>
              <th style={styles.th}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {renderTableBody()}
          </tbody>
        </table>
      </div>

    </div>
  );
};

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  container:   { padding: '1.5rem', height: '100%', overflowY: 'auto' },
  statsRow:    { display: 'flex', gap: 16, marginBottom: 20 },
  statCard:    { flex: 1, backgroundColor: 'white', borderRadius: 12, padding: '1rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  statNum:     { fontSize: 28, fontWeight: 800, color: '#1e3a5f' },
  statLabel:   { fontSize: 12, color: '#64748b', marginTop: 4 },
  pesan:       { padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontWeight: 600, fontSize: 13 },
  rowBetween:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  tabs:        { display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 8, padding: 3 },
  tab:         { padding: '6px 16px', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'transparent', color: '#64748b' },
  tabActive:   { background: '#1e3a5f', color: 'white' },
  addBtn:      { padding: '8px 16px', backgroundColor: '#1e3a5f', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  cancelBtn:   { padding: '8px 14px', backgroundColor: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  // ── BARU ──
  deleteBulkBtn: { padding: '8px 16px', backgroundColor: '#fee2e2', color: '#dc2626', border: '1.5px solid #fca5a5', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  importBtn:     { padding: '8px 16px', backgroundColor: '#f0fdf4', color: '#16a34a', border: '1.5px solid #86efac', borderRadius: 8, fontSize: 13, fontWeight: 600 },
  templateBtn:   { padding: '8px 16px', backgroundColor: '#f8fafc', color: '#475569', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  importResultBox: { backgroundColor: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '12px 16px', marginBottom: 16 },
  // ────────────
  formCard:    { backgroundColor: 'white', borderRadius: 12, padding: '1.5rem', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  formTitle:   { margin: '0 0 1rem 0', color: '#1e3a5f', fontSize: 14 },
  formGrid:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 },
  field:       { display: 'flex', flexDirection: 'column', gap: 4 },
  label:       { fontSize: 12, fontWeight: 600, color: '#374151' },
  input:       { padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none' },
  submitBtn:   { padding: '10px 24px', backgroundColor: '#1e3a5f', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  waInputWrap: { display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' },
  waPrefix:    { padding: '8px 10px', background: '#f8fafc', fontSize: 13, color: '#64748b', borderRight: '1px solid #e2e8f0', whiteSpace: 'nowrap', flexShrink: 0 },
  waLink:      { color: '#16a34a', fontSize: 12, textDecoration: 'none' },
  waEmpty:     { color: '#94a3b8', fontSize: 12 },
  tableWrap:   { backgroundColor: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  table:       { width: '100%', borderCollapse: 'collapse' },
  th:          { padding: '10px 14px', background: '#f8fafc', fontSize: 11, fontWeight: 700, color: '#64748b', textAlign: 'left', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' },
  tr:          { borderBottom: '1px solid #f1f5f9' },
  td:          { padding: '10px 14px', fontSize: 13, color: '#334155' },
  badge:       { padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  editBtn:     { padding: '5px 12px', backgroundColor: '#eef2ff', color: '#4f46e5', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  deleteBtn:   { padding: '5px 12px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  empty:       { textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 13 },
  expandPanel:    { background: '#f8fafc', padding: '16px 20px', borderTop: '2px solid #e2e8f0' },
  expandHeader:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  expandTitle:    { fontSize: 13, fontWeight: 700, color: '#1e3a5f' },
  slsTableHeader: { display: 'flex', alignItems: 'center', padding: '6px 12px', background: '#f1f5f9', borderRadius: 6, fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 },
  slsRow:         { display: 'flex', alignItems: 'center', padding: '9px 12px', background: 'white', borderRadius: 8, marginBottom: 4, fontSize: 13, color: '#334155', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  colKode:   { flex: '0 0 120px' },
  colKel:    { flex: 1 },
  colKec:    { flex: 1 },
  colTarget: { flex: '0 0 70px', textAlign: 'right', paddingRight: 8 },
  colAksi:   { flex: '0 0 80px', display: 'flex', justifyContent: 'flex-end' },
  slsEmpty:  { padding: '12px', color: '#94a3b8', fontSize: 13, fontStyle: 'italic', marginBottom: 10 },
  addSlsBtn: { padding: '7px 16px', backgroundColor: 'white', color: '#1e3a5f', border: '1.5px dashed #1e3a5f', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', marginTop: 8 },
  addSlsBox: { display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, padding: '10px 12px', background: 'white', borderRadius: 8, border: '1px solid #e2e8f0' }
};

export default KelolaPetugas;