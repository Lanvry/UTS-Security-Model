const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'jwt-secret-token-super-aman-uts-2026';

// POST /api/auth/login - Generate Token JWT
router.post('/login', (req, res) => {
    const { username, password } = req.body || {};

    if (username === 'admin' && password === 'admin123') {
        const token = jwt.sign(
            { username: 'admin', role: 'authorized_client' },
            JWT_SECRET,
            { expiresIn: '2h' }
        );

        return res.json({
            status: 'success',
            code: 200,
            message: 'Autentikasi berhasil.',
            token,
            expires_in: '2 Jam'
        });
    }

    return res.status(401).json({
        status: 'error',
        code: 401,
        message: 'Kredensial tidak valid. Gunakan username: admin dan password: admin123'
    });
});

module.exports = router;
