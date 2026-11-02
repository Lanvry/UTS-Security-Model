const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.status(200).json({
        status: 'ok',
        server: 'server-a',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

module.exports = router;
