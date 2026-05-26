import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const DashboardPML = () => {
  const { user, logout } = useAuth();
  const [pplList, setPplList] = useState([]);
  const [selectedPPL, setSelectedPPL] = useState(null);
  const [inputs, setInputs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPPL();
    kirimLokasiOtomatis();
    const interval = setInterval(kirimLokasiOtomatis, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchPPL = async () => {
    try {
      const res = await api.get('/pml/ppl');
      setPplList(res.data);
    } catch (err) {
      console.error('Gagal fetch PPL', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInputs = async (ppl_id) => {
    try {
      const res = await api.get(`/pml/inputs/${ppl_id}`);
      setInputs(res.data);
    } catch (err) {
      console.error('Gagal fetch inputs', err);
    }
  };

  const handleSelectPPL = (ppl) => {
    setSelectedPPL(ppl);
    fetchInputs(ppl.id);
  };

  const kirimLokasiOtomatis = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        await api.post('/pml/lokasi', {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      } catch (err) {
        console.error('Gagal kirim lokasi', err);
      }
    });
  };

  const totalLapangan = inputs.reduce((a, b) => a + parseInt(b.ke_lapangan), 0);
  const totalSubmit = inputs.reduce((a, b) => a + parseInt(b.submit), 0);
  const totalApprove = inputs.reduce((a, b) => a + parseInt(b.approve), 0);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.avatar}>{user?.nama?.charAt(0)}</div>
          <div>
            <div style={styles.headerName}>{user?.nama}</div>
            <div style={styles.headerRole}>Petugas PML</div>
          </div>
        </div>
        <button style={styles.logoutBtn} onClick={logout}>Keluar</button>
      </div>

      {/* Daftar PPL */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>PPL yang Dibawahi</div>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#9AA5B4', fontSize: 13 }}>Memuat...</p>
        ) : pplList.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#9AA5B4', fontSize: 13, padding: '16px 0' }}>Belum ada PPL.</p>
        ) : (
          pplList.map(ppl => (
            <div
              key={ppl.id}
              onClick={() => handleSelectPPL(ppl)}
              style={{
                ...styles.pplItem,
                backgroundColor: selectedPPL?.id === ppl.id ? '#EEF5FF' : '#F7F8FA',
                borderColor: selectedPPL?.id === ppl.id ? '#003366' : '#EBEEf2',
              }}
            >
              <div style={styles.pplAvatar}>{ppl.nama.charAt(0)}</div>
              <div style={styles.pplInfo}>
                <div style={styles.pplName}>{ppl.nama}</div>
                <div style={styles.pplemail}>@{ppl.email}</div>
              </div>
              <div style={styles.pplStats}>
                <div style={styles.pplStat}>
                  <div style={{ ...styles.pplStatNum, color: '#003366' }}>{ppl.total_ke_lapangan}</div>
                  <div style={styles.pplStatLabel}>Lapangan</div>
                </div>
                <div style={styles.pplStat}>
                  <div style={{ ...styles.pplStatNum, color: '#E8702A' }}>{ppl.total_submit}</div>
                  <div style={styles.pplStatLabel}>Submit</div>
                </div>
                <div style={styles.pplStat}>
                  <div style={{ ...styles.pplStatNum, color: '#1D9E75' }}>{ppl.total_approve}</div>
                  <div style={styles.pplStatLabel}>Approve</div>
                </div>
              </div>
              <div style={styles.pplArrow}>›</div>
            </div>
          ))
        )}
      </div>

      {/* Detail Input PPL */}
      {selectedPPL && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>Riwayat Input — {selectedPPL.nama}</div>

          {/* Summary */}
          <div style={styles.summaryRow}>
            <div style={styles.summaryCard}>
              <div style={{ ...styles.summaryNum, color: '#003366' }}>{totalLapangan}</div>
              <div style={styles.summaryLabel}>Ke Lapangan</div>
            </div>
            <div style={styles.summaryCard}>
              <div style={{ ...styles.summaryNum, color: '#E8702A' }}>{totalSubmit}</div>
              <div style={styles.summaryLabel}>Submit</div>
            </div>
            <div style={styles.summaryCard}>
              <div style={{ ...styles.summaryNum, color: '#1D9E75' }}>{totalApprove}</div>
              <div style={styles.summaryLabel}>Approve</div>
            </div>
          </div>

          {/* List input */}
          {inputs.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#9AA5B4', fontSize: 13, padding: '16px 0' }}>Belum ada data input.</p>
          ) : (
            inputs.map(i => (
              <div key={i.id} style={styles.inputItem}>
                <div style={styles.inputLeft}>
                  <div style={styles.inputWilayah}>{i.kelurahan}, {i.kecamatan}</div>
                  <div style={styles.inputDate}>
                    {new Date(i.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {i.catatan && <div style={styles.inputCatatan}>{i.catatan}</div>}
                </div>
                <div style={styles.inputRight}>
                  <div style={styles.inputStats}>
                    <div style={styles.inputStat}>
                      <div style={{ ...styles.inputStatNum, color: '#003366' }}>{i.ke_lapangan}</div>
                      <div style={styles.inputStatLabel}>Lapangan</div>
                    </div>
                    <div style={styles.inputStat}>
                      <div style={{ ...styles.inputStatNum, color: '#E8702A' }}>{i.submit}</div>
                      <div style={styles.inputStatLabel}>Submit</div>
                    </div>
                    <div style={styles.inputStat}>
                      <div style={{ ...styles.inputStatNum, color: '#1D9E75' }}>{i.approve}</div>
                      <div style={styles.inputStatLabel}>Approve</div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { maxWidth: 480, margin: '0 auto', padding: '1rem', backgroundColor: '#F0F2F5', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#003366', padding: '14px 16px', borderRadius: 14, marginBottom: 14 },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: '50%', backgroundColor: '#E8702A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 500, fontSize: 15 },
  headerName: { color: 'white', fontWeight: 500, fontSize: 14 },
  headerRole: { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 },
  logoutBtn: { backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12 },
  card: { backgroundColor: 'white', borderRadius: 14, padding: '16px', marginBottom: 14, border: '1px solid #EBEEf2', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  cardTitle: { fontSize: 11, fontWeight: 500, color: '#9AA5B4', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #F0F2F5' },
  pplItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: '1px solid', marginBottom: 8, cursor: 'pointer' },
  pplAvatar: { width: 34, height: 34, borderRadius: '50%', backgroundColor: '#003366', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 500, fontSize: 14, flexShrink: 0 },
  pplInfo: { flex: 1 },
  pplName: { fontSize: 13, fontWeight: 500, color: '#2D3748' },
  pplemail: { fontSize: 11, color: '#9AA5B4', marginTop: 1 },
  pplStats: { display: 'flex', gap: 12 },
  pplStat: { textAlign: 'center' },
  pplStatNum: { fontSize: 16, fontWeight: 500, lineHeight: 1 },
  pplStatLabel: { fontSize: 9, color: '#9AA5B4', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2 },
  pplArrow: { fontSize: 20, color: '#B0BAC6' },
  summaryRow: { display: 'flex', gap: 8, marginBottom: 14 },
  summaryCard: { flex: 1, background: '#F7F8FA', border: '1px solid #EBEEf2', borderRadius: 10, padding: '10px 8px', textAlign: 'center' },
  summaryNum: { fontSize: 22, fontWeight: 500 },
  summaryLabel: { fontSize: 9, color: '#9AA5B4', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 3 },
  inputItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F7F8FA' },
  inputLeft: { flex: 1 },
  inputWilayah: { fontSize: 13, fontWeight: 500, color: '#2D3748', marginBottom: 3 },
  inputDate: { fontSize: 11, color: '#9AA5B4' },
  inputCatatan: { fontSize: 11, color: '#7A8899', marginTop: 3, fontStyle: 'italic' },
  inputRight: { marginLeft: 10 },
  inputStats: { display: 'flex', gap: 10 },
  inputStat: { textAlign: 'center' },
  inputStatNum: { fontSize: 16, fontWeight: 500, lineHeight: 1 },
  inputStatLabel: { fontSize: 9, color: '#9AA5B4', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 },
};

export default DashboardPML;