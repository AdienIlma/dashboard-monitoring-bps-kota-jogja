import React, { useEffect, useState, useCallback } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import api from "./services/api";
import { AuthProvider, useAuth } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import KelolaPetugas from "./pages/KelolaPetugas";
import KelolaResponden from "./pages/KelolaResponden";
import ProgressPendataan from "./components/ProgressPendataan";
import TabelPendataan from "./components/TabelPendataan";
import PetugasLapangan from "./components/PetugasLapangan";
import PetaSebaranPetugas from "./components/PetaSebaranPetugas";
import Progress15Hari from "./components/Progress15Hari";
import ProgressPetugas from "./components/ProgressPetugas";
import DashboardPPL from "./pages/DashboardPPL";
import DashboardPML from "./pages/DashboardPML";
import {
  getPetugasData,
  getProgressData,
  getKecamatanData,
  getKecamatanHarianData,
  getProgress15Hari,
  getPetugasDetail,
  getPetugasDetailHarian,
  getWilayahData,
  getWilayahHarianData,
} from "./services/dataService";
import axios from "axios";

const BackgroundGeolocation = registerPlugin("BackgroundGeolocation");

// ─── Halaman Login ───────────────────────────────────────────
function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        { username, password },
        { headers: { "Content-Type": "application/json" } },
      );
      login(res.data);
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      setError(err.response?.data?.message || "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  const [showPassword, setShowPassword] = useState(false);

  return (
    <div style={loginStyles.container}>
      <div style={loginStyles.card}>
        <img
          src="/logo-sensus.png"
          alt="Logo BPS"
          style={{
            width: 64,
            height: 64,
            objectFit: "contain",
            display: "block",
            margin: "0 auto 1.25rem auto",
          }}
        />
        <h1 style={loginStyles.brandName}>SEMAKI</h1>
        <p style={loginStyles.brandTagline}>
          Sensus Ekonomi Manajemen Aktivitas dan Kinerja
        </p>
        <div style={loginStyles.divider} />
        {error && <div style={loginStyles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={loginStyles.field}>
            <label style={loginStyles.label}>Email</label>
            <input
              style={loginStyles.input}
              type="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan Email"
              required
            />
          </div>
          <div style={loginStyles.field}>
            <label style={loginStyles.label}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                style={{ ...loginStyles.input, paddingRight: "42px" }}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  color: "#6b88b5",
                }}
                aria-label={
                  showPassword ? "Sembunyikan password" : "Tampilkan password"
                }
              >
                {showPassword ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <button style={loginStyles.button} type="submit" disabled={loading}>
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>
        <p style={loginStyles.footer}>
          Badan Pusat Statistik · Kota Yogyakarta
        </p>
      </div>
    </div>
  );
}

const loginStyles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0a1628",
    backgroundImage:
      "radial-gradient(ellipse 80% 60% at 50% 0%, #1a3a6e 0%, #0a1628 65%)",
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.97)",
    padding: "2.5rem 2.25rem",
    borderRadius: "20px",
    boxShadow: "0 24px 64px rgba(0,0,0,0.45)",
    width: "100%",
    maxWidth: "360px",
    border: "1px solid rgba(255,255,255,0.15)",
  },
  brandName: {
    textAlign: "center",
    color: "#0a2a5e",
    fontSize: "2rem",
    fontWeight: "800",
    letterSpacing: "0.1em",
    margin: "0 0 4px",
    lineHeight: 1,
  },
  brandTagline: {
    textAlign: "center",
    color: "#6b88b5",
    fontSize: "0.72rem",
    fontWeight: "600",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    margin: "0 0 1.5rem",
  },
  divider: {
    height: 1,
    background: "linear-gradient(90deg, transparent, #d0dff0, transparent)",
    marginBottom: "1.5rem",
  },
  error: {
    backgroundColor: "#fee2e2",
    color: "#dc2626",
    padding: "10px",
    borderRadius: "8px",
    marginBottom: "1rem",
    fontSize: "0.85rem",
    textAlign: "center",
  },
  field: { marginBottom: "1rem" },
  label: {
    display: "block",
    marginBottom: "6px",
    color: "#4a6080",
    fontWeight: "700",
    fontSize: "0.72rem",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  input: {
    width: "100%",
    padding: "11px 14px",
    border: "1.5px solid #dde6f0",
    borderRadius: "10px",
    fontSize: "0.9rem",
    boxSizing: "border-box",
    outline: "none",
    backgroundColor: "#f7fafd",
    color: "#1a2840",
  },
  button: {
    width: "100%",
    padding: "13px",
    backgroundColor: "#0a2a5e",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "0.9rem",
    fontWeight: "700",
    cursor: "pointer",
    marginTop: "0.5rem",
    letterSpacing: "0.04em",
  },
  footer: {
    textAlign: "center",
    fontSize: "0.7rem",
    color: "#a0b4cc",
    marginTop: "1.25rem",
    marginBottom: 0,
  },
};

