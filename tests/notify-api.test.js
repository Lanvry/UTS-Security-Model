const assert = require('assert');
const http = require('http');
const { createApp } = require('../server-monitor/app');

function makePostRequest(server, path, headers = {}, body = {}) {
    return new Promise((resolve, reject) => {
        const addr = server.address();
        const payload = JSON.stringify(body);
        const req = http.request({
            hostname: '127.0.0.1',
            port: addr.port,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
                ...headers
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, raw: data });
                }
            });
        });
        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

async function testNotifyApi() {
    let dispatchedMessage = null;
    let dispatchedTopic = null;

    const mockNotifier = async (msg, topic) => {
        dispatchedMessage = msg;
        dispatchedTopic = topic;
        return true;
    };

    const app = createApp(mockNotifier, 'secret-test-key-123');
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));

    try {
        // 1. Missing API Key -> 401
        const resNoAuth = await makePostRequest(server, '/api/notify', {}, { message: 'Test message' });
        assert.strictEqual(resNoAuth.status, 401, 'Should return 401 when API key is missing');

        // 2. Wrong API Key -> 401
        const resBadAuth = await makePostRequest(server, '/api/notify', { 'x-api-key': 'wrong-key' }, { message: 'Test message' });
        assert.strictEqual(resBadAuth.status, 401, 'Should return 401 when API key is invalid');

        // 3. Missing message field -> 400
        const resNoMsg = await makePostRequest(server, '/api/notify', { 'x-api-key': 'secret-test-key-123' }, {});
        assert.strictEqual(resNoMsg.status, 400, 'Should return 400 when message is empty');

        // 4. Valid request -> 200 and handler invoked
        const resOk = await makePostRequest(server, '/api/notify', { 'x-api-key': 'secret-test-key-123' }, {
            topic: 'sync',
            message: 'Sinkronisasi berhasil 5 produk'
        });
        assert.strictEqual(resOk.status, 200, 'Should return 200 on valid notification');
        assert.strictEqual(dispatchedTopic, 'sync');
        assert.strictEqual(dispatchedMessage, 'Sinkronisasi berhasil 5 produk');

        console.log('✓ Notify API security and dispatch test passed');
    } finally {
        server.close();
    }
}

testNotifyApi().catch(err => {
    console.error('FAIL:', err.message || err);
    process.exit(1);
});

