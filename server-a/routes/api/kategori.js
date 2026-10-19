const express = require('express');
const router = express.Router();
const db = require('../../db');

// GET /api/kategori - Ambil daftar kategori dari DB A
router.get('/', async (req, res) => {
    try {
        const [kategori] = await db.query('SELECT * FROM kategori ORDER BY id DESC');
        res.json({ status: 'success', server: 'Server A (Local Laptop)', data: kategori });
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
        // Trigger Auto-Sync ke Server B di background
        const { syncToRemoteServer } = require('../../services/syncService');
        syncToRemoteServer('insert_kategori').catch(e => console.warn('[Auto-Sync] Gagal trigger:', e.message));

        if (req.accepts('html')) return res.redirect('/?msg=Kategori berhasil ditambahkan (Auto-Sync dijalankan)');
        res.status(201).json({ status: 'success', message: 'Kategori berhasil ditambahkan & sinkronisasi otomatis dijalankan', id: result.insertId });
    } catch (err) {
        if (req.accepts('html')) return res.redirect('/?err=' + encodeURIComponent(err.message));
        res.status(500).json({ status: 'error', message: err.message });
    }
});

module.exports = router;
