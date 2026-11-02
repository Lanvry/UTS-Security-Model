# Design Doc: WhatsApp Server Downtime & Sync Monitor (`server-monitor`)

## 1. Intent & The Why
Proyek UTS Security Model mengimplementasikan arsitektur data terenkripsi multi-server (Server A mengelola plaintext dan mengenkripsi data via AES-256-CBC + GZIP, Server B menyimpan ciphertext dan melayani dekripsi terautentikasi via JWT). 
Untuk memastikan keandalan sistem dan memenuhi kebutuhan integrasi WhatsApp, dibutuhkan layanan pemantau (*watchdog / observability service*) yang dapat:
1. Mendeteksi secara mandiri jika Server A atau Server B mengalami kegagalan (*down* / *crash* / *unresponsive*).
2. Mengirimkan notifikasi darurat secara instan ke nomor WhatsApp admin saat server mati dan saat server berhasil pulih (*recovered*).
3. Mengirimkan notifikasi audit saat sinkronisasi data antar-server mengalami kegagalan (*error*) atau saat ada perubahan data baru (*mutation*).

Karena Baileys terikat pada siklus hidup proses Node.js, menempatkannya di dalam Server A atau Server B akan menyebabkan kegagalan deteksi jika server tersebut mati (*single point of failure*). Oleh karena itu, monitor dipisahkan menjadi microservice independen (`server-monitor`).

---

## 2. Goals, Non-Goals, Anti-Goals

### Goals
- **Independent Health Check**: Service `server-monitor` berjalan di proses/port terpisah (port `3005`) dan secara periodik melakukan health polling (default tiap 10 detik) ke Server A dan Server B.
- **WhatsApp Alerting via Baileys**: Menggunakan `@whiskeysockets/baileys` yang menyimpan kredensial auth lokal (`server-monitor/auth_info_baileys`). Menampilkan terminal QR code saat inisialisasi awal.
- **Stateful Alerting & Anti-Flapping**:
  - Ambang batas kegagalan: Memerlukan **2 kali kegagalan beruntun** (*consecutive failures*) sebelum menyatakan server `DOWN` untuk mencegah *false alarm* akibat fluktuasi latensi WAN/Tailscale.
  - Notifikasi *DOWN* hanya dikirim **satu kali** saat status beralih ke `DOWN`.
  - Notifikasi *RECOVERED* dikirim **satu kali** saat status beralih kembali ke `UP`.
- **Sync Notification Policy (Anti-Ban/Anti-Spam)**:
  - Notifikasi sinkronisasi **hanya** dikirim saat terjadi **error/kegagalan** atau saat terjadi **perubahan data nyata (insert/update/delete)**.
  - Heartbeat timer rutin setiap 30 detik yang tidak membawa perubahan data **dibuat senyap (silent)** agar nomor WhatsApp tidak terblokir oleh sistem anti-spam WhatsApp.
- **Notification API Endpoint**: Endpoint `POST /api/notify` pada `server-monitor` (dilindungi `x-api-key` sederhana) agar Server A dapat memicu notifikasi kustom.
- **Health Endpoints**: Menyediakan endpoint `GET /health` ringan pada Server A dan Server B yang mengembalikan status HTTP 200, nama server, dan timestamp.

### Non-Goals
- Membuat bot percakapan 2 arah yang kompleks (seperti chatbot NLP belanja).
- Menggantikan tools monitoring enterprise seperti Prometheus/Grafana.

### Anti-Goals
- Menempatkan instance Baileys di dalam Server A atau Server B yang dapat menyebabkan *silent failure* saat server crash.
- Melakukan spamming pesan WhatsApp pada setiap interval polling atau setiap kali timer auto-sync 30 detik berdetak.

---

## 3. Constraints & Configuration
- Menjaga integritas kode enkripsi AES-256 dan sinkronisasi di Server A dan Server B.
- Konfigurasi terpusat di `.env`:
  - `MONITOR_PORT=3005`
  - `MONITOR_INTERVAL_MS=10000` (polling setiap 10 detik)
  - `SERVER_A_URL=http://127.0.0.1:4000`
  - `SERVER_B_URL=http://ubuntu.leopard-gila.ts.net:3002` (bisa diubah ke localhost jika testing)
  - `WA_TARGET_PHONE=628xxxxxxxxxx` (nomor tujuan notifikasi WhatsApp)
  - `MONITOR_API_KEY=monitor-secret-key-uts-2026`

---

## 4. Approaches Considered

