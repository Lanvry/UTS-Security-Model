const express = require('express');
const router = express.Router();

const kategoriRouter = require('./kategori');
const produkRouter = require('./produk');
const syncRouter = require('./sync');

// Daftarkan sub-router ke path masing-masing
router.use('/kategori', kategoriRouter);
router.use('/produk', produkRouter);
router.use('/sync', syncRouter);

module.exports = router;
