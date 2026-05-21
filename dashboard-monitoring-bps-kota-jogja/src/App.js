import React, { useEffect, useState, useCallback } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
} from "./services/dataService";

import axios from "axios";

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
      setError(err.response?.data?.message || "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={loginStyles.container}>
      <div style={loginStyles.card}>
        <div style={loginStyles.logo}>📊</div>
        <h2 style={loginStyles.title}>BPS Kota Yogyakarta</h2>
        <p style={loginStyles.subtitle}>Sistem Monitoring Pendataan</p>
        {error && <div style={loginStyles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={loginStyles.field}>
            <label style={loginStyles.label}>Username</label>
            <input
              style={loginStyles.input}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              required
            />
          </div>
          <div style={loginStyles.field}>
            <label style={loginStyles.label}>Password</label>
            <input
              style={loginStyles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              required
            />
          </div>
          <button style={loginStyles.button} type="submit" disabled={loading}>
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>
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
    backgroundColor: "#0f172a",
    backgroundImage: "radial-gradient(ellipse at top, #1e3a5f 0%, #0f172a 70%)",
  },
  card: {
    backgroundColor: "white",
    padding: "2.5rem",
    borderRadius: "16px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
    width: "100%",
    maxWidth: "380px",
  },
  logo: { textAlign: "center", fontSize: "2.5rem", marginBottom: "0.5rem" },
  title: {
    textAlign: "center",
    color: "#1e3a5f",
    marginBottom: "4px",
    fontSize: "1.4rem",
    fontWeight: "800",
  },
  subtitle: {
    textAlign: "center",
    color: "#64748b",
    marginBottom: "1.5rem",
    fontSize: "0.85rem",
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
    color: "#374151",
    fontWeight: "600",
    fontSize: "0.875rem",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "0.95rem",
    boxSizing: "border-box",
    outline: "none",
  },
  button: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#1e3a5f",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: "700",
    cursor: "pointer",
    marginTop: "0.5rem",
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

  const stableLogout = useCallback(() => logout(), [logout]);

  // App.js — ganti useEffect fetchPetugasHarian
  useEffect(() => {
  const fetchHarian = async () => {
    try {
      const [harianKecamatan, harianPetugas, detailTotal] = await Promise.all([
        getKecamatanHarianData(tanggalHarian),
        getPetugasDetailHarian(tanggalHarian),
        getPetugasDetail(),
      ]);

      setKecamatanHarianData(harianKecamatan);
      setPetugasHarianData(harianPetugas);
      setPetugasDetailData(detailTotal);
    } catch (err) {
      console.error("Gagal fetch harian:", err);
    }
  };

  fetchHarian();

  const interval = setInterval(fetchHarian, 5000);

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

  const interval = setInterval(fetchData, 5000);

  return () => clearInterval(interval);
  }, [stableLogout]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
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
      {/* Navbar */}
<div
  style={{
    ...navStyles.nav,
    transform: showNavbar ? "translateY(0)" : "translateY(-100%)",
  }}
  onMouseLeave={() => setShowNavbar(false)}
>
        <span style={navStyles.title}>
          📊 Dashboard Monitoring BPS Kota Yogyakarta
        </span>
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

      {/* Konten */}
      {activeMenu === "monitor" && (
        <div className="dashboard" style={{ flex: 1 }}>
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
            <PetaSebaranPetugas wilayahData={wilayahList} />
            <Progress15Hari data={progress15HariData} />
          </div>
          <div className="right">
            <ProgressPetugas
              petugasDetailData={petugasDetailData}
              petugasHarianData={petugasHarianData}
              tanggalHarian={tanggalHarian}
              onTanggalChange={setTanggalHarian}
              wilayahData={wilayahList}
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
    background: "rgba(30, 58, 95, 0.96)",
    backdropFilter: "blur(12px)",
    padding: "0 1.5rem",
    color: "white",
    height: 56,
    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
    transition: "transform 0.25s ease",
  },

  title: {
    fontWeight: "800",
    fontSize: "0.95rem",
    whiteSpace: "nowrap",
    letterSpacing: "0.02em",
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
    color: "#1e3a5f",
    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
  },

  right: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },

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
    transition: "all 0.2s ease",
  },
};

// ─── Router utama ─────────────────────────────────────────────
function AppRoutes() {
  const { user } = useAuth();

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
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