// ─── Dashboard Admin ─────────────────────────────────────────
function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeMenu, setActiveMenu] = useState("monitor");
  const [petugasData, setPetugasData] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [kecamatanData, setKecamatanData] = useState([]);
  const [kecamatanHarianData, setKecamatanHarianData] = useState([]);
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const [tanggalHarian, setTanggalHarian] = useState(yesterday);
  const [progress15HariData, setProgress15HariData] = useState([]);
  const [petugasDetailData, setPetugasDetailData] = useState([]);
  const [error, setError] = useState("");
  const [petugasHarianData, setPetugasHarianData] = useState([]);
  const [wilayahList, setWilayahList] = useState([]);
  const [showNavbar, setShowNavbar] = useState(false);
  const [wilayahHarianList, setWilayahHarianList] = useState([]);

  const stableLogout = useCallback(() => logout(), [logout]);

  useEffect(() => {
    const fetchHarian = async () => {
      try {
        const [harianKecamatan, harianPetugas, detailTotal, wilayahHarian] =
          await Promise.all([
            getKecamatanHarianData(tanggalHarian),
            getPetugasDetailHarian(tanggalHarian),
            getPetugasDetail(),
            getWilayahHarianData(tanggalHarian),
          ]);
        console.log("tanggal:", tanggalHarian); // cek tanggal
        console.log("data harian:", harianPetugas); // cek datanya
        setKecamatanHarianData(harianKecamatan);
        setPetugasHarianData(harianPetugas);
        setPetugasDetailData(detailTotal);
        setWilayahHarianList(wilayahHarian);
      } catch (err) {
        console.error("Gagal fetch harian:", err);
      }
    };
    fetchHarian();
    const interval = setInterval(fetchHarian, 60000);
    return () => clearInterval(interval);
  }, [tanggalHarian]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [petugas, progress, kecamatan, progress15, wilayah] =
          await Promise.all([
            getPetugasData(),
            getProgressData(),
            getKecamatanData(),
            getProgress15Hari(),
            getWilayahData(),
          ]);
        setPetugasData(petugas);
        setProgressData(progress);
        setKecamatanData(kecamatan);
        setProgress15HariData(progress15);
        setWilayahList(wilayah);
      } catch (err) {
        if (err.response?.status === 401) {
          stableLogout();
        } else {
          setError("Gagal memuat data dashboard");
        }
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [stableLogout]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <div
        onMouseEnter={() => setShowNavbar(true)}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 8,
          zIndex: 9999,
        }}
      />
      <div
        style={{
          ...navStyles.nav,
          transform: showNavbar ? "translateY(0)" : "translateY(-100%)",
        }}
        onMouseLeave={() => setShowNavbar(false)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img
            src="/logo-sensus.png"
            alt="Logo"
            style={{ width: 28, height: 28, objectFit: "contain" }}
          />
          <div
            style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}
          >
            <span style={navStyles.brandName}>SEMAKI</span>
            <span style={navStyles.brandSub}>
              Sensus Ekonomi Manajemen Aktivitas dan Kinerja
            </span>
          </div>
        </div>
        <div style={navStyles.tabs}>
          {[
            ["monitor", "📊 Monitor"],
            ["petugas", "👥 Kelola Petugas"],
            ["tugas", "📋 Kelola Tugas"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveMenu(key)}
              style={{
                ...navStyles.tab,
                ...(activeMenu === key ? navStyles.tabActive : {}),
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div style={navStyles.right}>
          <span style={navStyles.nama}>👤 {user?.nama}</span>
          <button style={navStyles.logoutBtn} onClick={stableLogout}>
            Logout
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: "#fee2e2",
            color: "#dc2626",
            padding: "10px",
            textAlign: "center",
            fontSize: 13,
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {activeMenu === "monitor" && (
        // ↓ hapus style={{ flex: 1 }}, biarkan CSS .dashboard yang mengatur
        <div className="dashboard">
          <div className="left">
            <ProgressPendataan data={progressData} />
            <TabelPendataan
              kecamatanData={kecamatanData}
              kecamatanHarianData={kecamatanHarianData}
              tanggalHarian={tanggalHarian}
              onTanggalChange={setTanggalHarian}
            />
          </div>
          <div className="center">
            <PetugasLapangan data={petugasData} />
            <div className="peta-wrapper">
              <PetaSebaranPetugas wilayahData={wilayahList} />
            </div>
            <Progress15Hari data={progress15HariData} />
          </div>
          <div className="right">
            <ProgressPetugas
              petugasDetailData={petugasDetailData}
              petugasHarianData={petugasHarianData}
              tanggalHarian={tanggalHarian}
              onTanggalChange={setTanggalHarian}
              wilayahData={wilayahList}
              wilayahHarianData={wilayahHarianList}
            />
          </div>
        </div>
      )}
      {activeMenu === "petugas" && (
        <div style={{ flex: 1, overflow: "auto", backgroundColor: "#f0f4f8" }}>
          <KelolaPetugas />
        </div>
      )}
      {activeMenu === "tugas" && (
        <div style={{ flex: 1, overflow: "auto", backgroundColor: "#f0f4f8" }}>
          <KelolaResponden />
        </div>
      )}
    </div>
  );
}

// ─── Dashboard Viewer (read-only, cuma monitor) ───────────────
function ViewerDashboard() {
  const { user, logout } = useAuth();
  const [petugasData, setPetugasData] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [kecamatanData, setKecamatanData] = useState([]);
  const [kecamatanHarianData, setKecamatanHarianData] = useState([]);
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const [tanggalHarian, setTanggalHarian] = useState(yesterday);
  const [progress15HariData, setProgress15HariData] = useState([]);
  const [petugasDetailData, setPetugasDetailData] = useState([]);
  const [error, setError] = useState("");
  const [petugasHarianData, setPetugasHarianData] = useState([]);
  const [wilayahList, setWilayahList] = useState([]);
  const [wilayahHarianList, setWilayahHarianList] = useState([]);
  const [showNavbar, setShowNavbar] = useState(false);

  const stableLogout = useCallback(() => logout(), [logout]);

  useEffect(() => {
    const fetchHarian = async () => {
      try {
        const [harianKecamatan, harianPetugas, detailTotal, wilayahHarian] =
          await Promise.all([
            getKecamatanHarianData(tanggalHarian),
            getPetugasDetailHarian(tanggalHarian),
            getPetugasDetail(),
            getWilayahHarianData(tanggalHarian),
          ]);
        setKecamatanHarianData(harianKecamatan);
        setPetugasHarianData(harianPetugas);
        setPetugasDetailData(detailTotal);
        setWilayahHarianList(wilayahHarian);
      } catch (err) {
        console.error("Gagal fetch harian:", err);
      }
    };
    fetchHarian();
    const interval = setInterval(fetchHarian, 60000);
    return () => clearInterval(interval);
  }, [tanggalHarian]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [petugas, progress, kecamatan, progress15, wilayah] =
          await Promise.all([
            getPetugasData(),
            getProgressData(),
            getKecamatanData(),
            getProgress15Hari(),
            getWilayahData(),
          ]);
        setPetugasData(petugas);
        setProgressData(progress);
        setKecamatanData(kecamatan);
        setProgress15HariData(progress15);
        setWilayahList(wilayah);
      } catch (err) {
        if (err.response?.status === 401) {
          stableLogout();
        } else {
          setError("Gagal memuat data dashboard");
        }
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [stableLogout]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Strip pemicu hover di paling atas */}
      <div
        onMouseEnter={() => setShowNavbar(true)}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 8,
          zIndex: 9999,
        }}
      />

      {/* Navbar yang muncul/hilang */}
      <div
        style={{
          ...navStyles.nav,
          transform: showNavbar ? "translateY(0)" : "translateY(-100%)",
        }}
        onMouseLeave={() => setShowNavbar(false)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img
            src="/logo-sensus.png"
            alt="Logo"
            style={{ width: 28, height: 28, objectFit: "contain" }}
          />
          <div
            style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}
          >
            <span style={navStyles.brandName}>SEMAKI</span>
            <span style={navStyles.brandSub}>
              Sensus Ekonomi Manajemen Aktivitas dan Kinerja
            </span>
          </div>
        </div>
        <div style={navStyles.right}>
          <span style={navStyles.nama}>👤 {user?.nama}</span>
          <button style={navStyles.logoutBtn} onClick={stableLogout}>
            Logout
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: "#fee2e2",
            color: "#dc2626",
            padding: "10px",
            textAlign: "center",
            fontSize: 13,
          }}
        >
          ⚠️ {error}
        </div>
      )}

      <div className="dashboard">
        <div className="left">
          <ProgressPendataan data={progressData} />
          <TabelPendataan
            kecamatanData={kecamatanData}
            kecamatanHarianData={kecamatanHarianData}
            tanggalHarian={tanggalHarian}
            onTanggalChange={setTanggalHarian}
          />
        </div>
        <div className="center">
          <PetugasLapangan data={petugasData} />
          <div className="peta-wrapper">
            <PetaSebaranPetugas wilayahData={wilayahList} />
          </div>
          <Progress15Hari data={progress15HariData} />
        </div>
        <div className="right">
          <ProgressPetugas
            petugasDetailData={petugasDetailData}
            petugasHarianData={petugasHarianData}
            tanggalHarian={tanggalHarian}
            onTanggalChange={setTanggalHarian}
            wilayahData={wilayahList}
            wilayahHarianData={wilayahHarianList}
          />
        </div>
      </div>
    </div>
  );
}

