import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getSebaranPetugas } from '../services/dataService';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// PML online (biru navy)
const pmlOnlineIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

// PML offline (abu-abu)
const pmlOfflineIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

// PPL online (oranye)
const pplOnlineIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const formatWaktu = (recorded_at) => {
  if (!recorded_at) return 'Belum pernah login';
  return new Date(recorded_at).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  });
};

const PetaSebaranPetugas = () => {
  const [sebaranData, setSebaranData] = useState([]);
  const [selectedPML, setSelectedPML] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const data = await getSebaranPetugas();
      setSebaranData(data);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Gagal ambil sebaran:', err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const pmlList = sebaranData.filter(p => p.role === 'pml');
  const pplList = sebaranData.filter(p => p.role === 'ppl');

  // PPL yang tampil: yang punya lokasi dan PML-nya dipilih
  const visiblePPL = selectedPML
    ? pplList.filter(p => p.pml_id === selectedPML && p.punya_lokasi)
    : [];

  const pmlOnline = pmlList.filter(p => p.online).length;
  const pplOnline = pplList.filter(p => p.online).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: '#9AA5B4', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Sebaran Petugas
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {lastUpdate && (
            <span style={{ fontSize: 10, color: '#B0BAC6' }}>
              {formatWaktu(lastUpdate)}
            </span>
          )}
          <button onClick={fetchData} style={{ fontSize: 11, padding: '4px 10px', border: '1px solid #EBEEf2', borderRadius: 6, background: 'white', cursor: 'pointer', color: '#7A8899' }}>
            Refresh
          </button>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 10, background: '#F7F8FA', padding: '8px 12px', borderRadius: 10, border: '1px solid #EBEEf2', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ fontSize: 11, color: '#7A8899', fontWeight: 500 }}>Keterangan:</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#003366' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#003366', display: 'inline-block' }} />
          PML Online ({pmlOnline})
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#9AA5B4' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#9AA5B4', display: 'inline-block' }} />
          PML Offline ({pmlList.length - pmlOnline})
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#E8702A' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#E8702A', display: 'inline-block' }} />
          PPL Online ({pplOnline})
        </div>
        {selectedPML && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: '#E8702A', fontWeight: 500 }}>
              PPL: {pmlList.find(p => p.id === selectedPML)?.nama}
            </span>
            <button onClick={() => setSelectedPML(null)} style={{ fontSize: 10, padding: '2px 8px', border: '1px solid #EBEEf2', borderRadius: 20, background: 'white', cursor: 'pointer', color: '#7A8899' }}>
              Reset
            </button>
          </div>
        )}
      </div>

      {/* Map */}
      <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #EBEEf2', height: 320 }}>
        <MapContainer center={[-7.82, 110.4]} zoom={12} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />

          {/* Marker PML — tampil semua yang punya lokasi */}
          {pmlList
          .filter(p => p.lat !== null && p.lng !== null)
           .map(pml => (
            <Marker
              key={`pml-${pml.id}`}
              position={[pml.lat, pml.lng]}
              icon={pml.online ? pmlOnlineIcon : pmlOfflineIcon}
              eventHandlers={{ click: () => setSelectedPML(selectedPML === pml.id ? null : pml.id) }}
            >
              <Popup>
                <div style={{ fontSize: 12, minWidth: 170 }}>
                  <div style={{ fontWeight: 600, color: '#1A2B42', marginBottom: 4 }}>{pml.nama}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: pml.online ? '#1D9E75' : '#9AA5B4', display: 'inline-block' }} />
                    <span style={{ fontSize: 11, color: pml.online ? '#1D9E75' : '#9AA5B4', fontWeight: 500 }}>
                      {pml.online ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#9AA5B4', marginBottom: 8 }}>
                    Terakhir: {formatWaktu(pml.recorded_at)}
                  </div>
                  <div
                    onClick={() => setSelectedPML(selectedPML === pml.id ? null : pml.id)}
                    style={{ padding: '5px 8px', backgroundColor: '#EEF5FF', borderRadius: 6, fontSize: 11, color: '#003366', textAlign: 'center', cursor: 'pointer', fontWeight: 500 }}
                  >
                    {selectedPML === pml.id ? 'Sembunyikan PPL' : 'Lihat PPL'}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Marker PPL — hanya tampil kalau PML dipilih */}
          {visiblePPL.map(ppl => (
            <Marker key={`ppl-${ppl.id}`} position={[ppl.lat, ppl.lng]} icon={pplOnlineIcon}>
              <Popup>
                <div style={{ fontSize: 12, minWidth: 170 }}>
                  <div style={{ fontWeight: 600, color: '#1A2B42', marginBottom: 4 }}>{ppl.nama}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: ppl.online ? '#1D9E75' : '#9AA5B4', display: 'inline-block' }} />
                    <span style={{ fontSize: 11, color: ppl.online ? '#1D9E75' : '#9AA5B4', fontWeight: 500 }}>
                      {ppl.online ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#9AA5B4' }}>
                    Terakhir: {formatWaktu(ppl.recorded_at)}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Info kalau belum ada lokasi sama sekali */}
      {sebaranData.every(p => !p.punya_lokasi) && (
        <div style={{ textAlign: 'center', fontSize: 11, color: '#B0BAC6' }}>
          Belum ada petugas yang mengirim lokasi
        </div>
      )}
    </div>
  );
};

export default PetaSebaranPetugas;