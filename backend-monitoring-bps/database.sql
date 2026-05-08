-- Tabel users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(10) CHECK (role IN ('admin', 'pml', 'ppl')) NOT NULL,
  pml_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabel responden
CREATE TABLE responden (
  id SERIAL PRIMARY KEY,
  nama_kepala_keluarga VARCHAR(100) NOT NULL,
  alamat TEXT NOT NULL,
  kecamatan VARCHAR(50),
  kelurahan VARCHAR(50),
  ppl_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'belum' CHECK (status IN ('belum', 'sudah_lapangan', 'submitted', 'approved', 'ditolak')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabel submissions
CREATE TABLE submissions (
  id SERIAL PRIMARY KEY,
  responden_id INTEGER REFERENCES responden(id) ON DELETE CASCADE,
  ppl_id INTEGER REFERENCES users(id),
  catatan_ppl TEXT,
  submitted_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'ditolak')),
  catatan_pml TEXT,
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMP
);