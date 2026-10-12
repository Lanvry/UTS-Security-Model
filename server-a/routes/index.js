const express = require('express');
const router = express.Router();
const db = require('../db');

// Halaman Utama Web EJS
router.get('/', async (req, res) => {
    try {
        const [kategori] = await db.query('SELECT * FROM kategori ORDER BY id ASC');
        const [produk] = await db.query(`
            SELECT p.*, k.nama_kategori 
            FROM produk p 
            LEFT JOIN kategori k ON p.id_kategori = k.id 
            ORDER BY p.id ASC
        `);

        res.render('index', {
            title: 'Server A - Pengelola Data (DB A)',
            kategori,
            produk,
            message: req.query.msg || null,
            error: req.query.err || null
        });
    } catch (err) {
        res.render('index', {
            title: 'Server A - Pengelola Data (DB A)',
            kategori: [],
            produk: [],
            message: null,
            error: 'Koneksi basis data gagal: ' + err.message
        });
    }
});

module.exports = router;
