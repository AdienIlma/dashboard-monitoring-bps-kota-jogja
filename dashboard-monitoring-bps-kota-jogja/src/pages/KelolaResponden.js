import React, { useEffect, useState } from 'react';
import api from '../services/api';

const KelolaResponden = () => {
  const [responden, setResponden] = useState([]);
  const [pplList, setPplList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nama_kepala_keluarga: '', alamat: '', kecamatan: '', kelurahan: '' });
  const [pesan, setPesan] = useState({ text: '', type: '' });
  const [assignTarget, setAssignTarget] = useState(null);
  const [assignPPL, setAssignPPL] = useState('');
  const [filterStatus, setFilterStatus] = useState('semua');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [res, ppl] = await Promise.all([
        api.get('/admin/responden'),
        api.get('/admin/users'),
      ]);
      setResponden(res.data);
      setPplList(ppl.data.filter(u => u.role === 'ppl'));
    } catch (err) {
      console.error('Gagal ambil data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTambah = async (e) => {
    e.preventDefault();
    setPesan({ text: '', type: '' });
    try {
      await api.post('/admin/responden', form);
      setPesan({ text: '✅ Responden berhasil ditambahkan!', type: 'success' });
      setForm({ nama_kepala_keluarga: '', alamat: '', kecamatan: '', kelurahan: '' });
      setShowForm(false);
      fetchData();
    } catch (err) {
      setPesan({ text: '❌ ' + (err.response?.data?.message || 'Gagal tambah'), type: 'error' });
    }
  };

  const handleAssign = async (id) => {
    if (!assignPPL) return;
    try {
      await api.put(`/admin/responden/${id}/assign`, { ppl_id: assignPPL });
      setPesan({ text: '✅ Berhasil di-assign!', type: 'success' });
      setAssignTarget(null);
      setAssignPPL('');
      fetchData();
    } catch (err) {
      setPesan({ text: '❌ ' + (err.response?.data?.message || 'Gagal assign'), type: 'error' });
    }
  };

  const statusColor = (status) => {
    switch (status) {
      case 'belum': return { bg: '#f1f5f9', color: '#64748b' };
      case 'sudah_lapangan': return { bg: '#fef3c7', color: '#f59e0b' };
      case 'submitted': return { bg: '#dbeafe', color: '#3b82f6' };
      case 'approved': return { bg: '#dcfce7', color: '#22c55e' };
      case 'ditolak': return { bg: '#fee2e2', color: '#ef4444' };
      default: return { bg: '#f1f5f9', color: '#64748b' };
    }
  };

  const statusLabel = (status) => {
    switch (status) {
      case 'belum': return 'Belum';
      case 'sudah_lapangan': return 'Di Lapangan';
      case 'submitted': return 'Submit';
      case 'approved': return 'Approved';
      case 'ditolak': return 'Ditolak';
      default: return status;
    }
  };

  const filtered = responden.filter(r => {
    const matchStatus = filterStatus === 'semua' || r.status === filterStatus;
    const matchSearch = !search || r.nama_kepala_keluarga.toLowerCase().includes(search.toLowerCase()) || r.alamat.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const counts = {
    semua: responden.length,
    belum: responden.filter(r => r.status === 'belum').length,
    sudah_lapangan: responden.filter(r => r.status === 'sudah_lapangan').length,
    submitted: responden.filter(r => r.status === 'submitted').length,
    approved: responden.filter(r => r.status === 'approved').length,
  };

  return (
    <div style={styles.container}>
      {/* Stats */}
      <div style={styles.statsRow}>
        {[
          { label: 'Total', val: counts.semua, color: '#1e3a5f' },
          { label: 'Belum', val: counts.belum, color: '#94a3b8' },
          { label: 'Di Lapangan', val: counts.sudah_lapangan, color: '#f59e0b' },
          { label: 'Submit', val: counts.submitted, color: '#3b82f6' },
          { label: 'Approved', val: counts.approved, color: '#22c55e' },
        ].map(s => (
          <div key={s.label} style={styles.statCard}>
            <div style={{ ...styles.statNum, color: s.color }}>{s.val}</div>
            <div style={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Pesan */}
      {pesan.text && (
        <div style={{ ...styles.pesan, backgroundColor: pesan.type === 'success' ? '#dcfce7' : '#fee2e2', color: pesan.type === 'success' ? '#16a34a' : '#dc2626' }}>
          {pesan.text}
        </div>
      )}

      {/* Filter + Search + Tombol */}
      <div style={styles.toolbar}>
        <div style={styles.tabs}>
          {[['semua', 'Semua'], ['belum', 'Belum'], ['sudah_lapangan', 'Lapangan'], ['submitted', 'Submit'], ['approved', 'Approved']].map(([val, label]) => (
            <button key={val} onClick={() => setFilterStatus(val)} style={{ ...styles.tab, ...(filterStatus === val ? styles.tabActive : {}) }}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="🔍 Cari nama/alamat..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={styles.searchInput}
          />
          <button onClick={() => setShowForm(!showForm)} style={styles.addBtn}>
            {showForm ? '✕ Batal' : '+ Tambah'}
          </button>
        </div>
      </div>

      {/* Form Tambah */}
      {showForm && (
        <div style={styles.formCard}>
          <h4 style={styles.formTitle}>Tambah Responden Baru</h4>
          <form onSubmit={handleTambah}>
            <div style={styles.formGrid}>
              <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
                <label style={styles.label}>Nama Kepala Keluarga</label>
                <input style={styles.input} type="text" placeholder="Nama KK" value={form.nama_kepala_keluarga} onChange={e => setForm({ ...form, nama_kepala_keluarga: e.target.value })} required />
              </div>
              <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
                <label style={styles.label}>Alamat</label>
                <input style={styles.input} type="text" placeholder="Alamat lengkap" value={form.alamat} onChange={e => setForm({ ...form, alamat: e.target.value })} required />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Kecamatan</label>
                <input style={styles.input} type="text" placeholder="Kecamatan" value={form.kecamatan} onChange={e => setForm({ ...form, kecamatan: e.target.value })} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Kelurahan</label>
                <input style={styles.input} type="text" placeholder="Kelurahan" value={form.kelurahan} onChange={e => setForm({ ...form, kelurahan: e.target.value })} />
              </div>
            </div>
            <button type="submit" style={styles.submitBtn}>Simpan Responden</button>
          </form>
        </div>
      )}

      {/* Tabel */}
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Nama KK</th>
              <th style={styles.th}>Alamat</th>
              <th style={styles.th}>Wilayah</th>
              <th style={styles.th}>PPL</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={styles.empty}>Memuat data...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="6" style={styles.empty}>Tidak ada data</td></tr>
            ) : (
              filtered.map(r => (
                <React.Fragment key={r.id}>
                  <tr style={styles.tr}>
                    <td style={styles.td}><strong>{r.nama_kepala_keluarga}</strong></td>
                    <td style={styles.td}>{r.alamat}</td>
                    <td style={styles.td}>{r.kelurahan ? `${r.kelurahan}, ${r.kecamatan}` : '-'}</td>
                    <td style={styles.td}>{r.nama_ppl || <span style={{ color: '#94a3b8' }}>Belum assign</span>}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, backgroundColor: statusColor(r.status).bg, color: statusColor(r.status).color }}>
                        {statusLabel(r.status)}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {r.status === 'belum' && (
                        <button
                          onClick={() => setAssignTarget(assignTarget === r.id ? null : r.id)}
                          style={styles.assignBtn}
                        >
                          {assignTarget === r.id ? '✕ Batal' : '👤 Assign'}
                        </button>
                      )}
                    </td>
                  </tr>
                  {/* Row assign PPL */}
                  {assignTarget === r.id && (
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      <td colSpan="6" style={{ padding: '8px 14px' }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <select
                            value={assignPPL}
                            onChange={e => setAssignPPL(e.target.value)}
                            style={{ ...styles.input, flex: 1, margin: 0 }}
                          >
                            <option value="">Pilih PPL</option>
                            {pplList.map(p => (
                              <option key={p.id} value={p.id}>{p.nama}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleAssign(r.id)}
                            disabled={!assignPPL}
                            style={{ ...styles.submitBtn, padding: '8px 16px' }}
                          >
                            Simpan
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '1.5rem', height: '100%', overflowY: 'auto' },
  statsRow: { display: 'flex', gap: 12, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: 'white', borderRadius: 12, padding: '1rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  statNum: { fontSize: 24, fontWeight: 800 },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 4 },
  pesan: { padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontWeight: 600, fontSize: 13 },
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 },
  tabs: { display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 8, padding: 3 },
  tab: { padding: '6px 12px', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: 'transparent', color: '#64748b' },
  tabActive: { background: '#1e3a5f', color: 'white' },
  searchInput: { padding: '7px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, outline: 'none', width: 200 },
  addBtn: { padding: '8px 16px', backgroundColor: '#1e3a5f', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  formCard: { backgroundColor: 'white', borderRadius: 12, padding: '1.5rem', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  formTitle: { margin: '0 0 1rem 0', color: '#1e3a5f', fontSize: 14 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { fontSize: 12, fontWeight: 600, color: '#374151' },
  input: { padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none' },
  submitBtn: { padding: '10px 24px', backgroundColor: '#1e3a5f', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  tableWrap: { backgroundColor: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '10px 14px', background: '#f8fafc', fontSize: 11, fontWeight: 700, color: '#64748b', textAlign: 'left', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '10px 14px', fontSize: 13, color: '#334155' },
  badge: { padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  assignBtn: { padding: '5px 12px', backgroundColor: '#eef2ff', color: '#6366f1', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  empty: { textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 13 },
};

export default KelolaResponden;