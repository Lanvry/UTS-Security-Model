const assert = require('assert');
const http = require('http');
const appA = require('../server-a/app');
const appB = require('../server-b/app');

function makeRequest(server, path) {
    return new Promise((resolve, reject) => {
        const addr = server.address();
        const req = http.get(`http://127.0.0.1:${addr.port}${path}`, (res) => {
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
    });
}

async function run() {
    const serverA = http.createServer(appA);
    const serverB = http.createServer(appB);

    await new Promise(r => serverA.listen(0, r));
    await new Promise(r => serverB.listen(0, r));

    try {
        const resA = await makeRequest(serverA, '/health');
        assert.strictEqual(resA.status, 200, 'Server A /health status should be 200');
        assert.strictEqual(resA.body.status, 'ok');
        assert.strictEqual(resA.body.server, 'server-a');
        assert.ok(typeof resA.body.uptime === 'number');

        const resB = await makeRequest(serverB, '/health');
        assert.strictEqual(resB.status, 200, 'Server B /health status should be 200');
        assert.strictEqual(resB.body.status, 'ok');
        assert.strictEqual(resB.body.server, 'server-b');
        assert.ok(typeof resB.body.uptime === 'number');

        console.log('✓ Health endpoints test passed');
    } finally {
        serverA.close();
        serverB.close();
    }
}

run().catch(err => {
    console.error('FAIL:', err.message || err);
    process.exit(1);
});