const navStyles = {
  nav: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9998,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "rgba(10, 26, 50, 0.97)",
    backdropFilter: "blur(12px)",
    padding: "0 1.5rem",
    color: "white",
    height: 56,
    boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
    transition: "transform 0.25s ease",
  },
  brandName: {
    fontWeight: "800",
    fontSize: "1rem",
    letterSpacing: "0.12em",
    color: "white",
  },
  brandSub: {
    fontSize: "0.6rem",
    fontWeight: "600",
    letterSpacing: "0.14em",
    color: "rgba(255,255,255,0.5)",
    textTransform: "uppercase",
    marginTop: 2,
  },
  tabs: {
    display: "flex",
    gap: 6,
    background: "rgba(255,255,255,0.08)",
    padding: 4,
    borderRadius: 10,
  },
  tab: {
    padding: "8px 16px",
    border: "none",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    background: "transparent",
    color: "rgba(255,255,255,0.75)",
    transition: "all 0.2s ease",
  },
  tabActive: {
    background: "white",
    color: "#0a2a5e",
    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
  },
  right: { display: "flex", alignItems: "center", gap: "0.75rem" },
  nama: {
    fontSize: "0.85rem",
    opacity: 0.9,
    whiteSpace: "nowrap",
    background: "rgba(255,255,255,0.08)",
    padding: "6px 10px",
    borderRadius: 8,
  },
  logoutBtn: {
    backgroundColor: "#ef4444",
    border: "none",
    color: "white",
    padding: "7px 14px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: "0.8rem",
    fontWeight: 700,
  },
};

