import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const DashboardPML = () => {
  const { user, logout } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewLoading, setReviewLoading] = useState(null);
  const [catatan, setCatatan] = useState({});
  const [pesan, setPesan] = useState('');

  useEffect(() => {
    fetchSubmissions();
    kirimLokasiOtomatis();
    const interval = setInterval(kirimLokasiOtomatis, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const kirimLokasiOtomatis = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        await api.post('/pml/lokasi', {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      } catch (err) {
        console.error('Gagal kirim lokasi PML', err);
      }
    });
  };

  const fetchSubmissions = async () => {
    try {
      const res = await api.get('/pml/submissions');
      setSubmissions(res.data);
    } catch (err) {
      console.error('Gagal ambil data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id, status) => {
    setReviewLoading(id + status);
    setPesan('');
    try {
      await api.put(`/pml/submissions/${id}/review`, {
        status,
        catatan_pml: catatan[id] || '',
      });
      setPesan(status === 'approved' ? '✅ Submission disetujui!' : '❌ Submission ditolak!');
      fetchSubmissions();
    } catch (err) {
      setPesan('Gagal: ' + (err.response?.data?.message || 'Error'));
    } finally {
      setReviewLoading(null);
    }
  };

  const statusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'approved': return '#22c55e';
      case 'ditolak': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  const statusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Menunggu';
      case 'approved': return 'Disetujui';
      case 'ditolak': return 'Ditolak';
      default: return status;
    }
  };

  const pending = submissions.filter(s => s.status === 'pending');
  const selesai = submissions.filter(s => s.status !== 'pending');

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.headerTitle}>Halo, {user?.nama}! 👋</h2>
          <p style={styles.headerSub}>Petugas PML</p>
        </div>
        <button style={styles.logoutBtn} onClick={logout}>Logout</button>
      </div>

      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <p style={styles.statNum}>{pending.length}</p>
          <p style={styles.statLabel}>Menunggu</p>
        </div>
        <div style={styles.statCard}>
          <p style={{ ...styles.statNum, color: '#22c55e' }}>{submissions.filter(s => s.status === 'approved').length}</p>
          <p style={styles.statLabel}>Disetujui</p>
        </div>
        <div style={styles.statCard}>
          <p style={{ ...styles.statNum, color: '#ef4444' }}>{submissions.filter(s => s.status === 'ditolak').length}</p>
          <p style={styles.statLabel}>Ditolak</p>
        </div>
      </div>

      {pesan && <div style={styles.pesan}>{pesan}</div>}

      {loading ? (
        <p style={{ textAlign: 'center', color: '#64748b' }}>Memuat data...</p>
      ) : (
        <>
          <h3 style={styles.sectionTitle}>Perlu Direview ({pending.length})</h3>
          {pending.length === 0 ? (
            <p style={styles.kosong}>Tidak ada submission yang menunggu.</p>
          ) : (
            pending.map((s) => (
              <div key={s.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <p style={styles.nama}>{s.nama_kepala_keluarga}</p>
                    <p style={styles.alamat}>{s.alamat}</p>
                    <p style={styles.ppl}>PPL: {s.nama_ppl}</p>
                  </div>
                  <span style={{ ...styles.badge, backgroundColor: statusColor(s.status) }}>
                    {statusLabel(s.status)}
                  </span>
                </div>
                {s.catatan_ppl && (
                  <div style={styles.catatanBox}>
                    <p style={styles.catatanLabel}>Catatan PPL:</p>
                    <p style={styles.catatanText}>{s.catatan_ppl}</p>
                  </div>
                )}
                <textarea
                  style={styles.textarea}
                  placeholder="Catatan untuk PPL (opsional)..."
                  value={catatan[s.id] || ''}
                  onChange={(e) => setCatatan({ ...catatan, [s.id]: e.target.value })}
                  rows={2}
                />
                <div style={styles.btnRow}>
                  <button style={styles.tolakBtn} onClick={() => handleReview(s.id, 'ditolak')} disabled={reviewLoading !== null}>
                    {reviewLoading === s.id + 'ditolak' ? '...' : '❌ Tolak'}
                  </button>
                  <button style={styles.approveBtn} onClick={() => handleReview(s.id, 'approved')} disabled={reviewLoading !== null}>
                    {reviewLoading === s.id + 'approved' ? '...' : '✅ Setujui'}
                  </button>
                </div>
              </div>
            ))
          )}
          {selesai.length > 0 && (
            <>
              <h3 style={{ ...styles.sectionTitle, marginTop: '1.5rem' }}>Riwayat ({selesai.length})</h3>
              {selesai.map((s) => (
                <div key={s.id} style={{ ...styles.card, opacity: 0.75 }}>
                  <div style={styles.cardHeader}>
                    <div>
                      <p style={styles.nama}>{s.nama_kepala_keluarga}</p>
                      <p style={styles.alamat}>{s.alamat}</p>
                      <p style={styles.ppl}>PPL: {s.nama_ppl}</p>
                    </div>
                    <span style={{ ...styles.badge, backgroundColor: statusColor(s.status) }}>
                      {statusLabel(s.status)}
                    </span>
                  </div>
                  {s.catatan_pml && (
                    <div style={styles.catatanBox}>
                      <p style={styles.catatanLabel}>Catatan PML:</p>
                      <p style={styles.catatanText}>{s.catatan_pml}</p>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </>
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
  statsRow: { display: 'flex', gap: '0.75rem', marginBottom: '1rem' },
  statCard: { flex: 1, backgroundColor: 'white', borderRadius: '10px', padding: '0.75rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  statNum: { fontSize: '1.5rem', fontWeight: '700', color: '#1e3a5f', margin: 0 },
  statLabel: { fontSize: '0.75rem', color: '#64748b', margin: 0 },
  pesan: { backgroundColor: 'white', padding: '10px', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', fontWeight: '600' },
  sectionTitle: { color: '#1e3a5f', marginBottom: '0.75rem', fontSize: '1rem' },
  kosong: { textAlign: 'center', color: '#64748b', fontSize: '0.9rem' },
  card: { backgroundColor: 'white', borderRadius: '12px', padding: '1rem', marginBottom: '0.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' },
  nama: { fontWeight: '700', color: '#1e293b', margin: '0 0 4px 0' },
  alamat: { color: '#64748b', fontSize: '0.85rem', margin: '0 0 2px 0' },
  ppl: { color: '#94a3b8', fontSize: '0.8rem', margin: 0 },
  badge: { color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', whiteSpace: 'nowrap' },
  catatanBox: { backgroundColor: '#f8fafc', borderRadius: '8px', padding: '8px', marginBottom: '0.5rem' },
  catatanLabel: { fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 2px 0' },
  catatanText: { fontSize: '0.85rem', color: '#475569', margin: 0 },
  textarea: { width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box', resize: 'none', marginBottom: '0.5rem' },
  btnRow: { display: 'flex', gap: '0.5rem' },
  tolakBtn: { flex: 1, padding: '10px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' },
  approveBtn: { flex: 1, padding: '10px', backgroundColor: '#dcfce7', color: '#16a34a', border: 'none', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' },
};

export default DashboardPML;