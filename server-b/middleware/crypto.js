const crypto = require('crypto');
const zlib = require('zlib');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const algorithm = 'aes-256-cbc';
const rawKey = process.env.AES_SECRET_KEY || 'kunci-rahasia-uts-workshop-32bytes!';
const key = crypto.createHash('sha256').update(rawKey).digest();

const rawIv = process.env.AES_IV || '1234567890123456';
const iv = Buffer.from(rawIv.slice(0, 16), 'utf8');

/**
 * Enkripsi data dengan kompresi GZIP terlebih dahulu (GZIP -> AES-256)
 */
function encrypt(text) {
    if (text === null || text === undefined) return '';
    // 1. Kompresi data dengan GZIP
    const compressed = zlib.gzipSync(Buffer.from(String(text), 'utf8'));
    // 2. Enkripsi buffer hasil kompresi
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const encrypted = Buffer.concat([cipher.update(compressed), cipher.final()]);
    return encrypted.toString('hex');
}

/**
 * Dekripsi data dan dekompresi GZIP (AES-256 -> GUNZIP)
 */
function decrypt(encryptedText) {
    if (!encryptedText) return '';
    try {
        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedText, 'hex')), decipher.final()]);
        // Dekompresi buffer hasil dekripsi
        const decompressed = zlib.gunzipSync(decrypted);
        return decompressed.toString('utf8');
    } catch (err) {
        return `[Gagal Dekripsi: ${err.message}]`;
    }
}

module.exports = { encrypt, decrypt };
