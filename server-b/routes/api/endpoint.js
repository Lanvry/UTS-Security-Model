const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../../db');
const { decrypt } = require('../../middleware/crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'jwt-secret-token-super-aman-uts-2026';

// Middleware Otentikasi JWT
function verifyJwtToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            status: 'error',
            code: 401,
            message: 'Akses ditolak: Token JWT tidak ditemukan pada header Authorization.'
        });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({
                status: 'error',
                code: 403,
                message: 'Akses dilarang: Token JWT tidak valid atau sudah kadaluarsa.'
            });
        }
        req.user = decoded;
        next();
    });
}

// GET /api/endpoint/produk - Langkah 3 & 4: GET DB B -> Dekripsi GZIP + AES -> Sajikan ke EndPoint
router.get('/produk', verifyJwtToken, async (req, res) => {
    try {
        // Langkah 3: GET data dari DB B (ciphertext)
        const [rawKategori] = await db.query('SELECT * FROM kategori ORDER BY id ASC');
        const [rawProduk] = await db.query('SELECT * FROM produk ORDER BY id ASC');

        const kategoriMap = {};
        rawKategori.forEach(k => {
            kategoriMap[k.id] = decrypt(k.nama_kategori);
        });

        // Langkah 4: Dekripsi setiap record ciphertext (Decrypted)
        const decryptedData = rawProduk.map(p => ({
            id: p.id,
            nama_produk: decrypt(p.nama_produk),
            harga_produk: Number(decrypt(p.harga_produk)) || 0,
            foto_produk: decrypt(p.foto_produk),
            id_kategori: p.id_kategori,
            nama_kategori: kategoriMap[p.id_kategori] || '(Kategori ID: ' + p.id_kategori + ')'
        }));

        res.json({
            status: 'success',
            code: 200,
            client_identity: req.user.username,
            total_items: decryptedData.length,
            data: decryptedData
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            code: 500,
            message: 'Gagal mengambil atau mendekripsi data: ' + err.message
        });
    }
});

module.exports = router;
