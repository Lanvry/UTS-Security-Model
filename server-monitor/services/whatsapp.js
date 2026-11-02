const path = require('path');
const pino = require('pino');
const qrcode = require('qrcode-terminal');

let sock = null;
let isConnected = false;
const messageQueue = [];

/**
 * Normalisasi nomor telepon ke format JID WhatsApp internasional (misal 628123456789@s.whatsapp.net)
 */
function normalizeJid(phone) {
    if (!phone || typeof phone !== 'string') return '';
    let cleaned = phone.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+')) cleaned = cleaned.slice(1);
    if (cleaned.startsWith('0')) cleaned = '62' + cleaned.slice(1);
    if (!cleaned) return '';
    return `${cleaned}@s.whatsapp.net`;
}

/**
 * Format teks pesan peringatan untuk dikirim ke WhatsApp
 */
function formatAlertMessage(serverName, type, details = '') {
    const name = String(serverName || 'SERVER').toUpperCase();
    const timestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

    if (type === 'DOWN') {
        return `🚨 *[ALERT] SERVER DOWN*\n\n` +
               `• *Target:* ${name}\n` +
               `• *Status:* Tidak Merespons / Offline\n` +
               `• *Error:* ${details || 'Connection Timeout / Failed'}\n` +
               `• *Waktu:* ${timestamp} WIB\n\n` +
               `_Pemberitahuan otomatis dari WhatsApp Monitor._`;
    }

    if (type === 'RECOVERED') {
        return `🟢 *[RECOVERED] SERVER ONLINE*\n\n` +
               `• *Target:* ${name}\n` +
               `• *Status:* Kembali Beroperasi Normal (HTTP 200)\n` +
               `• *Waktu:* ${timestamp} WIB\n\n` +
               `_Sistem kembali stabil._`;
    }

    return `📢 *[NOTIFIKASI]* (${name})\n${details}\n_Waktu: ${timestamp} WIB_`;
}

/**
 * Inisialisasi koneksi Baileys dengan Multi-File Auth
 */
async function initWhatsApp() {
    const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
    const authFolder = path.resolve(__dirname, '../auth_info_baileys');
    const { state, saveCreds } = await useMultiFileAuthState(authFolder);

    const logger = pino({ level: 'silent' });

    sock = makeWASocket({
        auth: state,
        logger: logger,
        printQRInTerminal: false,
        browser: ['UTS-Monitor', 'Chrome', '1.0.0']
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('\n📲 [WhatsApp] Silakan scan QR Code berikut menggunakan aplikasi WhatsApp di ponsel:');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            isConnected = false;
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            console.log(`🔌 [WhatsApp] Koneksi terputus (Status: ${statusCode}). Reconnect: ${shouldReconnect}`);

            if (shouldReconnect) {
                setTimeout(() => {
                    initWhatsApp().catch(err => console.error('[WhatsApp] Reconnect error:', err.message));
                }, 3000);
            } else {
                console.warn('⚠️ [WhatsApp] Sesi telah logout. Silakan hapus folder auth_info_baileys dan scan ulang.');
            }
        } else if (connection === 'open') {
            isConnected = true;
            console.log('✅ [WhatsApp] Sukses terhubung ke server WhatsApp!');

            // Flush pesan antrean jika ada
            while (messageQueue.length > 0) {
                const pending = messageQueue.shift();
                try {
                    await sock.sendMessage(pending.jid, { text: pending.text });
                    console.log(`[WhatsApp] Terkirim pesan antrean ke ${pending.jid}`);
                } catch (e) {
                    console.error('[WhatsApp] Gagal mengirim pesan antrean:', e.message);
                }
            }
        }
    });

    return sock;
}

/**
 * Mengirim pesan WhatsApp ke nomor target
 */
async function sendWhatsAppMessage(text, targetPhone = null) {
    const phone = targetPhone || process.env.WA_TARGET_PHONE;
    const jid = normalizeJid(phone);

    if (!jid) {
        console.warn('[WhatsApp] Nomor tujuan tidak valid atau belum diisi di WA_TARGET_PHONE.');
        return false;
    }

    if (!sock || !isConnected) {
        console.warn(`[WhatsApp] Koneksi belum siap, pesan dimasukkan ke antrean (${jid})`);
        messageQueue.push({ jid, text });
        return false;
    }

    try {
        await sock.sendMessage(jid, { text: text });
        console.log(`[WhatsApp] Pesan berhasil dikirim ke ${jid}`);
        return true;
    } catch (err) {
        console.error(`[WhatsApp] Gagal mengirim pesan ke ${jid}:`, err.message);
        return false;
    }
}

function isWhatsAppConnected() {
    return isConnected;
}

module.exports = {
    normalizeJid,
    formatAlertMessage,
    initWhatsApp,
    sendWhatsAppMessage,
    isWhatsAppConnected
};
