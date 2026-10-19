const express = require('express');
const router = express.Router();
const db = require('../../db');
const { decrypt } = require('../../middleware/crypto');

// Fungsi pembantu dekripsi aman: jika ciphertext maka didekripsi, jika plaintext dikembalikan apa adanya
function safeDecrypt(val) {
    if (!val) return '';
    try {
        const decrypted = decrypt(val);
        if (decrypted && !decrypted.startsWith('[Gagal Dekripsi:')) {
            return decrypted;
        }
    } catch (_) {}
    return val;
}

// GET /api/kategori atau /apiserverb/kategori - Endpoint Kategori Server B (Fallback)
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM kategori ORDER BY id DESC');
        const data = rows.map(item => ({
            id: item.id,
            nama_kategori: safeDecrypt(item.nama_kategori)
        }));

        res.json({
            status: 'success',
            server: 'Server B (Ubuntu)',
            data: data
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

module.exports = router;
