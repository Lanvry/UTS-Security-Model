const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../../db');
const { encrypt } = require('../../middleware/crypto');

// POST /api/sync - Langkah 1: Enkripsi GZIP + AES-256 dan Kirim Data ke Server B
router.post('/', async (req, res) => {
    try {
        const [kategori] = await db.query('SELECT * FROM kategori');
        const [produk] = await db.query('SELECT * FROM produk');

        if (produk.length === 0 && kategori.length === 0) {
            if (req.accepts('html')) return res.redirect('/?err=Data DB A masih kosong');
            return res.status(400).json({ status: 'error', message: 'Data DB A masih kosong' });
        }

        // Proses enkripsi GZIP + AES-256
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
            sender: 'Server A',
            timestamp: new Date().toISOString(),
            data: {
                kategori: encryptedKategori,
                produk: encryptedProduk
            }
        };

        let serverBUrl = process.env.SERVER_B_URL || 'http://macbook.leopard-gila.ts.net';
        if (!serverBUrl.endsWith('/api/sync/receive')) {
            serverBUrl = serverBUrl.replace(/\/+$/, '') + '/api/sync/receive';
        }
        const response = await axios.post(serverBUrl, payload, { timeout: 10000 });

        if (req.accepts('html')) {
            return res.redirect('/?msg=' + encodeURIComponent('Sinkronisasi Sukses: ' + response.data.message));
        }

        res.json({
            status: 'success',
            message: 'Sinkronisasi berhasil dikirim ke Server B',
            server_b_response: response.data
        });
    } catch (err) {
        const errMsg = err.response ? (err.response.data.message || err.response.statusText) : err.message;
        if (req.accepts('html')) {
            return res.redirect('/?err=' + encodeURIComponent('Gagal mengirim ke Server B: ' + errMsg));
        }
        res.status(500).json({ status: 'error', message: errMsg });
    }
});

module.exports = router;
