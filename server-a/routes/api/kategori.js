const express = require('express');
const router = express.Router();
const db = require('../../db');

// GET /api/kategori - Ambil daftar kategori dari DB A
router.get('/', async (req, res) => {
    try {
        const [kategori] = await db.query('SELECT * FROM kategori ORDER BY id ASC');
        res.json({ status: 'success', data: kategori });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// POST /api/kategori - Tambah kategori baru ke DB A
router.post('/', async (req, res) => {
    const { nama_kategori } = req.body;
    if (!nama_kategori || !nama_kategori.trim()) {
        if (req.accepts('html')) return res.redirect('/?err=Nama kategori tidak boleh kosong');
        return res.status(400).json({ status: 'error', message: 'Nama kategori tidak boleh kosong' });
    }

    try {
        const [result] = await db.query('INSERT INTO kategori (nama_kategori) VALUES (?)', [nama_kategori.trim()]);
        if (req.accepts('html')) return res.redirect('/?msg=Kategori berhasil ditambahkan');
        res.status(201).json({ status: 'success', message: 'Kategori berhasil ditambahkan', id: result.insertId });
    } catch (err) {
        if (req.accepts('html')) return res.redirect('/?err=' + encodeURIComponent(err.message));
        res.status(500).json({ status: 'error', message: err.message });
    }
});

module.exports = router;
