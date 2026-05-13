
import React, { useEffect, useState } from 'react';
import api from '../services/api';

const initialForm = {
  nama: '',
  username: '',
  password: '',
  role: 'pml',
  pml_id: ''
};

const KelolaPetugas = () => {
  const [users, setUsers] = useState([]);
  const [pmlList, setPmlList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [pesan, setPesan] = useState({ text: '', type: '' });
  const [activeTab, setActiveTab] = useState('semua');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
      setPmlList(res.data.filter((u) => u.role === 'pml'));
    } catch (err) {
      console.error('Gagal ambil users', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPesan({ text: '', type: '' });

    try {
      const payload = {
        ...form,
        pml_id: form.role === 'ppl' ? form.pml_id || null : null,
        password: form.password || undefined
      };

      if (editingId) {
        if (!payload.password) delete payload.password;
        await api.put(`/admin/users/${editingId}`, payload);
        setPesan({ text: '✅ Petugas berhasil diupdate!', type: 'success' });
      } else {
        await api.post('/admin/users', payload);
        setPesan({ text: '✅ Petugas berhasil ditambahkan!', type: 'success' });
      }

      resetForm();
      fetchUsers();
    } catch (err) {
      setPesan({
        text: '❌ ' + (err.response?.data?.message || 'Gagal simpan petugas'),
        type: 'error'
      });
    }
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    setForm({
      nama: user.nama,
      username: user.username,
      password: '',
      role: user.role,
      pml_id: user.pml_id || ''
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Hapus user ${user.nama}?`)) return;

    try {
      await api.delete(`/admin/users/${user.id}`);
      setPesan({ text: '✅ Petugas berhasil dihapus!', type: 'success' });
      fetchUsers();
    } catch (err) {
      setPesan({
        text: '❌ ' + (err.response?.data?.message || 'Gagal hapus petugas'),
        type: 'error'
      });
    }
  };

  const filteredUsers = users.filter((u) => {
    if (activeTab === 'semua') return true;
    return u.role === activeTab;
  });

  const counts = {
    admin: users.filter((u) => u.role === 'admin').length,
    pml: users.filter((u) => u.role === 'pml').length,
    ppl: users.filter((u) => u.role === 'ppl').length
  };

  const roleColor = (role) => {
    switch (role) {
      case 'admin':
        return { bg: '#fee2e2', color: '#dc2626' };
      case 'pml':
        return { bg: '#eef2ff', color: '#6366f1' };
      case 'ppl':
        return { bg: '#f0fdf4', color: '#16a34a' };
      default:
        return { bg: '#f1f5f9', color: '#64748b' };
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={styles.statNum}>{users.length}</div>
          <div style={styles.statLabel}>Total User</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statNum, color: '#dc2626' }}>{counts.admin}</div>
          <div style={styles.statLabel}>Admin</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statNum, color: '#6366f1' }}>{counts.pml}</div>
          <div style={styles.statLabel}>PML</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statNum, color: '#16a34a' }}>{counts.ppl}</div>
          <div style={styles.statLabel}>PPL</div>
        </div>
      </div>

      {pesan.text && (
        <div
          style={{
            ...styles.pesan,
            backgroundColor: pesan.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: pesan.type === 'success' ? '#15803d' : '#dc2626'
          }}
        >
          {pesan.text}
        </div>
      )}

      <div style={styles.rowBetween}>
        <div style={styles.tabs}>
          {[
            ['semua', 'Semua'],
            ['admin', 'Admin'],
            ['pml', 'PML'],
            ['ppl', 'PPL']
          ].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setActiveTab(val)}
              style={{
                ...styles.tab,
                ...(activeTab === val ? styles.tabActive : {})
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
            }
          }}
          style={styles.addBtn}
        >
          {showForm ? '✕ Batal' : '+ Tambah Petugas'}
        </button>
      </div>

      {showForm && (
        <div style={styles.formCard}>
          <h4 style={styles.formTitle}>
            {editingId ? 'Edit Petugas' : 'Tambah Petugas Baru'}
          </h4>

          <form onSubmit={handleSubmit}>
            <div style={styles.formGrid}>
              <div style={styles.field}>
                <label style={styles.label}>Nama Lengkap</label>
                <input
                  style={styles.input}
                  type="text"
                  value={form.nama}
                  onChange={(e) =>
                    setForm({ ...form, nama: e.target.value })
                  }
                  required
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Username</label>
                <input
                  style={styles.input}
                  type="text"
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                  required
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>
                  Password {editingId && '(Kosongkan jika tidak diubah)'}
                </label>
                <input
                  style={styles.input}
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required={!editingId}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Role</label>
                <select
                  style={styles.input}
                  value={form.role}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      role: e.target.value,
                      pml_id: ''
                    })
                  }
                >
                  <option value="admin">Admin</option>
                  <option value="pml">PML</option>
                  <option value="ppl">PPL</option>
                </select>
              </div>

              {form.role === 'ppl' && (
                <div style={styles.field}>
                  <label style={styles.label}>PML Atasan</label>
                  <select
                    style={styles.input}
                    value={form.pml_id}
                    onChange={(e) =>
                      setForm({ ...form, pml_id: e.target.value })
                    }
                    required
                  >
                    <option value="">Pilih PML</option>
                    {pmlList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nama}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <button type="submit" style={styles.submitBtn}>
              {editingId ? 'Update Petugas' : 'Simpan Petugas'}
            </button>
          </form>
        </div>
      )}

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Nama</th>
              <th style={styles.th}>Username</th>
              <th style={styles.th}>Role</th>
              <th style={styles.th}>PML Atasan</th>
              <th style={styles.th}>Dibuat</th>
              <th style={styles.th}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={styles.empty}>
                  Memuat data...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="6" style={styles.empty}>
                  Belum ada data
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const roleStyle = roleColor(u.role);
                return (
                  <tr key={u.id} style={styles.tr}>
                    <td style={styles.td}>
                      <strong>{u.nama}</strong>
                    </td>
                    <td style={styles.td}>{u.username}</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badge,
                          backgroundColor: roleStyle.bg,
                          color: roleStyle.color
                        }}
                      >
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {u.pml_id
                        ? users.find((p) => p.id === u.pml_id)?.nama || '-'
                        : '-'}
                    </td>
                    <td style={styles.td}>
                      {new Date(u.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => handleEdit(u)}
                          style={styles.editBtn}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          style={styles.deleteBtn}
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '1.5rem', height: '100%', overflowY: 'auto' },
  statsRow: { display: 'flex', gap: 16, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: '1rem',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  statNum: { fontSize: 28, fontWeight: 800, color: '#1e3a5f' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 4 },
  pesan: {
    padding: '10px 16px',
    borderRadius: 8,
    marginBottom: 16,
    fontWeight: 600,
    fontSize: 13
  },
  rowBetween: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  tabs: {
    display: 'flex',
    gap: 4,
    background: '#f1f5f9',
    borderRadius: 8,
    padding: 3
  },
  tab: {
    padding: '6px 16px',
    border: 'none',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    background: 'transparent',
    color: '#64748b'
  },
  tabActive: {
    background: '#1e3a5f',
    color: 'white'
  },
  addBtn: {
    padding: '8px 16px',
    backgroundColor: '#1e3a5f',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer'
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: '1.5rem',
    marginBottom: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  formTitle: {
    margin: '0 0 1rem 0',
    color: '#1e3a5f',
    fontSize: 14
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    marginBottom: 16
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: '#374151'
  },
  input: {
    padding: '8px 10px',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    fontSize: 13,
    outline: 'none'
  },
  submitBtn: {
    padding: '10px 24px',
    backgroundColor: '#1e3a5f',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer'
  },
  tableWrap: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    padding: '10px 14px',
    background: '#f8fafc',
    fontSize: 11,
    fontWeight: 700,
    color: '#64748b',
    textAlign: 'left',
    textTransform: 'uppercase',
    borderBottom: '1px solid #e2e8f0'
  },
  tr: {
    borderBottom: '1px solid #f1f5f9'
  },
  td: {
    padding: '10px 14px',
    fontSize: 13,
    color: '#334155'
  },
  badge: {
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 700
  },
  editBtn: {
    padding: '5px 12px',
    backgroundColor: '#eef2ff',
    color: '#4f46e5',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600
  },
  deleteBtn: {
    padding: '5px 12px',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600
  },
  empty: {
    textAlign: 'center',
    padding: 40,
    color: '#94a3b8',
    fontSize: 13
  }
};

export default KelolaPetugas;