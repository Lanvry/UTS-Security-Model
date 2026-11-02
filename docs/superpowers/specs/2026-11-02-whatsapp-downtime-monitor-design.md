# Design Doc: WhatsApp Server Downtime & Sync Monitor (`server-monitor`)

## 1. Intent & The Why
Proyek UTS Security Model mengimplementasikan arsitektur data terenkripsi multi-server (Server A mengelola plaintext dan mengenkripsi data via AES-256-CBC + GZIP, Server B menyimpan ciphertext dan melayani dekripsi terautentikasi via JWT). 
Untuk memastikan keandalan sistem dan memenuhi kebutuhan integrasi WhatsApp, dibutuhkan layanan pemantau (observability / watchdog) yang dapat:
1. Mendeteksi secara mandiri jika Server A atau Server B mengalami kegagalan (*down* / *crash* / *unresponsive*).
2. Mengirimkan notifikasi darurat secara instan ke nomor WhatsApp admin/pengembang saat server mati dan saat server berhasil pulih (*recovered*).
3. Mengirimkan notifikasi audit berkala saat sinkronisasi data antar-server sukses atau gagal.

Karena Baileys terikat pada siklus hidup proses Node.js, menempatkannya di dalam Server A atau Server B akan menyebabkan kegagalan deteksi jika server tersebut mati (*single point of failure*). Oleh karena itu, monitor dipisahkan menjadi microservice independen.

---

## 2. Goals, Non-Goals, Anti-Goals

### Goals
- **Independent Health Check**: Service `server-monitor` berjalan di proses/port terpisah (contoh: port 3005) dan secara periodik melakukan *health polling* (default tiap 10 detik) ke Server A dan Server B.
- **WhatsApp Alerting via Baileys**: Menggunakan `@whiskeysockets/baileys` yang menyimpan kredensial auth lokal (multi-file auth state). Menampilkan terminal QR code saat inisialisasi awal.
- **Stateful Alerting (Anti-Spam)**:
  - Notifikasi *DOWN* hanya dikirim **satu kali** saat status transisi dari `UP` -> `DOWN`.
  - Notifikasi *RECOVERED* dikirim **satu kali** saat status transisi dari `DOWN` -> `UP`.
  - Tidak membanjiri chat WhatsApp dengan pesan per detik jika server tetap down.
- **Notification API Endpoint**: Endpoint `POST /api/notify` pada `server-monitor` agar Server A / Server B dapat mengirimkan pesan notifikasi kustom (misal event sinkronisasi database, token alert).
- **Health Endpoint Standar**: Menyediakan endpoint `/health` ringan pada Server A dan Server B yang mengembalikan status HTTP 200 dan uptime.

### Non-Goals
- Membuat sistem WhatsApp Bot interaktif 2 arah yang kompleks (seperti e-commerce catalog checkout).
- Menggantikan tools monitoring skala enterprise seperti Prometheus/Grafana.

### Anti-Goals
- Menempatkan instance Baileys di dalam Server A atau Server B yang dapat menyebabkan *silent failure* saat server crash.
- Melakukan spamming notifikasi WhatsApp pada setiap interval polling ketika server sedang mati.

---

## 3. Constraints
- Menjaga integritas kode yang sudah ada pada Server A dan Server B tanpa merusak flow enkripsi AES-256 dan auto-sync.
- Menggunakan Node.js, Express, dan `@whiskeysockets/baileys` + `qrcode-terminal` (atau web QR sederhana).
- Nomor tujuan WhatsApp admin dikonfigurasi melalui `.env` (`WA_TARGET_PHONE=628xxxxxxxxxx`).
- Interval polling dan URL target Server A dan Server B dikonfigurasi via `.env`.

---

## 4. Approaches Considered

