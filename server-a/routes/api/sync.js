const express = require('express');
const router = express.Router();
const { syncToRemoteServer, getSyncStatus } = require('../../services/syncService');

// GET /api/sync/status - Status auto-sync terakhir
router.get('/status', (req, res) => {
    res.json({
        status: 'success',
        data: getSyncStatus()
    });
});

// POST /api/sync - Trigger sinkronisasi manual ke Server B
router.post('/', async (req, res) => {
    const result = await syncToRemoteServer('manual_trigger');

    if (req.accepts('html')) {
        if (result.status === 'success') {
            return res.redirect('/?msg=' + encodeURIComponent('Sinkronisasi Sukses: ' + (result.server_b_response ? result.server_b_response.message : 'OK')));
        } else {
            return res.redirect('/?err=' + encodeURIComponent('Sinkronisasi Gagal: ' + result.message));
        }
    }

    if (result.status === 'success') {
        res.json({
            status: 'success',
            message: 'Sinkronisasi berhasil dikirim ke Server B',
            data: result
        });
    } else {
        res.status(500).json({
            status: 'error',
            message: result.message
        });
    }
});

module.exports = router;