// ─── Router utama ─────────────────────────────────────────────
function AppRoutes() {
  const { user } = useAuth();

  // ── Background geolocation via Capacitor (APK) atau browser biasa ──
  useEffect(() => {
    if (!user || user.role === "admin") return;

    let watcherId = null;

    const startBgLokasi = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          // Pakai Capacitor background geolocation — jalan meski app di-minimize
          watcherId = await BackgroundGeolocation.addWatcher(
            {
              backgroundMessage: "SEMAKI sedang memantau lokasi Anda.",
              backgroundTitle: "SEMAKI Aktif",
              requestPermissions: true,
              stale: false,
              distanceFilter: 50,
            },
            async (location, error) => {
              if (error) {
                if (error.code === "NOT_AUTHORIZED") {
                  if (
                    window.confirm(
                      "Agar lokasi bisa terkirim saat aplikasi di-minimize, " +
                        'buka Pengaturan → Izin Aplikasi → Lokasi → pilih "Izinkan sepanjang waktu". ' +
                        "Buka pengaturan sekarang?",
                    )
                  ) {
                    BackgroundGeolocation.openSettings();
                  }
                }
                return;
              }
              if (!location) return;
              try {
                await api.post(`/${user.role}/lokasi`, {
                  latitude: location.latitude,
                  longitude: location.longitude,
                });
              } catch (err) {
                // silent
              }
            },
          );
        } else {
          // Di browser biasa — pakai geolocation + interval 1 jam
          const kirimLokasi = () => {
            if (!navigator.geolocation) return;
            navigator.geolocation.getCurrentPosition(
              async (pos) => {
                try {
                  await api.post(`/${user.role}/lokasi`, {
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                  });
                } catch (err) {}
              },
              () => {},
              { timeout: 10000, maximumAge: 60000 },
            );
          };
          kirimLokasi();
          watcherId = setInterval(kirimLokasi, 60 * 60 * 1000);
        }
      } catch (err) {
        console.warn("Background geolocation error:", err);
      }
    };

    startBgLokasi();

    return () => {
      if (Capacitor.isNativePlatform() && watcherId) {
        BackgroundGeolocation.removeWatcher({ id: watcherId });
      } else if (watcherId) {
        clearInterval(watcherId);
      }
    };
  }, [user]);

  // ── Notifikasi pengingat kirim lokasi tiap 1 menit (APK saja) ──
  useEffect(() => {
    if (!user || user.role === "admin" || !Capacitor.isNativePlatform()) return;

    const setupNotif = async () => {
      try {
        const perm = await LocalNotifications.requestPermissions();
        if (perm.display !== "granted") return;

        await LocalNotifications.cancel({ notifications: [{ id: 1 }] });

        const jadwalkanNotif = async () => {
          await LocalNotifications.schedule({
            notifications: [
              {
                id: 1,
                title: "SEMAKI - Pengingat Lokasi",
                body: "Anda belum kirim lokasi dalam 1 menit terakhir. Tap untuk kirim.",
                schedule: { at: new Date(Date.now() + 60 * 1000) },
                actionTypeId: "KIRIM_LOKASI",
                extra: { action: "kirim_lokasi" },
              },
            ],
          });
        };

        jadwalkanNotif();
        const iv = setInterval(jadwalkanNotif, 60 * 1000);

        LocalNotifications.addListener(
          "localNotificationActionPerformed",
          async () => {
            if (!navigator.geolocation) return;
            navigator.geolocation.getCurrentPosition(async (pos) => {
              try {
                await api.post(`/${user.role}/lokasi`, {
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                });
              } catch (err) {}
            });
          },
        );

        return () => {
          clearInterval(iv);
          LocalNotifications.cancel({ notifications: [{ id: 1 }] });
          LocalNotifications.removeAllListeners();
        };
      } catch (err) {
        console.warn("Notifikasi error:", err);
      }
    };

    setupNotif();
  }, [user]);

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route
        path="/admin"
        element={
          <PrivateRoute role="admin">
            <AdminDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/viewer"
        element={
          <PrivateRoute role="viewer">
            <ViewerDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/ppl"
        element={
          <PrivateRoute role="ppl">
            <DashboardPPL />
          </PrivateRoute>
        }
      />
      <Route
        path="/pml"
        element={
          <PrivateRoute role="pml">
            <DashboardPML />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to={`/${user.role}`} />} />
    </Routes>
  );
}

// ─── App Utama ───────────────────────────────────────────────
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
