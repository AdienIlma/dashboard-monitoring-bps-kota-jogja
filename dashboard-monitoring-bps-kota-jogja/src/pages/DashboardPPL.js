import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const DashboardPPL = () => {
  const { user, logout } = useAuth();
  const [responden, setResponden] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(null);
  const [catatan, setCatatan] = useState({});
  const [pesan, setPesan] = useState('');

  useEffect(() => {
    fetchResponden();
    kirimLokasiOtomatis();
    const interval = setInterval(kirimLokasiOtomatis, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchResponden = async () => {
    try {
      const res = await api.get('/ppl/responden');
      setResponden(res.data);
    } catch (err) {
      console.error('Gagal ambil data', err);
    } finally {
      setLoading(false);
    }
  };

  const kirimLokasiOtomatis = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        await api.post('/ppl/lokasi', {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      } catch (err) {
        console.error('Gagal kirim lokasi', err);
      }
    });
  };

  const handleSubmit = async (id) => {
    setSubmitLoading(id);
    setPesan('');
    try {
      await api.post(`/ppl/responden/${id}/submit`, {
        catatan_ppl: catatan[id] || '',
      });
      setPesan('✅ Berhasil disubmit!');
      fetchResponden();
    } catch (err) {
      setPesan('❌ Gagal submit: ' + (err.response?.data?.message || 'Error'));
    } finally {
      setSubmitLoading(null);
    }
  };

  const statusColor = (status) => {
    switch (status) {
      case 'belum': return '#94a3b8';
      case 'sudah_lapangan': return '#f59e0b';
      case 'submitted': return '#3b82f6';
      case 'approved': return '#22c55e';
      case 'ditolak': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  const statusLabel = (status) => {
    switch (status) {
      case 'belum': return 'Belum';
      case 'sudah_lapangan': return 'Di Lapangan';
      case 'submitted': return 'Sudah Submit';
      case 'approved': return 'Disetujui';
      case 'ditolak': return 'Ditolak';
      default: return status;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.headerTitle}>Halo, {user?.nama}! 👋</h2>
          <p style={styles.headerSub}>Petugas PPL</p>
        </div>
        <button style={styles.logoutBtn} onClick={logout}>Logout</button>
      </div>

      {pesan && <div style={styles.pesan}>{pesan}</div>}

      <h3 style={styles.sectionTitle}>Daftar Tugas ({responden.length})</h3>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#64748b' }}>Memuat data...</p>
      ) : responden.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#64748b' }}>Belum ada tugas.</p>
      ) : (
        responden.map((r) => (
          <div key={r.id} style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <p style={styles.nama}>{r.nama_kepala_keluarga}</p>
                <p style={styles.alamat}>{r.alamat}</p>
                {r.kecamatan && <p style={styles.wilayah}>{r.kelurahan}, {r.kecamatan}</p>}
              </div>
              <span style={{ ...styles.badge, backgroundColor: statusColor(r.status) }}>
                {statusLabel(r.status)}
              </span>
            </div>
            {(r.status === 'sudah_lapangan' || r.status === 'ditolak') && (
              <div style={styles.submitArea}>
                <textarea
                  style={styles.textarea}
                  placeholder="Catatan (opsional)..."
                  value={catatan[r.id] || ''}
                  onChange={(e) => setCatatan({ ...catatan, [r.id]: e.target.value })}
                  rows={2}
                />
                <button
                  style={styles.submitBtn}
                  onClick={() => handleSubmit(r.id)}
                  disabled={submitLoading === r.id}
                >
                  {submitLoading === r.id ? 'Mengirim...' : '📤 Submit'}
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

const styles = {
  container: { maxWidth: '480px', margin: '0 auto', padding: '1rem', backgroundColor: '#f0f4f8', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e3a5f', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', color: 'white' },
  headerTitle: { margin: 0, fontSize: '1.1rem' },
  headerSub: { margin: 0, fontSize: '0.8rem', opacity: 0.8 },
  logoutBtn: { backgroundColor: 'transparent', border: '1px solid white', color: 'white', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' },
  pesan: { backgroundColor: 'white', padding: '10px', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', fontWeight: '600' },
  sectionTitle: { color: '#1e3a5f', marginBottom: '0.75rem', fontSize: '1rem' },
  card: { backgroundColor: 'white', borderRadius: '12px', padding: '1rem', marginBottom: '0.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  nama: { fontWeight: '700', color: '#1e293b', margin: '0 0 4px 0' },
  alamat: { color: '#64748b', fontSize: '0.85rem', margin: '0 0 2px 0' },
  wilayah: { color: '#94a3b8', fontSize: '0.8rem', margin: 0 },
  badge: { color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', whiteSpace: 'nowrap' },
  submitArea: { marginTop: '0.75rem' },
  textarea: { width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box', resize: 'none', marginBottom: '0.5rem' },
  submitBtn: { width: '100%', padding: '10px', backgroundColor: '#1e3a5f', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer' },
};

export default DashboardPPL;