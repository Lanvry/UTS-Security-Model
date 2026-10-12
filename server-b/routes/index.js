const express = require('express');
const router = express.Router();
const db = require('../db');

// Tampilan Monitoring EJS Server B (Port 3001)
router.get('/', async (req, res) => {
    try {
        const [kategori] = await db.query('SELECT * FROM kategori ORDER BY id ASC');
        const [produk] = await db.query('SELECT * FROM produk ORDER BY id ASC');

        res.render('index', {
            title: 'Server B - Monitor Terenkripsi & EndPoint API',
            kategori,
            produk,
            error: null
        });
    } catch (err) {
        res.render('index', {
            title: 'Server B - Monitor Terenkripsi & EndPoint API',
            kategori: [],
            produk: [],
            error: 'Koneksi ke DB B gagal: ' + err.message
        });
    }
});

module.exports = router;