| Pendekatan | Mekanisme | Kelebihan | Kekurangan | Putusan |
|---|---|---|---|---|
| **A. Monolitik Baileys di Server A/B** | Baileys di-import langsung di Server A atau Server B | Tidak butuh folder/proses baru | **Fatal flaw**: Jika server mati, Baileys ikut mati sehingga tidak bisa mengirim alert downtime | **Ditolak** |
| **B. Cloud API Gateway (Fonnte/Wablas) + Mutual Heartbeat** | Server A & B saling ping, panggil REST API Fonnte | Tidak perlu scan QR di lokal | Ketergantungan ke layanan pihak ketiga (kuota gratis terbatas), tetap butuh logika mutual ping rumit | **Ditolak** |
| **C. Dedicated Watcher Microservice (`server-monitor`)** | Satu service Node.js independen (Baileys + Heartbeat Engine + Alerting State Machine) | 100% independen, gratis, toleran terhadap kegagalan Server A atau Server B, stateful anti-spam | Memerlukan 1 proses Node.js tambahan | **Dipilih (Rekomendasi)** |

---

## 5. Architectural Specification & Flow

### A. Struktur Folder Baru: `server-monitor/`
```text
UTS_Workshop/
├── server-a/
│   └── routes/health.js         <-- Endpoint GET /health
├── server-b/
│   └── routes/health.js         <-- Endpoint GET /health
├── server-monitor/              <-- Service Monitoring Baru
│   ├── package.json
│   ├── index.js                 <-- Express server + REST API /api/notify
│   ├── services/
│   │   ├── whatsapp.js          <-- Baileys socket client, QR terminal auth
│   │   └── monitor.js           <-- Polling loop (Server A & B) + State tracking
│   └── auth_info_baileys/       <-- Directory session Baileys (gitignored)
└── .env                         <-- Konfigurasi terpusat
```

### B. Health Check Protocol
1. Server A dan Server B menambahkan endpoint:
   `GET /health` -> `{ status: "ok", server: "server-a", timestamp: "..." }`
2. `server-monitor` menjalankan polling setiap `MONITOR_INTERVAL_MS` (default 10000 ms / 10 detik).
3. Target URL:
   - Server A: `http://localhost:4000/health` (atau via port di `.env`)
   - Server B: `SERVER_B_URL/health` (mendukung remote/Tailscale atau localhost)
4. State Machine per Server:
   - Status awal: `UNKNOWN`
   - Jika response HTTP 200:
     - Jika sebelumnya `DOWN`: Kirim pesan WhatsApp *"🟢 [RECOVERED] Server {NAME} telah kembali ONLINE pada {WAKTU}."*
     - Set status `UP`.
   - Jika response timeout (> 5000ms) / error koneksi (ECONNREFUSED):
     - Jika sebelumnya `UP`: Kirim pesan WhatsApp *"🚨 [ALERT] Server {NAME} DOWN / TIDAK MERESPONS! (Error: {ERR}) pada {WAKTU}."*
     - Set status `DOWN`.

### C. WhatsApp Dispatcher (`services/whatsapp.js`)
- Menggunakan `makeWASocket` dari `@whiskeysockets/baileys` dengan `useMultiFileAuthState`.
- Menampilkan QR Code di terminal menggunakan `qrcode-terminal`.
- Fungsi `sendAlert(message)`:
  - Format nomor tujuan internasional (contoh: `6281234567890@s.whatsapp.net`).
  - Mengantre pesan jika socket sedang *connecting/reconnecting*.

### D. Notifikasi Event Tambahan (`POST /api/notify`)
- `server-monitor` membuka endpoint HTTP:
  `POST /api/notify` dengan payload: `{ topic: "sync", message: "Sinkronisasi berhasil 4 produk" }`
- Server A (`syncService.js`) dapat memanggil endpoint ini secara asinkron setelah proses enkripsi dan push data ke Server B selesai, sehingga admin juga mendapatkan update status sinkronisasi di WhatsApp.

---

## 6. What's Left to the Builder
- Pemilihan versi persis paket Baileys (`@whiskeysockets/baileys`) dan logger `pino`.
- Format styling teks pesan WhatsApp (menggunakan bold `*...*`, monospace ````...````, dan emoji alert yang jelas).
- Penanganan reconnect Baileys otomatis (`DisconnectReason`).
