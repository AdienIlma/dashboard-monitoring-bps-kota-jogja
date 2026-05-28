import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const DashboardPML = () => {
  const { user, logout } = useAuth();
  const [pplList, setPplList]         = useState([]);
  const [expandedPPL, setExpandedPPL] = useState(null); // id PPL yang sedang expand
  const [inputs, setInputs]           = useState({});   // { [ppl_id]: [...] }
  const [wilayahMap, setWilayahMap]   = useState({});   // { [ppl_id]: [...] }
  const [loadingMap, setLoadingMap]   = useState({});   // { [ppl_id]: bool }
  const [loading, setLoading]         = useState(true);

  // Form approve — per PPL
  const [selectedSLS, setSelectedSLS]     = useState({});  // { [ppl_id]: obj }
  const [slsOpen, setSlsOpen]             = useState({});  // { [ppl_id]: bool }
  const [jumlahApprove, setJumlahApprove] = useState({});  // { [ppl_id]: str }
  const [catatan, setCatatan]             = useState({});  // { [ppl_id]: str }
  const [submitLoading, setSubmitLoading] = useState({});
  const [pesan, setPesan]                 = useState({});  // { [ppl_id]: {text,type} }

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
      setInputs(prev => ({ ...prev, [ppl_id]: res.data }));
    } catch (err) {
      console.error('Gagal fetch inputs', err);
    }
  };

  const fetchWilayah = async (ppl_id) => {
    setLoadingMap(prev => ({ ...prev, [ppl_id]: true }));
    try {
      const res = await api.get(`/pml/wilayah/${ppl_id}`);
      setWilayahMap(prev => ({ ...prev, [ppl_id]: res.data }));
    } catch (err) {
      console.error('Gagal fetch wilayah', err);
      setWilayahMap(prev => ({ ...prev, [ppl_id]: [] }));
    } finally {
      setLoadingMap(prev => ({ ...prev, [ppl_id]: false }));
    }
  };

  const handleTogglePPL = (ppl) => {
    const id = ppl.id;
    if (expandedPPL === id) {
      // collapse
      setExpandedPPL(null);
      setSlsOpen(prev => ({ ...prev, [id]: false }));
    } else {
      // expand
      setExpandedPPL(id);
      setSlsOpen(prev => ({ ...prev, [id]: false }));
      // fetch kalau belum ada
      if (!inputs[id])   fetchInputs(id);
      if (!wilayahMap[id]) fetchWilayah(id);
    }
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

  const handlePilihSLS = (ppl_id, w) => {
    setSelectedSLS(prev => ({ ...prev, [ppl_id]: w }));
    setSlsOpen(prev => ({ ...prev, [ppl_id]: false }));
  };

  const handleApprove = async (e, ppl_id) => {
    e.preventDefault();
    const sls    = selectedSLS[ppl_id];
    const jumlah = parseInt(jumlahApprove[ppl_id]) || 0;

    if (!sls) {
      setPesan(prev => ({ ...prev, [ppl_id]: { text: 'SLS wajib dipilih!', type: 'error' } }));
      return;
    }
    if (jumlah <= 0) {
      setPesan(prev => ({ ...prev, [ppl_id]: { text: 'Jumlah harus lebih dari 0!', type: 'error' } }));
      return;
    }
    const sisa = parseInt(sls.total_submit || 0) - parseInt(sls.total_approve || 0);
    if (jumlah > sisa) {
      setPesan(prev => ({ ...prev, [ppl_id]: { text: `Melebihi sisa approve! Sisa: ${sisa}`, type: 'error' } }));
      return;
    }

    setSubmitLoading(prev => ({ ...prev, [ppl_id]: true }));
    setPesan(prev => ({ ...prev, [ppl_id]: { text: '', type: '' } }));
    try {
      await api.post('/pml/approve', {
        ppl_id,
        wilayah_id: sls.id,
        approve:    jumlah,
        catatan:    catatan[ppl_id] || '',
      });
      setPesan(prev => ({ ...prev, [ppl_id]: { text: 'Approve berhasil disimpan!', type: 'success' } }));
      setSelectedSLS(prev => ({ ...prev, [ppl_id]: null }));
      setJumlahApprove(prev => ({ ...prev, [ppl_id]: '' }));
      setCatatan(prev => ({ ...prev, [ppl_id]: '' }));
      fetchInputs(ppl_id);
      fetchWilayah(ppl_id);
      fetchPPL();
    } catch (err) {
      setPesan(prev => ({ ...prev, [ppl_id]: { text: err.response?.data?.message || 'Gagal simpan', type: 'error' } }));
    } finally {
      setSubmitLoading(prev => ({ ...prev, [ppl_id]: false }));
    }
  };

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
          <p style={{ textAlign: 'center', color: '#9AA5B4', fontSize: 13, padding: '16px 0' }}>Memuat...</p>
        ) : pplList.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#9AA5B4', fontSize: 13, padding: '16px 0' }}>Belum ada PPL.</p>
        ) : (
          pplList.map(ppl => {
            const isOpen    = expandedPPL === ppl.id;
            const pplInputs = inputs[ppl.id] || [];
            const wilayah   = wilayahMap[ppl.id] || [];
            const isLoading = loadingMap[ppl.id];
            const sls       = selectedSLS[ppl.id] || null;
            const pesanPPL  = pesan[ppl.id] || { text: '', type: '' };

            const totalLapangan = pplInputs.reduce((a, b) => a + parseInt(b.ke_lapangan || 0), 0);
            const totalSubmit   = pplInputs.reduce((a, b) => a + parseInt(b.submit       || 0), 0);
            const totalApprove  = pplInputs.reduce((a, b) => a + parseInt(b.approve      || 0), 0);

            return (
              <div key={ppl.id} style={{ marginBottom: 8 }}>
                {/* Row PPL — klik untuk accordion */}
                <div
                  onClick={() => handleTogglePPL(ppl)}
                  style={{
                    ...styles.pplItem,
                    backgroundColor: isOpen ? '#EEF5FF' : '#F7F8FA',
                    borderColor:     isOpen ? '#EBEEf2' : '#EBEEf2',
                    borderBottomLeftRadius:  isOpen ? 0 : 10,
                    borderBottomRightRadius: isOpen ? 0 : 10,
                  }}
                >
                  <div style={styles.pplAvatar}>{ppl.nama.charAt(0)}</div>
                  <div style={styles.pplInfo}>
                    <div style={styles.pplName}>{ppl.nama}</div>
                    <div style={styles.pplUsername}>@{ppl.username}</div>
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
                  {/* Arrow — bawah kalau collapse, atas kalau expand */}
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                    style={{ flexShrink: 0, transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    <path d="M4 6l4 4 4-4" stroke="#9AA5B4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>

                {/* Accordion content */}
                {isOpen && (
                  <div style={styles.accordionBody}>
                    {isLoading ? (
                      <p style={{ textAlign: 'center', color: '#9AA5B4', fontSize: 13, padding: '16px 0' }}>Memuat data...</p>
                    ) : (
                      <>
                        {/* ── Form Approve ── */}
                        <div style={styles.section}>
                          <div style={{ ...styles.sectionTitle, color: '#1D9E75' }}>Input Approve</div>

                          {pesanPPL.text && (
                            <div style={{
                              ...styles.pesan,
                              backgroundColor: pesanPPL.type === 'success' ? '#EDFAF4' : '#FEE2E2',
                              color:           pesanPPL.type === 'success' ? '#1D9E75' : '#DC2626',
                            }}>
                              {pesanPPL.text}
                            </div>
                          )}

                          <form onSubmit={(e) => handleApprove(e, ppl.id)}>
                            {/* Pilih SLS */}
                            <div style={styles.field}>
                              <label style={styles.label}>SLS</label>
                              <div
                                onClick={() => !isLoading && setSlsOpen(prev => ({ ...prev, [ppl.id]: !prev[ppl.id] }))}
                                style={{
                                  ...styles.input,
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  cursor: 'pointer', userSelect: 'none',
                                  borderColor: slsOpen[ppl.id] ? '#1D9E75' : '#EBEEf2',
                                  borderWidth: slsOpen[ppl.id] ? 1.5 : 1,
                                  color: sls ? '#2D3748' : '#B0BAC6',
                                }}
                              >
                                <span style={{ fontSize: 13 }}>
                                  {sls ? `${sls.kode_sls || '—'} — ${sls.kelurahan}` : 'Pilih SLS'}
                                </span>
                                <svg width="13" height="13" viewBox="0 0 16 16" fill="none"
                                  style={{ transform: slsOpen[ppl.id] ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s', flexShrink: 0 }}>
                                  <path d="M4 6l4 4 4-4" stroke="#9AA5B4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </div>

                              {slsOpen[ppl.id] && (
                                <div style={styles.slsDropdown}>
                                  {wilayah.length === 0 ? (
                                    <div style={styles.slsEmpty}>Tidak ada SLS tersedia</div>
                                  ) : (
                                    wilayah.map(w => {
                                      const sudah = parseInt(w.total_approve || 0);
                                      const sub   = parseInt(w.total_submit  || 0);
                                      const sisa  = sub - sudah;
                                      const penuh = sisa <= 0;
                                      const pct   = sub > 0 ? Math.min((sudah / sub) * 100, 100) : 0;
                                      return (
                                        <div
                                          key={w.id}
                                          onClick={() => !penuh && handlePilihSLS(ppl.id, w)}
                                          style={{
                                            ...styles.slsOption,
                                            backgroundColor: penuh ? '#FFF8F8' : sls?.id === w.id ? '#F0FFF8' : 'white',
                                            borderLeft: penuh ? '3px solid #FECACA' : sls?.id === w.id ? '3px solid #1D9E75' : '3px solid transparent',
                                            opacity: penuh ? 0.75 : 1,
                                            cursor:  penuh ? 'not-allowed' : 'pointer',
                                          }}
                                        >
                                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                                            <span style={styles.slsKode}>{w.kode_sls || '—'}</span>
                                            {penuh
                                              ? <span style={styles.badgePenuh}>✓ Semua ter-approve</span>
                                              : <span style={styles.badgeProgres}>approve {sudah}/{sub}</span>
                                            }
                                          </div>
                                          <div style={styles.slsNama}>
                                            {w.kelurahan}<span style={styles.slsKec}>, {w.kecamatan}</span>
                                          </div>
                                          {sub > 0 && (
                                            <div style={styles.progressWrap}>
                                              <div style={{ ...styles.progressBar, width: `${pct}%`, backgroundColor: penuh ? '#EF4444' : '#1D9E75' }} />
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              )}

                              {sls && (
                                <div style={styles.slsPreview}>
                                  <div style={styles.slsPreviewRow}>
                                    <span style={styles.slsPreviewKey}>Kode SLS</span>
                                    <span style={styles.slsPreviewVal}>{sls.kode_sls || '—'}</span>
                                  </div>
                                  <div style={styles.slsPreviewRow}>
                                    <span style={styles.slsPreviewKey}>Total Submit</span>
                                    <span style={styles.slsPreviewVal}>{sls.total_submit || 0}</span>
                                  </div>
                                  <div style={{ ...styles.slsPreviewRow, borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>
                                    <span style={styles.slsPreviewKey}>Sisa belum approve</span>
                                    <span style={{ ...styles.slsPreviewVal, color: '#1D9E75', fontWeight: 600 }}>
                                      {parseInt(sls.total_submit || 0) - parseInt(sls.total_approve || 0)}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div style={styles.field}>
                              <label style={styles.label}>Jumlah Approve</label>
                              <input
                                style={{ ...styles.input, borderColor: '#1D9E75', borderWidth: 1.5 }}
                                type="number" min="1" placeholder="Masukkan jumlah"
                                value={jumlahApprove[ppl.id] || ''}
                                onChange={(e) => setJumlahApprove(prev => ({ ...prev, [ppl.id]: e.target.value }))}
                                required
                              />
                            </div>

                            <div style={styles.field}>
                              <label style={styles.label}>Catatan (opsional)</label>
                              <textarea
                                style={{ ...styles.input, resize: 'none', height: 56 }}
                                placeholder="Catatan tambahan..."
                                value={catatan[ppl.id] || ''}
                                onChange={(e) => setCatatan(prev => ({ ...prev, [ppl.id]: e.target.value }))}
                              />
                            </div>

                            <button
                              type="submit"
                              style={{ ...styles.submitBtn, opacity: submitLoading[ppl.id] ? 0.7 : 1 }}
                              disabled={submitLoading[ppl.id]}
                            >
                              {submitLoading[ppl.id] ? 'Menyimpan...' : 'Simpan Approve'}
                            </button>
                          </form>
                        </div>

                        {/* ── Riwayat Input ── */}
                        <div style={{ ...styles.section, borderTop: '1px solid #F0F2F5', paddingTop: 14 }}>
                          <div style={styles.sectionTitle}>Riwayat Input</div>

                          <div style={styles.summaryRow}>
                            <div style={styles.summaryCard}>
                              <div style={{ ...styles.summaryNum, color: '#003366' }}>{totalLapangan}</div>
                              <div style={styles.summaryLabel}>Lapangan</div>
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

                          {pplInputs.length === 0 ? (
                            <p style={{ textAlign: 'center', color: '#9AA5B4', fontSize: 13, padding: '12px 0' }}>Belum ada data input.</p>
                          ) : (
                            pplInputs.map(i => (
                              <div key={i.id} style={styles.inputItem}>
                                <div style={styles.inputLeft}>
                                  <div style={styles.inputWilayah}>{i.kelurahan}, {i.kecamatan}</div>
                                  <div style={styles.inputDate}>
                                    {new Date(i.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                  {i.catatan && <div style={styles.inputCatatan}>{i.catatan}</div>}
                                </div>
                                <div style={styles.inputStats}>
                                  <div style={styles.inputStat}>
                                    <div style={{ ...styles.inputStatNum, color: '#003366' }}>{i.ke_lapangan}</div>
                                    <div style={styles.inputStatLabel}>Lap</div>
                                  </div>
                                  <div style={styles.inputStat}>
                                    <div style={{ ...styles.inputStatNum, color: '#E8702A' }}>{i.submit}</div>
                                    <div style={styles.inputStatLabel}>Sub</div>
                                  </div>
                                  <div style={styles.inputStat}>
                                    <div style={{ ...styles.inputStatNum, color: '#1D9E75' }}>{i.approve}</div>
                                    <div style={styles.inputStatLabel}>Apr</div>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </>
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

  pplItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: '1px solid', cursor: 'pointer', transition: 'all 0.15s',outline:'none',WebkitTapHighlightColor: 'transparent' },
  pplAvatar: { width: 34, height: 34, borderRadius: '50%', backgroundColor: '#003366', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 500, fontSize: 14, flexShrink: 0 },
  pplInfo: { flex: 1 },
  pplName: { fontSize: 13, fontWeight: 500, color: '#2D3748' },
  pplUsername: { fontSize: 11, color: '#9AA5B4', marginTop: 1 },
  pplStats: { display: 'flex', gap: 12 },
  pplStat: { textAlign: 'center' },
  pplStatNum: { fontSize: 15, fontWeight: 500, lineHeight: 1 },
  pplStatLabel: { fontSize: 9, color: '#9AA5B4', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2 },

  accordionBody: { border: '1px solid #EBEEf2', borderTop: 'none', borderBottomLeftRadius: 10, borderBottomRightRadius: 10, backgroundColor: '#FAFBFF', overflow: 'hidden' },
  section: { padding: '14px 14px' },
  sectionTitle: { fontSize: 11, fontWeight: 600, color: '#9AA5B4', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 },

  summaryRow: { display: 'flex', gap: 8, marginBottom: 12 },
  summaryCard: { flex: 1, background: 'white', border: '1px solid #EBEEf2', borderRadius: 10, padding: '8px 6px', textAlign: 'center' },
  summaryNum: { fontSize: 20, fontWeight: 500 },
  summaryLabel: { fontSize: 9, color: '#9AA5B4', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 },

  inputItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F0F2F5' },
  inputLeft: { flex: 1 },
  inputWilayah: { fontSize: 12, fontWeight: 500, color: '#2D3748', marginBottom: 2 },
  inputDate: { fontSize: 10, color: '#9AA5B4' },
  inputCatatan: { fontSize: 10, color: '#7A8899', marginTop: 2, fontStyle: 'italic' },
  inputStats: { display: 'flex', gap: 8, marginLeft: 8 },
  inputStat: { textAlign: 'center' },
  inputStatNum: { fontSize: 14, fontWeight: 500, lineHeight: 1 },
  inputStatLabel: { fontSize: 8, color: '#9AA5B4', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2 },

  pesan: { padding: '9px 12px', borderRadius: 8, marginBottom: 12, fontSize: 12, fontWeight: 500 },
  field: { marginBottom: 10 },
  label: { display: 'block', fontSize: 12, fontWeight: 500, color: '#4A5568', marginBottom: 4 },
  input: { width: '100%', padding: '9px 12px', border: '1px solid #EBEEf2', borderRadius: 8, fontSize: 13, color: '#2D3748', background: 'white', outline: 'none', boxSizing: 'border-box' },
  submitBtn: { width: '100%', padding: '11px', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer', marginTop: 2, backgroundColor: '#1D9E75' },

  slsDropdown: { marginTop: 4, border: '1px solid #EBEEf2', borderRadius: 10, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', backgroundColor: 'white', maxHeight: 220, overflowY: 'auto' },
  slsOption: { padding: '9px 12px', borderBottom: '1px solid #F7F8FA', transition: 'background 0.1s' },
  slsKode: { fontSize: 10, fontWeight: 600, color: '#9AA5B4', letterSpacing: '0.08em', textTransform: 'uppercase' },
  slsNama: { fontSize: 12, fontWeight: 500, color: '#2D3748' },
  slsKec: { fontWeight: 400, color: '#9AA5B4' },
  slsEmpty: { padding: '14px', textAlign: 'center', color: '#B0BAC6', fontSize: 13 },
  badgePenuh: { fontSize: 9, fontWeight: 700, color: '#DC2626', backgroundColor: '#FEE2E2', padding: '2px 7px', borderRadius: 20 },
  badgeProgres: { fontSize: 10, fontWeight: 500, color: '#9AA5B4' },
  progressWrap: { marginTop: 5, height: 3, backgroundColor: '#F0F2F5', borderRadius: 99, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 99, transition: 'width 0.3s' },
  slsPreview: { marginTop: 8, padding: '9px 12px', backgroundColor: '#F7F8FA', borderRadius: 8, border: '1px solid #EBEEf2' },
  slsPreviewRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 5, marginBottom: 5, borderBottom: '1px solid #EEF0F3' },
  slsPreviewKey: { fontSize: 11, color: '#9AA5B4' },
  slsPreviewVal: { fontSize: 12, fontWeight: 500, color: '#2D3748' },
};

export default DashboardPML;