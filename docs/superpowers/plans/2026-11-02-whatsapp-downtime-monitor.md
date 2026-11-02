# WhatsApp Server Downtime & Sync Monitor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun microservice pemantau independen (`server-monitor`) berbasis Baileys untuk mendeteksi downtime Server A dan Server B serta mengirimkan notifikasi instan dan audit sinkronisasi ke WhatsApp admin.

**Architecture:** Layanan `server-monitor` berjalan secara terpisah pada port 3005 sebagai proses independen. Monitor melakukan *polling heartbeat* berkala ke endpoint `/health` Server A (port 4000) dan Server B (port 3002). Jika server gagal merespons sebanyak 2 kali berturut-turut, Baileys socket mengirimkan pesan peringatan darurat ke WhatsApp, dan mengirimkan pesan pemulihan saat server kembali online. Server A juga dapat mengirim notifikasi event sinkronisasi database melalui `POST /api/notify`.

**Tech Stack:** Node.js, Express, `@whiskeysockets/baileys`, `qrcode-terminal`, `axios`, `dotenv`, `pino`.

**Spec:** [docs/superpowers/specs/2026-11-02-whatsapp-downtime-monitor-design.md](file:///Users/arjunalanangadiwarsana/Herd/UTS_Workshop/docs/superpowers/specs/2026-11-02-whatsapp-downtime-monitor-design.md)

## Global Constraints
- Port default `server-monitor` adalah `3005` (dapat dikonfigurasi via `MONITOR_PORT` di `.env`).
- Endpoint `/health` Server A dan B harus mengembalikan HTTP 200 dengan payload JSON `{ status: "ok", server: "<name>", timestamp: "...", uptime: <seconds> }`.
- Ambang batas downtime adalah minimal 2 kali kegagalan beruntun (consecutive failures) sebelum status beralih ke `DOWN`.
- Notifikasi sinkronisasi otomatis dibatasi hanya untuk mutasi data atau kegagalan (error); siklus polling rutin 30 detik tanpa perubahan harus senyap (*silent*).
- Kredensial auth WhatsApp disimpan secara lokal di `server-monitor/auth_info_baileys` dan di-ignore dari git.

## Review Focus
- **Tailscale/WAN Latency Spikes:** Server B mungkin mengalami transient timeout > 5 detik sekali; monitor tidak boleh mengirim alarm DOWN palsu pada kegagalan tunggal.
- **WhatsApp Anti-Spam Rate Limit:** Pengiriman berulang-ulang dalam hitungan detik akan memblokir nomor WA; pengiriman pesan harus memiliki antrean atau deduplikasi state.
- **Grace Period saat Booting:** Jika monitor baru dinyalakan, server yang belum selesai booting tidak boleh langsung dianggap crashed pada detik pertama.
- **Format Nomor WhatsApp:** Nomor telepon tujuan di `.env` (misal `0812...` atau `+62812...`) harus dinormalisasi menjadi format JID Baileys (`62812...@s.whatsapp.net`).
- **Endpoint Unauthorized Access:** `POST /api/notify` harus menolak request tanpa `x-api-key` yang valid sesuai `.env`.

---

### Task 1: Health Check Endpoints on Server A & Server B

**Files:**
- Create: `server-a/routes/health.js`
- Create: `server-b/routes/health.js`
- Modify: `server-a/app.js:31-33`
- Modify: `server-b/app.js:31-34`
- Test: `tests/health-check.test.js`

**Interfaces:**
- Produces: `GET /health` responding with `{ status: "ok", server: string, timestamp: string, uptime: number }` (HTTP 200).

- [ ] **Step 1: Write the test verifying `/health` response on both servers**

```javascript
// tests/health-check.test.js
const assert = require('assert');
const request = require('supertest');
const appA = require('../server-a/app');
const appB = require('../server-b/app');

async function testHealth() {
    const resA = await request(appA).get('/health');
    assert.strictEqual(resA.status, 200);
    assert.strictEqual(resA.body.status, 'ok');
    assert.strictEqual(resA.body.server, 'server-a');
    assert.ok(typeof resA.body.uptime === 'number');

    const resB = await request(appB).get('/health');
    assert.strictEqual(resB.status, 200);
    assert.strictEqual(resB.body.status, 'ok');
    assert.strictEqual(resB.body.server, 'server-b');
    assert.ok(typeof resB.body.uptime === 'number');

    console.log('✓ Health endpoints test passed');
}

testHealth().catch(err => {
    console.error('FAIL:', err);
    process.exit(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/health-check.test.js`  
Expected: FAIL (404 Not Found on `/health`)

- [ ] **Step 3: Implement `health.js` route in Server A and Server B and mount in `app.js`**

Implement router returning uptime and server name, then add `app.use('/health', healthRouter)` before 404 handler in `server-a/app.js` and `server-b/app.js`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/health-check.test.js`  
Expected: PASS (`✓ Health endpoints test passed`)

- [ ] **Step 5: Commit**

```bash
git add server-a/routes/health.js server-b/routes/health.js server-a/app.js server-b/app.js tests/health-check.test.js
git -c user.name="CS-Orion" -c user.email="codingsolver0@gmail.com" commit --author="CS-Orion <codingsolver0@gmail.com>" -m "feat: add GET /health endpoints to server-a and server-b"
```

---

### Task 2: Service Monitor Scaffolding & Environment Configuration

**Files:**
- Create: `server-monitor/package.json`
- Create: `server-monitor/index.js`
- Modify: `.env`
- Modify: `.env.example`
- Modify: `package.json`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `server-monitor` express app capable of starting on `MONITOR_PORT` (default 3005).
- Consumes: `.env` variables (`MONITOR_PORT`, `MONITOR_INTERVAL_MS`, `WA_TARGET_PHONE`, `MONITOR_API_KEY`).

- [ ] **Step 1: Update `.env`, `.env.example`, and `.gitignore`**

Tambahkan variabel monitoring ke `.env` dan `.env.example`:
```env
MONITOR_PORT=3005
MONITOR_INTERVAL_MS=10000
SERVER_A_URL=http://127.0.0.1:4000
WA_TARGET_PHONE=628xxxxxxxxxx
MONITOR_API_KEY=monitor-secret-key-uts-2026
```
Tambahkan `server-monitor/auth_info_baileys` ke `.gitignore`.

- [ ] **Step 2: Create `server-monitor/package.json` and install dependencies**

Install `@whiskeysockets/baileys`, `qrcode-terminal`, `pino`, `axios`, `express`, `dotenv`, `cors`.

- [ ] **Step 3: Implement baseline `server-monitor/index.js`**

Express server dasar dengan middleware express.json() dan route `GET /health` untuk monitor itu sendiri. Update root `package.json` dengan script `"start:monitor": "node server-monitor/index.js"`.

- [ ] **Step 4: Verify monitor server boots and responds on port 3005**

Run: `node -e "const app = require('./server-monitor/app'); const server = app.listen(3005, () => { console.log('Monitor OK'); server.close(); });"`  
Expected: `Monitor OK`

- [ ] **Step 5: Commit**

```bash
git add server-monitor/package.json server-monitor/index.js .env.example .gitignore package.json
git -c user.name="Lanvry" -c user.email="wardilanang46@gmail.com" commit --author="Lanvry <wardilanang46@gmail.com>" -m "feat: initialize server-monitor microservice and config"
```

---

### Task 3: WhatsApp Engine with Baileys & Multi-File Auth

**Files:**
- Create: `server-monitor/services/whatsapp.js`
- Test: `tests/whatsapp-service.test.js`

**Interfaces:**
- Produces: `initWhatsApp(): Promise<void>`, `sendWhatsAppMessage(text: string): Promise<boolean>`, `isWhatsAppConnected(): boolean`.
- Consumes: `WA_TARGET_PHONE` from environment.

- [ ] **Step 1: Write test for WhatsApp phone number normalization & message formatting**

```javascript
// tests/whatsapp-service.test.js
const assert = require('assert');
const { normalizeJid, formatAlertMessage } = require('../server-monitor/services/whatsapp');

function testNormalization() {
    assert.strictEqual(normalizeJid('08123456789'), '628123456789@s.whatsapp.net');
    assert.strictEqual(normalizeJid('628123456789'), '628123456789@s.whatsapp.net');
    assert.strictEqual(normalizeJid('+628123456789'), '628123456789@s.whatsapp.net');
    
    const alert = formatAlertMessage('server-a', 'DOWN', 'ECONNREFUSED');
    assert.ok(alert.includes('ALERT'));
    assert.ok(alert.includes('server-a'));
    assert.ok(alert.includes('DOWN'));

    console.log('✓ WhatsApp normalization & format test passed');
}

testNormalization();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/whatsapp-service.test.js`  
Expected: FAIL (Cannot find module)

- [ ] **Step 3: Implement `server-monitor/services/whatsapp.js`**

Implementasikan:
- `normalizeJid(phone)`: Mengubah `08...`, `+62...`, `62...` menjadi format `62...@s.whatsapp.net`.
- `formatAlertMessage(serverName, type, details)`: Format pesan WhatsApp dengan Markdown (*bold*, _italic_).
- `initWhatsApp()`: Setup `makeWASocket` dengan `useMultiFileAuthState`, auto-reconnect saat `connection === 'close'`, dan render terminal QR code dengan `qrcode-terminal`.
- `sendWhatsAppMessage(text)`: Mengirim pesan ke `WA_TARGET_PHONE` atau mengantrekan jika koneksi sedang *reconnecting*.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/whatsapp-service.test.js`  
Expected: PASS (`✓ WhatsApp normalization & format test passed`)

- [ ] **Step 5: Commit**

```bash
git add server-monitor/services/whatsapp.js tests/whatsapp-service.test.js
git -c user.name="Lanvry" -c user.email="wardilanang46@gmail.com" commit --author="Lanvry <wardilanang46@gmail.com>" -m "feat: implement whatsapp service with baileys and jid normalization"
```

---

### Task 4: Watchdog State Machine & Polling Engine

**Files:**
- Create: `server-monitor/services/monitor.js`
- Test: `tests/monitor-state.test.js`

**Interfaces:**
- Produces: `startMonitoring(targets: Array<{name: string, url: string}>, intervalMs: number, onAlert: Function): Object`
- Produces: `getMonitorStatus(): Object`
- Consumes: `sendWhatsAppMessage` from `whatsapp.js`.

- [ ] **Step 1: Write test for State Machine transition, consecutive failure logic, and anti-spam**

```javascript
// tests/monitor-state.test.js
const assert = require('assert');
const { Watchdog } = require('../server-monitor/services/monitor');

async function testWatchdog() {
    const alerts = [];
    const mockNotifier = (serverName, type, details) => {
        alerts.push({ serverName, type, details });
    };

    const watchdog = new Watchdog(mockNotifier, { failureThreshold: 2 });
    watchdog.registerTarget('server-test', 'http://fake-test');

    // 1st failure: should NOT trigger alert (consecutiveFails = 1)
    await watchdog.handleCheckResult('server-test', false, 'Timeout 5s');
    assert.strictEqual(alerts.length, 0);

    // 2nd failure: SHOULD trigger DOWN alert (consecutiveFails = 2)
    await watchdog.handleCheckResult('server-test', false, 'Timeout 5s');
    assert.strictEqual(alerts.length, 1);
    assert.strictEqual(alerts[0].type, 'DOWN');

    // 3rd failure: should NOT spam alert again (already DOWN)
    await watchdog.handleCheckResult('server-test', false, 'Timeout 5s');
    assert.strictEqual(alerts.length, 1);

    // Recovery: should trigger RECOVERED alert once
    await watchdog.handleCheckResult('server-test', true);
    assert.strictEqual(alerts.length, 2);
    assert.strictEqual(alerts[1].type, 'RECOVERED');

    console.log('✓ Watchdog state machine test passed');
}

testWatchdog().catch(err => {
    console.error('FAIL:', err);
    process.exit(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/monitor-state.test.js`  
Expected: FAIL (Cannot find module)

- [ ] **Step 3: Implement `server-monitor/services/monitor.js`**

Implementasikan kelas `Watchdog` yang memiliki:
- Target registry dengan status (`UP`, `DOWN`, `INITIALIZING`), counter `consecutiveFails`, dan timestamp `lastChecked`.
- `handleCheckResult(targetName, isSuccess, errorDetail)`: Menjalankan logika state transition, anti-flapping (threshold = 2), dan memanggil notifier saat transisi terjadi.
- Polling loop dengan interval yang dapat dikonfigurasi via `MONITOR_INTERVAL_MS`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/monitor-state.test.js`  
Expected: PASS (`✓ Watchdog state machine test passed`)

- [ ] **Step 5: Commit**

```bash
git add server-monitor/services/monitor.js tests/monitor-state.test.js
git -c user.name="CS-Orion" -c user.email="codingsolver0@gmail.com" commit --author="CS-Orion <codingsolver0@gmail.com>" -m "feat: implement watchdog state machine with anti-flapping"
```

---

### Task 5: Custom Notification API & Server A Sync Integration

**Files:**
- Modify: `server-monitor/index.js` (add `POST /api/notify` with API key auth)
- Modify: `server-a/services/syncService.js` (trigger notify on mutation and error)
- Test: `tests/notify-api.test.js`

**Interfaces:**
- Produces: `POST /api/notify` accepting `{ topic: string, message: string }` with header `x-api-key: string`.
- Consumes: `syncToRemoteServer(trigger)` in `syncService.js`.

- [ ] **Step 1: Write test for `POST /api/notify` authorization and dispatch**

```javascript
// tests/notify-api.test.js
const assert = require('assert');
const request = require('supertest');
const { createApp } = require('../server-monitor/app');

async function testNotifyApi() {
    let dispatchedMessage = null;
    const mockSender = async (msg) => { dispatchedMessage = msg; return true; };
    const app = createApp(mockSender, 'test-secret-key');

    // Test 401 without key
    const resNoAuth = await request(app).post('/api/notify').send({ message: 'Hello' });
    assert.strictEqual(resNoAuth.status, 401);

    // Test 200 with valid key
    const resAuth = await request(app)
        .post('/api/notify')
        .set('x-api-key', 'test-secret-key')
        .send({ topic: 'sync', message: 'Sync Success' });
    assert.strictEqual(resAuth.status, 200);
    assert.ok(dispatchedMessage.includes('Sync Success'));

    console.log('✓ Notify API security and dispatch test passed');
}

testNotifyApi().catch(err => {
    console.error('FAIL:', err);
    process.exit(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/notify-api.test.js`  
Expected: FAIL

- [ ] **Step 3: Implement `POST /api/notify` in `server-monitor/app.js` and hook into `syncService.js`**

- Buat middleware validasi `x-api-key` di `server-monitor/app.js`.
- Modifikasi `server-a/services/syncService.js`:
  - Jika `syncToRemoteServer` dipanggil dengan trigger non-periodic (misal `manual` atau `new_produk`) dan berhasil: kirim POST ke `http://127.0.0.1:3005/api/notify`.
  - Jika sync mengalami error (`catch` block): kirim POST alert kegagalan ke `http://127.0.0.1:3005/api/notify`.
  - Jika trigger adalah `periodic_timer` rutin tanpa perubahan data: jangan kirim notifikasi (silent).

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/notify-api.test.js`  
Expected: PASS (`✓ Notify API security and dispatch test passed`)

- [ ] **Step 5: Commit**

```bash
git add server-monitor/app.js server-monitor/index.js server-a/services/syncService.js tests/notify-api.test.js
git -c user.name="Lanvry" -c user.email="wardilanang46@gmail.com" commit --author="Lanvry <wardilanang46@gmail.com>" -m "feat: add secure /api/notify and integrate sync notifications"
```

---

### Task 6: End-to-End Orchestration & Documentation

**Files:**
- Modify: `package.json` (add combined scripts `"start:monitor"`, `"start:all"`)
- Modify: `README.md` (add section for WhatsApp Monitor setup & scan QR)
- Test: `tests/e2e-simulation.test.js`

**Interfaces:**
- Produces: Complete system workflow test verifying Server A + Server B + Monitor interactions.

- [ ] **Step 1: Write end-to-end integration test simulating downtime & recovery**

Simulasikan server express lokal hidup, dimatikan (downtime terdeteksi), dan dihidupkan kembali (recovery terdeteksi).

- [ ] **Step 2: Run test to verify simulated flow**

Run: `node tests/e2e-simulation.test.js`  
Expected: PASS

- [ ] **Step 3: Update `package.json` scripts and `README.md`**

Tambahkan panduan menjalankan `server-monitor`, scan QR code terminal di awal, dan konfigurasi `.env`.

- [ ] **Step 4: Commit**

```bash
git add package.json README.md tests/e2e-simulation.test.js
git -c user.name="Lanvry" -c user.email="wardilanang46@gmail.com" commit --author="Lanvry <wardilanang46@gmail.com>" -m "docs: add whatsapp monitor usage guide and e2e verification"
```

