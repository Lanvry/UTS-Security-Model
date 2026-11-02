const assert = require('assert');
const { Watchdog } = require('../server-monitor/services/monitor');

async function testWatchdog() {
    const alerts = [];
    const mockNotifier = (serverName, type, details) => {
        alerts.push({ serverName, type, details });
    };

    const watchdog = new Watchdog(mockNotifier, { failureThreshold: 2 });
    watchdog.registerTarget('server-test', 'http://fake-test/health');

    // 1st failure: should NOT trigger alert (consecutiveFails = 1)
    await watchdog.handleCheckResult('server-test', false, 'Timeout 5s');
    assert.strictEqual(alerts.length, 0, '1st failure should not trigger alert (anti-flapping)');

    // 2nd failure: SHOULD trigger DOWN alert (consecutiveFails = 2)
    await watchdog.handleCheckResult('server-test', false, 'Timeout 5s');
    assert.strictEqual(alerts.length, 1, '2nd failure should trigger DOWN alert');
    assert.strictEqual(alerts[0].type, 'DOWN');
    assert.strictEqual(alerts[0].serverName, 'server-test');

    // 3rd failure: should NOT spam alert again (already DOWN)
    await watchdog.handleCheckResult('server-test', false, 'Timeout 5s');
    assert.strictEqual(alerts.length, 1, '3rd failure should not spam DOWN alert');

    // Recovery: should trigger RECOVERED alert once
    await watchdog.handleCheckResult('server-test', true);
    assert.strictEqual(alerts.length, 2, 'Recovery should trigger RECOVERED alert');
    assert.strictEqual(alerts[1].type, 'RECOVERED');

    // Subsequent UP: should NOT trigger alert again
    await watchdog.handleCheckResult('server-test', true);
    assert.strictEqual(alerts.length, 2, 'Subsequent UP should stay quiet');

    console.log('✓ Watchdog state machine test passed');
}

testWatchdog().catch(err => {
    console.error('FAIL:', err.message || err);
    process.exit(1);
});
