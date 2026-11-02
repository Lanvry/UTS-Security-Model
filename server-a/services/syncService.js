const axios = require('axios');
const db = require('../db');
const { encrypt } = require('../middleware/crypto');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

let isSyncing = false;
let lastSyncTime = null;
let lastSyncStatus = 'Belum pernah sinkronisasi';

/**
 * Mengirimkan event notifikasi ke service server-monitor via POST /api/notify
 */
async function dispatchMonitorNotification(topic, message) {
    try {
        const monitorUrl = process.env.MONITOR_URL || 'http://127.0.0.1:3005';
        const apiKey = process.env.MONITOR_API_KEY;
        await axios.post(`${monitorUrl.replace(/\/+$/, '')}/api/notify`, {
            topic,
            message
        }, {
            headers: { 'x-api-key': apiKey },
            timeout: 3000
        });
    } catch (e) {
        // Jangan hentikan flow sinkronisasi jika monitor belum berjalan
        console.warn('[Sync-Notification] Server-monitor tidak merespons (abaikan jika monitor belum berjalan):', e.message);
    }
}

/**
 * Fungsi utama sinkronisasi data dari DB A (Laptop) ke DB B (Ubuntu Remote)
 * @param {string} trigger - Penyebab sinkronisasi (e.g. 'periodic', 'new_produk', 'manual')
 */
async function syncToRemoteServer(trigger = 'manual') {
    if (isSyncing) {
        console.log(`[Auto-Sync] Sinkronisasi sedang berlangsung, lewati request (${trigger})`);
        return { status: 'skipped', message: 'Sync already in progress' };
    }

    isSyncing = true;
    try {
        const [kategori] = await db.query('SELECT * FROM kategori');
        const [produk] = await db.query('SELECT * FROM produk');

        if (produk.length === 0 && kategori.length === 0) {
            isSyncing = false;
            return { status: 'empty', message: 'Data DB A masih kosong' };
        }

        // Proses kompresi GZIP dan enkripsi AES-256
        const encryptedKategori = kategori.map(k => ({
            id: k.id,
            nama_kategori: encrypt(k.nama_kategori)
        }));

        const encryptedProduk = produk.map(p => ({
            id: p.id,
            nama_produk: encrypt(p.nama_produk),
            harga_produk: encrypt(String(p.harga_produk)),
            foto_produk: encrypt(p.foto_produk),
            id_kategori: p.id_kategori
        }));

        const payload = {
            sender: 'Server A (Auto-Sync)',
            trigger: trigger,
            timestamp: new Date().toISOString(),
            data: {
                kategori: encryptedKategori,
                produk: encryptedProduk
            }
        };

        let serverBUrl = process.env.SERVER_B_URL || 'http://ubuntu.leopard-gila.ts.net:3002';
        if (!serverBUrl.endsWith('/api/sync/receive')) {
            serverBUrl = serverBUrl.replace(/\/+$/, '') + '/api/sync/receive';
        }

        const response = await axios.post(serverBUrl, payload, { timeout: 8000 });

        lastSyncTime = new Date().toISOString();
        lastSyncStatus = `Sukses (${response.data.message || 'OK'})`;
        console.log(`[Auto-Sync - ${trigger}] Berhasil sinkronisasi ${kategori.length} kategori & ${produk.length} produk ke Server B (${lastSyncTime})`);

        // Notifikasi WA hanya untuk mutasi data nyata / manual, senyap untuk periodic timer
        if (trigger !== 'periodic_timer' && trigger !== 'initial_boot') {
            await dispatchMonitorNotification('sync', `Berhasil sinkronisasi ${kategori.length} kategori & ${produk.length} produk ke Server B (Trigger: ${trigger}).`);
        }

        return {
            status: 'success',
            server_b_response: response.data,
            last_sync: lastSyncTime
        };
    } catch (err) {
        const errMsg = err.response ? (err.response.data.message || err.response.statusText) : err.message;
        lastSyncStatus = `Gagal: ${errMsg}`;
        console.warn(`[Auto-Sync - ${trigger}] Gagal mengirim ke Server B: ${errMsg}`);

        // Kirim alert WA jika terjadi kegagalan sinkronisasi
        await dispatchMonitorNotification('sync_error', `🚨 Gagal sinkronisasi data ke Server B (${trigger}): ${errMsg}`);

        return {
            status: 'error',
            message: errMsg
        };
    } finally {
        isSyncing = false;
    }
}

/**
 * Menjalankan background loop otomatis untuk sync berkala
 * @param {number} intervalMs - Interval dalam milidetik (default 30 detik)
 */
function startPeriodicSync(intervalMs = 30000) {
    console.log(`[Auto-Sync] Layanan Auto-Sync diaktifkan (interval: ${intervalMs / 1000} detik).`);
    
    // Initial sync saat server baru dinyalakan
    setTimeout(() => {
        syncToRemoteServer('initial_boot');
    }, 2000);

    // Periodic sync berulang
    setInterval(() => {
        syncToRemoteServer('periodic_timer');
    }, intervalMs);
}

function getSyncStatus() {
    return {
        last_sync: lastSyncTime,
        status: lastSyncStatus,
        is_running: isSyncing
    };
}

module.exports = {
    syncToRemoteServer,
    startPeriodicSync,
    getSyncStatus
};