| Pendekatan | Mekanisme | Kelebihan | Kekurangan | Putusan |
|---|---|---|---|---|
| **A. Monolitik Baileys di Server A/B** | Baileys di-import langsung di Server A atau Server B | Tidak butuh folder/proses baru | **Fatal flaw**: Jika server mati, Baileys ikut mati sehingga tidak bisa mengirim alert downtime | **Ditolak** |
| **B. Cloud API Gateway (Fonnte/Wablas) + Mutual Heartbeat** | Server A & B saling ping, panggil REST API Fonnte | Tidak perlu scan QR di lokal | Ketergantungan ke layanan pihak ketiga (kuota gratis terbatas), tetap butuh logika mutual ping rumit | **Ditolak** |
| **C. Dedicated Watcher Microservice (`server-monitor`)** | Satu service Node.js independen (Baileys + Heartbeat Engine + Alerting State Machine) | 100% independen, gratis, toleran terhadap kegagalan Server A atau Server B, stateful anti-spam | Memerlukan 1 proses Node.js tambahan | **Dipilih (Rekomendasi)** |

---

## 5. Architectural Specification & Flow

### A. Struktur Folder & Komponen Baru
```text
UTS_Workshop/
├── server-a/
│   ├── routes/health.js         <-- Endpoint GET /health
│   └── services/syncService.js  <-- Tambahan trigger POST /api/notify saat error atau data mutasi
├── server-b/
│   └── routes/health.js         <-- Endpoint GET /health
├── server-monitor/              <-- Service Monitoring Baru
│   ├── package.json
│   ├── index.js                 <-- Express server + REST API POST /api/notify
│   ├── services/
│   │   ├── whatsapp.js          <-- Baileys socket client, QR terminal auth, queue sender
│   │   └── monitor.js           <-- Polling loop (Server A & B) + Consecutive failure tracking
│   └── auth_info_baileys/       <-- Directory session Baileys (gitignored)
└── .env                         <-- Konfigurasi terpusat
```

### B. Health Check & State Machine Logic
1. Server A dan Server B menambahkan endpoint:
   `GET /health` -> `{ status: "ok", server: "server-a", timestamp: "...", uptime: 123 }`
2. `server-monitor` menjalankan polling setiap `MONITOR_INTERVAL_MS` (10 detik) dengan timeout 5 detik.
3. Tracking State:
   - Tiap target memiliki state: `{ status: "UNKNOWN", consecutiveFails: 0 }`.
   - **Kondisi Sukses (HTTP 200)**:
     - Jika status sebelumnya `DOWN`: kirim alert WhatsApp:
       `🟢 *[RECOVERED]* Server *{NAME}* telah kembali ONLINE pada {TIMESTAMP}.`
     - Reset `consecutiveFails = 0`, set status `UP`.
   - **Kondisi Gagal (Timeout / Connection Refused / 5xx)**:
     - Tambahkan `consecutiveFails += 1`.
     - Jika `consecutiveFails >= 2` dan status sebelumnya bukan `DOWN`:
       - Kirim alert WhatsApp:
         `🚨 *[ALERT]* Server *{NAME}* DOWN / TIDAK MERESPONS!`
         `Detail: {ERROR_MSG}`
         `Waktu: {TIMESTAMP}`
       - Set status `DOWN`.

### C. WhatsApp Dispatcher (`services/whatsapp.js`)
- Menggunakan `makeWASocket` dari `@whiskeysockets/baileys` dengan `useMultiFileAuthState`.
- Render QR Code di terminal konsol menggunakan `qrcode-terminal` agar mudah di-scan via aplikasi WhatsApp hp.
- Auto-reconnect jika koneksi socket drop (`DisconnectReason`).
- Menangani pesan antrean jika ada notifikasi masuk saat socket sedang menghubungkan ulang.

### D. Notifikasi Event Tambahan (`POST /api/notify`)
- Server A (`syncService.js`) memanggil `POST http://127.0.0.1:3005/api/notify` dengan header `x-api-key`:
  - Saat ada produk baru ditambahkan (mutation trigger):
    `📦 *[DATA SYNC]* Berhasil sinkronisasi {COUNT} produk & {COUNT} kategori ke Server B.`
  - Saat terjadi error koneksi ke Server B:
    `⚠️ *[SYNC ERROR]* Gagal sinkronisasi data ke Server B: {ERROR_MSG}.`
  - Periodic timer tanpa mutasi **tidak mengirim notifikasi** untuk menjaga reputasi nomor WhatsApp.

---

## 6. Engineering Decisions (Builder Calls)
1. **Sync Notification Policy**: Dibatasi hanya pada error dan mutasi data (create/update produk). Polling 30 detik tanpa perubahan dibuat senyap untuk mencegah pemblokiran nomor WhatsApp oleh Meta.
2. **Anti-Flapping Threshold**: 2 kegagalan berturut-turut (~20 detik) sebelum memicu pesan DOWN, mengakomodasi fluktuasi wajar jaringan Tailscale/WAN tanpa memicu *false alarm*.
3. **Local Ingress**: Endpoint `POST /api/notify` mengikat pada `127.0.0.1` dan diproteksi dengan `x-api-key` dari `.env`, menjaga keamanan service agar tidak disalahgunakan sebagai open relay.
4. **Boot Grace Period**: Pada 15 detik pertama sejak `server-monitor` dijalankan, status adalah `INITIALIZING` sehingga tidak langsung melempar alarm palsu jika server lain baru sedang proses booting.
