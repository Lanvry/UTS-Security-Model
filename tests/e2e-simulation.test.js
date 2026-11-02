const assert = require('assert');
const http = require('http');
const { Watchdog } = require('../server-monitor/services/monitor');

function createMockServer(name) {
    let isHealthy = true;

    const server = http.createServer((req, res) => {
        if (req.url === '/health') {
            if (!isHealthy) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', message: 'Internal Server Error' }));
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok', server: name, uptime: process.uptime() }));
            }
        } else {
            res.writeHead(404);
            res.end();
        }
    });

    return {
        server,
        setHealthy: (h) => { isHealthy = h; },
        listen: () => new Promise(r => server.listen(0, r)),
        close: () => new Promise(r => server.close(r)),
        getPort: () => server.address().port
    };
}

async function testE2ESimulation() {
    console.log('Testing End-to-End Watchdog Lifecycle Simulation...');
    const alerts = [];
    const mockNotifier = async (serverName, type, details) => {
        alerts.push({ serverName, type, details, time: new Date() });
    };

    const mockA = createMockServer('server-a');
    await mockA.listen();
    const portA = mockA.getPort();

    const watchdog = new Watchdog(mockNotifier, { failureThreshold: 2, requestTimeoutMs: 1000 });
    watchdog.registerTarget('Server A', `http://127.0.0.1:${portA}/health`);

    // 1. Initial poll when server is healthy
    await watchdog.pollAll();
    let status = watchdog.getStatus();
    assert.strictEqual(status['Server A'].status, 'UP', 'Server A should be UP initially');
    assert.strictEqual(alerts.length, 0, 'No alert on initial UP');

    // 2. Simulate Server A crashing (returns 500)
    mockA.setHealthy(false);

    // Fail 1: Anti-flapping should prevent alert
    await watchdog.pollAll();
    status = watchdog.getStatus();
    assert.strictEqual(status['Server A'].consecutiveFails, 1);
    assert.strictEqual(alerts.length, 0, 'Should not alert on 1st transient failure');

    // Fail 2: Consecutive failures reached threshold -> DOWN alert!
    await watchdog.pollAll();
    status = watchdog.getStatus();
    assert.strictEqual(status['Server A'].status, 'DOWN');
    assert.strictEqual(alerts.length, 1, 'Should alert DOWN on 2nd consecutive failure');
    assert.strictEqual(alerts[0].type, 'DOWN');
    assert.strictEqual(alerts[0].serverName, 'Server A');

    // 3. Simulate Server A recovering
    mockA.setHealthy(true);
    await watchdog.pollAll();
    status = watchdog.getStatus();
    assert.strictEqual(status['Server A'].status, 'UP');
    assert.strictEqual(alerts.length, 2, 'Should alert RECOVERED when server comes back online');
    assert.strictEqual(alerts[1].type, 'RECOVERED');

    await mockA.close();
    console.log('✓ End-to-End Watchdog simulation passed successfully');
}

testE2ESimulation().catch(err => {
    console.error('FAIL:', err.message || err);
    process.exit(1);
});
