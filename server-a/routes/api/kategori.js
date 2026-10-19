const express = require('express');
const router = express.Router();
const db = require('../../db');
const { syncToRemoteServer } = require('../../services/syncService');

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
        return res.status(400).json({ status: 'error', message: 'Nama kategori tidak boleh kosong' });
    }

    try {
        const [result] = await db.query('INSERT INTO kategori (nama_kategori) VALUES (?)', [nama_kategori.trim()]);
        
        // Auto-sync ke Server B di background
        syncToRemoteServer('insert_kategori').catch(e => console.warn('[Auto-Sync] Gagal:', e.message));

        res.status(201).json({
            status: 'success',
            message: 'Kategori berhasil ditambahkan',
            id: result.insertId
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// PUT /api/kategori/:id - Ubah nama kategori
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nama_kategori } = req.body;

    if (!nama_kategori || !nama_kategori.trim()) {
        return res.status(400).json({ status: 'error', message: 'Nama kategori tidak boleh kosong' });
    }

    try {
        const [result] = await db.query('UPDATE kategori SET nama_kategori = ? WHERE id = ?', [nama_kategori.trim(), id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ status: 'error', message: 'Kategori tidak ditemukan' });
        }

        // Auto-sync ke Server B di background
        syncToRemoteServer('update_kategori').catch(e => console.warn('[Auto-Sync] Gagal:', e.message));

        res.json({ status: 'success', message: 'Kategori berhasil diperbarui' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// DELETE /api/kategori/:id - Hapus kategori
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query('DELETE FROM kategori WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ status: 'error', message: 'Kategori tidak ditemukan' });
        }

        // Auto-sync ke Server B di background
        syncToRemoteServer('delete_kategori').catch(e => console.warn('[Auto-Sync] Gagal:', e.message));

        res.json({ status: 'success', message: 'Kategori berhasil dihapus' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

module.exports = router;
