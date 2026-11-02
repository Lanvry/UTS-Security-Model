const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { createApp } = require('./app');
const { initWhatsApp, sendWhatsAppMessage } = require('./services/whatsapp');
const { Watchdog } = require('./services/monitor');

const PORT = process.env.MONITOR_PORT || 3005;
const INTERVAL_MS = parseInt(process.env.MONITOR_INTERVAL_MS, 10) || 10000;
const SERVER_A_URL = process.env.SERVER_A_URL || 'http://127.0.0.1:4000';
const SERVER_B_URL = process.env.SERVER_B_URL || 'http://ubuntu.leopard-gila.ts.net:3002';

async function bootstrap() {
    console.log('==================================================');
    console.log('🚀 Memulai WhatsApp Server Downtime & Sync Monitor');
    console.log('==================================================');

    // Inisialisasi WhatsApp Service (Baileys)
    try {
        await initWhatsApp();
    } catch (err) {
        console.warn('⚠️ [WhatsApp] Peringatan: Inisialisasi Baileys ditunda atau gagal:', err.message);
    }

    // Inisialisasi Watchdog State Machine
    const watchdog = new Watchdog(async (serverName, type, details) => {
        let text = '';
        const timestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

        if (type === 'DOWN') {
            text = `🚨 *[ALERT] SERVER DOWN*\n\n` +
                   `• *Target:* ${serverName.toUpperCase()}\n` +
                   `• *Status:* Tidak Merespons / Offline\n` +
                   `• *Error:* ${details || 'Connection Timeout'}\n` +
                   `• *Waktu:* ${timestamp} WIB\n\n` +
                   `_Harap segera periksa server terkait!_`;
        } else if (type === 'RECOVERED') {
            text = `🟢 *[RECOVERED] SERVER ONLINE*\n\n` +
                   `• *Target:* ${serverName.toUpperCase()}\n` +
                   `• *Status:* Kembali Beroperasi Normal (HTTP 200)\n` +
                   `• *Waktu:* ${timestamp} WIB`;
        }

        if (text) {
            console.log(`[Alert -> WA] Mengirimkan alert ${type} untuk ${serverName}`);
            await sendWhatsAppMessage(text);
        }
    }, { failureThreshold: 2 });

    // Daftarkan server target pemantauan
    watchdog.registerTarget('Server A', `${SERVER_A_URL.replace(/\/+$/, '')}/health`);
    watchdog.registerTarget('Server B', `${SERVER_B_URL.replace(/\/+$/, '')}/health`);

    // Handler untuk endpoint POST /api/notify
    const notifyHandler = async (message, topic) => {
        const timestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
        const prefix = topic ? `📢 *[EVENT: ${topic.toUpperCase()}]*` : `📢 *[SYSTEM EVENT]*`;
        const text = `${prefix}\n\n${message}\n\n_Waktu: ${timestamp} WIB_`;
        return sendWhatsAppMessage(text);
    };

    const app = createApp(notifyHandler, process.env.MONITOR_API_KEY);
    const server = app.listen(PORT, () => {
        console.log(`📡 Server Monitor berjalan pada port ${PORT}`);
        console.log(`🔍 Polling Server A: ${SERVER_A_URL}/health`);
        console.log(`🔍 Polling Server B: ${SERVER_B_URL}/health`);
        console.log(`⏱️ Interval Pemantauan: ${INTERVAL_MS / 1000} detik`);

        // Mulai polling loop
        watchdog.startPolling(INTERVAL_MS);
    });

    return { app, server, watchdog };
}

if (require.main === module) {
    bootstrap().catch(err => {
        console.error('Fatal error saat bootstrap monitor:', err);
        process.exit(1);
    });
}

module.exports = { bootstrap };

