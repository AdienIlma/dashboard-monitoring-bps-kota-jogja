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

const pmlIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const pplActiveIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const formatWaktu = (recorded_at) => {
  if (!recorded_at) return '-';
  return new Date(recorded_at).toLocaleString('id-ID', {
    day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit'
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
  const visiblePPL = selectedPML ? pplList.filter(p => p.pml_id === selectedPML) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          🗺️ Sebaran Petugas
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {lastUpdate && (
            <span style={{ fontSize: 10, color: '#94a3b8' }}>
              Update: {formatWaktu(lastUpdate)}
            </span>
          )}
          <button
            onClick={fetchData}
            style={{
              fontSize: 11, padding: '4px 10px',
              border: '1px solid #e2e8f0', borderRadius: 6,
              background: 'white', cursor: 'pointer', color: '#64748b'
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, background: '#f8fafc', padding: '8px 12px', borderRadius: 10, border: '1px solid #e2e8f0', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Keterangan:</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#3b82f6' }}>
          🔵 PML ({pmlList.length})
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#f59e0b' }}>
          🟠 PPL ({pplList.length})
        </div>
        {selectedPML && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>
              Menampilkan PPL: {pmlList.find(p => p.id === selectedPML)?.nama}
            </span>
            <button
              onClick={() => setSelectedPML(null)}
              style={{
                fontSize: 10, padding: '2px 8px',
                border: '1px solid #fbbf24', borderRadius: 20,
                background: '#fef3c7', cursor: 'pointer', color: '#92400e'
              }}
            >
              ✕ Reset
            </button>
          </div>
        )}
      </div>

      {/* Map — selalu tampil meski belum ada petugas */}
      <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #e2e8f0', height: 320 }}>
        <MapContainer
          center={[-7.82, 110.4]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
          />

          {/* Marker PML */}
          {pmlList.map((pml) => (
            <Marker
              key={`pml-${pml.id}`}
              position={[pml.lat, pml.lng]}
              icon={pmlIcon}
              eventHandlers={{
                click: () => setSelectedPML(selectedPML === pml.id ? null : pml.id),
              }}
            >
              <Popup>
                <div style={{ fontSize: 12, minWidth: 160 }}>
                  <div style={{ fontWeight: 700, color: '#1e3a5f', marginBottom: 4 }}>
                    🔵 {pml.nama}
                  </div>
                  <div style={{ color: '#475569', marginBottom: 2 }}>Role: PML</div>
                  <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 8 }}>
                    📅 {formatWaktu(pml.recorded_at)}
                  </div>
                  <div
                    onClick={() => setSelectedPML(selectedPML === pml.id ? null : pml.id)}
                    style={{
                      padding: '4px 8px', backgroundColor: '#eef2ff',
                      borderRadius: 6, fontSize: 11, color: '#6366f1',
                      textAlign: 'center', cursor: 'pointer'
                    }}
                  >
                    {selectedPML === pml.id ? '✕ Sembunyikan PPL' : '👁 Lihat PPL'}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Marker PPL */}
          {visiblePPL.map((ppl) => (
            <Marker
              key={`ppl-${ppl.id}`}
              position={[ppl.lat, ppl.lng]}
              icon={pplActiveIcon}
            >
              <Popup>
                <div style={{ fontSize: 12, minWidth: 160 }}>
                  <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
                    🟠 {ppl.nama}
                  </div>
                  <div style={{ color: '#475569', marginBottom: 2 }}>Role: PPL</div>
                  <div style={{ color: '#94a3b8', fontSize: 11 }}>
                    📅 {formatWaktu(ppl.recorded_at)}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Info kalau belum ada petugas */}
      {sebaranData.length === 0 && (
        <div style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', padding: '4px 0' }}>
          📍 Belum ada petugas aktif di lapangan
        </div>
      )}
    </div>
  );
};

export default PetaSebaranPetugas;