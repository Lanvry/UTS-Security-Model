const express = require('express');
const router = express.Router();
const db = require('../../db');
const { decrypt } = require('../../middleware/crypto');

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

// GET /api/produk atau /apiserverb/produk - Endpoint Produk Server B (Fallback)
router.get('/', async (req, res) => {
    try {
        const [rawKategori] = await db.query('SELECT * FROM kategori ORDER BY id ASC');
        const [rawProduk] = await db.query('SELECT * FROM produk ORDER BY id ASC');

        const kategoriMap = {};
        rawKategori.forEach(k => {
            kategoriMap[k.id] = safeDecrypt(k.nama_kategori);
        });

        const decryptedProduk = rawProduk.map(p => ({
            id: p.id,
            nama_produk: safeDecrypt(p.nama_produk),
            harga_produk: Number(safeDecrypt(p.harga_produk)) || 0,
            foto_produk: safeDecrypt(p.foto_produk),
            id_kategori: p.id_kategori,
            nama_kategori: kategoriMap[p.id_kategori] || `(Kategori ID: ${p.id_kategori})`
        }));

        res.json({
            status: 'success',
            server: 'Server B (Ubuntu)',
            total: decryptedProduk.length,
            data: decryptedProduk
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

module.exports = router;
