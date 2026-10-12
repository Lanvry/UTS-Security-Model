const express = require('express');
const router = express.Router();
const db = require('../../db');

// POST /api/sync/receive - Langkah 1 & 2: Menerima Payload Terenkripsi dan Simpan ke DB B
router.post('/receive', async (req, res) => {
    const { kategori, produk } = (req.body && req.body.data) || {};

    if (!Array.isArray(kategori) || !Array.isArray(produk)) {
        return res.status(400).json({
            status: 'error',
            code: 400,
            message: 'Payload tidak valid: Struktur data kategori atau produk tidak sesuai.'
        });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Langkah 2: Simpan kategori terenkripsi ke DB B
        for (const k of kategori) {
            await connection.query(
                `INSERT INTO kategori (id, nama_kategori) 
                 VALUES (?, ?) 
                 ON DUPLICATE KEY UPDATE nama_kategori = VALUES(nama_kategori)`,
                [k.id, k.nama_kategori]
            );
        }

        // Langkah 2: Simpan produk terenkripsi ke DB B
        for (const p of produk) {
            await connection.query(
                `INSERT INTO produk (id, nama_produk, harga_produk, foto_produk, id_kategori) 
                 VALUES (?, ?, ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE 
                    nama_produk = VALUES(nama_produk),
                    harga_produk = VALUES(harga_produk),
                    foto_produk = VALUES(foto_produk),
                    id_kategori = VALUES(id_kategori)`,
                [p.id, p.nama_produk, p.harga_produk, p.foto_produk, p.id_kategori]
            );
        }

        await connection.commit();

        return res.json({
            status: 'success',
            code: 200,
            message: `Berhasil menerima dan menyimpan ${produk.length} produk terenkripsi ke DB B.`,
            received_at: new Date().toISOString()
        });
    } catch (err) {
        await connection.rollback();
        return res.status(500).json({
            status: 'error',
            code: 500,
            message: 'Gagal menyimpan ke DB B: ' + err.message
        });
    } finally {
        connection.release();
    }
});

module.exports = router;
