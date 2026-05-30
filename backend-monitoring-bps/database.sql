--1. USERS

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,

  nama VARCHAR(100) NOT NULL,

  username VARCHAR(50) NOT NULL UNIQUE,

  password VARCHAR(255) NOT NULL,

  role ENUM('admin','pml','ppl') NOT NULL,

  pml_id INT NULL,

  is_logged_in BOOLEAN DEFAULT FALSE,

  nomor_whatsapp VARCHAR(20),

  target INT DEFAULT 0,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_users_pml
    FOREIGN KEY (pml_id)
    REFERENCES users(id)
    ON DELETE SET NULL
);

-- 2. LOKASI

CREATE TABLE lokasi (
  id INT AUTO_INCREMENT PRIMARY KEY,

  user_id INT NOT NULL,

  latitude DECIMAL(10,8) NOT NULL,

  longitude DECIMAL(11,8) NOT NULL,

  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_lokasi_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

-- 3. WILAYAH

CREATE TABLE wilayah (
  id INT AUTO_INCREMENT PRIMARY KEY,

  kode_sls VARCHAR(20) UNIQUE,

  kecamatan VARCHAR(100) NOT NULL,

  kelurahan VARCHAR(100),

  pml_id INT NULL,

  ppl_id INT NULL,

  target INT DEFAULT 0,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_wilayah_pml
    FOREIGN KEY (pml_id)
    REFERENCES users(id)
    ON DELETE SET NULL,

  CONSTRAINT fk_wilayah_ppl
    FOREIGN KEY (ppl_id)
    REFERENCES users(id)
    ON DELETE SET NULL
);

-- 4. USER_SLS

CREATE TABLE user_sls (
  id INT AUTO_INCREMENT PRIMARY KEY,

  user_id INT NOT NULL,

  wilayah_id INT NOT NULL,

  UNIQUE KEY uk_user_wilayah (
    user_id,
    wilayah_id
  ),

  CONSTRAINT fk_user_sls_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_user_sls_wilayah
    FOREIGN KEY (wilayah_id)
    REFERENCES wilayah(id)
    ON DELETE CASCADE
);

-- 5. INPUT_HARIAN

CREATE TABLE input_harian (
  id INT AUTO_INCREMENT PRIMARY KEY,

  ppl_id INT NOT NULL,

  wilayah_id INT NOT NULL,

  ke_lapangan INT DEFAULT 0,

  submit INT DEFAULT 0,

  approve INT DEFAULT 0,

  pml_hadir BOOLEAN DEFAULT FALSE,

  catatan TEXT,

  tanggal DATE DEFAULT (CURRENT_DATE),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_input_ppl
    FOREIGN KEY (ppl_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_input_wilayah
    FOREIGN KEY (wilayah_id)
    REFERENCES wilayah(id)
    ON DELETE CASCADE
);