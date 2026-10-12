const express = require('express');
const router = express.Router();
const db = require('../../db');

// GET /api/produk - Ambil daftar produk dari DB A
router.get('/', async (req, res) => {
    try {
        const [produk] = await db.query(`
            SELECT p.*, k.nama_kategori 
            FROM produk p 
            LEFT JOIN kategori k ON p.id_kategori = k.id 
            ORDER BY p.id ASC
        `);
        res.json({ status: 'success', total: produk.length, data: produk });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// POST /api/produk - Tambah produk baru ke DB A
router.post('/', async (req, res) => {
    const { nama_produk, harga_produk, foto_produk, id_kategori } = req.body;
    if (!nama_produk || !harga_produk || !id_kategori) {
        if (req.accepts('html')) return res.redirect('/?err=Lengkapi formulir produk');
        return res.status(400).json({ status: 'error', message: 'Lengkapi semua field produk' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO produk (nama_produk, harga_produk, foto_produk, id_kategori) VALUES (?, ?, ?, ?)',
            [nama_produk.trim(), Number(harga_produk), foto_produk.trim() || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300', Number(id_kategori)]
        );
        if (req.accepts('html')) return res.redirect('/?msg=Produk berhasil disimpan ke DB A');
        res.status(201).json({ status: 'success', message: 'Produk berhasil disimpan ke DB A', id: result.insertId });
    } catch (err) {
        if (req.accepts('html')) return res.redirect('/?err=' + encodeURIComponent(err.message));
        res.status(500).json({ status: 'error', message: err.message });
    }
});

module.exports = router;
