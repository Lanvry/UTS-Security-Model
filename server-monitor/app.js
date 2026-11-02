const express = require('express');
const cors = require('cors');

function createApp(notifyHandler = null, apiKey = null) {
    const app = express();

    app.use(cors());
    app.use(express.json());

    // Health check endpoint untuk monitor itu sendiri
    app.get('/health', (req, res) => {
        res.status(200).json({
            status: 'ok',
            service: 'server-monitor',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    });

    // Endpoint untuk menerima notifikasi event dari Server A / Server B
    app.post('/api/notify', async (req, res) => {
        const clientKey = req.headers['x-api-key'];
        const configuredKey = apiKey || process.env.MONITOR_API_KEY;

        if (configuredKey && clientKey !== configuredKey) {
            return res.status(401).json({
                status: 'error',
                message: 'Unauthorized: Invalid or missing x-api-key'
            });
        }

        const { topic, message } = req.body || {};
        if (!message) {
            return res.status(400).json({
                status: 'error',
                message: 'Field "message" is required'
            });
        }

        try {
            if (typeof notifyHandler === 'function') {
                await notifyHandler(message, topic);
            }
            res.status(200).json({
                status: 'success',
                message: 'Notification received and dispatched'
            });
        } catch (err) {
            res.status(500).json({
                status: 'error',
                message: err.message || 'Failed to dispatch notification'
            });
        }
    });

    return app;
}

module.exports = { createApp };
