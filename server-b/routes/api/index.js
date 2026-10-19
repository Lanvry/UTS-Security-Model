const express = require('express');
const router = express.Router();

const syncRouter = require('./sync');
const authRouter = require('./auth');
const endpointRouter = require('./endpoint');
const kategoriRouter = require('./kategori');
const produkRouter = require('./produk');

// Daftarkan sub-router ke path masing-masing
router.use('/sync', syncRouter);
router.use('/auth', authRouter);
router.use('/endpoint', endpointRouter);
router.use('/kategori', kategoriRouter);
router.use('/produk', produkRouter);

module.exports = router;
