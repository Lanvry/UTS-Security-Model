const express = require('express');
const router = express.Router();

const syncRouter = require('./sync');
const authRouter = require('./auth');
const endpointRouter = require('./endpoint');

// Daftarkan sub-router ke path masing-masing
router.use('/sync', syncRouter);
router.use('/auth', authRouter);
router.use('/endpoint', endpointRouter);

module.exports = router;
