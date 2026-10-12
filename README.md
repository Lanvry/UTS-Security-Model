# UTS Security Model - Multi-Server Encrypted Architecture

Implementasi arsitektur pertukaran dan sinkronisasi data terenkripsi berbasis **Express.js**, **MySQL**, **EJS**, **GZIP**, **AES-256-CBC**, dan **JWT Auth**.

---

## 🌟 Fitur Utama
- **Server A (Port 3000)**: Pengelola data asli (*Plaintext*) di `db_a`.
- **Enkripsi AES-256 + GZIP**: Kompresi data dengan `zlib` lalu enkripsi AES-256-CBC sebelum dikirimkan via HTTP POST.
- **Server B (Port 3001)**: Menerima payload terenkripsi dan menyimpannya ke `db_b` (*Encryption at Rest*).
- **Protected EndPoint API**: Verifikasi token JWT (`POST /api/auth/login`) sebelum data dari `db_b` didekripsi dan disajikan ke client (`GET /api/endpoint/produk`).
- **HTTP Compression**: Dukungan kompresi transport level GZIP menggunakan middleware `compression`.

---

## 🚀 Panduan Memulai

### 1. Kloning dan Setup
```bash
git clone git@github.com:Lanvry/UTS-Security-Model.git
cd UTS-Security-Model
```

### 2. Konfigurasi Lingkungan
Salin file konfigurasi contoh:
```bash
cp .env.example .env
```
Sesuaikan kredensial MySQL lokal jika diperlukan.

### 3. Setup Basis Data
Jalankan file SQL untuk membuat database `db_a` dan `db_b`:
```bash
mysql -u root < schema.sql
```

### 4. Instalasi Dependensi
```bash
npm install
cd server-a && npm install && cd ..
cd server-b && npm install && cd ..
```

### 5. Menjalankan Server
- **Server A**:
  ```bash
  cd server-a && PORT=3000 npm start
  ```
- **Server B**:
  ```bash
  cd server-b && PORT=3001 npm start
  ```
