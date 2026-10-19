const express = require('express');
const router = express.Router();
const db = require('../../db');
const { syncToRemoteServer } = require('../../services/syncService');

// GET /api/produk - Ambil daftar produk dari DB A
router.get('/', async (req, res) => {
    try {
        const [produk] = await db.query(`
            SELECT p.*, k.nama_kategori 
            FROM produk p 
            LEFT JOIN kategori k ON p.id_kategori = k.id 
            ORDER BY p.id DESC
        `);
        res.json({ status: 'success', server: 'Server A (Local Laptop)', total: produk.length, data: produk });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// POST /api/produk - Tambah produk baru ke DB A
router.post('/', async (req, res) => {
    const { nama_produk, harga_produk, foto_produk, id_kategori } = req.body;
    if (!nama_produk || !harga_produk || !id_kategori) {
        return res.status(400).json({ status: 'error', message: 'Lengkapi semua field produk' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO produk (nama_produk, harga_produk, foto_produk, id_kategori) VALUES (?, ?, ?, ?)',
            [nama_produk.trim(), Number(harga_produk), foto_produk ? foto_produk.trim() : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300', Number(id_kategori)]
        );

        // Trigger Auto-Sync ke Server B di background
        syncToRemoteServer('insert_produk').catch(e => console.warn('[Auto-Sync] Gagal trigger:', e.message));

        res.status(201).json({
            status: 'success',
            message: 'Produk berhasil disimpan ke DB A',
            id: result.insertId
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// PUT /api/produk/:id - Ubah produk
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nama_produk, harga_produk, foto_produk, id_kategori } = req.body;

    if (!nama_produk || !harga_produk || !id_kategori) {
        return res.status(400).json({ status: 'error', message: 'Lengkapi semua field produk' });
    }

    try {
        const [result] = await db.query(
            'UPDATE produk SET nama_produk = ?, harga_produk = ?, foto_produk = ?, id_kategori = ? WHERE id = ?',
            [nama_produk.trim(), Number(harga_produk), foto_produk ? foto_produk.trim() : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300', Number(id_kategori), id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ status: 'error', message: 'Produk tidak ditemukan' });
        }

        // Trigger Auto-Sync ke Server B di background
        syncToRemoteServer('update_produk').catch(e => console.warn('[Auto-Sync] Gagal trigger:', e.message));

        res.json({ status: 'success', message: 'Produk berhasil diperbarui' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// DELETE /api/produk/:id - Hapus produk
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query('DELETE FROM produk WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ status: 'error', message: 'Produk tidak ditemukan' });
        }

        // Trigger Auto-Sync ke Server B di background
        syncToRemoteServer('delete_produk').catch(e => console.warn('[Auto-Sync] Gagal trigger:', e.message));

        res.json({ status: 'success', message: 'Produk berhasil dihapus' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

module.exports = router;
