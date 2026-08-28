const express = require("express");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["https://semaki.my.id", "http://localhost:3000"];

app.use(
  require("cors")({
    origin: (origin, callback) => {
      if (!origin || origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1") || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-session-token"],
    credentials: true,
  }),
);

/*
|--------------------------------------------------------------------------
| Middleware
|--------------------------------------------------------------------------
*/
// Kompres semua response JSON/text otomatis — hemat bandwidth
app.use(compression());

// Ganti body-parser (deprecated) dengan bawaan Express
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

/*
|--------------------------------------------------------------------------
| Rate Limiting
|--------------------------------------------------------------------------
| ⚠️  Urutan penting: rule spesifik harus didaftarkan SEBELUM rule umum
|     agar /api/auth/login kena loginLimiter dulu, bukan apiLimiter dulu.
|--------------------------------------------------------------------------
*/
// Khusus login — cegah brute force & banjir request
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 10, // max 10 percobaan per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Terlalu banyak percobaan login. Coba lagi 15 menit." },
});

// Rate limit umum untuk semua API — cegah spam
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 menit
  max: 120, // max 120 request/menit per IP (2 req/detik)
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Terlalu banyak request. Coba lagi sebentar." },
});

// ✅ Spesifik dulu, baru umum
app.use("/api/auth/login", loginLimiter);
app.use("/api/", apiLimiter);

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/
const authRoutes = require("./src/routes/authRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const pplRoutes = require("./src/routes/pplRoutes");
const pmlRoutes = require("./src/routes/pmlRoutes");
const wilayahRoutes = require("./src/routes/wilayahRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ppl", pplRoutes);
app.use("/api/pml", pmlRoutes);
app.use("/api/wilayah", wilayahRoutes);

// Scheduler — wrapped agar crash-nya tidak matiin server
try {
  require("./src/scheduler");
} catch (err) {
  console.error("Scheduler gagal start:", err.message);
}

/*
|--------------------------------------------------------------------------
| Root Endpoint
|--------------------------------------------------------------------------
*/
app.get("/", (req, res) => {
  res.json({ message: "Backend BPS Monitoring OK" });
});

/*
|--------------------------------------------------------------------------
| Debug Endpoint — HANYA di development
|--------------------------------------------------------------------------
*/
if (process.env.NODE_ENV !== "production") {
  app.get("/debug-env", (req, res) => {
    res.json({
      cwd: process.cwd(),
      dirname: __dirname,
      DB_USER: process.env.DB_USER,
      DB_NAME: process.env.DB_NAME,
      DB_HOST: process.env.DB_HOST,
      HAS_PASSWORD: !!process.env.DB_PASSWORD,
    });
  });
}

/*
|--------------------------------------------------------------------------
| Error Handler
|--------------------------------------------------------------------------
*/
const isDev = process.env.NODE_ENV !== "production";

app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(err.status || 500).json({
    message: isDev ? err.message : "Internal Server Error",
  });
});

/*
|--------------------------------------------------------------------------
| Global Error Safety Net
|--------------------------------------------------------------------------
*/
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err.message);
  // Jangan langsung exit di production — log dulu, lalu biarkan process manager (PM2) restart
});

/*
|--------------------------------------------------------------------------
| Server
|--------------------------------------------------------------------------
*/
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server jalan di port ${PORT} [${process.env.NODE_ENV || "development"}]`,
  );
});
