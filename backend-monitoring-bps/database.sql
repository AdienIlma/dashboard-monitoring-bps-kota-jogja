-- 1. TABEL USERS
CREATE TABLE users (
  id           SERIAL PRIMARY KEY,
  nama         VARCHAR(100) NOT NULL,
  username     VARCHAR(50)  UNIQUE NOT NULL,
  password     VARCHAR(255) NOT NULL,
  role         VARCHAR(10)  NOT NULL CHECK (role IN ('admin', 'pml', 'ppl')),
  pml_id       INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  is_logged_in BOOLEAN      DEFAULT FALSE,
  nomor_whatsapp VARCHAR(20),
  target       INTEGER      DEFAULT 0,
  created_at   TIMESTAMP    DEFAULT NOW()
);
 
-- 2. TABEL LOKASI
CREATE TABLE lokasi (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER        REFERENCES users(id) ON DELETE CASCADE,
  latitude    DECIMAL(10, 8) NOT NULL,
  longitude   DECIMAL(11, 8) NOT NULL,
  recorded_at TIMESTAMP      DEFAULT NOW()
);
 
-- 3. TABEL WILAYAH
CREATE TABLE wilayah (
  id         SERIAL PRIMARY KEY,
  kode_sls   VARCHAR(20)  UNIQUE,
  kecamatan  VARCHAR(100) NOT NULL,
  kelurahan  VARCHAR(100),
  pml_id     INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  ppl_id     INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  target     INTEGER      DEFAULT 0,
  created_at TIMESTAMP    DEFAULT NOW()
);
 
-- 4. TABEL USER_SLS 
CREATE TABLE user_sls (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  wilayah_id INTEGER NOT NULL REFERENCES wilayah(id) ON DELETE CASCADE,
  UNIQUE (user_id, wilayah_id)
);
 
-- 5. TABEL INPUT HARIAN
CREATE TABLE input_harian (
  id         SERIAL PRIMARY KEY,
  ppl_id     INTEGER   REFERENCES users(id)   ON DELETE CASCADE,
  wilayah_id INTEGER   REFERENCES wilayah(id) ON DELETE CASCADE,
  ke_lapangan INTEGER  DEFAULT 0,
  submit     INTEGER   DEFAULT 0,
  approve    INTEGER   DEFAULT 0,
  pml_hadir  BOOLEAN   DEFAULT FALSE,
  catatan    TEXT,
  tanggal    DATE      DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);